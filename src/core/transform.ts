import {
  babelParse,
  generateTransform,
  getLang,
  walkAST,
} from '@vue-macros/common'
import MagicStringStack from 'magic-string-stack'
import { isJSXElement } from './utils'
import { compile } from './compiler'
import type { JSXElement, JSXFragment, Node } from '@babel/types'
import type { Options } from '../types'

export function transformVueJsxVapor(
  code: string,
  id: string,
  options?: Options,
) {
  const lang = getLang(id)
  const s = new MagicStringStack(code)

  let preambleIndex = 0
  const importSet = new Set<string>()
  const delegateEventSet = new Set<string>()
  const preambleMap = new Map<string, string>()
  function transform() {
    const rootNodes: (JSXElement | JSXFragment)[] = []
    walkAST<Node>(babelParse(s.original, lang), {
      enter(node, parent) {
        if (
          parent?.type !== 'JSXExpressionContainer' &&
          !isJSXElement(parent) &&
          isJSXElement(node)
        ) {
          rootNodes.push(node)
          this.skip()
        }
      },
    })

    for (const node of rootNodes) {
      let { code, vaporHelpers, preamble } = compile(
        s.slice(node.start!, node.end!),
        {
          mode: 'module',
          inline: true,
          isTS: id.endsWith('tsx'),
          filename: id,
          ...options?.compilerOptions,
        },
      )
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

      s.overwrite(node.start!, node.end!, code)
    }

    if (rootNodes.length) {
      s.commit()
      transform()
    }
  }
  transform()

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
  if (importResult.length)
    s.prepend(`import { ${importResult} } from 'vue/vapor';\n`)

  return generateTransform(s, id)
}
