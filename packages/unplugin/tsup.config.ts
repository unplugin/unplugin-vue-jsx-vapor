import { config } from '../../tsup.config.js'

export default config({
  onSuccess: 'npm run build:fix',
})
