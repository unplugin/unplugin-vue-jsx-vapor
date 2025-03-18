import {
  effectScope,
  insert,
  isFragment,
  remove,
  renderEffect,
  VaporFragment,
  type Block,
  type EffectScope,
} from 'vue'

export { shallowRef as useRef } from 'vue'

function createFragment(
  nodes: Block[],
  anchor: Node | undefined = document.createTextNode(''),
) {
  const frag = new VaporFragment(nodes)
  frag.anchor = anchor
  return frag
}

function normalizeValue(value: any, anchor?: Element): Block {
  if (value instanceof Node || isFragment(value)) {
    anchor && (anchor.textContent = '')
    return value
  } else if (Array.isArray(value)) {
    anchor && (anchor.textContent = '')
    return createFragment(
      value.map((i) => normalizeValue(i)),
      anchor,
    )
  } else {
    const result =
      value == null || typeof value === 'boolean' ? '' : String(value)
    if (anchor) {
      anchor.textContent = result
      return anchor
    } else {
      return document.createTextNode(result)
    }
  }
}

function resolveValue(current: Block, value: any, anchor?: Element) {
  const node = normalizeValue(value, anchor)
  if (current) {
    if (isFragment(current)) {
      const { anchor } = current
      if (anchor && anchor.parentNode) {
        remove(current.nodes, anchor.parentNode)
        insert(node, anchor.parentNode, anchor)
        ;(anchor as Element).remove()
      }
    } else if (current instanceof Node) {
      if (isFragment(node) && current.parentNode) {
        insert(node, current.parentNode, current)
        ;(current as Element).remove()
      } else if (node instanceof Node) {
        if (current.nodeType === 3 && node.nodeType === 3) {
          current.textContent = node.textContent
          return current
        } else if (current.parentNode) {
          current.parentNode.replaceChild(node, current)
        }
      }
    }
  }
  return node
}

function resolveValues(values: any[] = [], _anchor?: Element) {
  const nodes: Block[] = []
  const scopes: EffectScope[] = []
  for (const [index, value] of values.entries()) {
    const anchor = index === values.length - 1 ? _anchor : undefined
    if (typeof value === 'function') {
      renderEffect(() => {
        if (scopes[index]) scopes[index].stop()
        scopes[index] = effectScope()
        nodes[index] = scopes[index].run(() =>
          resolveValue(nodes[index], value(), anchor),
        )!
      })
    } else {
      nodes[index] = resolveValue(nodes[index], value, anchor)
    }
  }
  return nodes
}

export function setNodes(anchor: Element, ...values: any[]) {
  const resolvedValues = resolveValues(values, anchor)
  anchor.parentNode && insert(resolvedValues, anchor.parentNode, anchor)
}

export function createNodes(...values: any[]) {
  return resolveValues(values)
}
