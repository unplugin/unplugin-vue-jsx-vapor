import { type PluginReturn, createPlugin } from 'ts-macro'
import type { Options } from './types'

const plugin: PluginReturn<Options | undefined, true> = createPlugin(() => {
  return [].flat()
})

export default plugin
