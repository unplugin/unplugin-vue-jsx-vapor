<script lang="tsx">
import { defineComponent } from 'vue'
import { ref } from 'vue/vapor'

export default defineComponent({
  setup() {
    const count = ref(1)

    return (
      <>
        <form onSubmit_prevent>
          <input
            v-bind:value={count.value}
            onInput={count.value = $event.target.value}
          />

          <div>
            v-text:
            <span v-text={count.value} />
          </div>

          <div>
            v-html:
            <span v-html={count.value} />
          </div>

          <div>
            v-once:
            <span v-once>
              {count.value}
            </span>
          </div>

          <div>
            v-pre:
            <span v-pre>
              {count.value}
            </span>
          </div>

          <div>
            v-cloak:
            <span v-cloak>
              {count.value}
            </span>
          </div>

          <div>
            v-for:
            {
             Array.from({ length: 10 }).map(() => {
               return (
                 <span>
                   1
                 </span>
               )
             })
            }
          </div>
        </form>
      </>
    )
  },
})
</script>

<style>
[v-cloak] {
  color: red;
}
</style>
