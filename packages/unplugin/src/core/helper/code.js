import { effectScope, insert, remove, renderEffect } from 'vue/vapor'

function createFragment(nodes) {
  const fragment = [nodes, document.createTextNode('')]
  fragment._fragmentKey = true
  return fragment
}

function isFragment(node) {
  return (
    node &&
    typeof node === 'object' &&
    (node._fragmentKey || (node.nodes && node.anchor))
  )
}

function getFragmentNodes(fragment) {
  return fragment._fragmentKey ? fragment[0] : fragment.nodes
}

function getFragmentAnchor(fragment) {
  return fragment._fragmentKey ? fragment[1] : fragment.anchor
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
      const anchor = getFragmentAnchor(current)
      if (anchor.parentNode) {
        remove(getFragmentNodes(current), anchor.parentNode)
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
