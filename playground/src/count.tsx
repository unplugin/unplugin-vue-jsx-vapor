import { defineComponent } from 'vue'

export default defineComponent(({ value = '' }) => {
  return <div>{value}</div>
})
