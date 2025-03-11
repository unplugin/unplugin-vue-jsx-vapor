import { NodeTypes } from '@vue/compiler-dom'

import { IRDynamicPropsKind, IRNodeTypes } from '@vue/compiler-vapor'
import { describe, expect, test } from 'vitest'
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
    const { code, helpers } = compileWithElementTransform(
      `<div>
        {foo} {bar}
       </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = t0()
        _setText(n0, () => (foo), " ", () => (bar))
        return n0
      "
    `)
    expect(helpers).contains.all.keys('setText')
  })

  test('comments', () => {
    const { code } = compileWithElementTransform(
      '<>{/*foo*/}<div>{/*bar*/}</div></>',
    )
    expect(code).toMatchInlineSnapshot(`
      "
        const n1 = t0()
        return n1
      "
    `)
  })

  test('children & sibling references', () => {
    const { code, helpers } = compileWithElementTransform(
      `<div id={id}>
        <p>{ first }</p> 
        123 { second } 456 {foo}
        <p>{ forth }</p>
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "
        const n4 = t0()
        const n0 = _child(n4)
        const n3 = _nthChild(n4, 2)
        const n2 = _next(n3)
        _setText(n0, () => (first))
        const n1 = _createTextNode(() => (second), " 456 ", () => (foo))
        _setText(n2, () => (forth))
        _insert(n1, n4, n3)
        _renderEffect(() => _setProp(n4, "id", id))
        return n4
      "
    `)
    expect(Array.from(helpers)).containSubset([
      'createTextNode',
      'insert',
      'template',
    ])
  })

  test('{...obj}', () => {
    const { code, ir } = compileWithElementTransform(`<div {...obj} />`)
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = t0()
        _renderEffect(() => _setDynamicProps(n0, [obj], true))
        return n0
      "
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

  test('efficient traversal', () => {
    const { code } = compileWithElementTransform(
      `<div>
    <div>x</div>
    <div><span>{{ msg }}</span></div>
    <div><span>{{ msg }}</span></div>
    <div><span>{{ msg }}</span></div>
  </div>`,
    )
    expect(code).toMatchSnapshot()
  })

  test('efficient find', () => {
    const { code } = compileWithElementTransform(
      `<div>
        <div>x</div>
        <div>x</div>
        <div>{{ msg }}</div>
      </div>`,
    )
    expect(code).contains(`const n0 = _nthChild(n1, 2)`)
    expect(code).toMatchSnapshot()
  })
})
