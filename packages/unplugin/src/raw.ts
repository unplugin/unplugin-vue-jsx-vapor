import { plugin } from './core/plugin'
import type { Options } from './types'
import type { UnpluginFactoryOutput } from 'unplugin'

export default plugin as unknown as UnpluginFactoryOutput<Options, false>
