import {
  VaporFragment,
  effectScope,
  insert,
  isFragment,
  remove,
  renderEffect,
} from 'vue'

function createFragment(nodes) {
  const frag = new VaporFragment(nodes)
  frag.anchor = document.createTextNode('')
  return frag
}

function normalizeValue(value) {
  return value == null || typeof value === 'boolean'
    ? document.createTextNode('')
    : value instanceof Node || isFragment(value)
      ? value
      : Array.isArray(value)
        ? createFragment(value.map(normalizeValue))
        : document.createTextNode(String(value))
}

function resolveValue(current, value) {
  const node = normalizeValue(value)
  if (current) {
    if (isFragment(current)) {
      const { anchor } = current
      if (anchor.parentNode) {
        remove(current.nodes, anchor.parentNode)
        insert(node, anchor.parentNode, anchor)
        anchor.remove()
      }
    } else if (current.nodeType) {
      if (isFragment(node) && current.parentNode) {
        insert(node, current.parentNode, current)
        current.remove()
      } else if (current.nodeType === 3 && node.nodeType === 3) {
        current.textContent = node.textContent
        return current
      } else {
        current.parentNode.replaceChild(node, current)
      }
    }
  }
  return node
}

function resolveValues(values = []) {
  const nodes = []
  const scopes = []
  for (const [index, value] of values.entries()) {
    if (typeof value === 'function') {
      renderEffect(() => {
        if (scopes[index]) {
          scopes[index].stop()
        }
        scopes[index] = effectScope()
        scopes[index].run(() => {
          nodes[index] = resolveValue(nodes[index], value())
        })
      })
    } else {
      nodes[index] = resolveValue(nodes[index], value)
    }
  }
  return nodes
}

export function setText(parent, ...values) {
  insert(resolveValues(values), parent)
}

export function createTextNode(...values) {
  return resolveValues(values)
}
