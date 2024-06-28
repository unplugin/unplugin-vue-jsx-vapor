export { generate } from '@vue-vapor/compiler-vapor'

export {
  // wrapTemplate,
  compile,
  type CompilerOptions,
  type TransformPreset,
} from './compile'
export * from './transform'

export * from './ir'

export { transformText } from './transforms/transformText'
export { transformElement } from './transforms/transformElement'
export { transformChildren } from './transforms/transformChildren'
export { transformVBind } from './transforms/vBind'
