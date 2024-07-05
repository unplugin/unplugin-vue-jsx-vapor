import {
  camelize,
  capitalize,
  extend,
  isBuiltInDirective,
  isVoidTag,
  makeMap,
} from '@vue-vapor/shared'
import { isValidHTMLNesting } from '../html-nesting'
import {
  DynamicFlag,
  IRDynamicPropsKind,
  IRNodeTypes,
  type IRProp,
  type IRProps,
  type IRPropsDynamicAttribute,
  type IRPropsStatic,
} from '../ir'
import {
  isComponentNode,
  resolveExpression,
  resolveSimpleExpression,
} from '../utils'
import { EMPTY_EXPRESSION } from './utils'
import type { SimpleExpressionNode } from '@vue-vapor/compiler-dom'
import type { JSXAttribute, JSXElement, JSXSpreadAttribute } from '@babel/types'
import type {
  DirectiveTransformResult,
  NodeTransform,
  TransformContext,
} from '../transform'

// import { EMPTY_EXPRESSION } from './utils'

export const isReservedProp = /* #__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ',key,ref,ref_for,ref_key,',
)

const __BROWSER__ = false

const isEventRegex = /^on[A-Z]/
const isDirectiveRegex = /^v-[a-z]/

export const transformElement: NodeTransform = (node, context) => {
  return function postTransformElement() {
    ;({ node } = context)
    if (node.type !== 'JSXElement') return

    const {
      openingElement: { name },
    } = node
    const tag =
      name.type === 'JSXIdentifier'
        ? name.name
        : name.type === 'JSXMemberExpression'
          ? context.ir.source.slice(name.start!, name.end!)
          : ''
    const isComponent = isComponentNode(node)
    const propsResult = buildProps(
      node,
      context as TransformContext<JSXElement>,
      isComponent,
    )

    ;(isComponent ? transformComponentElement : transformNativeElement)(
      tag,
      propsResult,
      context as TransformContext<JSXElement>,
    )
  }
}

function transformComponentElement(
  tag: string,
  propsResult: PropsResult,
  context: TransformContext<JSXElement>,
) {
  let asset = true

  if (!__BROWSER__) {
    const fromSetup = resolveSetupReference(tag, context)
    if (fromSetup) {
      tag = fromSetup
      asset = false
    }
    const dotIndex = tag.indexOf('.')
    if (dotIndex > 0) {
      const ns = resolveSetupReference(tag.slice(0, dotIndex), context)
      if (ns) {
        tag = ns + tag.slice(dotIndex)
        asset = false
      }
    }
  }
  if (asset) {
    context.component.add(tag)
  }

  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE | DynamicFlag.INSERT
  const root =
    context.root === context.parent && context.parent.node.children.length === 1

  context.registerOperation({
    type: IRNodeTypes.CREATE_COMPONENT_NODE,
    id: context.reference(),
    tag,
    props: propsResult[0] ? propsResult[1] : [propsResult[1]],
    asset,
    root,
    slots: context.slots,
    once: context.inVOnce,
  })
  context.slots = []
}

function resolveSetupReference(name: string, context: TransformContext) {
  const bindings = context.options.bindingMetadata
  // TODO
  if (!context.options.prefixIdentifiers) return name
  if (!bindings || bindings.__isScriptSetup === false) {
    return
  }

  const camelName = camelize(name)
  const PascalName = capitalize(camelName)
  return bindings[name]
    ? name
    : bindings[camelName]
      ? camelName
      : bindings[PascalName]
        ? PascalName
        : undefined
}

function transformNativeElement(
  tag: string,
  propsResult: PropsResult,
  context: TransformContext<JSXElement>,
) {
  const { scopeId } = context.options

  let template = ''

  template += `<${tag}`
  if (scopeId) template += ` ${scopeId}`

  if (propsResult[0] /* dynamic props */) {
    const [, dynamicArgs, expressions] = propsResult
    context.registerEffect(expressions, {
      type: IRNodeTypes.SET_DYNAMIC_PROPS,
      element: context.reference(),
      props: dynamicArgs,
    })
  } else {
    for (const prop of propsResult[1]) {
      const { key, values } = prop
      if (key.isStatic && values.length === 1 && values[0].isStatic) {
        template += ` ${key.content}`
        if (values[0].content) template += `="${values[0].content}"`
      } else {
        context.registerEffect(values, {
          type: IRNodeTypes.SET_PROP,
          element: context.reference(),
          prop,
        })
      }
    }
  }

  template += `>${context.childrenTemplate.join('')}`
  // TODO remove unnecessary close tag, e.g. if it's the last element of the template
  if (!isVoidTag(tag)) {
    template += `</${tag}>`
  }

  if (
    context.parent &&
    context.parent.node.type === 'JSXElement' &&
    context.parent.node.openingElement.name.type === 'JSXIdentifier' &&
    !isValidHTMLNesting(context.parent.node.openingElement.name.name, tag)
  ) {
    context.reference()
    context.dynamic.template = context.pushTemplate(template)
    context.dynamic.flags |= DynamicFlag.INSERT | DynamicFlag.NON_TEMPLATE
  } else {
    context.template += template
  }
}

export type PropsResult =
  | [dynamic: true, props: IRProps[], expressions: SimpleExpressionNode[]]
  | [dynamic: false, props: IRPropsStatic]

export function buildProps(
  node: JSXElement,
  context: TransformContext<JSXElement>,
  isComponent: boolean,
): PropsResult {
  const props = node.openingElement.attributes
  if (props.length === 0) return [false, []]

  const dynamicArgs: IRProps[] = []
  const dynamicExpr: SimpleExpressionNode[] = []
  let results: DirectiveTransformResult[] = []

  function pushMergeArg() {
    if (results.length) {
      dynamicArgs.push(dedupeProperties(results))
      results = []
    }
  }

  for (const prop of props) {
    if (prop.type === 'JSXSpreadAttribute' && prop.argument) {
      const value = resolveExpression(prop.argument, context)
      dynamicExpr.push(value)
      pushMergeArg()
      dynamicArgs.push({
        kind: IRDynamicPropsKind.EXPRESSION,
        value,
      })
      continue
    }

    const result = transformProp(prop, node, context)
    if (result) {
      dynamicExpr.push(result.key, result.value)
      if (isComponent && !result.key.isStatic) {
        // v-bind:[name]="value" or v-on:[name]="value"
        pushMergeArg()
        dynamicArgs.push(
          extend(resolveDirectiveResult(result), {
            kind: IRDynamicPropsKind.ATTRIBUTE,
          }) as IRPropsDynamicAttribute,
        )
      } else {
        // other static props
        results.push(result)
      }
    }
  }

  // has dynamic key or v-bind="{}"
  if (dynamicArgs.length || results.some(({ key }) => !key.isStatic)) {
    // take rest of props as dynamic props
    pushMergeArg()
    return [true, dynamicArgs, dynamicExpr]
  }

  const irProps = dedupeProperties(results)
  return [false, irProps]
}

function transformProp(
  prop: JSXAttribute | JSXSpreadAttribute,
  node: JSXElement,
  context: TransformContext<JSXElement>,
): DirectiveTransformResult | void {
  if (prop.type === 'JSXSpreadAttribute') return
  let name =
    prop.name.type === 'JSXIdentifier'
      ? prop.name.name
      : prop.name.type === 'JSXNamespacedName'
        ? prop.name.namespace.name
        : ''

  if (
    !isDirectiveRegex.test(name) &&
    (!prop.value || prop.value.type === 'StringLiteral')
  ) {
    if (isReservedProp(name)) return
    return {
      key: resolveSimpleExpression(name, true, prop.name.loc!),
      value:
        prop.value && prop.value.type === 'StringLiteral'
          ? resolveSimpleExpression(prop.value.value, true, prop.value.loc!)
          : EMPTY_EXPRESSION,
    }
  }

  name = isEventRegex.test(name)
    ? 'on'
    : isDirectiveRegex.test(name)
      ? name.slice(2)
      : 'bind'
  const directiveTransform = context.options.directiveTransforms[name]
  if (directiveTransform) {
    return directiveTransform(prop, node, context)
  }

  if (!isBuiltInDirective(name)) {
    const fromSetup =
      !__BROWSER__ && resolveSetupReference(`v-${name}`, context)
    if (fromSetup) {
      name = fromSetup
    } else {
      context.directive.add(name)
    }

    // TODO
    // context.registerOperation({
    //   type: IRNodeTypes.WITH_DIRECTIVE,
    //   element: context.reference(),
    //   dir: prop,
    //   name,
    //   asset: !fromSetup,
    // })
  }
}

// Dedupe props in an object literal.
// Literal duplicated attributes would have been warned during the parse phase,
// however, it's possible to encounter duplicated `onXXX` handlers with different
// modifiers. We also need to merge static and dynamic class / style attributes.
function dedupeProperties(results: DirectiveTransformResult[]): IRProp[] {
  const knownProps: Map<string, IRProp> = new Map()
  const deduped: IRProp[] = []

  for (const result of results) {
    const prop = resolveDirectiveResult(result)
    // dynamic keys are always allowed
    if (!prop.key.isStatic) {
      deduped.push(prop)
      continue
    }
    const name = prop.key.content
    const existing = knownProps.get(name)
    if (existing) {
      if (name === 'style' || name === 'class') {
        mergePropValues(existing, prop)
      }
      // unexpected duplicate, should have emitted error during parse
    } else {
      knownProps.set(name, prop)
      deduped.push(prop)
    }
  }
  return deduped
}

function resolveDirectiveResult(prop: DirectiveTransformResult): IRProp {
  return extend({}, prop, {
    value: undefined,
    values: [prop.value],
  })
}

function mergePropValues(existing: IRProp, incoming: IRProp) {
  const newValues = incoming.values
  existing.values.push(...newValues)
}
