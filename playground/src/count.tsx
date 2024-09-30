import { defineComponent } from 'vue'

export default {
  props: {
    value: String,
  },
  setup(props) {
    return <div>{props.value}</div>
  },
}
