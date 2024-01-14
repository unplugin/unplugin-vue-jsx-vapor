import {
  MagicString,
  REGEX_SETUP_SFC,
  babelParse,
  generateTransform,
  getLang,
  parseSFC,
  walkAST,
} from '@vue-macros/common'
import type { CallExpression, JSXElement, JSXFragment, Node, Program } from '@babel/types'
import { compile } from 'vue/vapor'
import { transformVFor } from './v-for'

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
    const rootElements: (JSXElement | JSXFragment)[] = []
    const vForNodes: CallExpression[] = []
    walkAST<Node>(ast, {
      enter(node, parent) {
        if (
          (node.type === 'JSXElement'
          && (
            parent?.type === 'VariableDeclarator'
            || parent?.type === 'ArrowFunctionExpression'
            || parent?.type === 'CallExpression'
            || parent?.type === 'ReturnStatement'
          ))
          || node.type === 'JSXFragment'
        ) {
          rootElements.push(node)
          this.skip()
        }
      },
    })

    for (const rootElement of rootElements) {
      walkAST<Node>(rootElement, {
        enter(node, parent) {
          if (
            node.type === 'JSXElement'
            && node.openingElement.attributes.find(
              attr =>
                attr.type === 'JSXAttribute'
                && s.sliceNode(attr.name, { offset }) === 'v-pre',
            )
          ) {
            return this.skip()
          }
          else if (
            node.type === 'JSXExpressionContainer'
            && parent?.type === 'JSXElement'
          ) {
            if (node.expression.type === 'CallExpression'
              && node.expression.callee.type === 'MemberExpression'
              && node.expression.callee.property.type === 'Identifier'
              && node.expression.callee.property.name === 'map') {
              vForNodes.push(node.expression)
              s.remove(node.start! + offset, node.expression.start! + offset)
              s.remove(node.expression.end! + offset, node.end! + offset)
            }
            else {
              s.appendLeft(node.start! + offset, '{')
              s.appendRight(node.end! + offset, '}')
            }
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
        },
      })

      transformVFor(vForNodes, s, offset)

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
