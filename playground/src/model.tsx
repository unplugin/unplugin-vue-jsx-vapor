import { ref } from 'vue'
const Comp = () => {
  const model = defineModel<string>()
  return <div>comp</div>
}

export default () => {
  const model = ref('model')

  return (
    <div>
      123
      <Comp />1
      <div>
        <button disabled={!!model.value}>123</button>
      </div>
    </div>
  )
}
