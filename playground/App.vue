<script lang="tsx">
import { defineComponent, ref } from 'vue'
import Count2 from './Count.vue'
import If from './if.vue'
import For from './for.vue'
import Slot from './slot.vue'
import Model from './model.vue'
import Show from './show.vue'
import Html from './html.vue'

export default defineComponent({
  setup() {
    const count = ref('1')

    const Count = (props) => {
      return <div>{props.value}</div>
    }

    const Count1 = ({ value }) => {
      return <div>{value.value}</div>
    }

    return (
      <>
        <fieldset>
          <legend>Component</legend>
          <input
            value_prop={count.value}
            onInput={(e) => (count.value = e.target.value)}
          />

          <Count value={count.value} />
          <Count1 value={count} />
          <Count2 value={count.value} />
        </fieldset>

        <fieldset>
          <legend>v-if</legend>
          <If />
        </fieldset>

        <fieldset>
          <legend>v-for</legend>
          <For />
        </fieldset>

        <fieldset>
          <legend>v-slot</legend>
          <Slot />
        </fieldset>

        <fieldset>
          <legend>v-model</legend>
          <Model />
        </fieldset>

        <fieldset>
          <legend>v-show</legend>
          <Show />
        </fieldset>

        <fieldset>
          <legend>v-html</legend>
          <Html />
        </fieldset>
      </>
    )
  },
})
</script>
