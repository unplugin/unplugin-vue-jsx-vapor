import {
  FilterFileType,
  REGEX_NODE_MODULES,
  REGEX_SETUP_SFC,
  REGEX_SRC_FILE,
  createFilter,
  detectVueVersion,
  normalizePath,
} from '@vue-macros/common'
import {
  helperPrefix,
  useModelHelperCode,
  useModelHelperId,
  withDefaultsHelperCode,
  withDefaultsHelperId,
} from './core/helper'
import { transformStyle } from './core/style'
import { transformJsxMacros } from './core'
import type { Options, OptionsResolved } from './types'
import type { UnpluginOptions } from 'unplugin'

export function resolveOptions(options: Options): OptionsResolved {
  const version = options.version || detectVueVersion()
  const lib = options.lib || 'vue/vapor'
  return {
    include: [REGEX_SRC_FILE],
    exclude: [REGEX_SETUP_SFC, REGEX_NODE_MODULES],
    ...options,
    version,
    lib,
    defineComponent: {
      alias: options?.defineComponent?.alias ?? [
        'defineComponent',
        'defineVaporComponent',
      ],
    },
    defineModel: { alias: options?.defineModel?.alias ?? ['defineModel'] },
    defineSlots: { alias: options?.defineSlots?.alias ?? ['defineSlots'] },
    defineExpose: { alias: options?.defineExpose?.alias ?? ['defineExpose'] },
    defineStyle: { alias: options?.defineStyle?.alias ?? ['defineStyle'] },
  }
}

const name = '@vue-jsx-vapor/macros'

const plugin = (userOptions: Options = {}): UnpluginOptions => {
  const options = resolveOptions(userOptions)
  const filter = createFilter(options)
  const importMap = new Map()

  return {
    name,
    enforce: 'pre',

    resolveId(id) {
      if (normalizePath(id).startsWith(helperPrefix)) return id
    },
    loadInclude(id) {
      return normalizePath(id).startsWith(helperPrefix)
    },
    load(_id) {
      const id = normalizePath(_id)
      if (id === useModelHelperId) return useModelHelperCode
      else if (id === withDefaultsHelperId) return withDefaultsHelperCode
      else if (importMap.get(id)) return importMap.get(id)
    },

    transformInclude(id) {
      if (importMap.get(id)) return true
      return filter(id)
    },
    transform(code, id) {
      if (importMap.get(id)) return transformStyle(code, id, options)
      return transformJsxMacros(code, id, importMap, options)
    },
  }
}
export default plugin
