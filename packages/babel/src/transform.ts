import { compile } from '@vue-jsx-vapor/compiler'
import { parse } from '@babel/parser'
import { SourceMapConsumer } from 'source-map-js'
import traverse, { type VisitNodeFunction } from '@babel/traverse'
import { isJSXElement } from './utils'
import type { Options } from '.'
import type { JSXElement, JSXFragment } from '@babel/types'

export const transformJSX: VisitNodeFunction<
  Options,
  JSXElement | JSXFragment
> = (path, state) => {
  if (
    !(
      path.parent?.type !== 'JSXExpressionContainer' &&
      !isJSXElement(path.parent)
    )
  ) {
    return
  }

  const root = state.roots.shift()
  if (!root) return
  const isTS = state.filename?.endsWith('tsx')
  let { code, vaporHelpers, preamble, map } = compile(root.node, {
    mode: 'module',
    inline: true,
    isTS,
    filename: state.filename,
    sourceMap: true,
    source: ' '.repeat(root.node.start || 0) + root.source,
    ...state?.compile,
  })

  vaporHelpers.forEach((helper) => state.importSet.add(helper))

  preamble = preamble.replaceAll(
    /(?<=const )t(?=(\d))/g,
    `_t${state.preambleIndex}`,
  )
  code = code
    .replaceAll(/(?<== )t(?=\d)/g, `_t${state.preambleIndex}`)
    .replaceAll('_ctx: any', '')
    .replaceAll('$event: any', '$event')
  state.preambleIndex++

  for (const [, key, value] of preamble.matchAll(
    /const (_t\d+) = (_template\(.*\))/g,
  )) {
    const result = state.preambleMap.get(value)
    if (result) {
      code = code.replaceAll(key, result)
    } else {
      state.preambleMap.set(value, key)
    }
  }

  for (const [, events] of preamble.matchAll(/_delegateEvents\((.*)\)/g)) {
    events.split(', ').forEach((event) => state.delegateEventSet.add(event))
  }

  const ast = parse(code, {
    sourceFilename: state.filename,
    plugins: isTS ? ['jsx', 'typescript'] : ['jsx'],
  })

  if (map) {
    const consumer = new SourceMapConsumer(map)
    traverse(ast, {
      Identifier({ node: id }) {
        if (!id.loc) return
        const originalLoc = consumer.originalPositionFor(id.loc.start)
        if (originalLoc.column) {
          id.loc.start.line = originalLoc.line
          id.loc.start.column = originalLoc.column
          id.loc.end.line = originalLoc.line
          id.loc.end.column = originalLoc.column + id.name.length
        }
      },
    })
  }

  path.replaceWith(ast.program.body[0])
}
