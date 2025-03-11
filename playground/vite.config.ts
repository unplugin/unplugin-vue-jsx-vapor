import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
// import VueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    VueJsxVapor({
      macros: true,
    }),
    // VueJsx(),
    Inspect(),
  ],
})
