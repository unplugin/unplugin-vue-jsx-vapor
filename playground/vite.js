import { startVite } from 'vite-hyper-config'

startVite(undefined, {
  resolve: {
    conditions: ['dev'],
  },
})
