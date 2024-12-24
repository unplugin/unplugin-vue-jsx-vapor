import { parse } from '@babel/parser'
import { type CompilerOptions, generate, transform } from '../../src/'
import { IRNodeTypes, type RootNode } from '../../src/ir'
import type { JSXElement, JSXFragment } from '@babel/types'

export function makeCompile(options: CompilerOptions = {}) {
  return (source: string, overrideOptions: CompilerOptions = {}) => {
    const {
      body: [statement],
    } = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    }).program
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
      expressionPlugins: ['typescript', 'jsx'],
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
