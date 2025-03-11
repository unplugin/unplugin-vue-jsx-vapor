import process from 'node:process'
import Raw from 'unplugin-raw/esbuild'
import { type Options, defineConfig } from 'tsup'

export const config = (options: Options = {}) =>
  defineConfig({
    entry: ['./src/*.ts', '!./**.d.ts'],
    clean: true,
    format: ['cjs', 'esm'],
    watch: !!process.env.DEV,
    dts: !process.env.DEV,
    cjsInterop: true,
    external: ['vue'],
    define: {
      __DEV__: 'true',
    },
    esbuildPlugins: [Raw()],
    ...options,
  })

export default defineConfig(config())
