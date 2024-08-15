import { describe, expect, test } from 'vitest'
import { transformRestructure } from '../src/core/transformRestructure'

describe('transform', () => {
  test('transform reconstruct', () => {
    const { code } = transformRestructure(
      `const App = ([[[,foo]], {id: {foo: [bar]}}], { baz }) => {
        function onClick({ foo }){
          return { foo, baz: baz.baz }
        };
        return [ foo, bar, baz ]
      }`,
      'tsx',
    )!
    expect(code).toMatchInlineSnapshot(
      `
      "const App = (_ctx0, _ctx1) => {
              function onClick(_ctx2){
                return { foo: _ctx2.foo, baz: _ctx1.baz.baz }
              };
              return [ _ctx0[0][0][1], _ctx0[1].id.foo[0], _ctx1.baz ]
            }"
    `,
    )
  })
})
