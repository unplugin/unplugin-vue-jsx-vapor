import { transformVHtml as _transformVHtml } from '@vue-vapor/compiler-vapor'
import { resolveDirectiveNode, resolveNode } from '../utils'
import type { DirectiveTransform } from '../transform'

export const transformVHtml: DirectiveTransform = (dir, node, context) => {
  return _transformVHtml(
    resolveDirectiveNode(dir, context),
    resolveNode(node, context),
    context as any,
  )
}
