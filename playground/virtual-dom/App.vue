<script lang="tsx" setup>
import { ref } from 'vue'
import For from './for.vue'
import Bind from './bind.vue'
import Slot from './slot.vue'

const count = ref(1)
function Comp({ icon, getChildren }: any, { slots }: any) {
  const Children = getChildren?.()
  return (
    <div>
      Comp:
      <icon />
      <Children />
      <slot />
      <slots.bottom />
    </div>
  )
}

function Comp1() {
  return (
    !count.value
      ? null
      : Array.from({ length: count.value }).map((_, index) => (
        <span>
          {index}
        </span>
      ))
  )
}

function Comp2() {
  return (count.value && (
    count.value > 9
      ? (count.value > 2 && <div>null</div>)
      : (
        <div>
          Comp2: 2
        </div>
        )
  ))
}

function Comp3() {
  return (count.value > 1
    ? count.value
      ? (
        <div>
          1
        </div>
        )
      : null
    : <div>Comp3: 2</div>)
}

function Comp4() {
  return count.value && (
    <span>
      Comp4:
      {count.value}
    </span>
  )
}

const Component = <div>Component</div>
const slots = {
  default: () => <div>"default slot"</div>,
  bottom: () => <div>'bottom slot'</div>,
}

defineRender((
  <>
    <form onSubmit_prevent class="flex items-center">
      <input
        {...{ value: count.value }}
        {...count.value ? { for: 'id' } : {}}
        onInput={($event: any) => count.value = $event.target.value}
      />
      {/* Function Components */}
      {Component}
      <Comp
        v-permission={`"post"`}
        v-model_number={count.value}
        icon={(
          <i id="id">
            {count.value
              ? (
                <span>
                  {count.value}
                </span>
                )
              : null}
            "+"
          </i>
        )}
        icon1={`"icon1"`}
        getChildren={() => {
          const A = (
            <Comp icon={<i>"-"</i>} />
          )
          return A
        }}
      >
        <template v-for={(slot, slotName) in slots} v-slot:$slotName$>
          {slot}
        </template>
      </Comp>
      <Comp1 />
      <Comp2 />
      <Comp3 />
      <Comp4 />

      <div>
        v-bind:
        <Bind />
      </div>

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
              ? (
                  count.value
                  && Array.from({ length: 10 }).map((_, index) => (
                    index && (
                      <span>
                        3
                      </span>
                    )
                  ))
                )
              : (
                <div>
                  3
                </div>
                )
          )
        }
        {
          count.value && Array.from({ length: count.value }).map(() => (
            <span>
              1
            </span>
          ))
        }
        <For />
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
        {
              count.value && count.value > 1 && count.value > 2
              && (count.value > 9
                ? (<div>123</div>)
                : null)
            }
      </div>

      <div>
        v-slot:
        <Slot v-slot={scope}>
          default slot:
          {scope}
        </Slot>
      </div>
    </form>
  </>
),
)
</script>

<style>
[v-cloak] {
  color: red;
}
</style>
