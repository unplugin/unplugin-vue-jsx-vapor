import { transformVText as _transformVText } from '@vue/compiler-vapor'
import { resolveDirectiveNode, resolveNode } from '../utils'
import type { DirectiveTransform } from '../transform'

export const transformVText: DirectiveTransform = (dir, node, context) => {
  return _transformVText(
    resolveDirectiveNode(dir, context),
    resolveNode(node, context),
    context as any,
  )
}
