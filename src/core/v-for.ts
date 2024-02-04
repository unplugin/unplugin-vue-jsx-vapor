import type { MagicString } from '@vue-macros/common'
import type { CallExpression, Node } from '@babel/types'
import type { RootNodes } from './transform'
import { isFunctionExpression, overwrite } from './common'

export function transformVFor(
  node: CallExpression,
  parent: Node | null | undefined,
  rootNodes: RootNodes,
  s: MagicString,
) {
  const { callee, arguments: [argument] } = node
  if (
    !isFunctionExpression(argument)
    || callee.type !== 'MemberExpression'
  )
    return
  rootNodes.unshift(
    {
      node: callee.object,
      isAttributeValue: true,
    },
    {
      node: {
        ...argument.body,
        type: 'ReturnStatement',
      },
      isAttributeValue: true,
    },
  )

  const start = parent?.type === 'JSXExpressionContainer' ? parent.start! : node.start!
  const end = parent?.type === 'JSXExpressionContainer' ? parent.end! : node.end!
  return () => {
    overwrite(start, callee.object.start!, `<template v-for="(${s.sliceNode(argument.params)}) in `, s, 'appendRight')
    s.overwrite(callee.object.end!, argument.body.start!, `"><component :is="()=>`)
    s.overwrite(argument.body.end!, end, `"/></template>`)
  }
}
