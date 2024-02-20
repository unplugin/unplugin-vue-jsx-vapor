<script setup lang="tsx">
import { ref } from 'vue'

function Comp() {
  console.log(1)
  return (
    <span>
      1
    </span>
  )
}

const count = ref(0)
defineRender(
  <div>
    <button onClick={() => count.value++}>
      {count.value}
    </button>
    <div>
      {count.value}
    </div>
    <Comp>
      {
        Array.from({ length: 3 }).map((_, index) => (
          <span>
            {index}
          </span>
        ))
      }
    </Comp>
    {
      Array.from({ length: 3 }).map((_, index) => {
        const idx = index + 1
        return (
          <span>
            {idx}
          </span>
        )
      })
    }
    <Comp v-for={i in 3} key={i} ref={() => {}} />
  </div>,
)
</script>
