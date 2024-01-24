import type { MagicString } from '@vue-macros/common'
import type { Node } from '@babel/types'
import { addAttribute, isJSXElement, isJSXExpression, overwrite } from './common'

export function transformVIf(
  node: Node,
  parent: Node | null | undefined,
  s: MagicString,
) {
  const name = parent?.type === 'ConditionalExpression'
    && parent.alternate === node
    ? 'v-else-if'
    : 'v-if'

  const start = parent?.type === 'JSXExpressionContainer' ? parent.start! : node.start!
  const end = parent?.type === 'JSXExpressionContainer' ? parent.end! : node.end!

  if (node.type === 'ConditionalExpression') {
    const { test, consequent, alternate } = node

    const directive = ` ${name}="${s.sliceNode(test)}"`
    return () => {
      const isJSXElementConsequent = isJSXElement(consequent)
      const isJSXExpressionConsequent = isJSXExpression(consequent)
      const isJSXExpressionAlternate = isJSXExpression(alternate)
      if (isJSXElementConsequent) {
        addAttribute(consequent, directive, s)
        s.remove(start!, consequent.start!)
      }
      else {
        overwrite(start, consequent.start!, `<template${directive}>${isJSXExpressionConsequent ? '' : '{{'}`, s, parent)
      }

      if (isJSXElement(alternate)) {
        addAttribute(alternate, ` v-else`, s)
        if (isJSXElementConsequent) {
          s.remove(consequent.end!, alternate.start!)
        }
        else {
          overwrite(consequent.end!, alternate.start!, `${isJSXExpressionConsequent ? '' : '}}'}</template>`, s, parent)
        }
        s.remove(alternate.end!, end)
      }
      else if (
        alternate.type !== 'ConditionalExpression'
        && alternate.type !== 'LogicalExpression'
      ) {
        overwrite(
          consequent.end!,
          alternate.start!,
            `${isJSXElementConsequent
                ? ''
                : `${isJSXExpressionConsequent ? '' : '}}'
              }</template>`}<template v-else>${isJSXExpressionAlternate ? '' : '{{'}`,
            s,
            parent,
        )
        overwrite(alternate.end!, end, `${isJSXExpressionAlternate ? '' : '}}'}</template>`, s, parent)
      }
      else {
        s.remove(consequent.end!, alternate.start!)
        s.remove(alternate.end!, end)
      }
    }
  }
  else if (node.type === 'LogicalExpression') {
    const { left, operator, right } = node
    const prefix = operator === '&&' ? '' : '!'
    const directive = ` ${name}="${prefix}${s.sliceNode(left)}"`

    if (isJSXElement(right)) {
      addAttribute(right, directive, s)

      return () => {
        s.remove(start!, right.start!)
        s.remove(right.end!, end)
      }
    }

    return () => {
      overwrite(start, right.start!, `<template${directive}>`, s, parent)
      overwrite(right.end!, end, '</template>', s, parent)
    }
  }
}
