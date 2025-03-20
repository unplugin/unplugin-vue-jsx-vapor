import { HELPER_PREFIX } from '@vue-macros/common'
import { replaceRange } from 'ts-macro'
import { transformDefineStyle } from './define-style'
import type { RootMap, TransformOptions } from '.'

export function transformJsxMacros(
  rootMap: RootMap,
  options: TransformOptions,
): void {
  const { ts, codes, ast } = options

  for (const [root, map] of rootMap) {
    transformDefineStyle(map.defineStyle, options)

    if (!root?.body) continue

    const asyncModifier = root.modifiers?.find(
      (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
    )
    let setup = `typeof ${HELPER_PREFIX}setup`
    setup = asyncModifier ? `Awaited<${setup}>` : setup
    if (asyncModifier && map.defineComponent)
      replaceRange(codes, asyncModifier.pos, asyncModifier.end)
    const result = `({}) as __VLS_PickNotAny<${setup}['render'], {}> & { __ctx: ${setup} }`

    const propsType = root.parameters[0]?.type
      ? String(root.parameters[0].type.getText(ast))
      : '{}'
    replaceRange(
      codes,
      root.parameters.pos,
      root.parameters.pos,
      ts.isArrowFunction(root) && root.parameters.pos === root.pos ? '(' : '',
      `${HELPER_PREFIX}props: ${setup}['props'] & ${propsType}, `,
      `${HELPER_PREFIX}placeholder?: {}, `,
      `${HELPER_PREFIX}setup = (${asyncModifier ? 'async' : ''}(`,
    )
    if (ts.isArrowFunction(root)) {
      replaceRange(
        codes,
        root.end,
        root.end,
        `)())${root.pos === root.parameters.pos ? ')' : ''} => `,
        result,
      )
    } else {
      replaceRange(
        codes,
        root.body.getStart(ast),
        root.body.getStart(ast),
        '=>',
      )
      replaceRange(codes, root.end, root.end, `)()){ return `, result, '}')
    }

    ts.forEachChild(root.body, (node) => {
      if (ts.isReturnStatement(node) && node.expression) {
        const props = [...(map.defineModel ?? [])]
        const elements =
          root.parameters[0] &&
          !root.parameters[0].type &&
          ts.isObjectBindingPattern(root.parameters[0].name)
            ? root.parameters[0].name.elements
            : []
        for (const element of elements) {
          if (ts.isIdentifier(element.name))
            props.push(
              `${element.name.escapedText}${
                element.initializer &&
                ts.isNonNullExpression(element.initializer)
                  ? ':'
                  : '?:'
              } typeof ${element.name.escapedText}`,
            )
        }

        const shouldWrapByCall =
          (ts.isArrowFunction(node.expression) ||
            ts.isFunctionExpression(node.expression)) &&
          map.defineComponent
        replaceRange(
          codes,
          node.getStart(ast),
          node.expression.getStart(ast),
          `return {\nprops: {} as { ${props.join(', ')} }`,
          `,\nslots: {} as ${map.defineSlots ?? '{}'}`,
          `,\nexpose: (exposed: import('vue').ShallowUnwrapRef<${map.defineExpose ?? '{}'}>) => {}`,
          `,\nrender: `,
          shouldWrapByCall ? '(' : '',
        )
        replaceRange(
          codes,
          node.expression.end,
          node.expression.end,
          shouldWrapByCall ? ')()' : '',
          `\n}`,
        )
      }
    })
  }
}
