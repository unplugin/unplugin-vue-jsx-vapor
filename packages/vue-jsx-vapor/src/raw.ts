import Macros from '@vue-jsx-vapor/macros/raw'
import { createFilter, normalizePath } from 'unplugin-utils'
import { transformVueJsxVapor } from './core'
import { registerHMR } from './core/hmr'
import runtimeCode from './core/runtime?raw'
import type { Options } from './options'
import type { UnpluginOptions } from 'unplugin'

const plugin = (options: Options = {}): UnpluginOptions[] => {
  const transformInclude = createFilter(
    options?.include || /\.[cm]?[jt]sx?$/,
    options?.exclude,
  )
  let needHMR = false
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
        configResolved(config) {
          needHMR = config.command === 'serve'
        },
      },
      resolveId(id) {
        if (normalizePath(id) === 'vue-jsx-vapor/runtime') return id
      },
      loadInclude(id) {
        return normalizePath(id) === 'vue-jsx-vapor/runtime'
      },
      load(id) {
        if (normalizePath(id) === 'vue-jsx-vapor/runtime') return runtimeCode
      },
      transformInclude,
      transform(code, id) {
        const result = transformVueJsxVapor(code, id, options)
        if (result?.code) {
          needHMR && registerHMR(result, id)
          return {
            code: result.code,
            map: result.map,
          }
        }
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
