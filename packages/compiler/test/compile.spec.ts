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
} from '../src'
import { makeCompile } from './transforms/_utils'

const compile = makeCompile({
  nodeTransforms: [
    transformTemplateRef,
    transformText,
    transformElement,
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
        const n0 = _createTextNode(1, 2)
        return n0
      "
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<div>{a +b +       c }</div>`)
    expect(code).toMatchInlineSnapshot(`
      "
        const n0 = t0()
        _setText(n0, () => (a +b +       c))
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
          const n0 = _createTextNode(() => (a + b))
          return n0
        "
      `)
      expect(code).contains('a + b')
    })
  })
})
