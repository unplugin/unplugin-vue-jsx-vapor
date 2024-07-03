<script lang="tsx">
import { defineComponent } from 'vue'

const Comp = (props, { slots }) => (
  <>{slots.default ? <slots.default /> : <div>default slot</div>}</>
)

let slots = { default: () => <div>foo</div> }

export default defineComponent({
  setup(props) {
    return <Comp v-slots={slots}></Comp>
  },
})
</script>
