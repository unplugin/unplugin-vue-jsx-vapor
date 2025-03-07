export {
  compile,
  generate,
  type CompilerOptions,
  type TransformPreset,
} from './compile'
export * from './transform'

export { resolveDirectiveNode, resolveNode } from './utils'

export * from './ir'

export { transformText } from './transforms/transformText'
export { transformElement } from './transforms/transformElement'
export { transformChildren } from './transforms/transformChildren'
export { transformTemplateRef } from './transforms/transformTemplateRef'
export { transformVBind } from './transforms/vBind'
export { transformVOn } from './transforms/vOn'
export { transformVSlot } from './transforms/vSlot'
export { transformVModel } from './transforms/vModel'
export { transformVShow } from './transforms/vShow'
export { transformVHtml } from './transforms/vHtml'
export { transformVFor } from './transforms/vFor'
