import { DynamicFlag, type IRDynamicInfo, IRNodeTypes } from '../ir/index'
import {
  type NodeTransform,
  type TransformContext,
  transformNode,
} from '../transform'
import type { Node } from '@babel/types'

export const transformChildren: NodeTransform = (node, context) => {
  const isFragment =
    node.type === IRNodeTypes.ROOT || node.type === 'JSXFragment'

  if (!isFragment && node.type !== 'JSXElement') return

  Array.from(node.children).forEach((child, index) => {
    if (child.type === 'JSXText' && !child.value.trim()) {
      child.value = ' '
      if (!index) {
        node.children.splice(0, 1)
      } else if (index === node.children.length) {
        node.children.splice(-1, 1)
      }
    }
  })

  for (const [i, child] of node.children.entries()) {
    const childContext = context.create(child, i)
    transformNode(childContext)

    if (isFragment) {
      childContext.reference()
      childContext.registerTemplate()

      if (
        !(childContext.dynamic.flags & DynamicFlag.NON_TEMPLATE) ||
        childContext.dynamic.flags & DynamicFlag.INSERT
      ) {
        context.block.returns.push(childContext.dynamic.id!)
      }
    } else {
      context.childrenTemplate.push(childContext.template)
    }

    context.dynamic.children[i] = childContext.dynamic
  }

  if (!isFragment) {
    processDynamicChildren(context as TransformContext<Node>)
  }
}

function processDynamicChildren(context: TransformContext<Node>) {
  let prevDynamics: IRDynamicInfo[] = []
  let hasStaticTemplate = false
  const children = context.dynamic.children

  for (const [index, child] of children.entries()) {
    if (child.flags & DynamicFlag.INSERT) {
      prevDynamics.push(child)
    }

    if (!(child.flags & DynamicFlag.NON_TEMPLATE)) {
      if (prevDynamics.length) {
        if (hasStaticTemplate) {
          context.childrenTemplate[index - prevDynamics.length] = `<!>`

          prevDynamics[0].flags -= DynamicFlag.NON_TEMPLATE
          const anchor = (prevDynamics[0].anchor = context.increaseId())

          context.registerOperation({
            type: IRNodeTypes.INSERT_NODE,
            elements: prevDynamics.map((child) => child.id!),
            parent: context.reference(),
            anchor,
          })
        } else {
          context.registerOperation({
            type: IRNodeTypes.PREPEND_NODE,
            elements: prevDynamics.map((child) => child.id!),
            parent: context.reference(),
          })
        }
        prevDynamics = []
      }
      hasStaticTemplate = true
    }
  }

  if (prevDynamics.length) {
    context.registerOperation({
      type: IRNodeTypes.INSERT_NODE,
      elements: prevDynamics.map((child) => child.id!),
      parent: context.reference(),
    })
  }
}
