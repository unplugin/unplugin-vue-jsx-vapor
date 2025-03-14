import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    conditions: ['dev'],
  },
  optimizeDeps: {
    exclude: ['vitepress'],
  },
})
