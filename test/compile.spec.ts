import { describe, expect, test } from 'vitest'
import { BindingTypes } from '@vue/compiler-dom'
import { type CompilerOptions, compile as _compile } from '../src/core/compiler'

export function compile(template: string, options: CompilerOptions = {}) {
  return _compile(template, {
    ...options,
    mode: 'module',
    prefixIdentifiers: false,
  })
}

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
      "import { template as _template } from 'vue/vapor';
      const t0 = _template("<div><div>hello</div> <input> <span></span></div>")

      export function render(_ctx) {
        const n0 = t0()
        return n0
      }"
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<>{ 1 }{ 2 }</>`)
    expect(code).toMatchInlineSnapshot(`
      "import { createTextNode as _createTextNode } from 'vue/vapor';

      export function render(_ctx) {
        const n0 = _createTextNode([1, 2])
        return n0
      }"
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<div>{a +b +       c }</div>`)
    expect(code).toMatchInlineSnapshot(`
      "import { renderEffect as _renderEffect, setText as _setText, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        _renderEffect(() => _setText(n0, _ctx.a +_ctx.b +       _ctx.c))
        return n0
      }"
    `)
  })

  describe('expression parsing', () => {
    test('interpolation', () => {
      const { code } = compile(`<>{ a + b }</>`, {
        inline: true,
        bindingMetadata: {
          b: BindingTypes.SETUP_REF,
        },
      })
      expect(code).toMatchInlineSnapshot(`
        "(() => {
          const n0 = _createTextNode(() => [a + b.value])
          return n0
        })()"
      `)
      expect(code).contains('a + b.value')
    })
  })
})
