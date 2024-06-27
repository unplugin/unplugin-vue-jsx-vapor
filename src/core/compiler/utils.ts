import { isGloballyAllowed } from '@vue/shared'
import {
  type AttributeNode,
  type ElementNode,
  NodeTypes,
  type SimpleExpressionNode,
  findDir as _findDir,
  findProp as _findProp,
  createSimpleExpression,
  isLiteralWhitelisted,
} from '@vue/compiler-dom'
import htmlTags, { type HtmlTags } from 'html-tags'
import svgTags from 'svg-tags'
import { EMPTY_EXPRESSION } from './transforms/utils'
import type { VaporDirectiveNode } from './ir'
import type {
  BigIntLiteral,
  Node,
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

export function resolveExpression(exp: SimpleExpressionNode) {
  if (!exp.isStatic) {
    const value = getLiteralExpressionValue(exp)
    if (value !== null) {
      return createSimpleExpression(`${value}`, true, exp.loc)
    }
  }
  return exp
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

export function resolveSimpleExpression(
  source: string,
  isStatic: boolean,
  location: SourceLocation,
) {
  return createSimpleExpression(source, isStatic, {
    start: {
      line: location.start.line,
      column: location.start.column,
      offset: location.start.index,
    },
    end: {
      line: location.end.line,
      column: location.end.column,
      offset: location.end.index,
    },
    source,
  })
}

export function isComponent(node: Node) {
  if (node.type === 'JSXIdentifier') {
    const name = node.name
    return !htmlTags.includes(name as HtmlTags) && !svgTags.includes(name)
  } else {
    return node.type === 'JSXMemberExpression'
  }
}
