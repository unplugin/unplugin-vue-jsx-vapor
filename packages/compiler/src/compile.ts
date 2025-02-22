import { extend, isString } from '@vue/shared'
import { parse } from '@babel/parser'
import {
  type VaporCodegenResult as BaseVaporCodegenResult,
  generate,
} from '../patched/compiler-vapor.js'
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
  source: string | JSXElement | JSXFragment,
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

  let expression!: Expression
  if (isString(source)) {
    const {
      body: [statement],
    } = parse(source, {
      sourceType: 'module',
      plugins: resolvedOptions.expressionPlugins,
    }).program
    if (statement.type === 'ExpressionStatement') {
      expression = statement.expression
    }
  } else {
    expression = source
  }
  const children =
    expression.type === 'JSXFragment'
      ? expression.children
      : expression.type === 'JSXElement'
        ? [expression]
        : []
  const ast: RootNode = {
    type: IRNodeTypes.ROOT,
    children,
    source: isString(source) ? source : options.source || '',
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
