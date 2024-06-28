import {
  type BlockIRNode,
  DynamicFlag,
  IRNodeTypes,
  type RootNode,
} from '../ir'
import {
  getLiteralExpressionValue,
  isComponent,
  isConstantExpression,
  resolveExpression,
} from '../utils'
import type {
  JSXElement,
  JSXExpressionContainer,
  JSXText,
  Node,
} from '@babel/types'
import type { NodeTransform, TransformContext } from '../transform'

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
    !isComponent(node.openingElement) &&
    isAllTextLike(node.children)
  ) {
    processTextLikeContainer(
      node.children,
      context as TransformContext<JSXElement>,
    )
  } else if (node.type === 'JSXExpressionContainer') {
    processTextLike(context as TransformContext<JSXExpressionContainer>)
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
  return node.type === 'JSXExpressionContainer' || node.type === 'JSXText'
}
