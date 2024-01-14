import {
  MagicString,
  REGEX_SETUP_SFC,
  babelParse,
  generateTransform,
  getLang,
  parseSFC,
  walkAST,
} from '@vue-macros/common'
import type { JSXElement, JSXFragment, Node, Program } from '@babel/types'
import { compile } from 'vue/vapor'

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
  for (const { ast, offset } of asts) {
    const rootElements: (JSXElement | JSXFragment)[] = []
    walkAST<Node>(ast, {
      enter(node, parent) {
        if (node.type === 'JSXElement') {
          if (
            parent?.type === 'VariableDeclarator'
            || parent?.type === 'ArrowFunctionExpression'
            || parent?.type === 'CallExpression'
            || parent?.type === 'ReturnStatement'
          )
            rootElements.push(node)

          if (
            node.openingElement.attributes.find(
              attr =>
                attr.type === 'JSXAttribute'
                && s.sliceNode(attr.name, { offset }) === 'v-pre',
            )
          )
            return this.skip()
        }
        else if (node.type === 'JSXFragment') {
          rootElements.push(node)
        }
        else if (node.type === 'JSXAttribute') {
          let name = s.sliceNode(node.name, { offset })
          if (/^on[A-Z]/.test(name)) {
            name = name.replace(
              /^(on)([A-Z])/,
              (_, __, str) => `@${str.toLowerCase()}`,
            )
          }
          else if (!name.startsWith('v-')) {
            name = `:${name}`
          }
          s.overwriteNode(node.name, `${name.replaceAll('_', '.')}`, {
            offset,
          })

          if (node.value && node.value.type !== 'StringLiteral') {
            s.overwriteNode(
              node.value,
              `"${
                s.slice(
                  node.value.start! + offset + 1,
                  node.value.end! + offset - 1,
                )
                }"`,
              { offset },
            )
          }
        }
        else if (
          node.type === 'JSXExpressionContainer'
          && parent?.type === 'JSXElement'
        ) {
          s.appendLeft(node.start! + offset, '{')
          s.appendRight(node.end! + offset, '}')
        }
      },
    })

    const importSet = new Set()
    for (const rootElement of rootElements) {
      const { code } = compile(
        s.sliceNode(
          rootElement.type === 'JSXFragment'
            ? rootElement.children
            : rootElement,
          { offset },
        ),
      )
      s.overwriteNode(
        rootElement,
        `(${
          code
            .replace(/import\s{(.*)}.*;\n/, (_, str) => {
              str.split(',').map((s: string) => importSet.add(s.trim()))
              return ''
            })
            .replace('export ', '')
          })()`,
        { offset },
      )
      s.prepend(
        `import { ${Array.from(importSet).join(', ')} } from 'vue/vapor';`,
      )
    }
  }

  return generateTransform(s, id)
}
