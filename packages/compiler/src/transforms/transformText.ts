import {
  type BlockIRNode,
  DynamicFlag,
  IRNodeTypes,
  type RootNode,
} from '../ir'
import {
  getLiteralExpressionValue,
  isEmptyText,
  isJSXComponent,
  resolveExpression,
  resolveJSXText,
} from '../utils'
import { processConditionalExpression, processLogicalExpression } from './vIf'
import type { NodeTransform, TransformContext } from '../transform'
import type {
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
    !(isJSXComponent(node) as boolean) &&
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
    } else {
      processTextLike(context as TransformContext<JSXExpressionContainer>)
    }
  } else if (node.type === 'JSXText') {
    const value = resolveJSXText(node)
    if (value) {
      context.template += value
    } else {
      context.dynamic.flags |= DynamicFlag.NON_TEMPLATE
    }
  }
}

function processTextLike(context: TransformContext<JSXExpressionContainer>) {
  const nexts = context.parent!.node.children?.slice(context.index)
  const idx = nexts.findIndex((n) => !isTextLike(n))
  const nodes = (idx > -1 ? nexts.slice(0, idx) : nexts) as Array<TextLike>

  const values = createTextLikeExpressions(nodes, context)
  if (!values.length) return

  context.dynamic.flags |= DynamicFlag.INSERT | DynamicFlag.NON_TEMPLATE
  context.registerOperation({
    type: IRNodeTypes.CREATE_TEXT_NODE,
    id: context.reference(),
    values,
    effect: false,
  })
}

function processTextLikeContainer(
  children: TextLike[],
  context: TransformContext<JSXElement>,
) {
  const values = createTextLikeExpressions(children, context)
  if (!values.length) return

  const literals = values.map(getLiteralExpressionValue)
  if (literals.every((l) => l != null)) {
    context.childrenTemplate = literals.map((l) => String(l))
  } else {
    context.registerOperation({
      type: IRNodeTypes.SET_TEXT,
      element: context.reference(),
      values,
    })
  }
}

function createTextLikeExpressions(
  nodes: TextLike[],
  context: TransformContext,
) {
  const values = []
  for (const node of nodes) {
    if (isEmptyText(node)) continue
    seen.get(context.root)!.add(node)
    values.push(resolveExpression(node, context, true))
  }
  return values
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
      )) ||
    node.type === 'JSXText'
  )
}
