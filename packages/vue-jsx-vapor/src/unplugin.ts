import { createUnplugin, type UnpluginFactory } from 'unplugin'
import { createFilter, transformWithEsbuild } from 'vite'
import plugin from './raw'
import type { Options } from './options'

export * from './options'

export const unpluginFactory: UnpluginFactory<Options | undefined, true> = (
  options = {},
) => {
  return [
    ...plugin(options),
    options.interop
      ? { name: 'interop' }
      : {
          name: 'unplugin-esbuild',
          transformInclude: createFilter(
            options?.include || /\.[jt]sx$/,
            options?.exclude,
          ),
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
