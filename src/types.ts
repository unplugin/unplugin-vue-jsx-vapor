import type { FilterPattern } from 'vite'
import type { compile } from '@vue/compiler-dom'

export interface Options {
  // define your plugin options here
  include?: FilterPattern
  exclude?: FilterPattern
  compile?: typeof compile
}
