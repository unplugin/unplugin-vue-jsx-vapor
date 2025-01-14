import { ref } from 'vue'

export default () => {
  const count = ref(3)

  const Arr = (
    <>
      {Array.from({ length: count.value }).map((_, index) => {
        if (index > 1) {
          return (
            <>
              <div>({index}) lg 1</div>
            </>
          )
        } else {
          return [<br />, <span>({index}) lt 1</span>]
        }
      })}
    </>
  )

  return (
    <div>
      <input v-model={count.value} type="number" />

      {Arr}
    </div>
  )
}
