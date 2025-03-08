import { extend, isString } from '@vue/shared'
import {
  type VaporCodegenResult as BaseVaporCodegenResult,
  generate,
} from '@vue/compiler-vapor'
import { parse } from '@babel/parser'
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
import { transformVSlots } from './transforms/vSlots'
import { transformVModel } from './transforms/vModel'
import { transformVShow } from './transforms/vShow'
import { transformVHtml } from './transforms/vHtml'
import {
  type HackOptions,
  IRNodeTypes,
  type RootIRNode,
  type RootNode,
} from './ir'
import { transformVFor } from './transforms/vFor'
import { transformVOnce } from './transforms/vOnce'
import type { CompilerOptions as BaseCompilerOptions } from '@vue/compiler-dom'
import type { ExpressionStatement, JSXElement, JSXFragment } from '@babel/types'

export { generate }

export interface VaporCodegenResult
  extends Omit<BaseVaporCodegenResult, 'ast'> {
  ast: RootIRNode
}

// code/AST -> IR (transform) -> JS (generate)
export function compile(
  source: JSXElement | JSXFragment | string,
  options: CompilerOptions = {},
): VaporCodegenResult {
  const resolvedOptions = extend({}, options, {
    inline: true,
    prefixIdentifiers: false,
    expressionPlugins: options.expressionPlugins || ['jsx'],
  })
  if (!resolvedOptions.source && isString(source)) {
    resolvedOptions.source = source
  }
  if (resolvedOptions.isTS) {
    const { expressionPlugins } = resolvedOptions
    if (!expressionPlugins.includes('typescript')) {
      resolvedOptions.expressionPlugins = [
        ...(expressionPlugins || []),
        'typescript',
      ]
    }
  }
  const root = isString(source)
    ? (
        parse(source, {
          sourceType: 'module',
          plugins: resolvedOptions.expressionPlugins,
        }).program.body[0] as ExpressionStatement
      ).expression
    : source
  const children =
    root.type === 'JSXFragment'
      ? root.children
      : root.type === 'JSXElement'
        ? [root]
        : []
  const ast: RootNode = {
    type: IRNodeTypes.ROOT,
    children,
    source: resolvedOptions.source || '',
  }
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()

  const ir = transform(
    ast,
    extend({}, resolvedOptions, {
      nodeTransforms: [
        ...nodeTransforms,
        ...(resolvedOptions.nodeTransforms || []), // user transforms
      ],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        resolvedOptions.directiveTransforms || {}, // user transforms
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
      transformVOnce,
      transformVFor,
      transformTemplateRef,
      transformText,
      transformElement,
      transformVSlots,
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
