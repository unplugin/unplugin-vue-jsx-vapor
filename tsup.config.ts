import type { Options } from 'tsup'

export default {
  entry: {
    vite: 'src/vite.ts',
    astro: 'src/astro.ts',
    esbuild: 'src/esbuild.ts',
    nuxt: 'src/nuxt.ts',
    rollup: 'src/rollup.ts',
    rspack: 'src/rspack.ts',
    types: 'src/types.ts',
    webpack: 'src/webpack.ts',
    index: 'src/index.ts',
    compiler: 'src/core/compiler/index.ts',
  },
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
