import {
  babelParse,
  generateTransform,
  getLang,
  walkAST,
} from '@vue-macros/common'
import { compile } from '@vue-jsx-vapor/compiler'
import MagicStringStack from 'magic-string-stack'
import * as helper from './helper'
import type { JSXElement, JSXFragment, Node } from '@babel/types'
import type { Options } from '../types'

export const helperCode = helper.helperCode
export const helperId = helper.helperId
export const helperPrefix = helper.helperPrefix

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
      // @ts-ignore
      let { code, vaporHelpers, preamble } = compile(
        s.slice(node.start!, node.end!),
        {
          mode: 'module',
          inline: true,
          isTS: id.endsWith('tsx'),
          filename: id,
          ...options?.compile,
        },
      )
      vaporHelpers.forEach((helper) => importSet.add(helper))

      preamble = preamble.replaceAll(
        /(?<=const )t(?=(\d))/g,
        `_t${preambleIndex}`,
      )
      code = code
        .replaceAll(/(?<== )t(?=\d)/g, `_t${preambleIndex}`)
        .replaceAll('_ctx: any', '')
      preambleIndex++

      for (const [, key, value] of preamble.matchAll(
        /const (_t\d+) = (_template\(.*\))/g,
      )) {
        const result = preambleMap.get(value)
        if (result) {
          code = code.replaceAll(key, result)
        } else {
          preambleMap.set(value, key)
        }
      }

      for (const [, events] of preamble.matchAll(/_delegateEvents\((.*)\)/g)) {
        events.split(', ').forEach((event: any) => delegateEventSet.add(event))
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

  const helpers = ['setText', 'createTextNode'].filter((helper) => {
    const result = importSet.has(helper)
    result && importSet.delete(helper)
    return result
  })
  if (helpers.length) {
    s.prepend(
      `import { ${helpers.map((i) => `${i} as _${i}`).join(', ')} } from '${helperId}';\n`,
    )
  }

  const importResult = Array.from(importSet)
    .map((i) => `${i} as _${i}`)
    .join(', ')
  if (importResult.length)
    s.prepend(`import { ${importResult} } from 'vue/vapor';\n`)

  return generateTransform(s as any, id)
}

function isJSXElement(node?: Node | null): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}
