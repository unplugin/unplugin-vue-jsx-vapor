# unplugin-vue-jsx-vapor

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-jsx-vapor?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-vue-jsx-vapor)

Starter template for [unplugin](https://github.com/unjs/unplugin).

## Template Usage

To use this template, clone it down using:

```bash
npx degit unplugin/unplugin-vue-jsx-vapor my-unplugin
```

And do a global replacement of `unplugin-vue-jsx-vapor` with your plugin name.

Then you can start developing your unplugin 🔥

To test your plugin, run: `pnpm run dev`
To release a new version, run: `pnpm run release`

## Install

```bash
npm i unplugin-vue-jsx-vapor
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Starter from 'unplugin-vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [
    Starter({ /* options */ }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Starter from 'unplugin-vue-jsx-vapor/rollup'

export default {
  plugins: [
    Starter({ /* options */ }),
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
    require('unplugin-vue-jsx-vapor/webpack')({ /* options */ })
  ]
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-vue-jsx-vapor/nuxt', { /* options */ }],
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
      require('unplugin-vue-jsx-vapor/webpack')({ /* options */ }),
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
import Starter from 'unplugin-vue-jsx-vapor/esbuild'

build({
  plugins: [Starter()],
})
```

<br></details>
