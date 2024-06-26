import { describe, expect, test } from 'vitest'
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
      </div>`,
    )
    expect(code).toMatchInlineSnapshot(`
      "import { template as _template } from 'vue/vapor';
      const t0 = _template("<div><div>hello</div></div>")

      export function render(_ctx) {
        const n0 = t0()
        return n0
      }"
    `)
  })

  test('dynamic root', () => {
    const { code } = compile(`<><div>{1 + a}</div></>`)
    expect(code).toMatchInlineSnapshot(`
      "import { renderEffect as _renderEffect, setText as _setText, template as _template } from 'vue/vapor';
      const t0 = _template("<div></div>")

      export function render(_ctx) {
        const n0 = t0()
        _renderEffect(() => _setText(n0, 1 + a_ctx.))
        return n0
      }"
    `)
  })
})
