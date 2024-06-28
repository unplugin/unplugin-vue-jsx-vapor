import {
  DynamicFlag,
  type IRDynamicInfo,
  IRNodeTypes,
} from '@vue-vapor/compiler-vapor'
import { createSimpleExpression } from '@vue-vapor/compiler-dom'
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

export const EMPTY_EXPRESSION = createSimpleExpression('', true)
