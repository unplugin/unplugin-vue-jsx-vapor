import {
  MagicStringAST,
  babelParse,
  generateTransform,
  getLang,
  walkAST,
} from '@vue-macros/common'
import { isJSXElement, isJSXExpression } from './utils'
import { compile } from './compiler'
import type { Node } from '@babel/types'
import type { Options } from '../types'

export type RootNodes = {
  node: Node
}[]

export function transformVueJsxVapor(
  code: string,
  id: string,
  options?: Options,
) {
  const s = new MagicStringAST(code)
  const rootNodes: RootNodes = []
  walkAST<Node>(babelParse(code, getLang(id)), {
    enter(node, parent) {
      if (
        parent?.type !== 'JSXExpressionContainer' &&
        !isJSXExpression(parent) &&
        isJSXExpression(node)
      ) {
        rootNodes.unshift({
          node,
        })
      }
    },
  })

  let preambleIndex = 0
  const importSet = new Set<string>()
  const delegateEventSet = new Set<string>()
  const preambleMap = new Map<string, string>()
  for (const { node } of rootNodes) {
    if (isJSXElement(node)) {
      let { code, vaporHelpers, preamble } = compile(s.sliceNode(node), {
        mode: 'module',
        inline: true,
        isTS: id.endsWith('tsx'),
        filename: id,
        ...options?.compile,
      })
      vaporHelpers.forEach((helper) => importSet.add(helper))

      preamble = preamble.replaceAll(
        /(?<=const )t(?=(\d))/g,
        `_${preambleIndex}`,
      )
      code = code.replaceAll(/(?<== )t(?=\d)/g, `_${preambleIndex}`)
      preambleIndex++

      for (const [, key, value] of preamble.matchAll(
        /const (_\d+) = (_template\(.*\))/g,
      )) {
        const result = preambleMap.get(value)
        if (result) {
          code = code.replaceAll(key, result)
        } else {
          preambleMap.set(value, key)
        }
      }

      for (const [, events] of preamble.matchAll(/_delegateEvents\((.*)\)/g)) {
        events.split(', ').forEach((event) => delegateEventSet.add(event))
      }

      s.overwriteNode(node, code)
    }
  }

  if (delegateEventSet.size) {
    s.prepend(`_delegateEvents(${Array.from(delegateEventSet).join(', ')});\n`)
  }

  if (preambleMap.size) {
    let preambleResult = ''
    for (const [value, key] of preambleMap) {
      preambleResult += `const ${key} = ${value}\n`
    }
    s.prepend(preambleResult)
  }

  const importResult = Array.from(importSet).map((i) => `${i} as _${i}`)
  s.prepend(`import { ${importResult} } from 'vue/vapor';\n`)

  return generateTransform(s, id)
}
