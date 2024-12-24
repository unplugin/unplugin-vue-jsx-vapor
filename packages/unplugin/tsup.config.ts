import process from 'node:process'
import type { Options } from 'tsup'

export default {
  entry: ['./src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  watch: !!process.env.DEV,
  dts: !process.env.DEV,
  cjsInterop: true,
  splitting: true,
  onSuccess: 'npm run build:fix',
  define: {
    __DEV__: 'true',
    __BROWSER__: 'false',
  },
} satisfies Options