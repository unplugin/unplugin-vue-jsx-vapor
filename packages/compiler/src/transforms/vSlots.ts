import { createCompilerError, ErrorCodes } from '@vue/compiler-dom'
import { IRSlotType } from '../ir'
import { isJSXComponent, resolveExpression, resolveLocation } from '../utils'
import type { NodeTransform } from '../transform'
import type { JSXAttribute } from '@babel/types'

export const transformVSlots: NodeTransform = (node, context) => {
  if (node.type !== 'JSXElement' || !isJSXComponent(node)) return

  const {
    openingElement: { attributes },
    children,
  } = node

  const vSlotsIndex = attributes.findIndex(
    (attr) =>
      attr.type === 'JSXAttribute' && attr.name.name.toString() === 'v-slots',
  )
  const vSlotsDir = attributes[vSlotsIndex] as JSXAttribute
  if (vSlotsDir && vSlotsDir.value?.type === 'JSXExpressionContainer') {
    attributes.splice(vSlotsIndex, 1)
    context.slots = [
      {
        slotType: IRSlotType.EXPRESSION,
        slots: resolveExpression(vSlotsDir.value.expression, context),
      },
    ]

    if (children.length) {
      context.options.onError(
        createCompilerError(
          ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE,
          resolveLocation(children[0].loc, context),
        ),
      )
    }
  }
}
