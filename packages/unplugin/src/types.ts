import type { FilterPattern } from 'unplugin-utils'
import type { CompilerOptions } from '@vue-jsx-vapor/compiler'

export interface Options {
  // define your plugin options here
  include?: FilterPattern
  exclude?: FilterPattern
  interop?: boolean
  compile?: CompilerOptions
}
