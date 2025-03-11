import {
  DynamicFlag,
  IRNodeTypes,
  type BlockIRNode,
  type RootNode,
} from '../ir'
import {
  getLiteralExpressionValue,
  isEmptyText,
  isJSXComponent,
  isTemplate,
  resolveExpression,
  resolveJSXText,
} from '../utils'
import type { NodeTransform, TransformContext } from '../transform'
import {
  processConditionalExpression,
  processLogicalExpression,
} from './expression'
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
    !isTemplate(node) &&
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
  const nodes = (idx !== -1 ? nexts.slice(0, idx) : nexts) as Array<TextLike>

  const values = createTextLikeExpressions(nodes, context)
  if (!values.length) {
    context.dynamic.flags |= DynamicFlag.NON_TEMPLATE
    return
  }

  const id = context.reference()
  context.dynamic.flags |= DynamicFlag.INSERT | DynamicFlag.NON_TEMPLATE

  context.registerOperation({
    type: IRNodeTypes.CREATE_TEXT_NODE,
    id,
    values,
    jsx: true,
  })
}

function processTextLikeContainer(
  children: TextLike[],
  context: TransformContext<JSXElement>,
) {
  const values = createTextLikeExpressions(children, context)
  const literals = values.map(getLiteralExpressionValue)
  if (literals.every((l) => l != null)) {
    context.childrenTemplate = literals.map((l) => String(l))
  } else {
    context.registerOperation({
      type: IRNodeTypes.SET_TEXT,
      element: context.reference(),
      values,
      jsx: true,
    })
  }
}

function createTextLikeExpressions(
  nodes: TextLike[],
  context: TransformContext,
) {
  const values = []
  for (const node of nodes) {
    seen.get(context.root)!.add(node)
    if (isEmptyText(node)) continue
    values.push(resolveExpression(node, context, !context.inVOnce))
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
      node.expression.type !== 'ConditionalExpression' &&
      node.expression.type !== 'LogicalExpression') ||
    node.type === 'JSXText'
  )
}
