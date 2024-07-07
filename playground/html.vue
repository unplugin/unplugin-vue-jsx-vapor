<script setup lang="tsx">
import { ref } from 'vue'

let foo = ref('<div style="color: red;">foo</div>')


const Render = (
  <>
    <input v-model={foo.value} style="width: 100%" />
    <div v-html={foo.value} />
  </>
)
defineRender(Render)
</script>
