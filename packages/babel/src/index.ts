// @ts-ignore
import SyntaxJSX from '@babel/plugin-syntax-jsx'
import template from '@babel/template'
import { transformJSX } from './transform'
import type { CompilerOptions } from '@vue-jsx-vapor/compiler'
import type { Visitor } from '@babel/core'

export type Opts = {
  importSet: Set<string>
  delegateEventSet: Set<string>
  preambleMap: Map<string, string>
  preambleIndex: number
  compile?: CompilerOptions
}

export default (): {
  name: string
  inherits: any
  visitor: Visitor<{ filename: string; opts: Opts }>
} => {
  return {
    name: 'Vue JSX Vapor',
    inherits: SyntaxJSX,
    visitor: {
      JSXElement: {
        exit: transformJSX,
      },
      JSXFragment: {
        exit: transformJSX,
      },
      Program: {
        enter: (_, state) => {
          state.opts.importSet = new Set<string>()
          state.opts.delegateEventSet = new Set<string>()
          state.opts.preambleMap = new Map<string, string>()
          state.opts.preambleIndex = 0
        },
        exit: (
          path,
          { opts: { delegateEventSet, importSet, preambleMap } },
        ) => {
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
            statements.unshift(`import { ${importResult} } from 'vue/vapor';\n`)
          }

          path.node.body.unshift(...[template(statements.join('\n'))()].flat())
        },
      },
    },
  }
}
