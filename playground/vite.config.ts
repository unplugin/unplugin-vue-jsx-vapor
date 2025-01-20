import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import VueMacros from 'unplugin-vue-macros/vite'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'

export default defineConfig({
  plugins: [
    VueMacros({
      plugins: {
        vueJsx: VueJsxVapor(),
      },
    }),
    Inspect(),
  ],
})
