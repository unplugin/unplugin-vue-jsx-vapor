import { extend } from '@vue/shared'
import {
  type VaporCodegenResult as BaseVaporCodegenResult,
  generate,
} from '@vue/compiler-vapor'
import {
  type DirectiveTransform,
  type NodeTransform,
  transform,
} from './transform'

import { transformElement } from './transforms/transformElement'
import { transformChildren } from './transforms/transformChildren'
import { transformTemplateRef } from './transforms/transformTemplateRef'
import { transformText } from './transforms/transformText'
import { transformVBind } from './transforms/vBind'
import { transformVOn } from './transforms/vOn'
import { transformVSlot } from './transforms/vSlot'
import { transformVModel } from './transforms/vModel'
import { transformVShow } from './transforms/vShow'
import { transformVHtml } from './transforms/vHtml'
import {
  type HackOptions,
  IRNodeTypes,
  type RootIRNode,
  type RootNode,
} from './ir'
import type { CompilerOptions as BaseCompilerOptions } from '@vue/compiler-dom'
import type { Expression, JSXElement, JSXFragment } from '@babel/types'

export { generate }

export interface VaporCodegenResult
  extends Omit<BaseVaporCodegenResult, 'ast'> {
  ast: RootIRNode
}

// code/AST -> IR (transform) -> JS (generate)
export function compile(
  root: JSXElement | JSXFragment,
  options: CompilerOptions = {},
): VaporCodegenResult {
  const resolvedOptions = extend({}, options, {
    inline: true,
    prefixIdentifiers: false,
    expressionPlugins: options.expressionPlugins || ['jsx'],
  })
  if (options.isTS) {
    const { expressionPlugins } = resolvedOptions
    if (!expressionPlugins.includes('typescript')) {
      resolvedOptions.expressionPlugins = [
        ...(expressionPlugins || []),
        'typescript',
      ]
    }
  }

  const children =
    root.type === 'JSXFragment'
      ? root.children
      : root.type === 'JSXElement'
        ? [root]
        : []
  const ast: RootNode = {
    type: IRNodeTypes.ROOT,
    children,
    source: options.source || '',
  }
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()

  const ir = transform(
    ast,
    extend({}, resolvedOptions, {
      nodeTransforms: [
        ...nodeTransforms,
        ...(options.nodeTransforms || []), // user transforms
      ],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        options.directiveTransforms || {}, // user transforms
      ),
    }),
  )

  return generate(ir as any, resolvedOptions) as unknown as VaporCodegenResult
}

export type CompilerOptions = HackOptions<BaseCompilerOptions> & {
  source?: string
}
export type TransformPreset = [
  NodeTransform[],
  Record<string, DirectiveTransform>,
]

export function getBaseTransformPreset(): TransformPreset {
  return [
    [
      transformTemplateRef,
      transformText,
      transformElement,
      transformVSlot,
      transformChildren,
    ],
    {
      bind: transformVBind,
      on: transformVOn,
      model: transformVModel,
      show: transformVShow,
      html: transformVHtml,
    },
  ]
}
