import {
  ErrorCodes,
  type SimpleExpressionNode,
  createCompilerError,
  forAliasRE,
  isConstantNode,
} from '@vue/compiler-dom'
import { parseExpression } from '@babel/parser'
import { DynamicFlag, IRNodeTypes } from '../ir'
import {
  findProp,
  getText,
  isJSXComponent,
  propToExpression,
  resolveExpression,
  resolveLocation,
  resolveSimpleExpression,
} from '../utils'
import {
  type NodeTransform,
  type TransformContext,
  createStructuralDirectiveTransform,
} from '../transform'
import { createBranch } from './utils'
import type { JSXAttribute, JSXElement, Node } from '@babel/types'

export const transformVFor: NodeTransform = createStructuralDirectiveTransform(
  'for',
  processFor,
)

export function processFor(
  node: JSXElement,
  dir: JSXAttribute,
  context: TransformContext,
) {
  if (!dir.value) {
    context.options.onError(
      createCompilerError(
        ErrorCodes.X_V_FOR_NO_EXPRESSION,
        resolveLocation(dir.loc, context),
      ),
    )
    return
  }
  if (!forAliasRE) {
    context.options.onError(
      createCompilerError(
        ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION,
        resolveLocation(dir.loc, context),
      ),
    )
    return
  }

  let value: SimpleExpressionNode | undefined,
    index: SimpleExpressionNode | undefined,
    key: SimpleExpressionNode | undefined,
    source: SimpleExpressionNode
  if (
    dir.value.type === 'JSXExpressionContainer' &&
    dir.value.expression.type === 'BinaryExpression'
  ) {
    if (dir.value.expression.left.type === 'SequenceExpression') {
      const expressions = dir.value.expression.left.expressions
      value = expressions[0] && resolveValueExpression(expressions[0], context)
      key = expressions[1] && resolveExpression(expressions[1], context)
      index = expressions[2] && resolveExpression(expressions[2], context)
    } else {
      value = resolveValueExpression(dir.value.expression.left, context)
    }
    source = resolveExpression(dir.value.expression.right, context)
  }

  const keyProp = findProp(node, 'key')
  const keyProperty = keyProp && propToExpression(keyProp, context)
  const isComponent = isJSXComponent(node)
  const id = context.reference()
  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE | DynamicFlag.INSERT
  const [render, exitBlock] = createBranch(node, context, true)
  return (): void => {
    exitBlock()

    const { parent } = context

    // if v-for is the only child of a parent element, it can go the fast path
    // when the entire list is emptied
    const isOnlyChild =
      parent &&
      parent.block.node !== parent.node &&
      parent.node.children.length === 1

    context.registerOperation({
      type: IRNodeTypes.FOR,
      id,
      source,
      value,
      key,
      index,
      keyProp: keyProperty,
      render,
      once: context.inVOnce || !!(source.ast && isConstantNode(source.ast, {})),
      component: isComponent,
      onlyChild: !!isOnlyChild,
    })
  }
}

function resolveValueExpression(node: Node, context: TransformContext) {
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
