import { createFilter, normalizePath } from '@vue-macros/common'
import { helperCode, helperId, helperPrefix, transformVueJsxVapor } from '.'
import type { Options } from '../types'
import type { UnpluginFactory } from 'unplugin'

export const plugin: UnpluginFactory<Options | undefined, false> = (
  options: Options = {},
) => {
  const transformInclude = createFilter({
    include: options?.include || /\.[jt]sx$/,
    exclude: options?.exclude,
  })
  return {
    name: 'unplugin-vue-jsx-vapor',
    vite: {
      config(config) {
        return {
          // only apply esbuild to ts files
          // since we are handling jsx and tsx now
          esbuild: {
            include: /\.ts$/,
          },
          define: {
            __VUE_OPTIONS_API__: config.define?.__VUE_OPTIONS_API__ ?? true,
            __VUE_PROD_DEVTOOLS__:
              config.define?.__VUE_PROD_DEVTOOLS__ ?? false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__:
              config.define?.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ ?? false,
          },
        }
      },
    },
    resolveId(id) {
      if (normalizePath(id).startsWith(helperPrefix)) return id
    },
    loadInclude(id) {
      return normalizePath(id).startsWith(helperPrefix)
    },
    load(id) {
      if (normalizePath(id) === helperId) return helperCode
    },
    transformInclude,
    transform(code, id) {
      return transformVueJsxVapor(code, id, options)
    },
  }
}
