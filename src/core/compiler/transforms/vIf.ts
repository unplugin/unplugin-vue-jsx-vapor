import {
  type BlockIRNode,
  DynamicFlag,
  IRNodeTypes,
  type OperationNode,
} from '../ir'
import { resolveExpression } from '../utils'
import { type TransformContext, transformNode } from '../transform'
import { newBlock, wrapFragment } from './utils'
import type { ConditionalExpression, LogicalExpression } from '@babel/types'

export function processConditionalExpression(
  node: ConditionalExpression,
  context: TransformContext,
) {
  const { test, consequent, alternate } = node

  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE
  context.dynamic.flags |= DynamicFlag.INSERT

  const id = context.reference()
  const condition = resolveExpression(test, context)
  const [branch, onExit] = createIfBranch(consequent, context)
  const operation: OperationNode = {
    type: IRNodeTypes.IF,
    id,
    condition,
    positive: branch,
    once: context.inVOnce,
  }

  return [
    () => {
      onExit()
      context.registerOperation(operation)
    },
    () => {
      const [branch, onExit] = createIfBranch(alternate, context)
      operation.negative = branch
      transformNode(context)
      onExit()
    },
  ]
}

export function processLogicalExpression(
  node: LogicalExpression,
  context: TransformContext,
) {
  const { left, right, operator } = node

  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE
  context.dynamic.flags |= DynamicFlag.INSERT

  const id = context.reference()
  const condition = resolveExpression(left, context)
  const [branch, onExit] = createIfBranch(
    operator === '&&' ? right : left,
    context,
  )
  const operation: OperationNode = {
    type: IRNodeTypes.IF,
    id,
    condition,
    positive: branch,
    once: context.inVOnce,
  }

  return [
    () => {
      onExit()
      context.registerOperation(operation)
    },
    () => {
      const [branch, onExit] = createIfBranch(
        operator === '&&' ? left : right,
        context,
      )
      operation.negative = branch
      transformNode(context)
      onExit()
    },
  ]
}

export function createIfBranch(
  node: Parameters<typeof wrapFragment>[0],
  context: TransformContext,
): [BlockIRNode, () => void] {
  context.node = node = wrapFragment(node)

  const branch: BlockIRNode = newBlock(node)
  const exitBlock = context.enterBlock(branch)
  context.reference()
  return [branch, exitBlock]
}
