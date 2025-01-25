import { type UnpluginFactory, createUnplugin } from 'unplugin'
import { createFilter, transformWithEsbuild } from 'vite'
import transformVueJsxVapor, { type Options } from './api'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {},
) => {
  return [
    transformVueJsxVapor,
    {
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
