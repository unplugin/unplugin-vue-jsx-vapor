import { findProp } from '../utils'
import type { NodeTransform } from '../transform'

export const transformVOnce: NodeTransform = (node, context) => {
  if (
    // !context.inSSR &&
    node.type === 'JSXElement' &&
    findProp(node, 'v-once')
  ) {
    context.inVOnce = true
  }
}
