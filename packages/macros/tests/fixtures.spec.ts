import { testFixtures } from '@vue-macros/test-utils'
import { describe } from 'vitest'
import { transformJsxMacros } from '../src/core'

const options = {
  defineModel: { alias: ['defineModel'] },
  defineSlots: { alias: ['defineSlots'] },
  defineStyle: { alias: ['defineStyle'] },
  defineExpose: { alias: ['defineExpose'] },
  defineComponent: { alias: ['defineComponent', 'defineVaporComponent'] },
}

describe('fixtures', async () => {
  await testFixtures(
    import.meta.glob('./fixtures/**/*.tsx', {
      eager: true,
      as: 'raw',
    }),
    (args, id, code) =>
      transformJsxMacros(code, id, new Map(), {
        lib: 'vue',
        include: ['*.tsx'],
        version: 3.5,
        ...options,
      })?.code,
  )
})

describe('vue/vapor fixtures', async () => {
  await testFixtures(
    import.meta.glob('./fixtures/**/*.tsx', {
      eager: true,
      as: 'raw',
    }),
    (args, id, code) =>
      transformJsxMacros(code, id, new Map(), {
        lib: 'vue/vapor',
        include: ['*.tsx'],
        version: 3.5,
        ...options,
      })?.code,
  )
})
