import { createSimpleExpression } from '@vue/compiler-dom'
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
import {
  type BlockIRNode,
  DynamicFlag,
  type IRDynamicInfo,
  type IRNodeTypes,
} from '../ir/index'
import { isJSXElement } from '../utils'
import type { TransformContext } from '../transform'

export function newDynamic(): IRDynamicInfo {
  return {
    flags: DynamicFlag.REFERENCED,
    children: [],
  }
}

export function newBlock(node: BlockIRNode['node']): BlockIRNode {
  return {
    type: 1 satisfies IRNodeTypes.BLOCK,
    node,
    dynamic: newDynamic(),
    effect: [],
    operation: [],
    returns: [],
    expressions: [],
    tempId: 0,
  }
}

export function createBranch(
  node: Parameters<typeof wrapFragment>[0],
  context: TransformContext,
  isVFor?: boolean,
): [BlockIRNode, () => void] {
  context.node = node = wrapFragment(node)
  const branch: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(branch, isVFor)
  context.reference()
  return [branch, exitBlock]
}

export function wrapFragment(
  node: JSXElement | JSXFragment | Expression,
): JSXFragment {
  if (node.type === 'JSXFragment') {
    return node
  }

  return jsxFragment(jsxOpeningFragment(), jsxClosingFragment(), [
    node.type === 'JSXElement' ? node : jsxExpressionContainer(node),
  ])
}

export const EMPTY_EXPRESSION = createSimpleExpression('', true)
