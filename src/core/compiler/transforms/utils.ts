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
  jsxClosingFragment,
  jsxExpressionContainer,
  jsxFragment,
  jsxOpeningFragment,
} from '@babel/types'
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
