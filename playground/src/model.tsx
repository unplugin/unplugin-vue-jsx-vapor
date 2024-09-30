import { ref } from 'vue'

const Comp = (props) => {
  const model = {
    get value() {
      return props.modelValue
    },
    set value(value) {
      props['onUpdate:modelValue'](value)
    },
  }
  return <input v-model={model.value} />
}

export default () => {
  const model = ref('model')

  return (
    <>
      <input v-model={model.value}></input>
      <Comp v-model={model.value} />
      {model.value}
    </>
  )
}
