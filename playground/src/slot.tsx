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

const slotName = ref('default')
export default () => {
  const foo = ref('foo')
  return (
    <>
      <input value={foo.value} onInput={(e) => (foo.value = e.target.value)} />
      <div style="display: flex;">
        <fieldset>
          <legend>v-slots</legend>
          <Comp v-slots={slots} foo={foo.value} />
          <Comp
            v-slots={{ default: (scope) => <div>{scope.foo}</div> }}
            foo={foo.value}
          />
        </fieldset>

        <fieldset>
          <legend>v-slot</legend>
          <Comp v-slot:$slotName_value$={scope} foo={foo.value}>
            <div>{scope.foo}</div>
          </Comp>
        </fieldset>
      </div>
    </>
  )
}
