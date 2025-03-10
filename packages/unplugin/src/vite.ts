import { createVitePlugin } from 'unplugin'
import { unpluginFactory } from './core/unplugin'

export default createVitePlugin(unpluginFactory)
