import { importHelperFn, type MagicStringAST } from '@vue-macros/common'
import type { CallExpression } from '@babel/types'

export function transformDefineSlots(
  node: CallExpression,
  s: MagicStringAST,
): void {
  s.overwrite(
    node.start!,
    (node.arguments[0]?.start && node.arguments[0].start - 1) ||
      node.typeArguments?.end ||
      node.callee.end!,
    `Object.assign`,
  )
  const slots = `${importHelperFn(s, 0, 'useSlots')}()`
  s.appendLeft(node.end! - 1, `${node.arguments[0] ? ',' : '{}, '}${slots}`)
}
