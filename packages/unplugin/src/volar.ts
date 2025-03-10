import jsxDirective from '@vue-macros/volar/jsx-directive'
import jsxRef from '@vue-macros/volar/jsx-ref'
import { type PluginReturn, createPlugin } from 'ts-macro'
import type { Options } from './types'

const plugin: PluginReturn<Options | undefined, true> = createPlugin(
  (ctx, options) => {
    return [
      jsxDirective()(ctx),
      options?.ref === false
        ? []
        : jsxRef(options?.ref === true ? undefined : options?.ref)(ctx),
    ].flat()
  },
)

export default plugin
