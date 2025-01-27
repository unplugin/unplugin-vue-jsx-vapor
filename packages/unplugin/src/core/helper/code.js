import {
  createBranch,
  effectScope,
  insert,
  remove,
  renderEffect,
} from 'vue/vapor'

const fragmentKey = Object.getOwnPropertySymbols(createBranch(() => {}))[0]
function createFragment(nodes) {
  return {
    nodes,
    anchor: document.createTextNode(''),
    [fragmentKey]: true,
  }
}

function normalizeValue(value) {
  return value == null || typeof value === 'boolean'
    ? document.createTextNode('')
    : value instanceof Node || value[fragmentKey]
      ? value
      : Array.isArray(value)
        ? createFragment(value.map(normalizeValue))
        : document.createTextNode(String(value))
}

function resolveValue(current, value) {
  const node = normalizeValue(value)
  if (current) {
    if (current[fragmentKey]) {
      const { anchor } = current
      if (anchor.parentNode) {
        remove(current.nodes, anchor.parentNode)
        insert(node, anchor.parentNode, anchor)
        anchor.remove()
      }
    } else if (current.nodeType) {
      if (node[fragmentKey] && current.parentNode) {
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

function resolveValues(values) {
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

export function createTextNode(values) {
  return createFragment(resolveValues(values))
}
