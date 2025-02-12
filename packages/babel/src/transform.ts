import { compile } from '@vue-jsx-vapor/compiler'
import { parse } from '@babel/parser'
import { SourceMapConsumer } from 'source-map-js'
import traverse, { type VisitNodeFunction } from '@babel/traverse'
import type { Options } from '.'
import type { JSXElement, JSXFragment, Node } from '@babel/types'

export const transformJSX: VisitNodeFunction<
  Options,
  JSXElement | JSXFragment
> = (path, state) => {
  const { parent, node } = path
  if (!(parent?.type !== 'JSXExpressionContainer' && !isJSXElement(parent))) {
    return
  }

  let { code, vaporHelpers, preamble, map } = compile(
    state.rootCodes.shift()!,
    {
      mode: 'module',
      inline: true,
      isTS: state.filename?.endsWith('tsx'),
      filename: state.filename,
      sourceMap: true,
      ...state?.compile,
    },
  )
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
    startLine: node.loc!.start.line - 1,
    plugins: ['jsx'],
  })

  if (map) {
    const consumer = new SourceMapConsumer(map)
    const line = node.loc!.start.line - 1
    traverse(ast, {
      Identifier({ node: id }) {
        const originalLoc = consumer.originalPositionFor({
          ...id.loc!.start,
          line: id.loc!.start.line - line + 1,
        })
        const column = originalLoc.line === 1 ? node.loc!.start.column : 0
        if (originalLoc.column) {
          id.loc!.start.line = line + originalLoc.line + (path.hub ? 0 : 1)
          id.loc!.start.column = column + originalLoc.column
          id.loc!.end.line = line + originalLoc.line
          id.loc!.end.column = column + originalLoc.column + id.name.length
        }
      },
    })
  }
  path.replaceWith(ast.program.body[0])
}

export function isJSXElement(
  node?: Node | null,
): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}
