import { describe, expect, test } from 'vitest'
import {
  transformChildren,
  transformElement,
  transformTemplateRef,
  transformText,
  transformVBind,
  transformVHtml,
  transformVModel,
  transformVOn,
  transformVShow,
  transformVSlot,
  transformVSlots,
} from '../src'
import { makeCompile } from './transforms/_utils'

const compile = makeCompile({
  nodeTransforms: [
    transformTemplateRef,
    transformText,
    transformElement,
    transformVSlots,
    transformVSlot,
    transformChildren,
  ],
  directiveTransforms: {
    bind: transformVBind,
    on: transformVOn,
    model: transformVModel,
    show: transformVShow,
    html: transformVHtml,
  },
})

describe('compile', () => {
  test('static template', () => {
    const { code } = compile(
      `<div>
        <div>hello</div>
        <input />
        <span />
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = t0()
        return n0
      "
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<>{ 1 }{ 2 }</>`)
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = _createNodes(1, 2)
        return n0
      "
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<div>{a +b +       c }</div>`)
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = t0()
        const x0 = _child(n0)
        _setNodes(x0, () => (a +b +       c))
        return n0
      "
    `)
  })

  describe('expression parsing', () => {
    test('interpolation', () => {
      const { code } = compile(`<>{ a + b }</>`, {
        inline: true,
      })
      expect(code).toMatchInlineSnapshot(`
        "
          const n0 = _createNodes(() => (a + b))
          return n0
        "
      `)
      expect(code).contains('a + b')
    })
  })
})
