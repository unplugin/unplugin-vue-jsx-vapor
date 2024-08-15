import { type UnpluginFactory, createUnplugin } from 'unplugin'
import { createFilter, transformWithEsbuild } from 'vite'
import { transformVueJsxVapor } from './core/transform'
import { transformRestructure } from './core/transformRestructure'
import type { Options } from './types'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {},
) => {
  const transformInclude = createFilter(
    options?.include || /\.[jt]sx$/,
    options?.exclude,
  )
  return [
    {
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
      transformInclude,
      transform(code, id) {
        const result = transformVueJsxVapor(code, id, options)
        return result
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
    ...(options?.restructure
      ? [
          {
            name: 'unplugin-restructure',
            transformInclude,
            transform: transformRestructure,
          },
        ]
      : []),
  ]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
