import { isGloballyAllowed, isString, makeMap } from '@vue/shared'
import {
  type AttributeNode,
  type DirectiveNode,
  type ElementNode,
  ElementTypes,
  Namespaces,
  NodeTypes,
  type SimpleExpressionNode,
  type TextNode,
  createSimpleExpression,
  isLiteralWhitelisted,
} from '@vue/compiler-dom'
import {
  type BigIntLiteral,
  type ConditionalExpression,
  type Expression,
  type Identifier,
  type JSXAttribute,
  type JSXElement,
  type JSXFragment,
  type JSXText,
  type Literal,
  type LogicalExpression,
  type Node,
  type NumericLiteral,
  type SourceLocation,
  type SpreadElement,
  type StringLiteral,
  isLiteral,
} from '@babel/types'
import { EMPTY_EXPRESSION } from './transforms/utils'
import type { TransformContext } from './transform'
import type { VaporDirectiveNode } from './ir'

import type { MagicString } from '@vue-macros/common'

const __BROWSER__ = false

export function propToExpression(prop: AttributeNode | VaporDirectiveNode) {
  return prop.type === NodeTypes.ATTRIBUTE
    ? prop.value
      ? createSimpleExpression(prop.value.content, true, prop.value.loc)
      : EMPTY_EXPRESSION
    : prop.exp
}

export function isConstantExpression(exp: SimpleExpressionNode) {
  return (
    isLiteralWhitelisted(exp.content) ||
    isGloballyAllowed(exp.content) ||
    getLiteralExpressionValue(exp) !== null
  )
}

export function getLiteralExpressionValue(
  exp: SimpleExpressionNode,
): number | string | boolean | null {
  if (!__BROWSER__ && exp.ast) {
    if (
      ['StringLiteral', 'NumericLiteral', 'BigIntLiteral'].includes(
        exp.ast.type,
      )
    ) {
      return (exp.ast as StringLiteral | NumericLiteral | BigIntLiteral).value
    } else if (
      exp.ast.type === 'TemplateLiteral' &&
      exp.ast.expressions.length === 0
    ) {
      return exp.ast.quasis[0].value.cooked!
    }
  }
  return exp.isStatic ? exp.content : null
}

export const isConstant = (
  node: Expression | Identifier | Literal | SpreadElement | null,
): boolean => {
  if (!node) return false
  if (node.type === 'Identifier') {
    return node.name === 'undefined'
  }
  if (node.type === 'ArrayExpression') {
    const { elements } = node
    return elements.every((element) => element && isConstant(element))
  }
  if (node.type === 'ObjectExpression') {
    return node.properties.every((property) =>
      isConstant((property as any).value),
    )
  }
  if (
    node.type === 'TemplateLiteral' ? !node.expressions.length : isLiteral(node)
  ) {
    return true
  }
  return false
}

export function isLiteralExpressionContainer(node?: Node | null) {
  return (
    node?.type === 'JSXExpressionContainer' &&
    node.expression.type !== 'JSXEmptyExpression' &&
    isConstant(node.expression)
  )
}

const EMPTY_TEXT_REGEX = /^\s*[\n\r]\s*$/
const START_EMPTY_TEXT_REGEX = /^\s*[\n\r]/
const END_EMPTY_TEXT_REGEX = /[\n\r]\s*$/
export function resolveJSXText(node: JSXText) {
  if (EMPTY_TEXT_REGEX.test(`${node.extra?.raw}`)) {
    return ''
  }
  let value = node.value
  if (START_EMPTY_TEXT_REGEX.test(value)) {
    value = value.trimStart()
  }
  if (END_EMPTY_TEXT_REGEX.test(value)) {
    value = value.trimEnd()
  }
  return value
}

export function isEmptyText(node: Node) {
  return (
    (node.type === 'JSXText' && EMPTY_TEXT_REGEX.test(`${node.extra?.raw}`)) ||
    (node.type === 'JSXExpressionContainer' &&
      node.expression.type === 'JSXEmptyExpression')
  )
}

export function resolveExpression(
  node: Node | undefined | null,
  context: TransformContext,
  effect = false,
): SimpleExpressionNode {
  const isStatic =
    !!node &&
    (node.type === 'StringLiteral' ||
      node.type === 'JSXText' ||
      node.type === 'JSXIdentifier')
  let source = !node
    ? ''
    : node.type === 'JSXIdentifier'
      ? node.name
      : node.type === 'StringLiteral'
        ? node.value
        : node.type === 'JSXText'
          ? resolveJSXText(node)
          : node.type === 'JSXExpressionContainer'
            ? node.expression.type === 'JSXEmptyExpression'
              ? ''
              : node.expression.type === 'Identifier'
                ? node.expression.name
                : context.ir.source.slice(
                    node.expression.start!,
                    node.expression.end!,
                  )
            : context.ir.source.slice(node.start!, node.end!)
  const location = node ? node.loc : null
  if (source && !isStatic && effect && !isLiteralExpressionContainer(node)) {
    source = `() => (${source})`
  }
  return resolveSimpleExpression(source, isStatic, location)
}

export function resolveSimpleExpression(
  source: string,
  isStatic: boolean,
  location?: SourceLocation | null,
) {
  const result = createSimpleExpression(
    source,
    isStatic,
    resolveLocation(location, source),
  )
  result.ast = null
  return result
}

export function resolveLocation(
  location: SourceLocation | null | undefined,
  context: TransformContext | string,
) {
  return location
    ? {
        start: {
          line: location.start.line,
          column: location.start.column + 1,
          offset: location.start.index,
        },
        end: {
          line: location.end.line,
          column: location.end.column + 1,
          offset: location.end.index,
        },
        source: isString(context)
          ? context
          : context.ir.source.slice(location.start.index, location.end.index),
      }
    : {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      }
}

export function resolveValue(
  value: JSXAttribute['value'],
  context: TransformContext,
): TextNode | undefined {
  return value
    ? {
        type: NodeTypes.TEXT,
        content:
          value.type === 'StringLiteral'
            ? value.value
            : value.type === 'JSXExpressionContainer'
              ? context.ir.source.slice(
                  value.expression.start!,
                  value.expression.end!,
                )
              : '',
        loc: resolveLocation(value.loc, context),
      }
    : undefined
}

export function resolveNode(
  node: JSXElement,
  context: TransformContext,
): ElementNode {
  const tag =
    node.openingElement.name.type === 'JSXIdentifier'
      ? node.openingElement.name.name
      : ''
  const loc = resolveLocation(node.loc, context)
  const tagType = isJSXComponent(node)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT
  const props = node.openingElement.attributes.reduce(
    (result, attr) => {
      if (attr.type === 'JSXAttribute') {
        if (tagType === ElementTypes.COMPONENT) {
          result.push(resolveDirectiveNode(attr, context))
        } else {
          result.push({
            type: NodeTypes.ATTRIBUTE,
            name: `${attr.name.name}`,
            nameLoc: resolveLocation(attr.name.loc, context),
            value: resolveValue(attr.value, context),
            loc: resolveLocation(attr.loc, context),
          })
        }
      }
      return result
    },
    [] as Array<AttributeNode | DirectiveNode>,
  )

  return {
    type: NodeTypes.ELEMENT,
    props,
    children: node.children as any[],
    tag,
    loc,
    ns: Namespaces.HTML,
    tagType,
    isSelfClosing: !!node.selfClosing,
    codegenNode: undefined,
  }
}

export function resolveDirectiveNode(
  node: JSXAttribute,
  context: TransformContext,
): VaporDirectiveNode {
  const { value, name } = node
  const nameString = name.type === 'JSXIdentifier' ? name.name : ''
  const argString = name.type === 'JSXNamespacedName' ? name.namespace.name : ''

  const arg =
    name.type === 'JSXNamespacedName'
      ? resolveSimpleExpression(argString, true, name.namespace.loc)
      : undefined
  const exp = value ? resolveExpression(value, context) : undefined

  const [tag, ...modifiers] = argString.split('_')

  return {
    type: NodeTypes.DIRECTIVE,
    name: nameString,
    rawName: `${name}:${tag}`,
    exp,
    arg,
    loc: resolveLocation(node.loc, context),
    modifiers: modifiers.map((modifier) => createSimpleExpression(modifier)),
  }
}

// Copy from https://github.com/sindresorhus/html-tags/blob/main/html-tags.json
export const isHtmlTags = makeMap(
  'a,abbr,address,area,article,aside,audio,b,base,bdi,bdo,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,data,datalist,dd,del,details,dfn,dialog,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,img,input,ins,kbd,label,legend,li,link,main,map,mark,math,menu,menuitem,meta,meter,nav,noscript,object,ol,optgroup,option,output,p,param,picture,pre,progress,q,rb,rp,rt,rtc,ruby,s,samp,script,search,section,select,slot,small,source,span,strong,style,sub,summary,sup,svg,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,u,ul,var,video,wbr',
)
// Copy from https://github.com/element-io/svg-tags/blob/master/lib/svg-tags.json
export const isSvgTags = makeMap(
  'a,altGlyph,altGlyphDef,altGlyphItem,animate,animateColor,animateMotion,animateTransform,circle,clipPath,color-profile,cursor,defs,desc,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,font,font-face,font-face-format,font-face-name,font-face-src,font-face-uri,foreignObject,g,glyph,glyphRef,hkern,image,line,linearGradient,marker,mask,metadata,missing-glyph,mpath,path,pattern,polygon,polyline,radialGradient,rect,script,set,stop,style,svg,switch,symbol,text,textPath,title,tref,tspan,use,view,vkern',
)
export function isJSXComponent(node: Node): node is JSXElement {
  if (node.type !== 'JSXElement') return false

  const { openingElement } = node
  if (openingElement.name.type === 'JSXIdentifier') {
    const name = openingElement.name.name
    return !isHtmlTags(name) && !isSvgTags(name)
  } else {
    return openingElement.name.type === 'JSXMemberExpression'
  }
}

export function findProp(expression: Expression | undefined, key: string) {
  if (expression?.type === 'JSXElement') {
    for (const attr of expression.openingElement.attributes) {
      if (attr.type === 'JSXAttribute' && attr.name.name === key) {
        return attr
      }
    }
  }
}

export function getReturnExpression(node: Node): Expression | undefined {
  if (
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    if (node.body.type !== 'BlockStatement') {
      return node.body
    } else {
      for (const statement of node.body.body) {
        if (statement.type === 'ReturnStatement' && statement.argument)
          return statement.argument
      }
    }
  }
}

export function addAttribute(node: Node, str: string, s: MagicString) {
  const end =
    node.type === 'JSXElement'
      ? node.openingElement.name.end!
      : node.type === 'JSXFragment'
        ? node.openingFragment.end! - 1
        : null
  if (end) s.appendRight(end, str)
}

export function overwrite(
  start: number | undefined,
  end: number | undefined,
  content: string,
  s: MagicString,
  method:
    | 'prependLeft'
    | 'prependRight'
    | 'appendLeft'
    | 'appendRight' = 'prependLeft',
) {
  if (start === end) {
    s[method](start!, content)
  } else {
    s.overwrite(start!, end!, content)
  }
}

export function isJSXElement(
  node?: Node | null,
): node is JSXElement | JSXFragment {
  return !!node && (node.type === 'JSXElement' || node.type === 'JSXFragment')
}
