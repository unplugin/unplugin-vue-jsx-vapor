import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [VueJsxVapor(), Inspect()],
})
