import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import VueJsxVapor from 'unplugin-vue-jsx-vapor/vite'
import { compile } from '@vue/compiler-dom'
import VueMacros from 'unplugin-vue-macros/vite'

export default defineConfig({
  plugins: [
    VueJsxVapor({
      compile,
    }),
    VueMacros({
      exportRender: true,
      jsxDirective: false,
      plugins: {
        vue: Vue(),
      },
    }),
    Inspect(),
  ],
})
