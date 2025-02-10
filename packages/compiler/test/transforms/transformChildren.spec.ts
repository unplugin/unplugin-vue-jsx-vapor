import { describe, expect, test } from 'vitest'

import { NodeTypes } from '@vue/compiler-core'
import { IRDynamicPropsKind, IRNodeTypes } from '@vue/compiler-vapor'
import {
  transformChildren,
  transformElement,
  transformText,
  transformVBind,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithElementTransform = makeCompile({
  nodeTransforms: [transformText, transformElement, transformChildren],
  directiveTransforms: { bind: transformVBind },
})

describe('compiler: children transform', () => {
  test('basic', () => {
    const { code, vaporHelpers } = compileWithElementTransform(
      `<div>
        {foo} {bar}
       </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "import { setText as _setText, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        _setText(n0, () => (foo), " ", () => (bar))
        return n0
      }"
    `)
    expect(vaporHelpers).contains.all.keys('setText')
  })

  test('comments', () => {
    const { code } = compileWithElementTransform(
      '<>{/*foo*/}<div>{/*bar*/}</div></>',
    )
    expect(code).toMatchInlineSnapshot(`
      "import { createTextNode as _createTextNode, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n1 = t0()
        const n0 = _createTextNode([])
        return [n0, n1]
      }"
    `)
  })

  test('children & sibling references', () => {
    const { code, vaporHelpers } = compileWithElementTransform(
      `<div>
        <p>{ first }</p> 
        { second }
        <p>{ forth }</p>
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "import { setText as _setText, createTextNode as _createTextNode, insert as _insert, template as _template } from 'vue/vapor';
      const t0 = _template("<div><p></p><!><p></p></div>")

      export function render(_ctx) {
        const n4 = t0()
        const n0 = n4.firstChild
        const n3 = n0.nextSibling
        const n2 = n3.nextSibling
        _setText(n0, () => (first))
        const n1 = _createTextNode([() => (second)])
        _setText(n2, () => (forth))
        _insert(n1, n4, n3)
        return n4
      }"
    `)
    expect(Array.from(vaporHelpers)).containSubset([
      'createTextNode',
      'insert',
      'template',
    ])
  })

  test('{...obj}', () => {
    const { code, ir } = compileWithElementTransform(`<div {...obj} />`)
    expect(code).toMatchInlineSnapshot(`
      "import { setInheritAttrs as _setInheritAttrs, renderEffect as _renderEffect, setDynamicProps as _setDynamicProps, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        _setInheritAttrs(true)
        _renderEffect(() => _setDynamicProps(n0, [obj], true))
        return n0
      }"
    `)
    expect(ir.block.effect).toMatchObject([
      {
        expressions: [
          {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'obj',
            isStatic: false,
          },
        ],
        operations: [
          {
            type: IRNodeTypes.SET_DYNAMIC_PROPS,
            element: 0,
            props: [
              {
                kind: IRDynamicPropsKind.EXPRESSION,
                value: {
                  type: NodeTypes.SIMPLE_EXPRESSION,
                  content: 'obj',
                  isStatic: false,
                },
              },
            ],
          },
        ],
      },
    ])
    expect(code).contains('_setDynamicProps(n0, [obj], true)')
  })
})
