<script setup lang="tsx">
import { ref } from 'vue'

let model = ref('model')

const Comp = (props) => {
 console.log(props)
 return <input value={props.modelValue} onInput={e=>props['onUpdate:modelValue'](e.target.value)} />
}

const Render = (
  <>
    <input v-model={model.value}></input>
    <Comp v-model={model.value} />
    {model.value}
  </>
)
defineRender(Render)
</script>
