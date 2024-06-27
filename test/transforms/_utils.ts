import { babelParse } from '@vue-macros/common'
import {
  type CompilerOptions,
  generate,
  transform,
} from '../../src/core/compiler'
import { IRNodeTypes, type RootNode } from '../../src/core/compiler/ir'
import type { JSXElement, JSXFragment } from '@babel/types'

export function makeCompile(options: CompilerOptions = {}) {
  return (source: string, overrideOptions: CompilerOptions = {}) => {
    const {
      body: [statement],
    } = babelParse(source)
    let children!: JSXElement[] | JSXFragment['children']
    if (statement.type === 'ExpressionStatement') {
      children =
        statement.expression.type === 'JSXFragment'
          ? statement.expression.children
          : statement.expression.type === 'JSXElement'
            ? [statement.expression]
            : []
    }
    const ast: RootNode = {
      type: IRNodeTypes.ROOT,
      children,
      source,
      components: [],
      directives: [],
      helpers: new Set(),
      temps: 0,
    }
    const ir = transform(ast, {
      prefixIdentifiers: true,
      ...options,
      ...overrideOptions,
    }) as any
    const { code, helpers, vaporHelpers } = generate(ir, {
      prefixIdentifiers: true,
      ...options,
      ...overrideOptions,
    })
    return { ast, ir, code, helpers, vaporHelpers }
  }
}
