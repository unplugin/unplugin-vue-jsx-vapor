import {
  DynamicFlag,
  type IRDynamicInfo,
  IRNodeTypes,
} from '@vue-vapor/compiler-vapor'
import { createSimpleExpression } from '@vue-vapor/compiler-dom'
import {
  type Expression,
  type JSXElement,
  type JSXFragment,
  arrowFunctionExpression,
  callExpression,
  jsxClosingFragment,
  jsxExpressionContainer,
  jsxFragment,
  jsxOpeningFragment,
  parenthesizedExpression,
} from '@babel/types'
import type { TransformContext } from '../transform'
import type { BlockIRNode } from '../ir/index'

export function newDynamic(): IRDynamicInfo {
  return {
    flags: DynamicFlag.REFERENCED,
    children: [],
  }
}

export function newBlock(node: BlockIRNode['node']): BlockIRNode {
  return {
    type: IRNodeTypes.BLOCK,
    node,
    dynamic: newDynamic(),
    effect: [],
    operation: [],
    returns: [],
  }
}

export function createBranch(
  node: Parameters<typeof wrapFragment>[0],
  context: TransformContext,
  isVFor?: boolean,
): [BlockIRNode, () => void] {
  context.node = node = wrapFragment(node, isVFor)

  const branch: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(branch, isVFor)
  context.reference()
  return [branch, exitBlock]
}

export function wrapFragment(
  node: JSXElement | JSXFragment | Expression,
  isVFor?: boolean,
): JSXFragment {
  if (node.type === 'JSXFragment') {
    return node
  }

  if (
    isVFor &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression')
  ) {
    node = {
      ...callExpression(
        parenthesizedExpression(arrowFunctionExpression([], node.body)),
        [],
      ),
      start: node.body.start,
      end: node.body.end,
    }
  }

  return jsxFragment(jsxOpeningFragment(), jsxClosingFragment(), [
    node.type === 'JSXElement' ? node : jsxExpressionContainer(node),
  ])
}

export const EMPTY_EXPRESSION = createSimpleExpression('', true)
