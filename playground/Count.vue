<script lang="tsx">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    value: String,
  },
  setup(props) {
    return <div>{props.value}</div>
  },
})
</script>
