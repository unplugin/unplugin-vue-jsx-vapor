import type { MagicString } from '@vue-macros/common'
import type { CallExpression, Node } from '@babel/types'
import type { RootNodes } from './transform'

export function transformVFor(
  node: CallExpression,
  parent: Node | null | undefined,
  rootNodes: RootNodes,
  s: MagicString,
) {
  const { callee, arguments: [argument] } = node
  if (
    argument.type !== 'FunctionExpression'
    && argument.type !== 'ArrowFunctionExpression'
  )
    return

  const start = parent?.type === 'JSXExpressionContainer' ? parent.start! : node.start!
  const end = parent?.type === 'JSXExpressionContainer' ? parent.end! : node.end!

  const left = s.sliceNode(argument.params)
  const right = callee.type === 'MemberExpression'
    ? s.sliceNode(callee.object)
    : null
  const directive = ` v-for="(${left}) in ${right}"`

  rootNodes.unshift({
    node: {
      ...argument.body,
      type: 'ReturnStatement',
    },
    isAttributeValue: true,
  })
  return () => {
    s.overwrite(start, argument.body.start!, `<template${directive}><component :is="()=>`)
    s.overwrite(argument.body.end!, end, `"/></template>`)
  }
}
