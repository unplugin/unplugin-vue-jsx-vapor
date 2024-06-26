import { type UnpluginFactory, createUnplugin } from 'unplugin'
import { createFilter } from 'vite'
import { transformVueJsxVapor } from './core/transform'
import type { Options } from './types'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {},
) => ({
  enforce: 'pre',
  name: 'unplugin-vue-jsx-vapor',
  transformInclude: createFilter(
    options?.include || /\.[jt]sx$/,
    options?.exclude,
  ),
  transform(code, id) {
    return transformVueJsxVapor(code, id, options)
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
