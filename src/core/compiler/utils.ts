import { isGloballyAllowed, isString } from '@vue-vapor/shared'
import {
  type AttributeNode,
  type ElementNode,
  NodeTypes,
  type SimpleExpressionNode,
  findDir as _findDir,
  findProp as _findProp,
  createSimpleExpression,
  isLiteralWhitelisted,
} from '@vue-vapor/compiler-dom'
import htmlTags, { type HtmlTags } from 'html-tags'
import svgTags from 'svg-tags'
import { type ParseResult, parseExpression } from '@babel/parser'
import { EMPTY_EXPRESSION } from './transforms/utils'
import type { TransformContext } from './transform'
import type { VaporDirectiveNode } from './ir'
import type {
  BigIntLiteral,
  Expression,
  JSXAttribute,
  JSXElement,
  JSXIdentifier,
  JSXText,
  NumericLiteral,
  SourceLocation,
  StringLiteral,
} from '@babel/types'

const __BROWSER__ = false

export const findProp = _findProp as (
  node: ElementNode,
  name: string,
  dynamicOnly?: boolean,
  allowEmpty?: boolean,
) => AttributeNode | VaporDirectiveNode | undefined

/** find directive */
export const findDir = _findDir as (
  node: ElementNode,
  name: string | RegExp,
  allowEmpty?: boolean,
) => VaporDirectiveNode | undefined

export function propToExpression(prop: AttributeNode | VaporDirectiveNode) {
  return prop.type === NodeTypes.ATTRIBUTE
    ? prop.value
      ? createSimpleExpression(prop.value.content, true, prop.value.loc)
      : EMPTY_EXPRESSION
    : prop.exp
}

export function isConstantExpression(exp: SimpleExpressionNode) {
  return (
    isLiteralWhitelisted(exp.content) ||
    isGloballyAllowed(exp.content) ||
    getLiteralExpressionValue(exp) !== null
  )
}

export function getLiteralExpressionValue(
  exp: SimpleExpressionNode,
): number | string | boolean | null {
  if (!__BROWSER__ && exp.ast) {
    if (
      ['StringLiteral', 'NumericLiteral', 'BigIntLiteral'].includes(
        exp.ast.type,
      )
    ) {
      return (exp.ast as StringLiteral | NumericLiteral | BigIntLiteral).value
    } else if (
      exp.ast.type === 'TemplateLiteral' &&
      exp.ast.expressions.length === 0
    ) {
      return exp.ast.quasis[0].value.cooked!
    }
  }
  return exp.isStatic ? exp.content : null
}

export function resolveExpression(
  node: JSXAttribute['value'] | JSXText | JSXIdentifier,
  context: TransformContext,
) {
  const isStatic =
    !!node &&
    (node.type === 'StringLiteral' ||
      node.type === 'JSXText' ||
      node.type === 'JSXIdentifier')
  const source = !node
    ? ''
    : node.type === 'JSXIdentifier'
      ? node.name
      : isStatic
        ? node.value
        : node.type === 'JSXExpressionContainer'
          ? node.expression.type === 'Identifier'
            ? node.expression.name
            : context.ir.source.slice(
                node.expression.start!,
                node.expression.end!,
              )
          : ''
  const location = node ? node.loc : null
  let ast: false | ParseResult<Expression> = false
  if (!isStatic && context.options.prefixIdentifiers) {
    ast = parseExpression(` ${source}`, {
      sourceType: 'module',
      plugins: context.options.expressionPlugins,
    })
  }
  return resolveSimpleExpression(source, isStatic, location, ast)
}

export function resolveSimpleExpression(
  source: string,
  isStatic: boolean,
  location?: SourceLocation | null,
  ast?: false | ParseResult<Expression>,
) {
  const result = createSimpleExpression(
    source,
    isStatic,
    resolveLocation(location, source),
  )
  result.ast = ast ?? null
  return result
}

export function resolveLocation(
  location: SourceLocation | null | undefined,
  context: TransformContext | string,
) {
  return location
    ? {
        start: {
          line: location.start.line,
          column: location.start.column + 1,
          offset: location.start.index,
        },
        end: {
          line: location.end.line,
          column: location.end.column + 1,
          offset: location.end.index,
        },
        source: isString(context)
          ? context
          : context.ir.source.slice(location.start.index, location.end.index),
      }
    : {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      }
}

export function isComponentNode(node: JSXElement) {
  const { openingElement } = node
  if (openingElement.name.type === 'JSXIdentifier') {
    const name = openingElement.name.name
    return !htmlTags.includes(name as HtmlTags) && !svgTags.includes(name)
  } else {
    return openingElement.name.type === 'JSXMemberExpression'
  }
}
