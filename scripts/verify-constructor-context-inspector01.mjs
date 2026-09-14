import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Run the actual component and its effects with a small deterministic hook host.
// Browser layout, pointer dragging and screenshots are checked separately.
const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const cache = new Map()
let host
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
const hooks = {
  useState(initial) {
    const h = host, i = h.index++
    if (!(i in h.slots)) h.slots[i] = typeof initial === 'function' ? initial() : initial
    return [h.slots[i], (next) => {
      // React may evaluate functional updaters after the event handler finishes.
      h.pending.push(() => {
        const value = typeof next === 'function' ? next(h.slots[i]) : next
        if (!Object.is(value, h.slots[i])) { h.slots[i] = value; h.dirty = true }
      })
    }]
  },
  useRef(initial) {
    const i = host.index++
    return host.slots[i] ??= { current: initial }
  },
  useMemo(fn, deps) {
    const i = host.index++, previous = host.slots[i]
    if (!previous || !same(previous.deps, deps)) host.slots[i] = { deps, value: fn() }
    return host.slots[i].value
  },
  useEffect(fn, deps) {
    const i = host.index++
    if (!same(host.slots[i], deps)) { host.slots[i] = deps; host.effects.push(fn) }
  },
}
const windowStub = { requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {} }
function load(filename) {
  let path = resolve(root, filename)
  if (path.endsWith('.css')) return {}
  if (!/\.tsx?$/.test(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : join(path, 'index.ts')
  if (cache.has(path)) return cache.get(path)
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'window', outputText)((name) =>
    name === 'react' ? hooks : name.startsWith('.') ? load(resolve(dirname(path), name)) : require(name), module, module.exports, windowStub)
  cache.set(path, module.exports)
  return module.exports
}
const domain = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const { kmgPrelude60: system } = load('src/data/profileSystems')
const Shell = load('src/components/ConstructorShell.tsx').default
const frame = { xMm: 0, yMm: 0, widthMm: 1800, heightMm: 1500 }
let model = domain.createConstructionModel(frame)
model = domain.splitField(model, domain.resolveConstructionTopology(model).fields[0].id, 'vertical', 800)
const initialDraft = { version: 'constructor-01d', frame, topology: model }
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}
function text(tree) {
  if (tree === null || tree === undefined || typeof tree === 'boolean') return ''
  if (Array.isArray(tree)) return tree.map(text).join(' ')
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree)
}
function fixture(mode = 'free', draft = initialDraft) {
  const h = { slots: [], index: 0, effects: [], pending: [], dirty: true, tree: null, writes: 0 }
  const props = {
    mode, moduleNumber: 1, activeModuleId: 'module-test', moduleItems: [{ id: 'module-test', sequence: 1 }],
    initialDraft: draft, freeProfileSystemId: system.id,
    offerContext: { profileSystemId: system.id, profileSystemLabel: 'PRELUDE 60' },
    moduleSummary: { productType: 'window', widthMm: 1800, heightMm: 1500 },
    profileResolution: profiles.createModuleProfileResolution(system.id),
    onClose() {}, onSelectModule() {}, onFreeProfileSystemChange() {},
    onDraftChange(value) { h.writes++; h.draft = value },
    onModuleSizeChange() { h.writes++ }, onFieldTopologyChange() { h.writes++ },
    onProfileResolutionChange(value) { h.writes++; props.profileResolution = value; h.dirty = true },
  }
  h.render = () => {
    for (let i = 0; i < 12; i++) {
      host = h; h.index = 0; h.effects = []; h.dirty = false
      h.pending.splice(0).forEach(apply => apply())
      h.tree = Shell(props)
      h.effects.forEach(fn => fn())
      if (!h.dirty && h.pending.length === 0) return
    }
    throw new Error('Effects did not settle')
  }
  h.find = (test, tree = h.tree) => { const found = nodes(tree).find(test); assert.ok(found, 'Expected control exists'); return found }
  h.inspector = () => h.find(n => n.type === 'aside' && n.props['data-context'])
  h.context = () => h.inspector().props['data-context']
  h.click = (label) => {
    const button = h.find(n => n.type === 'button' && (n.props['aria-label'] === label || text(n).trim().replace(/\s+/g, ' ') === label))
    const event = { stopPropagation() {}, preventDefault() {}, clientX: 0, clientY: 0, pointerId: 1, currentTarget: { setPointerCapture() {} } }
    ;(button.props.onClick ?? button.props.onPointerDown)(event)
    h.render()
  }
  h.render()
  return h
}

for (const mode of ['free', 'offer']) {
  const h = fixture(mode)
  assert.equal(h.context(), 'module')
  assert.match(text(h.inspector()), /Профилна система/)
  const baseline = h.writes
  for (let i = 0; i < 3; i++) {
    h.click('Поле 1')
    assert.equal(h.context(), 'field')
    assert.doesNotMatch(text(h.inspector()), /ТИП МОДУЛ|ПРОФИЛ НА КАСАТА/)
    h.click('Вертикален делител на поле')
    assert.equal(h.context(), 'divider')
    assert.doesNotMatch(text(h.inspector()), /Стъклопакет|тип на полето|дебелина на стъклопакета/)
    h.click('Поле 2')
    assert.match(text(h.inspector()), /Поле 2/)
    h.click('Модул 1')
    assert.equal(h.context(), 'module')
  }
  assert.equal(h.writes, baseline, 'Selection and module-context navigation do not publish saved data')
  h.click('Поле 1'); h.click('Отваряемо / крило'); h.click('Странично + падащо'); h.click('Ляво')
  assert.equal(domain.resolveConstructionTopology(h.draft.topology).fields[0].openingHanding, 'left')
  h.click('↶ Отмени')
  assert.equal(domain.resolveConstructionTopology(h.draft.topology).fields[0].openingHanding, null)
  h.click('↷ Повтори')
  assert.equal(domain.resolveConstructionTopology(h.draft.topology).fields[0].openingHanding, 'left')
  h.click('Поле 2'); h.click('Фиксирано')
  const result = domain.resolveConstructionTopology(h.draft.topology)
  assert.equal(result.fields[0].fieldType, 'operable')
  assert.equal(result.fields[1].fieldType, 'fixed')
  h.click('Стъклопакет')
  assert.ok(h.find(n => n.props?.['aria-label'] === 'Дебелина на стъклопакета за избраното поле', h.inspector()))
  assert.doesNotMatch(text(h.inspector()), /MISSING|UNCONFIRMED|FIELD|RESOLVED|source=/)
  console.log(`PASS ${mode}: module → field → divider → field → module; selection-only writes = 0; opening; undo/redo; field isolation`)
}
console.log('CONSTRUCTOR CONTEXT INSPECTOR 01: PASS')
