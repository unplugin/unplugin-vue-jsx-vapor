import type { MagicString } from '@vue-macros/common'
import type { Node } from '@babel/types'
import { addAttribute, overwrite } from './common'

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
      const isConditionalElement = consequent.type === 'JSXElement' || consequent.type === 'JSXFragment'
      if (isConditionalElement) {
        addAttribute(consequent, directive, s)
        s.remove(start!, consequent.start!)
      }
      else {
        overwrite(start, consequent.start!, `<template${directive}>`, s)
      }

      if (
        alternate.type === 'JSXElement'
        || alternate.type === 'JSXFragment'
      ) {
        addAttribute(alternate, ` v-else`, s)
        if (isConditionalElement) {
          s.remove(consequent.end!, alternate.start!)
        }
        else {
          overwrite(consequent.end!, alternate.start!, '</template>', s)
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
          `${isConditionalElement ? '' : '</template>'}<template v-else>`,
          s,
        )
        overwrite(alternate.end!, end, '</template>', s)
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

    if (right.type === 'JSXElement' || right.type === 'JSXFragment') {
      addAttribute(right, directive, s)

      return () => {
        s.remove(start!, right.start!)
        s.remove(right.end!, end)
      }
    }

    return () => {
      overwrite(start, right.start!, `<template${directive}>`, s)
      overwrite(right.end!, end, '</template>', s)
    }
  }
}
