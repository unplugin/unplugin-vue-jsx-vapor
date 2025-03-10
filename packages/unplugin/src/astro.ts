import unplugin from './core/unplugin'
import type { Options } from './types'

export default (options: Options) => ({
  name: 'unplugin-vue-jsx-vapor',
  hooks: {
    'astro:config:setup': (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unplugin.vite(options))
    },
  },
})
