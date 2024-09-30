import { ref } from 'vue'

export default () => {
  const show = ref(false)

  return (
    <>
      <input v-model={show.value} type="checkbox" />
      <span v-show={show.value}>{show.value}</span>
    </>
  )
}
