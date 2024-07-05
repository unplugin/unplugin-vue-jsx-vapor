import { transformVShow as _transformVShow } from '@vue-vapor/compiler-vapor'
import { resolveDirectiveNode, resolveNode } from '../utils'
import type { DirectiveTransform } from '../transform'

export const transformVShow: DirectiveTransform = (dir, node, context) => {
  return _transformVShow(
    resolveDirectiveNode(dir, context),
    resolveNode(node, context),
    context as any,
  )
}
