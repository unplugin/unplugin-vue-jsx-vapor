import {
  type CompilerOptions as BaseCompilerOptions,
  ErrorCodes,
  createCompilerError,
  defaultOnError,
} from '@vue/compiler-dom'
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
import {
  type HackOptions,
  IRNodeTypes,
  type RootIRNode,
  type RootNode,
} from './ir'
import { transformText } from './transforms/transformText'
import { transformVBind } from './transforms/vBind'
import { transformVOn } from './transforms/vOn'
import { transformVSlot } from './transforms/vSlot'
import { transformVModel } from './transforms/vModel'
import { transformVShow } from './transforms/vShow'
import { transformVHtml } from './transforms/vHtml'
import type { JSXElement, JSXFragment, Program } from '@babel/types'

export interface VaporCodegenResult
  extends Omit<BaseVaporCodegenResult, 'ast'> {
  ast: RootIRNode
}

// code/AST -> IR (transform) -> JS (generate)
export function compile(
  source: string | Program,
  options: CompilerOptions = {},
): VaporCodegenResult {
  const onError = options.onError || defaultOnError
  const isModuleMode = options.mode === 'module'
  const __BROWSER__ = false
  /* istanbul ignore if */
  if (__BROWSER__ && isModuleMode) {
    onError(createCompilerError(ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED))
  }

  if (options.scopeId && !isModuleMode) {
    onError(createCompilerError(ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED))
  }

  const resolvedOptions = extend({}, options, {
    prefixIdentifiers: false,
    expressionPlugins: options.expressionPlugins || ['jsx'],
  })
  if (!__BROWSER__ && options.isTS) {
    const { expressionPlugins } = resolvedOptions
    if (!expressionPlugins.includes('typescript')) {
      resolvedOptions.expressionPlugins = [
        ...(expressionPlugins || []),
        'typescript',
      ]
    }
  }

  const {
    body: [statement],
  } = isString(source)
    ? parse(source, {
        sourceType: 'module',
        plugins: resolvedOptions.expressionPlugins,
      }).program
    : source
  let children!: JSXElement[] | JSXFragment['children']
  if (statement.type === 'ExpressionStatement') {
    children =
      statement.expression.type === 'JSXFragment'
        ? statement.expression.children
        : statement.expression.type === 'JSXElement'
          ? [statement.expression]
          : []
  }
  const ast: RootNode = {
    type: IRNodeTypes.ROOT,
    children,
    source: isString(source) ? source : '', // TODO
    components: [],
    directives: [],
    helpers: new Set(),
    temps: 0,
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

export type CompilerOptions = HackOptions<BaseCompilerOptions>
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
