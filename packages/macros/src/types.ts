import type { BaseOptions, MarkRequired } from '@vue-macros/common'

export type Options = BaseOptions & {
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
  | 'version'
  | 'lib'
  | 'defineComponent'
  | 'defineModel'
  | 'defineExpose'
  | 'defineSlots'
  | 'defineStyle'
>
