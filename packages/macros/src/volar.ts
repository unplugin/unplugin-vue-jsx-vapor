import { createFilter } from '@vue-macros/common'
import { createPlugin, type PluginReturn } from 'ts-macro'
import { resolveOptions, type Options } from './options'
import { getGlobalTypes, getRootMap, transformJsxMacros } from './volar/index'

const plugin: PluginReturn<Options | undefined> = createPlugin(
  ({ ts }, userOptions = {}) => {
    const resolvedOptions = resolveOptions(userOptions!)
    const filter = createFilter(resolvedOptions)

    return {
      name: '@vue-jsx-vapor/macros',
      resolveVirtualCode(virtualCode) {
        const { filePath, codes } = virtualCode
        if (!filter(filePath)) return

        const options = {
          ts,
          ...virtualCode,
          ...resolvedOptions,
        }
        const rootMap = getRootMap(options)
        if (rootMap.size) {
          transformJsxMacros(rootMap, options)
          codes.push(getGlobalTypes(options))
        }
      },
    }
  },
)
export default plugin
