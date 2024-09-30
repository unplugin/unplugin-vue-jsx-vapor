import { ref } from 'vue'

export default () => {
  const count = ref(3)

  return (
    <div>
      <input v-model={count.value} type="number" />

      {Array.from({ length: count.value }).map((item, index) => {
        if (item > 1) {
          return <div>({index}) lg 1</div>
        } else {
          return <div>({index}) lt 1</div>
        }
      })}
    </div>
  )
}
