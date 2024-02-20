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
import { isComponent, isConditionalExpression, isFunctionExpression, isJSXElement, isJSXExpression, isLogicalExpression, isMapCallExpression } from './common'

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
  let hasSlots = false
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
        if (node.value?.type === 'JSXExpressionContainer') {
          if (/^on[A-Z]/.test(name)) {
            name = name.replace(/^(?:on)([A-Z])/, (_, $1) => `@${$1.toLowerCase()}`)
          }
          else if (!name.startsWith('v-')) {
            name = `:${name}`
          }

          s.overwrite(node.value.start!, node.value.start! + 1, '"')
          s.overwrite(node.value.end! - 1, node.value.end!, '"')

          rootNodes.unshift({
            node: name === 'v-for' && node.value.expression.type === 'BinaryExpression'
              ? node.value.expression.right
              : node.value.expression,
            postCallbacks: [],
            isAttributeValue: true,
          })
          postCallbacks = rootNodes[0].postCallbacks!
        }
        else if (node.value?.type === 'StringLiteral' && name.startsWith('v-')) {
          s.overwrite(node.value.start!, node.value.start! + 1, `"'`)
          s.overwrite(node.value.end! - 1, node.value.end!, `'"`)
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
        else if (parent?.type === 'JSXElement'
          && isComponent(parent.openingElement)
          && parent.children.filter(child => s.sliceNode(child).trim()).length === 1
          && !(isMapCallExpression(node.expression)
          || isConditionalExpression(node)
          || isLogicalExpression(node))
        ) {
          rootNodes.unshift({
            node: node.expression,
            isAttributeValue: true,
          })
          hasSlots = true
          s.overwrite(node.start!, node.expression.start!, `<template v-for="(slot, slotName) in _toSlots(`)
          s.overwrite(node.expression.end!, node.end!, `)" v-slot:[slotName]="scope" :key="slotName"><component :is="slot" v-bind="scope" /></template>`)
        }
        else if (!isJSXExpression(node.expression)) {
          s.overwrite(node.start!, node.start! + 1, '<component :is="_resolveJSXExpression(')
          s.overwrite(node.end! - 1, node.end!, ')" />')

          rootNodes.unshift({
            node: node.expression,
            isAttributeValue: true,
          })
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
      runtime = preamble.match(/(["'].*["'])/)?.[1] || '"vue"'
      if (content.includes('<slot ')) {
        code = code.replace('_ctx', '_ctx = _getCurrentInstance().ctx')
        importSet.add('getCurrentInstance as _getCurrentInstance')
      }
      code = code
        .replace('_cache', '_cache = []')
        .replaceAll(/_ctx\.(?!\$slots)/g, '')
        .replaceAll(/"v\d+\-bind": /g, '...')
        .replaceAll(/(?<!const )_component_(\w*)/g, ($0, $1) => `(() => { try { return ${$1.replaceAll(/(?<=\w)46(?=\w)/g, '.')} } catch { return ${$0} } })()`)
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
     `const _resolveJSXExpression = (node) => node?.__v_isVNode || typeof node === 'function' || (Array.isArray(node) && node[0]?.__v_isVNode) ? node : _createTextVNode(_toDisplayString(node));`,
    )
  }

  if (hasSlots) {
    s.prepend(`const _toSlots = s => (Object.prototype.toString.call(s) === '[object Object]' && !s?.__v_isVNode) ? s : { default: typeof s === 'function' ? s: () => s };`)
  }

  s.prepend(
    `import { ${Array.from(importSet).join(', ')} } from ${runtime};`,
  )

  return generateTransform(s, id)
}
