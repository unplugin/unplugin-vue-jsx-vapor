import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import defineRender from '@vue-macros/define-render/vite'
import Devtools from 'vite-plugin-vue-devtools'
import VueJsxVapor from '../src/vite'

export default defineConfig({
  plugins: [Vue(), VueJsxVapor(), defineRender(), Inspect(), Devtools()],
})
