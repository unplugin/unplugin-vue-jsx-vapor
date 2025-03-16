import { transformSync } from '@babel/core'
// @ts-ignore missing type
import babelTypescript from '@babel/plugin-transform-typescript'
import jsx from '@vue-jsx-vapor/babel'
import type { Options } from '../options'

export type { Options }

export function transformVueJsxVapor(
  code: string,
  id: string,
  options?: Options,
) {
  const result = transformSync(code, {
    plugins: [
      [jsx, { compile: options?.compile, interop: options?.interop }],
      id.endsWith('.tsx')
        ? [babelTypescript, { isTSX: true, allowExtensions: true }]
        : null,
    ].filter((i) => i !== null),
    filename: id,
    sourceMaps: true,
    sourceFileName: id,
    babelrc: false,
    configFile: false,
  })

  if (result?.code)
    return {
      code: result.code,
      map: result.map,
    }
}
