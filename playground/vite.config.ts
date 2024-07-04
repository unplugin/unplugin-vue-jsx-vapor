import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Vue from '@vitejs/plugin-vue'
import VueMacros from 'unplugin-vue-macros/vite'
import Devtools from 'vite-plugin-vue-devtools'
import VueJsxVapor from '../src/vite'

export default defineConfig({
  plugins: [Vue(), VueJsxVapor(), VueMacros(), Inspect(), Devtools()],
})
