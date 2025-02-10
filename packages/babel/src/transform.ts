import { compile } from '@vue-jsx-vapor/compiler'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import { SourceMapConsumer } from 'source-map-js'
import traverse, {
  type NodePath,
  type VisitNodeFunction,
} from '@babel/traverse'
import type { Opts } from '.'
import type { JSXElement, JSXFragment, Node } from '@babel/types'

export const transformJSX: VisitNodeFunction<
  {
    filename: string
    opts: Opts
  },
  JSXElement | JSXFragment
> = (path, state) => {
  const { parent, node } = path
  if (
    !(
      parent?.type !== 'JSXExpressionContainer' &&
      !isJSXElement(parent) &&
      !isConditionalExpression(path.parentPath)
    )
  ) {
    return
  }

  let { code, vaporHelpers, preamble, map } = compile(
    ' '.repeat(node.loc?.start.column || 0) + generate(node).code,
    {
      mode: 'module',
      inline: true,
      isTS: state.filename?.endsWith('tsx'),
      filename: state.filename,
      sourceMap: true,
      ...state.opts?.compile,
    },
  )
  vaporHelpers.forEach((helper) => state.opts.importSet.add(helper))

  preamble = preamble.replaceAll(
    /(?<=const )t(?=(\d))/g,
    `_t${state.opts.preambleIndex}`,
  )
  code = code
    .replaceAll(/(?<== )t(?=\d)/g, `_t${state.opts.preambleIndex}`)
    .replaceAll('_ctx: any', '')
    .replaceAll('$event: any', '$event')
  state.opts.preambleIndex++

  for (const [, key, value] of preamble.matchAll(
    /const (_t\d+) = (_template\(.*\))/g,
  )) {
    const result = state.opts.preambleMap.get(value)
    if (result) {
      code = code.replaceAll(key, result)
    } else {
      state.opts.preambleMap.set(value, key)
    }
  }

  for (const [, events] of preamble.matchAll(/_delegateEvents\((.*)\)/g)) {
    events
      .split(', ')
      .forEach((event: any) => state.opts.delegateEventSet.add(event))
  }

  const ast = parse(code, {
    sourceFilename: state.filename,
  })

  if (map) {
    const consumer = new SourceMapConsumer(map)
    const line = (node.loc?.start.line ?? 1) - 1
    traverse(ast, {
      Identifier({ node: id }) {
        const originalLoc = consumer.originalPositionFor(id.loc!.start)
        if (originalLoc) {
          id.loc = {
            ...id.loc!,
            start: {
              line: line + originalLoc.line,
              column: originalLoc.column,
              index: originalLoc.column,
            },
            end: {
              line: line + originalLoc.line,
              column: originalLoc.column + id.name.length,
              index: originalLoc.column + id.name.length,
            },
          }
        }
      },
    })
  }
  // console.dir({ a }, { depth: 112 })
  // path.replaceWith()
  path.replaceWith(ast.program.body[0])
  // path.replaceWithSourceString(code)
}

function isJSXElement(node?: Node | null): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}

function isConditionalExpression(path: NodePath<Node> | null): boolean {
  return !!(
    path &&
    (path?.type === 'LogicalExpression' ||
      path.type === 'ConditionalExpression') &&
    (path.parent.type === 'JSXExpressionContainer' ||
      (path.parent.type === 'ConditionalExpression' &&
        isConditionalExpression(path.parentPath)))
  )
}
