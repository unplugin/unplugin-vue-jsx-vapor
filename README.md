# unplugin-vue-jsx-vapor

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-jsx-vapor?color=a1b858&label=)](https://www.npmjs.com/package/unplugin-vue-jsx-vapor)

Vue JSX Vapor.

[Playground](https://stackblitz.com/github/unplugin/unplugin-vue-jsx-vapor?file=playground%2FApp.vue)

## Install

```bash
npm i unplugin-vue-jsx-vapor
```

> [!CAUTION]
> ❌ The destructuring of props in a functional component will cause loss of reactivity.

```tsx
function Comp({ foo }) {
  return <div>{foo}</div>
}

const foo = ref('foo')
export default <Comp foo={foo.value} />
```

#### Two Solutions

1. ✅ Pass a ref variable as prop:

```tsx
function Comp({ foo }) {
  return <div>{foo.value}</div>
}

const foo = ref('foo')
export default <Comp foo={foo} />
```

2. ✅ Use the `defineComponent` macro from [@vue-macros/jsx-macros](https://github.com/vue-macros/vue-macros/pull/794) to wrapping.

```tsx
const Comp = defineComponent(({ foo }) => {
  return <>{foo}</>
})
// Will be convert to:
const Comp = defineComponent((_props) => {
  return <>{_props.foo}</>
}, { props: ['foo'] })

const foo = ref('foo')
export default <Comp foo={foo.value} />
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [VueJsxVapor()],
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
  plugins: [VueJsxVapor()],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [require('unplugin-vue-jsx-vapor/webpack')()],
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: ['unplugin-vue-jsx-vapor/nuxt'],
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
    plugins: [require('unplugin-vue-jsx-vapor/webpack')()],
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
  plugins: [VueJsxVapor()],
})
```

<br></details>
