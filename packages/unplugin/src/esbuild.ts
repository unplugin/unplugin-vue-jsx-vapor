import { createEsbuildPlugin } from 'unplugin'
import { unpluginFactory } from './core/unplugin'

export default createEsbuildPlugin(unpluginFactory)
