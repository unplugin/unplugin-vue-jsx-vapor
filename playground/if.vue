<script lang="tsx">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(1)

    const Foo = () => <div style="color: red">2</div>

    return (
      <div>
        <div>
          {count.value === 1 ? (
            <div>{1}</div>
          ) : count.value === 2 ? (
            <Foo />
          ) : (
            count.value >= 3 && <div>lg 3</div>
          )}
        </div>

        <button onClick={() => count.value++}>+</button>
        <button onClick={() => count.value--}>-</button>
      </div>
    )
  },
})
</script>
