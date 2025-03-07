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
          return [<span>({index}) lt 1</span>, <br />]
        }
      })}
    </>
  )

  return (
    <div>
      <input v-model={count.value} type="number" />

      <div style="display: flex;">
        <fieldset>
          <legend>map</legend>
          {Arr}
        </fieldset>

        <fieldset>
          <legend>v-for</legend>
          <div v-for={(_, index) in count.value}>{index}</div>
        </fieldset>
      </div>
    </div>
  )
}
