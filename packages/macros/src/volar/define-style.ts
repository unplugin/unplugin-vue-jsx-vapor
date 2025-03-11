import { HELPER_PREFIX } from '@vue-macros/common'
import { generateClassProperty } from '@vue/language-core/lib/codegen/style/classProperty.js'
import { parseCssClassNames } from '@vue/language-core/lib/utils/parseCssClassNames.js'
import { replaceRange } from 'ts-macro'
import type { JsxMacros, TransformOptions } from '.'

export function transformDefineStyle(
  defineStyles: JsxMacros['defineStyle'],
  options: TransformOptions,
): void {
  if (!defineStyles?.length) return
  const { ts, codes, ast } = options
  defineStyles.forEach(({ expression, isCssModules }, index) => {
    if (
      isCssModules &&
      expression?.arguments[0] &&
      !expression.typeArguments &&
      ts.isTemplateLiteral(expression.arguments[0])
    ) {
      replaceRange(
        codes,
        expression.arguments.pos - 1,
        expression.arguments.pos - 1,
        `<${HELPER_PREFIX}PrettifyLocal<{}`,
        ...generateCssClassesType(
          expression.arguments[0].getText(ast).slice(1, -1),
          expression.arguments[0].getStart(ast) + 1,
          index,
        ),
        '>>',
      )
    }

    addEmbeddedCode(expression, index, options)
  })
}

function* generateCssClassesType(css: string, offset: number, index: number) {
  for (const className of [...parseCssClassNames(css)]) {
    yield* generateClassProperty(
      index,
      className.text,
      className.offset + offset,
      'string',
    )
  }
}

function addEmbeddedCode(
  expression: import('typescript').CallExpression,
  index: number,
  options: TransformOptions,
) {
  const { ts, ast } = options
  const languageId =
    ts.isPropertyAccessExpression(expression.expression) &&
    ts.isIdentifier(expression.expression.name)
      ? expression.expression.name.text
      : 'css'
  const style = expression.arguments[0]
  const styleText = style
    .getText(ast)
    .slice(1, -1)
    .replaceAll(/\$\{.*\}/g, (str) => '_'.repeat(str.length))
  options.embeddedCodes.push({
    id: `style_${index}`,
    languageId,
    snapshot: {
      getText: (start, end) => styleText.slice(start, end),
      getLength: () => styleText.length,
      getChangeRange: () => undefined,
    },
    mappings: [
      {
        sourceOffsets: [style.getStart(ast) + 1],
        generatedOffsets: [0],
        lengths: [styleText.length],
        data: {
          completion: true,
          format: true,
          navigation: true,
          semantic: true,
          structure: true,
          verification: true,
        },
      },
    ],
    embeddedCodes: [],
  })
}
