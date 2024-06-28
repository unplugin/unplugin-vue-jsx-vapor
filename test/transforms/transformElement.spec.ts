import { describe, expect, test } from 'vitest'
// import {
//   type BindingMetadata,
//   BindingTypes,
//   NodeTypes,
// } from '@vue/compiler-core'
// import {
//   IRDynamicPropsKind,
//   IRNodeTypes,
//   transformChildren,
//   transformElement,
//   transformText,
//   transformVBind,
//   transformVOn,
// } from '../../src/core/compiler/index'
import { compile } from '../compile.spec'
// import { makeCompile } from './_utils'

const compileWithElementTransform = compile
//  makeCompile({
//   nodeTransforms: [transformElement, transformChildren, transformText],
//   directiveTransforms: {
//     bind: transformVBind,
//     on: transformVOn,
//   },
// })

describe('compiler: element transform', () => {
  describe('component', () => {
    test('import + resolve component', () => {
      const { code, vaporHelpers } = compileWithElementTransform(`<Foo/>`)
      expect(code).toMatchInlineSnapshot(`
        "import { createComponent as _createComponent } from 'vue/vapor';

        export function render(_ctx) {
          const n0 = _createComponent(Foo, null, null, true)
          return n0
        }"
      `)
      expect(vaporHelpers).contains.all.keys(
        // 'resolveComponent',
        'createComponent',
      )
    })
  })
})
