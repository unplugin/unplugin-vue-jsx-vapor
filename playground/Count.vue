<script lang="tsx">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: {
    value: String,
  },
  setup(props) {
    return <div>{props.value}</div>
  },
})
</script>
