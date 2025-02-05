import process from 'node:process'
import type { Options } from 'tsup'

export default {
  entry: ['./src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  watch: !!process.env.DEV,
  dts: !process.env.DEV,
  cjsInterop: true,
  splitting: true,
} satisfies Options
