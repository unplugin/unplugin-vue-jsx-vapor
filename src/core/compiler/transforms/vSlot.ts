import {
  IRSlotType,
  type IRSlots,
  type IRSlotsStatic,
  type SlotBlockIRNode,
} from '../ir'
import { isJSXComponent, resolveExpression } from '../utils'
import { newBlock } from './utils'
import type { JSXAttribute, JSXElement } from '@babel/types'
import type { NodeTransform, TransformContext } from '../transform'

export const transformVSlot: NodeTransform = (node, context) => {
  if (node.type !== 'JSXElement') return
  if (!isJSXComponent(node)) return

  const { openingElement, children } = node
  const vSlotsIndex = openingElement.attributes.findIndex(
    (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'v-slots',
  )
  const vSlotsDir = openingElement.attributes[vSlotsIndex] as JSXAttribute
  if (vSlotsDir && vSlotsDir.value?.type === 'JSXExpressionContainer') {
    node.openingElement.attributes.splice(vSlotsIndex, 1)
    context.slots = [
      {
        slotType: IRSlotType.EXPRESSION,
        slots: resolveExpression(vSlotsDir.value.expression, context),
      },
    ]
  }

  if (children.length) {
    return transformComponentSlot(node, context)
  }
}

function transformComponentSlot(node: JSXElement, context: TransformContext) {
  const { children } = node
  const nonWhitespaceChildren = children.filter(() =>
    isNonWhitespaceContent(node),
  )

  const [block, onExit] = createSlotBlock(node, context)

  const { slots } = context

  return () => {
    onExit()

    if (nonWhitespaceChildren.length) {
      registerSlot(slots, block)
      context.slots = slots
    }
  }
}

function ensureStaticSlots(slots: IRSlots[]): IRSlotsStatic {
  let lastSlots = slots.at(-1)!
  if (!slots.length || lastSlots.slotType !== IRSlotType.STATIC) {
    slots.push(
      (lastSlots = {
        slotType: IRSlotType.STATIC,
        slots: {},
      }),
    )
  }
  return lastSlots
}

function registerSlot(slots: IRSlots[], block: SlotBlockIRNode) {
  const staticSlots = ensureStaticSlots(slots)
  staticSlots.slots.default = block
}

function createSlotBlock(
  slotNode: JSXElement,
  context: TransformContext,
): [SlotBlockIRNode, () => void] {
  const block: SlotBlockIRNode = newBlock(slotNode)
  const exitBlock = context.enterBlock(block)
  return [block, exitBlock]
}

function isNonWhitespaceContent(node: JSXElement['children'][0]): boolean {
  if (node.type !== 'JSXText') return true
  return !!node.value.trim()
}
