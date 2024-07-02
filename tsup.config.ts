import type { Options } from 'tsup'

export default {
  entryPoints: ['src/*.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  cjsInterop: true,
  splitting: true,
  onSuccess: 'npm run build:fix',
  define: {
    __DEV__: 'true',
    __BROWSER__: 'false',
  },
} satisfies Options
