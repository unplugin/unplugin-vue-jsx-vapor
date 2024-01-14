import type { MagicString } from '@vue-macros/common'
import type { CallExpression, Expression, Node } from '@babel/types'

export function transformVFor(
  nodes: CallExpression[],
  s: MagicString,
  offset: number,
) {
  nodes.forEach((node) => {
    const [argument] = node.arguments
    if (!argument)
      return

    let left
    let returnExpression
    if (
      argument.type === 'FunctionExpression'
      || argument.type === 'ArrowFunctionExpression'
    ) {
      left = s.sliceNode(argument.params, { offset })
      if (argument.body.type !== 'BlockStatement') {
        returnExpression = argument.body
      }
      else {
        for (const statement of argument.body.body) {
          if (statement.type === 'ReturnStatement' && statement.argument)
            returnExpression = statement.argument
        }
      }
    }
    if (!returnExpression)
      return

    const right = node.callee.type === 'MemberExpression'
      ? s.sliceNode(node.callee.object, { offset })
      : null
    if (!right)
      return

    const tagName = returnExpression.type === 'JSXElement' ? returnExpression.openingElement.name : returnExpression.type === 'JSXFragment' ? returnExpression.openingFragment : null
    if (!tagName)
      return
    if (tagName.end)
      s.appendRight(tagName.end, ` v-for="(${left}) in ${right}"`)
    s.remove(node.start! + offset, returnExpression.start! + offset - 1)
    s.remove(returnExpression.end! + offset + 1, node.end! + offset)
  })
}
