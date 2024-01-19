import type { CallExpression, ConditionalExpression, LogicalExpression, Node } from '@babel/types'
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
    s.appendRight(start!, content)
  }
  else {
    s.overwrite(start!, end!, content)
  }
}

export function getReturnExpression(
  node: Node,
) {
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

export function isJSXElement(node?: Node): boolean {
  return !!node && (node.type === 'JSXElement'
    || node.type === 'JSXFragment'
    || isConditionalExpression(node)
    || isLogicalExpression(node)
    || isMapCallExpression(node)
  )
}

export function isMapCallExpression(node: Node): node is CallExpression {
  return node.type === 'CallExpression'
    && node.callee.type === 'MemberExpression'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'map'
    && isJSXElement(
      getReturnExpression(node.arguments[0]),
    )
}

export function isConditionalExpression(node: Node): node is ConditionalExpression {
  return node.type === 'ConditionalExpression' && (
    isJSXElement(node.consequent)
    || isJSXElement(node.alternate)
  )
}

export function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression'
    && isJSXElement(node.right)
}
