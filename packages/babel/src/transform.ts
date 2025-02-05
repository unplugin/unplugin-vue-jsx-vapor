import { compile } from '@vue-jsx-vapor/compiler'
import generate from '@babel/generator'
import type { Opts } from '.'
import type { JSXElement, JSXFragment, Node } from '@babel/types'
import type { NodePath, VisitNodeFunction } from '@babel/traverse'

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

  let { code, vaporHelpers, preamble } = compile(generate(node).code, {
    mode: 'module',
    inline: true,
    isTS: state.filename?.endsWith('tsx'),
    filename: 'index.tsx',
    ...state.opts?.compile,
  })
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
  path.replaceWithSourceString(code)
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
