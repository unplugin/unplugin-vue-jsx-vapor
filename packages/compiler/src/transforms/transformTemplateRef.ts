import { IRNodeTypes } from '../ir'
import { findProp, isConstantExpression, resolveExpression } from '../utils'
import type { NodeTransform } from '../transform'

export const transformTemplateRef: NodeTransform = (node, context) => {
  if (node.type !== 'JSXElement') return

  const dir = findProp(node, 'ref')
  if (!dir?.value) return

  context.ir.hasTemplateRef = true

  const value = resolveExpression(dir.value, context)

  return () => {
    const id = context.reference()
    const effect = !isConstantExpression(value)
    effect &&
      context.registerOperation({
        type: IRNodeTypes.DECLARE_OLD_REF,
        id,
      })
    context.registerEffect([value], {
      type: IRNodeTypes.SET_TEMPLATE_REF,
      element: id,
      value,
      refFor: !!context.inVFor,
      effect,
    })
  }
}
