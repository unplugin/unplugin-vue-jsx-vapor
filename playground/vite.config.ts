import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'
import VueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    VueJsxVapor({
      interop: true,
    }),
    VueJsx(),
    Inspect(),
  ],
})
