import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export function createRuntimeLoader(overrides = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const require = createRequire(import.meta.url)
  const cache = new Map()
  function load(filename) {
    let path = resolve(root, filename)
    if (path.endsWith('.css')) return {}
    if (!/\.tsx?$/.test(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : existsSync(`${path}.tsx`) ? `${path}.tsx` : join(path, 'index.ts')
    if (cache.has(path)) return cache.get(path).exports
    const module = { exports: {} }
    cache.set(path, module)
    const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
      fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    })
    new Function('require', 'module', 'exports', outputText)((specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier]
      return specifier.startsWith('.') ? load(resolve(dirname(path), specifier)) : require(specifier)
    }, module, module.exports)
    return module.exports
  }
  return load
}
