<script setup lang="tsx">
import { ref } from 'vue'

let show = ref(false)


const Render = (
  <>
    <input v-model={show.value} type="checkbox"/>
    <span v-show={show.value}>{show.value}</span>
  </>
)
defineRender(Render)
</script>
