<script setup lang="tsx">
import { ref } from 'vue'

function Comp(props: any) {
  return (
    <span>
      {props}
    </span>
  )
}

const count = ref(0)
defineRender(
  <Comp
    id={1}
    v-model:value={count.value}
    {...{ id: 2 }}
    {...{
      id: 3,
    }}
  />,
)
</script>
