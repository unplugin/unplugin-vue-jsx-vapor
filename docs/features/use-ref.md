# useRef

Automatically infer type for `useRef`. It's an alias of `shallowRef`.

## Basic Usage

```tsx twoslash
import { defineComponent } from 'vue'
import { useRef } from 'vue-jsx-vapor'
// or
// import { shallowRef as useRef } from 'vue'

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
