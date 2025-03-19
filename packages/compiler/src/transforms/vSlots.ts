import { createCompilerError, ErrorCodes } from '@vue/compiler-dom'
import { IRSlotType } from '../ir'
import { isJSXComponent, resolveExpression, resolveLocation } from '../utils'
import type { DirectiveTransform } from '../transform'

export const transformVSlots: DirectiveTransform = (dir, node, context) => {
  if (!isJSXComponent(node)) return

  if (dir.value?.type === 'JSXExpressionContainer') {
    context.slots = [
      {
        slotType: IRSlotType.EXPRESSION,
        slots: resolveExpression(dir.value.expression, context),
      },
    ]

    if (node.children.length) {
      context.options.onError(
        createCompilerError(
          ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE,
          resolveLocation(node.children[0].loc, context),
        ),
      )
    }
  }
}
