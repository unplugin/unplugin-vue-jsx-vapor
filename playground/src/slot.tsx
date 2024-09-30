import { ref } from 'vue'

const Comp = (props, { slots }) => {
  return (
    <>
      {slots.default ? (
        <slots.default foo={props.foo} />
      ) : (
        <div>default slot</div>
      )}
    </>
  )
}

const slots = {
  default: (scope) => <div>{scope.foo}</div>,
}

export default () => {
  const foo = ref('foo')
  return (
    <>
      <input value={foo.value} onInput={(e) => (foo.value = e.target.value)} />
      <Comp v-slots={slots} foo={foo.value} />
      <Comp
        v-slots={{ default: (scope) => <div>{scope.foo}</div> }}
        foo={foo.value}
      />
    </>
  )
}
