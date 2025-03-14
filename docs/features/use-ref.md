# useRef

Automatically infer type for `useRef`. It's an alias of `shallowRef`.

## Basic Usage

::: code-group

```tsx
import { defineComponent, shallowRef as useRef } from 'vue'
// or
// import { useRef } from 'vue-jsx-vapor'

export const Comp = defineComponent({
  setup() {
    return { foo: 1 }
  },
})

export default defineComponent(() => {
  const comp = useRef()
  comp.value?.foo
  //           ^?

  return (
    <>
      <Comp ref={comp} />
    </>
  )
})
```
