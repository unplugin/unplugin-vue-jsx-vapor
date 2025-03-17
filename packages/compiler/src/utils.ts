import { parseExpression } from '@babel/parser'
import {
  isLiteral,
  type BigIntLiteral,
  type Expression,
  type JSXAttribute,
  type JSXElement,
  type JSXFragment,
  type JSXText,
  type Node,
  type NumericLiteral,
  type SourceLocation,
  type StringLiteral,
} from '@babel/types'
import {
  createSimpleExpression,
  ElementTypes,
  isLiteralWhitelisted,
  Namespaces,
  NodeTypes,
  walkIdentifiers,
  type AttributeNode,
  type DirectiveNode,
  type ElementNode,
  type SimpleExpressionNode,
  type TextNode,
} from '@vue/compiler-dom'
import { isGloballyAllowed, isHTMLTag, isString, isSVGTag } from '@vue/shared'
import { EMPTY_EXPRESSION } from './transforms/utils'
import type { VaporDirectiveNode } from './ir'
import type { TransformContext } from './transform'

export function propToExpression(
  prop: JSXAttribute,
  context: TransformContext,
) {
  return prop.type === 'JSXAttribute' &&
    prop.value?.type === 'JSXExpressionContainer'
    ? resolveExpression(prop.value.expression, context)
    : EMPTY_EXPRESSION
}

export function isConstantExpression(exp: SimpleExpressionNode) {
  return (
    isLiteralWhitelisted(exp.content) ||
    isGloballyAllowed(exp.content) ||
    getLiteralExpressionValue(exp) !== null
  )
}

export function getLiteralExpressionValue(
  exp: SimpleExpressionNode,
): number | string | boolean | null {
  if (exp.ast) {
    if (
      ['StringLiteral', 'NumericLiteral', 'BigIntLiteral'].includes(
        exp.ast.type,
      )
    ) {
      return (exp.ast as StringLiteral | NumericLiteral | BigIntLiteral).value
    } else if (
      exp.ast.type === 'TemplateLiteral' &&
      exp.ast.expressions.length === 0
    ) {
      return exp.ast.quasis[0].value.cooked!
    }
  }
  return exp.isStatic ? exp.content : null
}

export const isConstant = (node: Node | null | undefined): boolean => {
  if (!node) return false
  if (node.type === 'Identifier') {
    return node.name === 'undefined'
  }
  if (node.type === 'ArrayExpression') {
    const { elements } = node
    return elements.every((element) => element && isConstant(element))
  }
  if (node.type === 'ObjectExpression') {
    return node.properties.every((property) =>
      isConstant((property as any).value),
    )
  }
  if (
    node.type === 'TemplateLiteral' ? !node.expressions.length : isLiteral(node)
  ) {
    return true
  }
  return false
}

const EMPTY_TEXT_REGEX =
  /^[\t\v\f \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*[\n\r]\s*$/
const START_EMPTY_TEXT_REGEX = /^\s*[\n\r]/
const END_EMPTY_TEXT_REGEX = /[\n\r]\s*$/
export function resolveJSXText(node: JSXText) {
  if (EMPTY_TEXT_REGEX.test(String(node.extra?.raw))) {
    return ''
  }
  let value = node.value
  if (START_EMPTY_TEXT_REGEX.test(value)) {
    value = value.trimStart()
  }
  if (END_EMPTY_TEXT_REGEX.test(value)) {
    value = value.trimEnd()
  }
  return value
}

export function isEmptyText(node: Node) {
  return (
    (node.type === 'JSXText' &&
      EMPTY_TEXT_REGEX.test(String(node.extra?.raw))) ||
    (node.type === 'JSXExpressionContainer' &&
      node.expression.type === 'JSXEmptyExpression')
  )
}

export function resolveSimpleExpressionNode(
  exp: SimpleExpressionNode,
): SimpleExpressionNode {
  if (!exp.isStatic) {
    const value = getLiteralExpressionValue(exp)
    if (value !== null) {
      return createSimpleExpression(String(value), true, exp.loc)
    }
  }
  return exp
}

export function resolveExpression(
  node: Node | undefined | null,
  context: TransformContext,
  effect = false,
): SimpleExpressionNode {
  node = node?.type === 'JSXExpressionContainer' ? node.expression : node
  const isStatic =
    !!node &&
    (node.type === 'StringLiteral' ||
      node.type === 'JSXText' ||
      node.type === 'JSXIdentifier')
  let source =
    !node || node.type === 'JSXEmptyExpression'
      ? ''
      : node.type === 'JSXIdentifier'
        ? node.name
        : node.type === 'StringLiteral'
          ? node.value
          : node.type === 'JSXText'
            ? resolveJSXText(node)
            : node.type === 'Identifier'
              ? node.name
              : context.ir.source.slice(node.start!, node.end!)
  const location = node ? node.loc : null
  if (source && !isStatic && effect && !isConstant(node)) {
    source = `() => (${source})`
    if (location && node) {
      location.start.column -= 7
      node.start! -= 7
    }
  }
  if (node) {
    const offset = node.start! - 1
    walkIdentifiers(
      node,
      (id) => {
        if (!id.loc) return
        id.start = id.loc.start.index! - offset
        id.end = id.loc.end.index! - offset
      },
      true,
    )
  }
  return resolveSimpleExpression(source, isStatic, location, node)
}

export function resolveSimpleExpression(
  source: string,
  isStatic: boolean,
  location?: SourceLocation | null,
  ast?: false | Node | null,
) {
  const result = createSimpleExpression(
    source,
    isStatic,
    resolveLocation(location, source),
  )
  result.ast = ast ?? null
  return result
}

export function resolveLocation(
  location: SourceLocation | null | undefined,
  context: TransformContext | string,
) {
  return location
    ? {
        start: {
          line: location.start.line,
          column: location.start.column + 1,
          offset: location.start.index,
        },
        end: {
          line: location.end.line,
          column: location.end.column + 1,
          offset: location.end.index,
        },
        source: isString(context)
          ? context
          : context.ir.source.slice(location.start.index, location.end.index),
      }
    : {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      }
}

export function resolveValue(
  value: JSXAttribute['value'],
  context: TransformContext,
): TextNode | undefined {
  return value
    ? {
        type: NodeTypes.TEXT,
        content:
          value.type === 'StringLiteral'
            ? value.value
            : value.type === 'JSXExpressionContainer'
              ? context.ir.source.slice(
                  value.expression.start!,
                  value.expression.end!,
                )
              : '',
        loc: resolveLocation(value.loc, context),
      }
    : undefined
}

export function resolveNode(
  node: JSXElement,
  context: TransformContext,
): ElementNode {
  const tag =
    node.openingElement.name.type === 'JSXIdentifier'
      ? node.openingElement.name.name
      : ''
  const loc = resolveLocation(node.loc, context)
  const tagType = isJSXComponent(node)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT
  const props = node.openingElement.attributes.reduce(
    (result, attr) => {
      if (attr.type === 'JSXAttribute') {
        if (tagType === ElementTypes.COMPONENT) {
          result.push(resolveDirectiveNode(attr, context))
        } else {
          result.push({
            type: NodeTypes.ATTRIBUTE,
            name: String(attr.name.name),
            nameLoc: resolveLocation(attr.name.loc, context),
            value: resolveValue(attr.value, context),
            loc: resolveLocation(attr.loc, context),
          })
        }
      }
      return result
    },
    [] as Array<AttributeNode | DirectiveNode>,
  )

  return {
    type: NodeTypes.ELEMENT,
    props,
    children: node.children as any[],
    tag,
    loc,
    ns: Namespaces.HTML,
    tagType,
    isSelfClosing: !!node.selfClosing,
    codegenNode: undefined,
  }
}

const namespaceRE = /^(?:\$([\w-]+)\$)?([\w-]+)?/
export function resolveDirectiveNode(
  node: JSXAttribute,
  context: TransformContext,
  withFn = false,
): VaporDirectiveNode {
  const { value, name } = node
  let nameString =
    name.type === 'JSXNamespacedName'
      ? name.namespace.name
      : name.type === 'JSXIdentifier'
        ? name.name
        : ''
  let argString = name.type === 'JSXNamespacedName' ? name.name.name : ''
  if (name.type !== 'JSXNamespacedName' && !argString) {
    const [newName, modifiers] = nameString.split('_')
    nameString = newName
    modifiers && (argString = `_${modifiers}`)
  }

  let modifiers: string[] = []
  let isStatic = true
  const result = argString.match(namespaceRE)
  if (result) {
    let modifierString = ''
    ;[, argString, modifierString] = result
    if (argString) {
      argString = argString.replaceAll('_', '.')
      isStatic = false
      if (modifierString && modifierString.startsWith('_'))
        modifiers = modifierString.slice(1).split('_')
    } else if (modifierString) {
      ;[argString, ...modifiers] = modifierString.split('_')
    }
  }

  const arg =
    argString && name.type === 'JSXNamespacedName'
      ? resolveSimpleExpression(argString, isStatic, name.name.loc)
      : undefined
  const exp = value
    ? withFn && value.type === 'JSXExpressionContainer'
      ? resolveExpressionWithFn(value.expression, context)
      : resolveExpression(value, context)
    : undefined

  return {
    type: NodeTypes.DIRECTIVE,
    name: nameString.slice(2),
    rawName: `${nameString}:${argString}`,
    exp,
    arg,
    loc: resolveLocation(node.loc, context),
    modifiers: modifiers.map((modifier) => createSimpleExpression(modifier)),
  }
}

export function resolveExpressionWithFn(node: Node, context: TransformContext) {
  const text = getText(node, context)
  return node.type === 'Identifier'
    ? resolveSimpleExpression(text, false, node.loc)
    : resolveSimpleExpression(
        text,
        false,
        node.loc,
        parseExpression(`(${text})=>{}`, {
          plugins: ['typescript'],
        }),
      )
}

export function isJSXComponent(node: Node): node is JSXElement {
  if (node.type !== 'JSXElement') return false

  const { openingElement } = node
  if (openingElement.name.type === 'JSXIdentifier') {
    const name = openingElement.name.name
    return !isHTMLTag(name) && !isSVGTag(name)
  } else {
    return openingElement.name.type === 'JSXMemberExpression'
  }
}

export function findProp(
  expression: Expression | undefined,
  key: string | RegExp,
) {
  if (expression?.type === 'JSXElement') {
    for (const attr of expression.openingElement.attributes) {
      const name =
        attr.type === 'JSXAttribute' &&
        (attr.name.type === 'JSXIdentifier'
          ? attr.name.name
          : attr.name.type === 'JSXNamespacedName'
            ? attr.name.namespace.name
            : ''
        ).split('_')[0]
      if (name && (isString(key) ? name === key : key.test(name))) {
        return attr
      }
    }
  }
}

export function isJSXElement(
  node?: Node | null,
): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}

export function getText(node: Node, content: TransformContext) {
  return content.ir.source.slice(node.start!, node.end!)
}

export function isTemplate(node: Node) {
  if (
    node.type === 'JSXElement' &&
    node.openingElement.name.type === 'JSXIdentifier'
  ) {
    return node.openingElement.name.name === 'template'
  }
}
