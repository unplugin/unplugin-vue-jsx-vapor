import { describe, expect, test } from 'vitest'
import { BindingTypes } from '@vue/compiler-dom'
import { type CompilerOptions, compile as _compile } from '../src'

export function compile(template: string, options: CompilerOptions = {}) {
  return _compile(template, {
    ...options,
    mode: 'module',
    prefixIdentifiers: true,
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
      "import { setText as _setText, renderEffect as _renderEffect, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        let _a, _b, _c
        _renderEffect(() => (_a !== _ctx.a || _b !== _ctx.b || _c !== _ctx.c) && _setText(n0, (_a = _ctx.a) +(_b = _ctx.b) +       (_c = _ctx.c)))
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
        "((_ctx) => {
          const n0 = _createTextNode(() => [a + b.value])
          return n0
        })()"
      `)
      expect(code).contains('a + b.value')
    })
  })
})
