import { camelize, extend } from '@vue/shared'
import { resolveExpression, resolveSimpleExpression } from '../utils'
import { isReservedProp } from './transformElement'
import type { DirectiveTransform } from '../transform'

export const transformVBind: DirectiveTransform = (dir, node, context) => {
  const { name, value, loc } = dir
  if (!loc || name.type === 'JSXNamespacedName') return

  const [nameString, ...modifiers] = name.name.split('_')

  const exp = resolveExpression(value, context)
  let arg = resolveSimpleExpression(nameString, true, dir.name.loc)

  if (arg.isStatic && isReservedProp(arg.content)) return

  let camel = false
  if (modifiers.includes('camel')) {
    if (arg.isStatic) {
      arg = extend({}, arg, { content: camelize(arg.content) })
    } else {
      camel = true
    }
  }

  return {
    key: arg,
    value: exp,
    loc,
    runtimeCamelize: camel,
    modifier: modifiers.includes('prop')
      ? '.'
      : modifiers.includes('attr')
        ? '^'
        : undefined,
  }
}
