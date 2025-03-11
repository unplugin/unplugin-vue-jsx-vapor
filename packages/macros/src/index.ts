import { type UnpluginInstance, createUnplugin } from 'unplugin'
import plugin from './raw'
import type { Options } from './types'

export * from './types'

const unplugin: UnpluginInstance<Options | undefined> = createUnplugin(plugin)
export default unplugin
