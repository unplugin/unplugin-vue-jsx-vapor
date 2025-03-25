import getHash from 'hash-sum'
import { normalizePath } from 'unplugin-utils'
import type { BabelFileResult, types } from '@babel/core'

interface HotComponent {
  local: string
  exported: string
  id: string
}

export function registerHMR(
  result: BabelFileResult,
  id: string,
  defineComponentName = ['defineComponent', 'defineVaporComponent'],
) {
  const { ast } = result

  // check for hmr injection
  const declaredComponents: string[] = []
  const hotComponents: HotComponent[] = []
  let defaultName = ''
  const ssr = false

  for (const node of ast!.program.body) {
    if (node.type === 'VariableDeclaration') {
      const names = parseComponentDecls(node, defineComponentName)
      if (names.length) {
        declaredComponents.push(...names)
      }
    }

    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        hotComponents.push(
          ...parseComponentDecls(node.declaration, defineComponentName).map(
            (name) => ({
              local: name,
              exported: name,
              id: getHash(id + name),
            }),
          ),
        )
      } else if (node.specifiers.length) {
        for (const spec of node.specifiers) {
          if (
            spec.type === 'ExportSpecifier' &&
            spec.exported.type === 'Identifier'
          ) {
            const matched = declaredComponents.find(
              (name) => name === spec.local.name,
            )
            if (matched) {
              hotComponents.push({
                local: spec.local.name,
                exported: spec.exported.name,
                id: getHash(id + spec.exported.name),
              })
            }
          }
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration.type === 'Identifier') {
        const _name = node.declaration.name
        const matched = declaredComponents.find((name) => name === _name)
        if (matched) {
          hotComponents.push({
            local: _name,
            exported: 'default',
            id: getHash(`${id}default`),
          })
        }
      } else if (isDefineComponentCall(node.declaration, defineComponentName)) {
        defaultName = (node.declaration.callee as any).name
        hotComponents.push({
          local: '__default__',
          exported: 'default',
          id: getHash(`${id}default`),
        })
      }
    }
  }

  if (hotComponents.length) {
    if (defaultName || ssr) {
      result.code = `${result.code!.replaceAll(
        `export default ${defaultName}`,
        `const __default__ = ${defaultName}`,
      )}\nexport default __default__`
    }

    if (!ssr && !/\?vue&type=script/.test(id)) {
      let code = result.code
      let callbackCode = ``
      for (const { local, exported, id } of hotComponents) {
        code +=
          `\n${local}.__hmrId = "${id}"` +
          `\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`
        callbackCode += `
    if (mod._rerender_only) {
      __VUE_HMR_RUNTIME__.rerender(mod['${exported}'].__hmrId, mod['${exported}'].setup)
    } else {
      __VUE_HMR_RUNTIME__.reload(mod['${exported}'].__hmrId, mod['${exported}'])
    }`
      }

      code += `\nexport const _rerender_only = __VUE_HMR_RUNTIME__.CHANGED_FILE === ${JSON.stringify(normalizePath(id))}`
      code += `
if (import.meta.hot) {
  import.meta.hot.on('file-changed', ({ file }) => {
    __VUE_HMR_RUNTIME__.CHANGED_FILE = file
  })
  import.meta.hot.accept((mod) => {${callbackCode}\n})
}`
      result.code = code
    }

    // if (ssr) {
    //   const normalizedId = normalizePath(path.relative(root, id))
    //   let ssrInjectCode =
    //     `\nimport { ssrRegisterHelper } from "${ssrRegisterHelperId}"` +
    //     `\nconst __moduleId = ${JSON.stringify(normalizedId)}`
    //   for (const { local } of hotComponents) {
    //     ssrInjectCode += `\nssrRegisterHelper(${local}, __moduleId)`
    //   }
    //   result.code += ssrInjectCode
    // }
  }
}

function parseComponentDecls(
  node: types.VariableDeclaration,
  fnNames: string[],
) {
  const names = []
  for (const decl of node.declarations) {
    if (
      decl.id.type === 'Identifier' &&
      isDefineComponentCall(decl.init, fnNames)
    ) {
      names.push(decl.id.name)
    }
  }
  return names
}

function isDefineComponentCall(
  node: types.Node | null | undefined,
  names: string[],
): node is types.CallExpression {
  return !!(
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    names.includes(node.callee.name)
  )
}
