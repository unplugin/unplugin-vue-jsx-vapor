# Migration

## Migration from `vue-jsx`

1. Doesn't support hyphenated prop name and hyphenated component name.
2. `v-model` doesn't support Array Expression, use `v-model:$name$_trim={foo}` instead.
3. Doesn't support `v-models` directive.
4. Destructing props:

> [!CAUTION]
> ❌ The destructuring of props in a functional component will cause loss of reactivity.

```tsx
function Comp({ foo }) {
  return <div>{foo}</div>
}

export default () => {
  const foo = ref('foo')
  return <Comp foo={foo.value} />
}
```

#### Two Solutions

1. ✅ Pass a ref variable as prop:

```tsx
function Comp({ foo }) {
  return <div>{foo.value}</div>
}

export default () => {
  const foo = ref('foo')
  return <Comp foo={foo} />
}
```

2. ✅ Set the macros option to true, then use the `defineComponent` macro for wrapping.

  - Setup

    ```ts {7}
    // vite.config.ts
    import vueJsxVapor from 'vue-jsx-vapor/vite'

    export default defineConfig({
      plugins: [
        vueJsxVapor({
          macros: true,
        }),
      ]
    })

    ```

  - Usage

    ```tsx
    import { defineComponent, ref } from 'vue'

    const Comp = defineComponent(({ foo }) => {
      return <>{foo}</>
    })
    // Will be convert to:
    const Comp = defineComponent((_props) => {
      return <>{_props.foo}</>
    }, { props: ['foo'] })

    export default () => {
      const foo = ref('foo')
      return <Comp foo={foo.value} />
    }
    ```