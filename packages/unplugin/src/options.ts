import type { FilterPattern } from 'unplugin-utils'
import type { CompilerOptions } from '@vue-jsx-vapor/compiler'
import type { Options as MacrosOptions } from '@vue-jsx-vapor/macros'

export interface Options {
  // define your plugin options here
  include?: FilterPattern
  exclude?: FilterPattern
  interop?: boolean
  compile?: CompilerOptions
  /** @default true */
  ref?:
    | {
        alias?: string[]
      }
    | boolean
  /** @default false */
  macros?: MacrosOptions | boolean
}
