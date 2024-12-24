import { describe, expect, test } from 'vitest'

import { NodeTypes } from '@vue/compiler-core'
import { IRDynamicPropsKind, IRNodeTypes } from '@vue/compiler-vapor'
import {
  transformChildren,
  transformElement,
  transformText,
  transformVBind,
  // transformVIf,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithElementTransform = makeCompile({
  nodeTransforms: [
    transformText,
    // transformVIf,
    transformElement,
    transformChildren,
  ],
  directiveTransforms: { bind: transformVBind },
})

describe('compiler: children transform', () => {
  test.todo('basic')

  test('children & sibling references', () => {
    const { code, vaporHelpers } = compileWithElementTransform(
      `<div>
        <p>{ first }</p> 
        { second }
        <p>{ forth }</p>
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "import { next as _next, createTextNode as _createTextNode, insert as _insert, setText as _setText, renderEffect as _renderEffect, template as _template } from 'vue/vapor';
      const t0 = _template("<div><p></p> <!><p></p></div>")

      export function render(_ctx) {
        const n4 = t0()
        const n0 = n4.firstChild
        const n3 = _next(n0, 2)
        const n2 = n3.nextSibling
        const n1 = _createTextNode(() => [_ctx.second, " "])
        _insert(n1, n4, n3)
        let _first, _forth
        _renderEffect(() => {
          _first !== _ctx.first && _setText(n0, (_first = _ctx.first))
          _forth !== _ctx.forth && _setText(n2, (_forth = _ctx.forth))
        })
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

  test('{...obj}', () => {
    const { code, ir } = compileWithElementTransform(`<div {...obj} />`)
    expect(code).toMatchInlineSnapshot(`
      "import { setInheritAttrs as _setInheritAttrs, setDynamicProps as _setDynamicProps, renderEffect as _renderEffect, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        _setInheritAttrs(true)
        let _obj
        _renderEffect(() => _obj !== _ctx.obj && (_obj = _setDynamicProps(n0, _obj, [_ctx.obj], true)))
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
    expect(code).contains('_setDynamicProps(n0, _obj, [_ctx.obj], true)')
  })
})
