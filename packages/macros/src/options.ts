import {
  detectVueVersion,
  REGEX_NODE_MODULES,
  REGEX_SETUP_SFC,
  REGEX_SRC_FILE,
  type FilterOptions,
  type MarkRequired,
} from '@vue-macros/common'

export type Options = FilterOptions & {
  lib?: 'vue' | 'vue/vapor' | (string & {})
  defineComponent?: { alias: string[] }
  defineModel?: { alias: string[] }
  defineExpose?: { alias: string[] }
  defineSlots?: { alias: string[] }
  defineStyle?: { alias: string[] }
}
export type OptionsResolved = MarkRequired<
  Options,
  | 'include'
  | 'lib'
  | 'defineComponent'
  | 'defineModel'
  | 'defineExpose'
  | 'defineSlots'
  | 'defineStyle'
>

export function resolveOptions(options: Options): OptionsResolved {
  const lib = options.lib || 'vue/vapor'
  return {
    include: [REGEX_SRC_FILE],
    exclude: [REGEX_SETUP_SFC, REGEX_NODE_MODULES],
    ...options,
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
