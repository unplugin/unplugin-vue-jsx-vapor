import { createUnplugin, type UnpluginInstance } from 'unplugin'
import plugin from './raw'
import type { Options } from './options'

export * from './options'

const unplugin: UnpluginInstance<Options | undefined> = createUnplugin(plugin)
export default unplugin
