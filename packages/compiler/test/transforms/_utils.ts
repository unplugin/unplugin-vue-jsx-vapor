import { parse } from '@babel/parser'
import { generate, transform, type CompilerOptions } from '../../src'
import { customGenOperation } from '../../src/generate'
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
    }
    const ir = transform(ast, {
      expressionPlugins: ['typescript', 'jsx'],
      inline: true,
      prefixIdentifiers: false,
      ...options,
      ...overrideOptions,
    }) as any
    const { code, helpers, preamble } = generate(ir, {
      inline: true,
      prefixIdentifiers: false,
      ...options,
      ...overrideOptions,
      customGenOperation,
    })
    return { ast, ir, code, helpers, preamble }
  }
}
