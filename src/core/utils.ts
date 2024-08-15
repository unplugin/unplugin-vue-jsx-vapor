import { isMapCallExpression } from './compiler/utils'
import type {
  ArrowFunctionExpression,
  ConditionalExpression,
  FunctionDeclaration,
  FunctionExpression,
  JSXElement,
  JSXFragment,
  LogicalExpression,
  Node,
} from '@babel/types'
import type { MagicString } from '@vue-macros/common'

export function addAttribute(node: Node, str: string, s: MagicString) {
  const end =
    node.type === 'JSXElement'
      ? node.openingElement.name.end!
      : node.type === 'JSXFragment'
        ? node.openingFragment.end! - 1
        : null
  if (end) s.appendRight(end, str)
}

export function overwrite(
  start: number | undefined,
  end: number | undefined,
  content: string,
  s: MagicString,
  method:
    | 'prependLeft'
    | 'prependRight'
    | 'appendLeft'
    | 'appendRight' = 'prependLeft',
) {
  if (start === end) {
    s[method](start!, content)
  } else {
    s.overwrite(start!, end!, content)
  }
}

export function isJSXExpression(node?: Node | null): boolean {
  return (
    !!node &&
    (isJSXElement(node) ||
      isConditionalExpression(node) ||
      isLogicalExpression(node) ||
      isMapCallExpression(node))
  )
}

export function isJSXElement(
  node?: Node | null,
): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}

export function isConditionalExpression(
  node: Node,
): node is ConditionalExpression {
  return (
    node.type === 'ConditionalExpression' &&
    (isJSXExpression(node.consequent) || isJSXExpression(node.alternate))
  )
}

export function isLogicalExpression(node: Node): node is LogicalExpression {
  return node.type === 'LogicalExpression' && isJSXExpression(node.right)
}

export function isFunctionExpression(
  node: Node,
): node is FunctionExpression | ArrowFunctionExpression | FunctionDeclaration {
  return (
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration'
  )
}
