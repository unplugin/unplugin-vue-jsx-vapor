import {
  MagicString,
  babelParse,
  generateTransform,
  getLang,
  importHelperFn,
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
        const restResult = new Map()
        for (const param of node.params) {
          const paths = `_ctx${index++}`
          if (resolveParam(param, paths, result, restResult)) {
            s.overwrite(param.start!, param.end!, paths)
          }
        }

        if (restResult.size) {
          for (const [key, value] of restResult) {
            const result = `${key} = ${importHelperFn(s, 0, 'createPropsRestProxy', 'vue')}(${value})`
            if (node.body.type === 'BlockStatement') {
              s.appendRight(node.body.start! + 1, `const ${result};`)
            } else {
              s.appendRight(node.body.start!, `(${result},`)
              s.appendRight(node.body.end!, ')')
            }
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

function resolveParam(
  param: Node,
  paths: string = '',
  result: Map<string, string>,
  restResult: Map<string, string>,
) {
  const properties =
    param.type === 'ObjectPattern'
      ? param.properties
      : param.type === 'ArrayPattern'
        ? param.elements
        : []
  if (!properties.length) return

  const propNames: string[] = []
  properties.forEach((prop, index) => {
    if (prop?.type === 'Identifier') {
      result.set(prop.name, `${paths}[${index}]`)
      propNames.push(`'${prop.name}'`)
    } else if (
      prop?.type === 'ObjectProperty' &&
      prop.key.type === 'Identifier'
    ) {
      if (
        !resolveParam(
          prop.value,
          `${paths}.${prop.key.name}`,
          result,
          restResult,
        )
      ) {
        result.set(prop.key.name, `${paths}.${prop.key.name}`)
        propNames.push(`'${prop.key.name}'`)
      }
    } else if (
      prop?.type === 'RestElement' &&
      prop?.argument.type === 'Identifier'
    ) {
      restResult.set(prop.argument.name, `${paths}, [${propNames.join(', ')}]`)
    } else if (prop) {
      resolveParam(prop, `${paths}[${index}]`, result, restResult)
    }
  })
  return true
}
