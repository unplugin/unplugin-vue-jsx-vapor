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
  <>
    <button onClick={() => count.value++}>
      {count.value}
    </button>
    <Comp v-for={i in 3} key={i} ref={() => {}} />
  </>,
)
</script>
