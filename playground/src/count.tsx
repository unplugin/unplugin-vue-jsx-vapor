import { computed, defineComponent } from 'vue'

export default defineComponent(({ value = '' }) => {
  defineExpose({
    double: computed(() => +value * 2),
  })
  return <div>{value}</div>
})
