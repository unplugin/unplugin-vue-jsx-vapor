import { describe, expect, test } from 'vitest'
import { transformVueJsxVapor } from '../src/core'

describe('transform', () => {
  test('transform multiple components', () => {
    const { code } = transformVueJsxVapor(
      `const a = <div onClick={onClick}>Hello</div>
       const b = <>{foo? <div onClick={onClick}>Hello</div> : <div onDblclick={onDblclick}>World</div>}</>`,
      'tsx',
    )!
    expect(code).toMatchInlineSnapshot(`
      "import { delegate as _delegate,delegateEvents as _delegateEvents,template as _template,createIf as _createIf } from 'vue/vapor';
      const _00 = _template("<div>Hello</div>")
      const _11 = _template("<div>World</div>")
      _delegateEvents("click", "dblclick");
      const a = (() => {
        const n0 = _00()
        _delegate(n0, "click", () => onClick)
        return n0
      })()
             const b = (() => {
        const n0 = _createIf(() => (foo), () => {
          const n2 = _00()
          _delegate(n2, "click", () => onClick)
          return n2
        }, () => {
          const n4 = _11()
          _delegate(n4, "dblclick", () => onDblclick)
          return n4
        })
        return n0
      })()"
    `)
  })
})
