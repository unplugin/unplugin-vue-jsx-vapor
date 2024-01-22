import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import defineRender from '@vue-macros/define-render/vite'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'
import { compile } from '@vue/compiler-dom'

export default defineConfig({
  plugins: [
    Vue(),
    VueJsxVapor({
      compile,
    }),
    defineRender(),
    Inspect(),
  ],
})
