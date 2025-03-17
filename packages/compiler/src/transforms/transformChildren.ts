import {
  DynamicFlag,
  IRNodeTypes,
  isBlockOperation,
  type IRDynamicInfo,
} from '../ir/index'
import {
  transformNode,
  type NodeTransform,
  type TransformContext,
} from '../transform'
import { isJSXComponent, isTemplate } from '../utils'
import type { Node } from '@babel/types'

export const transformChildren: NodeTransform = (node, context) => {
  const isFragment =
    node.type === IRNodeTypes.ROOT ||
    node.type === 'JSXFragment' ||
    (node.type === 'JSXElement' && (isTemplate(node) || isJSXComponent(node)))

  if (node.type !== 'JSXElement' && !isFragment) return

  for (const [i, child] of node.children.entries()) {
    const childContext = context.create(child, i)
    transformNode(childContext)

    const childDynamic = childContext.dynamic

    if (isFragment) {
      childContext.reference()
      childContext.registerTemplate()

      if (
        !(childDynamic.flags & DynamicFlag.NON_TEMPLATE) ||
        childDynamic.flags & DynamicFlag.INSERT
      ) {
        context.block.returns.push(childDynamic.id!)
      }
    } else {
      context.childrenTemplate.push(childContext.template)
    }

    if (
      childDynamic.hasDynamicChild ||
      childDynamic.id !== undefined ||
      childDynamic.flags & DynamicFlag.NON_TEMPLATE ||
      childDynamic.flags & DynamicFlag.INSERT
    ) {
      context.dynamic.hasDynamicChild = true
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
          registerInsertion(prevDynamics, context, anchor)
        } else {
          registerInsertion(prevDynamics, context, -1 /* prepend */)
        }
        prevDynamics = []
      }
      hasStaticTemplate = true
    }
  }

  if (prevDynamics.length) {
    registerInsertion(prevDynamics, context)
  }
}

function registerInsertion(
  dynamics: IRDynamicInfo[],
  context: TransformContext,
  anchor?: number,
) {
  for (const child of dynamics) {
    if (child.template != null) {
      // template node due to invalid nesting - generate actual insertion
      context.registerOperation({
        type: IRNodeTypes.INSERT_NODE,
        elements: dynamics.map((child) => child.id!),
        parent: context.reference(),
        anchor,
      })
    } else if (child.operation && isBlockOperation(child.operation)) {
      // block types
      child.operation.parent = context.reference()
      child.operation.anchor = anchor
    }
  }
}
