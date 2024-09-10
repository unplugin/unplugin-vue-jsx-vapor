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

  test('reconstruct arrowFunctionExpression', () => {
    const { code } = transformRestructure(
      `const App = ([{root: {foo, ...rest}}]) => (
        <>{[foo, rest]}</>
      )`,
      'tsx',
    )!
    expect(code).toMatchInlineSnapshot(
      `
      "
      import { createPropsRestProxy as __MACROS_createPropsRestProxy } from "vue";const App = (_ctx0) => (
              (rest = __MACROS_createPropsRestProxy(_ctx0[0].root, ['foo']),<>{[_ctx0[0].root.foo, rest]}</>)
            )"
    `,
    )
  })

  test('reconstruct functionDeclaration', () => {
    const { code } = transformRestructure(
      `function App({foo, ...rest}){
        return <>{[foo, rest]}</>
      }`,
      'tsx',
    )!
    expect(code).toMatchInlineSnapshot(
      `
      "
      import { createPropsRestProxy as __MACROS_createPropsRestProxy } from "vue";function App(_ctx0){const rest = __MACROS_createPropsRestProxy(_ctx0, ['foo']);
              return <>{[_ctx0.foo, rest]}</>
            }"
    `,
    )
  })
})
