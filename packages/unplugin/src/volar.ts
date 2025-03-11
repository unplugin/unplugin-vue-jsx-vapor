import jsxDirective from '@vue-macros/volar/jsx-directive'
import jsxRef from '@vue-macros/volar/jsx-ref'
import { type PluginReturn, createPlugin } from 'ts-macro'
import jsxMacros from '@vue-jsx-vapor/macros/volar'
import type { Options } from './types'

const plugin: PluginReturn<Options | undefined, true> = createPlugin(
  (ctx, options) => {
    return [
      jsxDirective()(ctx),
      options?.ref === false
        ? []
        : jsxRef(options?.ref === true ? undefined : options?.ref)(ctx),
      options?.macros === false
        ? []
        : options?.macros
          ? jsxMacros(options.macros ? undefined : options.macros)(ctx)
          : [],
    ].flat()
  },
)

export default plugin
