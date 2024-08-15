import {
  MagicString,
  babelParse,
  generateTransform,
  getLang,
  walkAST,
} from '@vue-macros/common'
import { walkIdentifiers } from '@vue-vapor/compiler-core'
import { isFunctionExpression } from './utils'
import type { Node } from '@babel/types'

export function transformRestructure(code: string, id: string) {
  const s = new MagicString(code)
  const ast = babelParse(code, getLang(id))

  let index = 0
  walkAST<Node>(ast, {
    enter(node) {
      if (isFunctionExpression(node)) {
        const result = new Map()
        for (const param of node.params) {
          const paths = `_ctx${index++}`
          if (resolveParams(param, paths, result)) {
            s.overwrite(param.start!, param.end!, paths)
          }
        }
        if (!result.size) return

        walkIdentifiers(
          node.body,
          (id, parent, __, ___, isLocal) => {
            if (!isLocal && result.get(id.name)) {
              s.overwrite(
                id.start!,
                id.end!,
                parent.type === 'ObjectProperty' && parent.shorthand
                  ? `${id.name}: ${result.get(id.name)}`
                  : result.get(id.name),
              )
            }
          },
          false,
        )
      }
    },
  })

  return generateTransform(s, id)
}

function resolveParams(
  param: Node,
  paths: string = '',
  result: Map<string, string>,
) {
  const elements =
    param.type === 'ObjectPattern'
      ? param.properties
      : param.type === 'ArrayPattern'
        ? param.elements
        : []
  if (!elements.length) return

  elements.forEach((element, index) => {
    if (element?.type === 'Identifier') {
      result.set(element.name, `${paths}[${index}]`)
    } else if (
      element?.type === 'ObjectProperty' &&
      element.key.type === 'Identifier'
    ) {
      if (!resolveParams(element.value, `${paths}.${element.key.name}`, result))
        result.set(element.key.name, `${paths}.${element.key.name}`)
    } else if (element) {
      resolveParams(element, `${paths}[${index}]`, result)
    }
  })
  return true
}
