import type { CallExpression, ConditionalExpression, Expression, LogicalExpression, Node } from '@babel/types'
import type { MagicString } from '@vue-macros/common'

export function addAttribute(
  node: Node,
  str: string,
  s: MagicString,
) {
  const end = node.type === 'JSXElement'
    ? node.openingElement.name.end!
    : node.type === 'JSXFragment'
      ? node.openingFragment.end! - 1
      : null
  if (end)
    s.appendRight(end, str)
}

export function overwrite(
  start: number | undefined,
  end: number | undefined,
  content: string,
  s: MagicString,
) {
  if (start === end) {
    s.prependLeft(start!, content)
  }
  else {
    s.overwrite(start!, end!, content)
  }
}

export function getReturnExpression(
  node: Node,
): Expression | undefined {
  if (
    node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression'
  ) {
    if (node.body.type !== 'BlockStatement') {
      return node.body
    }
    else {
      for (const statement of node.body.body) {
        if (statement.type === 'ReturnStatement' && statement.argument)
          return statement.argument
      }
    }
  }
}

export function isJSXExpression(node?: Node | null): boolean {
  return !!node && (
    isJSXElement(node)
    || isConditionalExpression(node)
    || isLogicalExpression(node)
    || isMapCallExpression(node)
  )
}

export function isJSXElement(node?: Node | null): boolean {
  return !!node && (
    node.type === 'JSXElement'
    || node.type === 'JSXFragment'
  )
}

export function isMapCallExpression(node?: Node | null): node is CallExpression {
  return !!node && (
    node.type === 'CallExpression'
    && node.callee.type === 'MemberExpression'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'map'
    && isJSXExpression(
      getReturnExpression(node.arguments[0]),
    )
  )
}

export function isConditionalExpression(node: Node): node is ConditionalExpression {
  return node.type === 'ConditionalExpression' && (
    isJSXExpression(node.consequent)
    || isJSXExpression(node.alternate)
  )
}

export function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression'
    && isJSXExpression(node.right)
}
