import type { CompilerOptions } from './core/compiler'
import type { FilterPattern } from 'vite'

export interface Options {
  // define your plugin options here
  include?: FilterPattern
  exclude?: FilterPattern
  compile?: CompilerOptions
}
