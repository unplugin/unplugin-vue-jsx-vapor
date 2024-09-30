import { defineConfig } from 'unplugin-vue-macros'

export default defineConfig({
  jsxMacros: {
    lib: 'vue/vapor',
  },
  jsxRef: true,
  scriptSFC: true,
})
