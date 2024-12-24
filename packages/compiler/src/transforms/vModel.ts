import { transformVModel as _transformVModel } from '@vue/compiler-vapor'
import { resolveDirectiveNode, resolveNode } from '../utils'
import type { DirectiveTransform } from '../transform'

export const transformVModel: DirectiveTransform = (dir, node, context) => {
  return _transformVModel(
    resolveDirectiveNode(dir, context),
    resolveNode(node, context),
    context as any,
  )
}
