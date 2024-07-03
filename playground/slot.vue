<script lang="tsx">
import { defineComponent, ref } from 'vue'

const Comp = (props, { slots }) => (
  <>
    {slots.default ? (
      <slots.default foo={props.foo} />
    ) : (
      <div>default slot</div>
    )}
  </>
)

let slots = {
  default: (scope) => <div>{scope.foo}</div>,
}

export default defineComponent({
  setup(props) {
    const foo = ref('foo')
    return (
      <>
        <input
          value={foo.value}
          onInput={(e) => (foo.value = e.target.value)}
        />
        <Comp v-slots={slots} foo={foo.value} />
        <Comp
          v-slots={{ default: ({ foo }) => <div>{foo}</div> }}
          foo={foo.value}
        />
      </>
    )
  },
})
</script>
