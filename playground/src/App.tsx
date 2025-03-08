import { type Ref, ref } from 'vue'
import Count2 from './count'
import If from './if'
import For from './for'
import Slot from './slot'
import Model from './model'
import Show from './show'
import Html from './html'
import Once from './once'

export default () => {
  const count = ref('1')

  const Count = (props: { value: string }) => {
    return <div>{props.value}</div>
  }

  const Count1 = ({ value }: { value: Ref<string> }) => {
    return <div>{value.value}</div>
  }

  return (
    <>
      <fieldset>
        <legend>Component</legend>
        <input
          value_prop={count.value}
          onInput={(e) => (count.value = e.target.value)}
        />

        <Count value={count.value} />
        <Count1 value={count} />
        <Count2 value={count.value} />
      </fieldset>

      <fieldset>
        <legend>v-if</legend>
        <If />
      </fieldset>

      <fieldset>
        <legend>v-for</legend>
        <For />
      </fieldset>

      <fieldset>
        <legend>v-slot</legend>
        <Slot />
      </fieldset>

      <fieldset>
        <legend>v-model</legend>
        <Model />
      </fieldset>

      <fieldset>
        <legend>v-show</legend>
        <Show />
      </fieldset>

      <fieldset>
        <legend>v-html</legend>
        <Html />
      </fieldset>

      <fieldset>
        <legend>v-once</legend>
        <Once />
      </fieldset>
    </>
  )
}
