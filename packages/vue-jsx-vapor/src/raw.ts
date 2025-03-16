import Macros from '@vue-jsx-vapor/macros/raw'
import { createFilter } from 'unplugin-utils'
import { transformVueJsxVapor } from './core'
import type { Options } from './options'
import type { UnpluginOptions } from 'unplugin'

const plugin = (options: Options = {}): UnpluginOptions[] => {
  const transformInclude = createFilter(
    options?.include || /\.[cm]?[jt]sx?$/,
    options?.exclude,
  )
  return [
    {
      name: 'vue-jsx-vapor',
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
      transformInclude,
      transform(code, id) {
        return transformVueJsxVapor(code, id, options)
      },
    },
    ...(options.macros === false
      ? []
      : options.macros
        ? [Macros(options.macros === true ? undefined : options.macros)]
        : []),
  ]
}
export default plugin
