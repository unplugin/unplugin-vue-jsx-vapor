import {
  MagicString,
  babelParse,
  generateTransform,
  getLang,
  walkAST,
} from '@vue-macros/common'
import type { Node } from '@babel/types'
import type { Options } from '../types'
import { transformVIf } from './v-if'
import { transformVFor } from './v-for'
import { isConditionalExpression, isJSXElement, isJSXExpression, isLogicalExpression, isMapCallExpression } from './common'

export type RootNodes = {
  node: Node
  postCallbacks?: ((() => void) | undefined)[]
  isAttributeValue?: boolean
}[]

export function transformVueJsxVapor(
  code: string,
  id: string,
  options: Options,
) {
  const s = new MagicString(code)
  let hasTextNode = false
  const rootNodes: RootNodes = []
  let postCallbacks: ((() => void) | undefined)[] = []
  walkAST<Node>(babelParse(code, getLang(id)), {
    enter(node, parent) {
      if (
        parent?.type !== 'JSXExpressionContainer'
        && !isJSXExpression(parent)
        && isJSXExpression(node)
      ) {
        rootNodes.unshift({
          node,
          postCallbacks: [],
        })
        postCallbacks = rootNodes[0].postCallbacks!
      }
      else if (
        parent?.type === 'JSXAttribute'
        && node.type === 'JSXExpressionContainer'
        && /("|<.*?\/.*?>)/.test(s.sliceNode(node.expression))
      ) {
        rootNodes.unshift({
          node: parent.name.name === 'v-for' && node.expression.type === 'BinaryExpression'
            ? node.expression.right
            : node.expression,
          postCallbacks: [],
          isAttributeValue: true,
        })
        postCallbacks = rootNodes[0].postCallbacks!
      }

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
      else if (node.type === 'JSXSpreadAttribute' && parent?.type === 'JSXOpeningElement') {
        const index = parent.attributes
          .filter(attr => attr.type === 'JSXSpreadAttribute')
          .findIndex(attr => attr === node)
        s.appendLeft(node.start!, `${index ? `:v${index}` : 'v'}-bind=`)
        s.overwrite(node.start!, node.argument.start!, '"')
        s.overwrite(node.end! - 1, node.end!, '"')
      }
      else if (node.type === 'JSXAttribute') {
        let name = s.sliceNode(node.name)
        if (/^on[A-Z]/.test(name)) {
          name = name.replace(/^(?:on)([A-Z])/, (_, $1) => `@${$1.toLowerCase()}`)
        }
        else if (!name.startsWith('v-') && node.value?.type === 'JSXExpressionContainer') {
          name = `:${name}`
        }

        if (name.startsWith('v-') && node.value?.type === 'StringLiteral') {
          s.overwrite(node.value.start!, node.value.start! + 1, `"'`)
          s.overwrite(node.value.end! - 1, node.value.end!, `'"`)
        }

        if (node.value?.type === 'JSXExpressionContainer') {
          s.overwrite(node.value.start!, node.value.start! + 1, '"')
          s.overwrite(node.value.end! - 1, node.value.end!, '"')
        }

        postCallbacks.unshift(() =>
          s.overwriteNode(node.name, name
            .replaceAll('_', '.')
            .replaceAll(/\$(\w+)\$/g, '[$1]')),
        )
      }
      else if (
        isMapCallExpression(node)
      ) {
        postCallbacks.unshift(
          transformVFor(node, parent, rootNodes, s),
        )
      }
      else if (
        isConditionalExpression(node)
        || isLogicalExpression(node)
      ) {
        postCallbacks.unshift(
          transformVIf(node, parent, s),
        )
      }
      else if (
        node.type === 'JSXExpressionContainer'
        && isJSXElement(parent)
      ) {
        if (node.expression.type === 'JSXEmptyExpression') {
          postCallbacks.unshift(() =>
            s.removeNode(node),
          )
        }
        else if (!isJSXExpression(node.expression)) {
          s.overwrite(node.start!, node.start! + 1, '<component :is="__createTextVNode(')
          s.overwrite(node.end! - 1, node.end!, ')" />')

          if (
            /("|<.*?\/.*?>)/.test(s.sliceNode(node.expression))
          ) {
            rootNodes.unshift({
              node: node.expression,
              isAttributeValue: true,
            })
          }
          hasTextNode = true
        }
      }
    },
  })

  const importSet = new Set()
  let runtime = '"vue"'
  function compile(node: Node) {
    const content = s.sliceNode(
      node.type === 'JSXFragment'
        ? node.children
        : node,
    )
    if (options?.compile && isJSXExpression(node)) {
      let { code, preamble } = options.compile(content, { mode: 'module', inline: true })
      preamble.match(/(\w+ as \w+)/g)?.forEach(s => importSet.add(s))
      runtime = preamble.match(/(["'].*["'])/)![1]
      if (content.includes('<slot ')) {
        code = code.replace('_ctx', '_ctx = _getCurrentInstance().ctx')
        importSet.add('getCurrentInstance as _getCurrentInstance')
      }
      code = code
        .replace('_cache', '_cache = []')
        .replaceAll(/_ctx\.(?!\$slots)/g, '')
        .replaceAll(/{ "v\d+\-bind": ([\s\S]*) }/g, '$1')
        .replaceAll(/_resolveComponent\("(.*)"\)/g, ($0, $1) => `(() => { try { return ${$1} } catch { return ${$0} } })()`)
      return runtime === '"vue"' ? `(${code})()` : code
    }
    else {
      return content
    }
  }

  const placeholders: string[] = []
  for (const { node, postCallbacks, isAttributeValue } of rootNodes) {
    postCallbacks?.forEach(callback => callback?.())

    const result = compile(node)
      .replaceAll(/__PLACEHOLDER_(\d+)/g, (_, $1) => placeholders[$1])
    if (isAttributeValue) {
      s.overwriteNode(node, `__PLACEHOLDER_${placeholders.push(result) - 1}`)
    }
    else {
      s.overwriteNode(node, result)
    }
  }

  if (hasTextNode) {
    importSet.add('createTextVNode as _createTextVNode')
    importSet.add('toDisplayString as _toDisplayString')
    s.prepend(
     `const __createTextVNode = (node) => node?.__v_isVNode || typeof node === 'function' || (Array.isArray(node) && node[0]?.__v_isVNode) ? node : _createTextVNode(_toDisplayString(node));`,
    )
  }

  s.prepend(
    `import { ${Array.from(importSet).join(', ')} } from ${runtime};`,
  )

  return generateTransform(s, id)
}
