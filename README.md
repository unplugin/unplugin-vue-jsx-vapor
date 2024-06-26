# unplugin-vue-jsx-vapor

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-jsx-vapor?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-vue-jsx-vapor)

Convert JSX to Vapor.

## Install

```bash
npm i unplugin-vue-jsx-vapor
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [
    VueJsxVapor(),
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

export default {
  plugins: [
    VueJsxVapor(),
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
    require('unplugin-vue-jsx-vapor/webpack')(),
  ],
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    [
      'unplugin-vue-jsx-vapor/nuxt',
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
      require('unplugin-vue-jsx-vapor/webpack')(),
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

build({
  plugins: [
    VueJsxVapor()
  ],
})
```

<br></details>
