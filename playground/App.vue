<script lang="tsx">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)
    setInterval(() => {
      count.value++
    }, 1000)

    const Count = () => <div>{count.value * 2}</div>

    return (
      <>
        <Count />
      </>
    )
  },
})
</script>
