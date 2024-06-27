import { describe, expect, test } from 'vitest'

import {
  transformChildren,
  transformElement,
  transformText,
  // transformVIf,
} from '../../src/core/compiler'
import { makeCompile } from './_utils'

const compileWithElementTransform = makeCompile({
  nodeTransforms: [
    transformText,
    // transformVIf,
    transformElement,
    transformChildren,
  ],
})

describe('compiler: children transform', () => {
  test.todo('basic')

  test('children & sibling references', () => {
    const { code, vaporHelpers } = compileWithElementTransform(
      `<div id>
        <p>{ first }</p> 
        { second }
        <p>{ forth }</p>
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "import { next as _next, createTextNode as _createTextNode, insert as _insert, renderEffect as _renderEffect, setText as _setText, template as _template } from 'vue/vapor';
      const t0 = _template("<div id><p></p> <!><p></p></div>")

      export function render(_ctx) {
        const n4 = t0()
        const n0 = n4.firstChild
        const n3 = _next(n0, 2)
        const n2 = n3.nextSibling
        const n1 = _createTextNode(() => [_ctx.second, " "])
        _insert(n1, n4, n3)
        _renderEffect(() => _setText(n0, _ctx.first))
        _renderEffect(() => _setText(n2, _ctx.forth))
        return n4
      }"
    `)
    expect(Array.from(vaporHelpers)).containSubset([
      'next',
      'setText',
      'createTextNode',
      'insert',
      'template',
    ])
  })
})
