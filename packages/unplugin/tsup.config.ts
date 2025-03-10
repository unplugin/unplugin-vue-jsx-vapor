import process from 'node:process'
import Raw from 'unplugin-raw/esbuild'
import type { Options } from 'tsup'

export default {
  entry: ['./src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  watch: !!process.env.DEV,
  dts: !process.env.DEV,
  cjsInterop: true,
  external: ['vue'],
  onSuccess: 'npm run build:fix',
  define: {
    __DEV__: 'true',
  },
  esbuildPlugins: [Raw()],
} satisfies Options
