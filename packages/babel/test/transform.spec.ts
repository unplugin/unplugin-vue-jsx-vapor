import { describe, expect, test } from 'vitest'
import { transformSync } from '@babel/core'
import jsx from '../src/index'

describe('transform', () => {
  test('transform multiple components', () => {
    const { code } = transformSync(
      `const a = <div onClick={onClick}>{Hello}</div>
       const b = <>{foo? <div onClick={onClick}>Hello</div> : <div onDblclick={onDblclick}>World</div>}</>`,
      {
        filename: 'test.tsx',
        plugins: [[jsx]],
      },
    )!
    expect(code).toMatchInlineSnapshot(`
      "import { delegate as _delegate, delegateEvents as _delegateEvents, template as _template, createIf as _createIf } from 'vue/vapor';
      import { setText as _setText } from 'unplugin-vue-jsx-vapor/helper.js';
      const _t00 = _template("<div></div>");
      const _t10 = _template("<div>Hello</div>");
      const _t11 = _template("<div>World</div>");
      _delegateEvents("click", "dblclick");
      const a = (() => {
        const n0 = _t00();
        _setText(n0, () => Hello);
        _delegate(n0, "click", () => onClick);
        return n0;
      })();
      const b = (() => {
        const n0 = _createIf(() => foo, () => {
          const n2 = _t10();
          _delegate(n2, "click", () => onClick);
          return n2;
        }, () => {
          const n4 = _t11();
          _delegate(n4, "dblclick", () => onDblclick);
          return n4;
        });
        return n0;
      })();"
    `)
  })
})
