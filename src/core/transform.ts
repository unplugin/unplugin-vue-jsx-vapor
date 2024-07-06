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

  const importSet = new Set()
  const preambles: string[] = []
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
      preamble = preamble.replace(/^[^\n]*;\n?/, '')
      preamble = preamble.replaceAll(
        /(?<=const t)(?=\d)/g,
        `_${preambles.length}`,
      )
      s.overwriteNode(
        node,
        code.replaceAll(/(?<= t)(?=\d)/g, `_${preambles.length}`),
      )
      preambles.push(preamble)
    }
  }

  s.prepend(
    `import { ${Array.from(importSet).map((i) => `${i} as _${i}`)} } from 'vue/vapor';\n${preambles.join('')}`,
  )

  return generateTransform(s, id)
}
