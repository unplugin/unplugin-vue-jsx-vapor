import { type UnpluginFactory, createUnplugin } from 'unplugin'
import { createFilter, transformWithEsbuild } from 'vite'
import { shallowRef } from 'vue'
import { version } from '../package.json'
import { transformVueJsxVapor } from './core/transform'
import type { Options } from './types'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  rawOptions = {},
) => {
  const options = shallowRef<Options>({
    include: /\.[jt]sx$/,
    ...rawOptions,
  })

  const api = {
    get options() {
      return options.value
    },
    set options(value) {
      options.value = value
    },
    version,
  }

  const transformInclude = createFilter(
    options.value.include,
    options.value.exclude,
  )

  return [
    {
      name: 'unplugin-vue-jsx-vapor',
      vite: {
        api,
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
      rollup: {
        api,
      },
      rolldown: {
        api,
      },
      transformInclude,
      transform(code, id) {
        return transformVueJsxVapor(code, id, options.value)
      },
    },
    {
      name: 'unplugin-esbuild',
      transformInclude,
      transform(code, id) {
        return transformWithEsbuild(code, id, {
          target: 'esnext',
          charset: 'utf8',
          minify: false,
          minifyIdentifiers: false,
          minifySyntax: false,
          minifyWhitespace: false,
          treeShaking: false,
          keepNames: false,
          supported: {
            'dynamic-import': true,
            'import-meta': true,
          },
        })
      },
    },
  ]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
