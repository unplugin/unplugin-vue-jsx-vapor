import {
  MagicString,
  REGEX_SETUP_SFC,
  babelParse,
  generateTransform,
  getLang,
  parseSFC,
  walkAST,
} from '@vue-macros/common'
import type { Node, Program } from '@babel/types'
import { compile } from 'vue/vapor'
import { transformVIf } from './v-if'
import { transformVFor } from './v-for'
import { isConditionalExpression, isJSXElement, isLogicalExpression, isMapCallExpression } from './common'

export function transformVueJsxVapor(code: string, id: string) {
  const lang = getLang(id)
  let asts: {
    ast: Program
    offset: number
  }[] = []
  if (lang === 'vue' || REGEX_SETUP_SFC.test(id)) {
    const { scriptSetup, getSetupAst, script, getScriptAst } = parseSFC(
      code,
      id,
    )
    if (script)
      asts.push({ ast: getScriptAst()!, offset: script.loc.start.offset })

    if (scriptSetup)
      asts.push({ ast: getSetupAst()!, offset: scriptSetup.loc.start.offset })
  }
  else if (['jsx', 'tsx'].includes(lang)) {
    asts = [{ ast: babelParse(code, lang), offset: 0 }]
  }
  else {
    return
  }

  const s = new MagicString(code)
  const importSet = new Set()
  for (const { ast, offset } of asts) {
    s.offset = offset
    const rootNodes: Node[] = []
    walkAST<Node>(ast, {
      enter(node) {
        if (isJSXElement(node)) {
          rootNodes.push(node)
          this.skip()
        }
      },
    })

    for (const root of rootNodes) {
      const postCallbacks: (Function | undefined)[] = []
      walkAST<Node>(root, {
        enter(node, parent) {
          if (
            node.type === 'JSXElement'
            && node.openingElement.attributes.find(
              attr =>
                attr.type === 'JSXAttribute'
                && s.sliceNode(attr.name) === 'v-pre',
            )
          ) {
            this.skip()
          }
          else if (
            node.type === 'JSXOpeningFragment'
            || node.type === 'JSXClosingFragment'
          ) {
            s.appendLeft(node.end! - 1, 'template')
          }
          else if (node.type === 'JSXAttribute') {
            let name = s.sliceNode(node.name)
            if (/^on[A-Z]/.test(name)) {
              name = name.replace(
                /^(on)([A-Z])/,
                (_, __, str) => `@${str.toLowerCase()}`,
              )
            }
            else if (!name.startsWith('v-')) {
              name = `:${name}`
            }

            s.overwriteNode(node.name, name.replaceAll('_', '.'))

            if (node.value && node.value.type !== 'StringLiteral') {
              s.overwrite(node.value.start!, node.value.start! + 1, '"')
              s.overwrite(node.value.end! - 1, node.value.end!, '"')
            }
          }
          else if (
            isMapCallExpression(node)
          ) {
            postCallbacks.push(
              transformVFor(node, parent, s),
            )
          }
          else if (
            isConditionalExpression(node)
            || isLogicalExpression(node)
          ) {
            postCallbacks.push(
              transformVIf(node, parent, s),
            )
          }
          else if (
            node.type === 'JSXExpressionContainer'
            && parent?.type === 'JSXElement'
          ) {
            s.appendRight(node.start!, '{')
            s.appendLeft(node.end!, '}')
          }
          else if (node.type === 'NullLiteral') {
            postCallbacks.push(() => {
              s.removeNode(node)
            })
          }
        },
      })

      postCallbacks.forEach(remove => remove?.())

      const { code } = compile(
        root.type === 'JSXFragment'
          ? s.sliceNode(root.children)
          : s.slice(root.start!, root.end! + 1),
      )
      const result = `(${
      code
        .replace(/import\s{(.*)}.*;\n/, (_, str) => {
          str.split(',').map((s: string) => importSet.add(s.trim()))
          return ''
        })
        .replace('export ', '')
      })()`
      s.overwrite(root.start!, root.end! + 1, `${result}${s.slice(root.end!, root.end! + 1).replace('</template>', '')}`)
    }
  }

  s.prepend(
    `import { ${Array.from(importSet).join(', ')} } from 'vue/vapor';`,
  )

  return generateTransform(s, id)
}
