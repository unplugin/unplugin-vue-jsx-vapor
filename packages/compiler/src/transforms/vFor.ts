import { DynamicFlag, IRNodeTypes } from '../ir'
import { findProp, getReturnExpression, resolveExpression } from '../utils'
import { createBranch } from './utils'
import type { TransformContext } from '../transform'
import type { CallExpression } from '@babel/types'

export function processMapCallExpression(
  node: CallExpression,
  context: TransformContext,
) {
  const {
    callee,
    arguments: [argument],
  } = node
  if (
    !(
      argument.type === 'FunctionExpression' ||
      argument.type === 'ArrowFunctionExpression'
    ) ||
    callee?.type !== 'MemberExpression'
  )
    return

  context.dynamic.flags |= DynamicFlag.NON_TEMPLATE | DynamicFlag.INSERT
  const id = context.reference()
  const [render, exitBlock] = createBranch(argument, context, true)

  const source = resolveExpression(callee.object, context)
  const value =
    argument.params[0] && resolveExpression(argument.params[0], context)
  const key =
    argument.params[1] && resolveExpression(argument.params[1], context)
  const index =
    argument.params[2] && resolveExpression(argument.params[2], context)

  const returnExpression = getReturnExpression(argument)
  const keyProp = findProp(returnExpression, 'key')
  const keyProperty = keyProp && resolveExpression(keyProp.value, context)
  return () => {
    exitBlock()
    context.registerOperation({
      type: IRNodeTypes.FOR,
      id,
      source,
      value,
      key,
      index,
      keyProp: keyProperty,
      render,
      once: context.inVOnce,
    })
  }
}
