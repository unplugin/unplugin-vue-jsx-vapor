# unplugin-vue-jsx-vapor

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-jsx-vapor?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-vue-jsx-vapor)

Convert JSX to Template for compiler-vapor.

## Install

```bash
npm i unplugin-vue-jsx-vapor
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'
import { compile } from 'vue/vapor'
// or
// import { compile } from '@vue/compiler-dom'

export default defineConfig({
  plugins: [
    VueJsxVapor({
      compile
    }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import VueJsxVapor from 'unplugin-vue-jsx-vapor/rollup'
import { compile } from 'vue/vapor'
// or
// import { compile } from '@vue/compiler-dom'

export default {
  plugins: [
    VueJsxVapor({
      compile
    }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-vue-jsx-vapor/webpack')({
      compile: require('vue/vapor')
      // or
      // compile: require('@vue/compiler-dom')
    }),
  ],
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
import { compile } from 'vue/vapor'
// or
// import { compile } from '@vue/compiler-dom'
export default defineNuxtConfig({
  modules: [
    [
      'unplugin-vue-jsx-vapor/nuxt',
      {
        compile
      },
    ],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-vue-jsx-vapor/webpack')({
        compile: require('vue/vapor')
        // or
        // compile: require('@vue/compiler-dom')
      }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/esbuild'
import { compile } from 'vue/vapor'
// or
// import { compile } from '@vue/compiler-dom'

build({
  plugins: [
    VueJsxVapor({
      compile
    })
  ],
})
```

<br></details>
