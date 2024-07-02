import {
  type BlockIRNode,
  DynamicFlag,
  IRNodeTypes,
  type RootNode,
} from '../ir'
import {
  getLiteralExpressionValue,
  isComponentNode,
  isConstantExpression,
  isMapCallExpression,
  resolveExpression,
} from '../utils'
import { processConditionalExpression, processLogicalExpression } from './vIf'
import { processMapCallExpression } from './vFor'
import type { NodeTransform, TransformContext } from '../transform'
import type {
  CallExpression,
  JSXElement,
  JSXExpressionContainer,
  JSXText,
  Node,
} from '@babel/types'

type TextLike = JSXText | JSXExpressionContainer
const seen = new WeakMap<
  TransformContext<RootNode>,
  WeakSet<TextLike | BlockIRNode['node'] | RootNode>
>()

export const transformText: NodeTransform = (node, context) => {
  if (!seen.has(context.root)) seen.set(context.root, new WeakSet())
  if (seen.get(context.root)!.has(node)) {
    context.dynamic.flags |= DynamicFlag.NON_TEMPLATE
    return
  }

  if (
    node.type === 'JSXElement' &&
    !isComponentNode(node) &&
    isAllTextLike(node.children)
  ) {
    processTextLikeContainer(
      node.children,
      context as TransformContext<JSXElement>,
    )
  } else if (node.type === 'JSXExpressionContainer') {
    if (node.expression.type === 'ConditionalExpression') {
      return processConditionalExpression(node.expression, context)
    } else if (node.expression.type === 'LogicalExpression') {
      return processLogicalExpression(node.expression, context)
    } else if (node.expression.type === 'CallExpression') {
      if (isMapCallExpression(node.expression)) {
        return processMapCallExpression(node.expression, context)
      } else {
        processCallExpression(node.expression, context)
      }
    } else {
      processTextLike(context as TransformContext<JSXExpressionContainer>)
    }
  } else if (node.type === 'JSXText') {
    context.template += node.value
  }
}

function processTextLike(context: TransformContext<JSXExpressionContainer>) {
  const nexts = context.parent!.node.children?.slice(context.index)
  const idx = nexts.findIndex((n) => !isTextLike(n))
  const nodes = (idx > -1 ? nexts.slice(0, idx) : nexts) as Array<TextLike>

  const id = context.reference()
  const values = nodes.map((node) => createTextLikeExpression(node, context))

  context.dynamic.flags |= DynamicFlag.INSERT | DynamicFlag.NON_TEMPLATE

  context.registerOperation({
    type: IRNodeTypes.CREATE_TEXT_NODE,
    id,
    values,
    effect: !values.every(isConstantExpression) && !context.inVOnce,
  })
}

function processTextLikeContainer(
  children: TextLike[],
  context: TransformContext<JSXElement>,
) {
  const values = children.map((child) =>
    createTextLikeExpression(child, context),
  )
  const literals = values.map(getLiteralExpressionValue)
  if (literals.every((l) => l != null)) {
    context.childrenTemplate = literals.map((l) => String(l))
  } else {
    context.registerEffect(values, {
      type: IRNodeTypes.SET_TEXT,
      element: context.reference(),
      values,
    })
  }
}

function createTextLikeExpression(node: TextLike, context: TransformContext) {
  seen.get(context.root)!.add(node)
  return resolveExpression(node, context)
}

function isAllTextLike(children: Node[]): children is TextLike[] {
  return (
    !!children.length &&
    children.every(isTextLike) &&
    // at least one an interpolation
    children.some((n) => n.type === 'JSXExpressionContainer')
  )
}

function isTextLike(node: Node): node is TextLike {
  return (
    (node.type === 'JSXExpressionContainer' &&
      !(
        node.expression.type === 'ConditionalExpression' ||
        node.expression.type === 'LogicalExpression'
      ) &&
      node.expression.type !== 'CallExpression') ||
    node.type === 'JSXText'
  )
}

function processCallExpression(
  node: CallExpression,
  context: TransformContext,
) {
  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE | DynamicFlag.INSERT
  const root =
    context.root === context.parent && context.parent.node.children.length === 1
  const tag = `() => ${context.ir.source.slice(node.start!, node.end!)}`

  context.registerOperation({
    type: IRNodeTypes.CREATE_COMPONENT_NODE,
    id: context.reference(),
    tag,
    props: [],
    asset: false,
    root,
    slots: context.slots,
    once: context.inVOnce,
  })
}
