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
  _options?: Options,
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
        prefixIdentifiers: false,
        inline: true,
      })
      vaporHelpers.forEach((i) => importSet.add(`${i} as _${i}`))
      preamble = preamble.replace(/^[^\n]*;\n?/, '')
      if (preambles.length) {
        preamble = preamble.replaceAll(
          /(?<=const t)(?=\d)/g,
          `${preambles.length}`,
        )
        code = code.replace(/(?<= t)(?=0)/, `${preambles.length}`)
      }
      preambles.push(preamble)
      s.overwriteNode(node, code)
    }
  }

  s.prepend(
    `import { ${Array.from(importSet).join(', ')} } from 'vue/vapor';\n${preambles.join(';\n')}`,
  )

  return generateTransform(s, id)
}
