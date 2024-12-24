import type { CompilerOptions } from '@vue-jsx-vapor/compiler'
import type { FilterPattern } from 'vite'

export interface Options {
  // define your plugin options here
  include?: FilterPattern
  exclude?: FilterPattern
  compile?: CompilerOptions
}
