<script lang="tsx">
import { defineComponent, ref } from 'vue'
import Count2 from './Count.vue'

export default defineComponent({
  setup() {
    const count = ref(1)

    const Count = (props) => {
      return <div>{props.value}</div>
    }

    const Count1 = ({ value }) => {
      return <div>{value}</div>
    }

    return (
      <>
        <input
          value_prop={count.value}
          onInput={(e) => (count.value = e.target.value)}
        />

        <Count value={count.value} />
        <Count1 value={count.value} />
        <Count2 value={count.value} />
      </>
    )
  },
})
</script>
