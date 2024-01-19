<script lang="tsx">
import { defineComponent } from 'vue'
import { ref } from 'vue/vapor'

export default defineComponent({
  setup() {
    const count = ref(1)

    const Comp = () => count.value
      ? count.value && <div>2</div>
      : (<div>1</div>)

    const Comp1 = () => {
      return (count.value
        ? (Array.from({ length: count.value }).map((_, index) => (
            index && (
              <span>
                {index}
              </span>
            )
          )))
        : null
      )
    }

    const Comp2 = () => {
      return (count.value && (
        count.value > 9
          ? count.value > 2 && <div>null</div>
          : (
            <div>
              12333
            </div>
            )
      ))
    }

    const Comp3 = () => {
      return count.value > 1
        ? count.value
          ? (
            <div>
              1
            </div>
            )
          : <div>null</div>
        : (
          <div>
            2
          </div>
          )
    }

    const Comp4 = () => {
      return count.value > 1
        ? (
          <span>
            {count.value}
          </span>
          )
        : <div>null</div>
    }

    return (
      <>
        <form onSubmit_prevent>
          <input
            v-bind:value={count.value}
            onInput={count.value = $event.target.value}
          />

          <div>
            v-show:
            <span v-show={count.value}>
              {count.value > 1 ? 2 : 3}
            </span>
          </div>

          <div>
            v-text:
            <span v-text={count.value} />
          </div>

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
              count.value
              && count.value > 1
              && (count.value === 5
                ? (
                  <span>
                    1
                  </span>
                  )
                : count.value === 6
                  ? (count.value && Array.from({ length: 10 }).map(() => (
                    <span>
                      2
                    </span>
                    )))
                  : (
                    <div>
                      3
                    </div>
                    )
              )
            }

            {
              Array.from({ length: 10 }).map(() => (
                <span>
                  1
                </span>
              ))
            }
          </div>

          <div>
            v-if:
            {
              count.value > 1
                ? <span>lg 1</span>
                : count.value > 2
                  ? <span>lg 2</span>
                  : <span>lt 1</span>
            }
            {count.value && <span> 123 </span>}
            {count.value && Array.from({ length: 10 }).map(() => (
              <span>
                1
              </span>
            ))}
            {
              count.value && count.value > 1 && count.value > 2
              && (count.value > 9
                ? (<div>123</div>)
                : null)
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
