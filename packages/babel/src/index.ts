// @ts-ignore
import SyntaxJSX from '@babel/plugin-syntax-jsx'
import { parse } from '@babel/parser'
import { transformJSX } from './transform'
import { isConditionalExpression, isJSXElement } from './utils'
import type { VisitNodeFunction } from '@babel/traverse'
import type { JSXElement, JSXFragment, Node } from '@babel/types'
import type { CompilerOptions } from '@vue-jsx-vapor/compiler'
import type { Visitor } from '@babel/core'

export type Options = {
  filename: string
  importSet: Set<string>
  delegateEventSet: Set<string>
  preambleMap: Map<string, string>
  preambleIndex: number
  roots: {
    node: JSXElement | JSXFragment
    source: string
    inVaporComponent: boolean
  }[]
  opts: {
    interop?: boolean
    compile?: CompilerOptions
  }
}

export default (): {
  name: string
  inherits: any
  visitor: Visitor<Options>
} => {
  return {
    name: 'Vue JSX Vapor',
    inherits: SyntaxJSX,
    visitor: {
      JSXElement: transformJSX,
      JSXFragment: transformJSX,
      Program: {
        enter: (path, state) => {
          state.importSet = new Set<string>()
          state.delegateEventSet = new Set<string>()
          state.preambleMap = new Map<string, string>()
          state.preambleIndex = 0
          state.roots = []
          const collectRoot: VisitNodeFunction<
            Node,
            JSXElement | JSXFragment
          > = (path) => {
            if (
              !isJSXElement(path.parent) &&
              !isConditionalExpression(path.parentPath)
            ) {
              state.roots.push({
                node: path.node,
                source: path.getSource(),
                inVaporComponent: !state.opts.interop
                  ? true
                  : (
                      path.findParent(
                        ({ node }) =>
                          node.type === 'CallExpression' &&
                          node.callee.type === 'Identifier' &&
                          ['defineVaporComponent', 'defineComponent'].includes(
                            node.callee.name,
                          ),
                      ) as any
                    )?.node.callee.name === 'defineVaporComponent',
              })
            }
          }
          path.traverse({
            JSXElement: collectRoot,
            JSXFragment: collectRoot,
          })
        },
        exit: (path, state) => {
          const { delegateEventSet, importSet, preambleMap } = state

          const statements: string[] = []
          if (delegateEventSet.size) {
            statements.unshift(
              `_delegateEvents(${Array.from(delegateEventSet).join(', ')});`,
            )
          }

          if (preambleMap.size) {
            let preambleResult = ''
            for (const [value, key] of preambleMap) {
              preambleResult += `const ${key} = ${value}\n`
            }
            statements.unshift(preambleResult)
          }

          const helpers = ['setText', 'createTextNode'].filter((helper) => {
            const result = importSet.has(helper)
            result && importSet.delete(helper)
            return result
          })
          if (helpers.length) {
            statements.unshift(
              `import { ${helpers.map((i) => `${i} as _${i}`).join(', ')} } from 'unplugin-vue-jsx-vapor/helper.js';\n`,
            )
          }

          if (importSet.size) {
            const importResult = Array.from(importSet)
              .map((i) => `${i} as _${i}`)
              .join(', ')
            statements.unshift(`import { ${importResult} } from 'vue';\n`)
          }

          path.node.body.unshift(
            ...parse(statements.join('\n'), { sourceType: 'module' }).program
              .body,
          )
        },
      },
    },
  }
}
