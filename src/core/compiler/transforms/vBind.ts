import {
  ErrorCodes,
  type SimpleExpressionNode,
  createCompilerError,
} from '@vue/compiler-dom'
import { camelize, extend } from '@vue/shared'
import {
  resolveExpression,
  resolveLocation,
  resolveSimpleExpression,
} from '../utils'
import { isReservedProp } from './transformElement'
import type { DirectiveTransform } from '../transform'

const __BROWSER__ = false
export const transformVBind: DirectiveTransform = (dir, node, context) => {
  const { loc } = dir
  if (!loc || dir.name.type === 'JSXNamespacedName') return

  const [name, ...modifiers] = dir.name.name.split('_')

  let exp: SimpleExpressionNode
  if (!name.trim() && loc) {
    if (!__BROWSER__) {
      // #10280 only error against empty expression in non-browser build
      // because :foo in in-DOM templates will be parsed into :foo="" by the
      // browser
      context.options.onError(
        createCompilerError(
          ErrorCodes.X_V_BIND_NO_EXPRESSION,
          resolveLocation(loc, name),
        ),
      )
    }
    exp = resolveSimpleExpression('', true, loc)
  }

  exp = resolveExpression(dir.value, context)
  let arg = resolveExpression(dir.name, context)

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
