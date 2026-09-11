import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Run the real App state handlers and ConstructorShell render functions with a
// deterministic in-memory hook host. Browser effects/layout are not simulated.
const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
let host
const react = {
  ...require('react'),
  useState(initial) {
    const current = host
    const index = current.index++
    if (!(index in current.values)) current.values[index] = typeof initial === 'function' ? initial() : initial
    return [current.values[index], (next) => {
      current.values[index] = typeof next === 'function' ? next(current.values[index]) : next
    }]
  },
  useMemo: (compute) => compute(),
  useRef: (initial) => react.useState(() => ({ current: initial }))[0],
  useEffect: () => {},
}
const cache = new Map()
function load(filename) {
  let path = resolve(root, filename)
  if (path.endsWith('.css')) return {}
  if (!/\.tsx?$/.test(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : existsSync(`${path}.tsx`) ? `${path}.tsx` : join(path, 'index.ts')
  if (cache.has(path)) return cache.get(path).exports
  const module = { exports: {} }
  cache.set(path, module)
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  new Function('require', 'module', 'exports', outputText)((specifier) => {
    if (specifier === 'react') return react
    return specifier.startsWith('.') ? load(resolve(dirname(path), specifier)) : require(specifier)
  }, module, module.exports)
  return module.exports
}
function mount(component, props = {}) {
  const hooks = { values: [], index: 0 }
  return (nextProps = props) => {
    host = hooks
    hooks.index = 0
    return component(nextProps)
  }
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  const children = [tree.props?.children].flat(Infinity)
  return [...(predicate(tree) ? [tree] : []), ...children.flatMap((child) => nodes(child, predicate))]
}
const text = (tree) => typeof tree === 'string' || typeof tree === 'number' ? String(tree)
  : [tree?.props?.children].flat(Infinity).map((child) => child == null || typeof child === 'boolean' ? '' : text(child)).join('')
function button(tree, label) {
  const match = nodes(tree, (node) => node.type === 'button' && text(node).includes(label))[0]
  assert.ok(match, `button ${label}`)
  return match
}
const App = load('src/App.tsx').default
const Shell = load('src/components/ConstructorShell.tsx').default
const catalog = load('src/data/profileSystems')
const profiles = load('src/domain/profileResolution')
const construction = load('src/domain/construction')
const prelude = catalog.getProfileSystemById('kmg-prelude-60')
const otherSystem = catalog.getSelectableProfileSystems().find((system) => system.id !== prelude.id)
assert.ok(otherSystem, 'system-change fixture from central selectable catalogue')
const renderApp = mount(App)
let appTree = renderApp()
button(appTree, 'Свободна скица · без оферта').props.onClick()
function active() {
  appTree = renderApp()
  const shell = nodes(appTree, (node) => node.type === Shell)[0]
  assert.ok(shell, 'shared ConstructorShell mounted')
  return shell.props
}
let passed = 0
function test(name, action) {
  action()
  passed++
  console.log(`PASS ${name}`)
}
const clean = (resolution, systemId) => assert.deepEqual(resolution, profiles.createModuleProfileResolution(systemId))
test('first free module is neutral, no default system or product type', () => {
  active().onCreateModule()
  assert.equal(active().freeProfileSystemId, '')
  assert.equal(active().profileResolution, null)
  assert.equal(active().moduleSummary.productType, null)
  assert.equal(active().offerContext, undefined)
})
const firstId = active().activeModuleId
test('human system select uses catalogue and enables clean resolution without offer', () => {
  const render = mount(Shell, active())
  const tree = render()
  const select = nodes(tree, (node) => node.type === 'select' && node.props.value === '')[0]
  assert.ok(select)
  const options = nodes(select, (node) => node.type === 'option')
  assert.deepEqual(options.map((option) => option.props.value), ['', ...catalog.getSelectableProfileSystems().map((system) => system.id)])
  assert.equal(text(options.find((option) => option.props.value === prelude.id)), `${prelude.manufacturer} ${prelude.name}`)
  select.props.onChange({ target: { value: prelude.id } })
  clean(active().profileResolution, prelude.id)
})
let model = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1800, heightMm: 1600 })
model = construction.splitField(model, 'field-1', 'vertical', 650)
for (const field of construction.resolveConstructionTopology(model).fields) model = construction.setConstructionFieldType(model, field.id, 'operable')
const draft = { version: 'constructor-01d', frame: model.frame, topology: model }
const sketchBefore = JSON.stringify(draft)
active().onDraftChange(draft)
test('existing product-type callback works in free Context card', () => {
  const tree = mount(Shell, active())()
  button(tree, 'Прозорец').props.onClick()
  assert.equal(active().moduleSummary.productType, 'window')
})
const topo = construction.resolveConstructionTopology(model)
test('frame, divider, WINDOW sash candidates and assignments use existing engine', () => {
  assert.ok(profiles.getFrameProfileCandidates(prelude).some((profile) => profile.code === '482.30'))
  assert.ok(profiles.getDividerProfileCandidates(prelude).some((profile) => profile.code === '482.21'))
  assert.ok(profiles.getFieldSashProfileCandidates(prelude, 'window', 'operable').some((profile) => profile.code === '482.05'))
  let resolution = profiles.setFrameProfileAssignment(active().profileResolution, prelude, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, prelude, topo.dividers[0].id, '482.21')
  for (const field of topo.fields) resolution = profiles.setFieldSashProfileAssignment(resolution, prelude, 'window', field, '482.05')
  active().onProfileResolutionChange(resolution)
  assert.equal(active().profileResolution.frame.profileCode, '482.30')
  assert.equal(Object.keys(active().profileResolution.fieldSashes).length, 2)
})
const approvedResolution = active().profileResolution
test('free Profile pane, badges and reviewed placement render without offerContext; OFF falls back', () => {
  const render = mount(Shell, active())
  let tree = render()
  assert.equal(nodes(tree, (node) => node.props?.className === 'constructor-reviewed-sash-placement').length, 2)
  assert.ok(nodes(tree, (node) => node.props?.className === 'constructor-inspector-component-progress').length)
  assert.match(text(tree), /КРИЛА 2\/2/)
  button(tree, 'Профил').props.onClick()
  tree = render()
  assert.doesNotMatch(text(nodes(tree, (node) => node.props?.role === 'tabpanel')[0]), /Профилна система не е избрана/)
  const hasOption = (value) => nodes(tree, (node) => node.type === 'option' && node.props.value === value).length > 0
  assert.ok(hasOption('482.05'), 'OPERABLE WINDOW sash option in actual Profile pane')
  nodes(tree, (node) => node.type === 'button' && node.props.className?.startsWith('constructor-divider is-local'))[0].props.onClick({ stopPropagation() {} })
  tree = render()
  assert.ok(hasOption('482.21'), 'normal divider catalogue option in actual Profile pane')
  nodes(tree, (node) => node.props.className?.startsWith('constructor-parametric-frame'))[0].props.onPointerDown({ stopPropagation() {} })
  tree = render()
  assert.ok(hasOption('482.30'), 'frame catalogue option in actual Profile pane')
  const view = button(tree, 'Profile View')
  assert.equal(view.props.disabled, false)
  view.props.onClick()
  tree = render()
  assert.equal(nodes(tree, (node) => node.props?.className === 'constructor-reviewed-sash-placement').length, 0)
})
test('WINDOW to DOOR clears incompatible sash; DOOR candidates use door-sash; CLEAR unresolved', () => {
  active().onModuleProductTypeChange('door')
  assert.deepEqual(active().profileResolution.fieldSashes, {})
  assert.equal(active().profileResolution.frame.profileCode, '482.30')
  const doorCandidates = profiles.getFieldSashProfileCandidates(prelude, 'door', 'operable')
  assert.ok(doorCandidates.length > 0)
  assert.ok(doorCandidates.every((profile) => profile.role === 'door-sash'))
  assert.equal(profiles.getFieldSashRole('door', 'operable'), 'door-sash')
  active().onModuleProductTypeChange(null)
  assert.deepEqual(profiles.getFieldSashProfileCandidates(prelude, null, 'operable'), [])
  assert.equal(active().moduleSummary.productType, null)
  active().onModuleProductTypeChange('window')
  active().onProfileResolutionChange(approvedResolution)
})
test('new module inherits only system, clean resolution, null type and empty sketch', () => {
  active().onCreateModule()
  assert.equal(active().freeProfileSystemId, prelude.id)
  clean(active().profileResolution, prelude.id)
  assert.equal(active().initialDraft, null)
  assert.equal(active().moduleSummary.productType, null)
})
const secondId = active().activeModuleId
test('module switch restores independent system, type, assignments and sketch', () => {
  active().onFreeProfileSystemChange(otherSystem.id)
  active().onModuleProductTypeChange('door')
  active().onSelectModule(firstId)
  assert.equal(active().freeProfileSystemId, prelude.id)
  assert.equal(active().moduleSummary.productType, 'window')
  assert.deepEqual(active().profileResolution, approvedResolution)
  assert.strictEqual(active().initialDraft, draft)
  active().onSelectModule(secondId)
  assert.equal(active().freeProfileSystemId, otherSystem.id)
  assert.equal(active().moduleSummary.productType, 'door')
  assert.equal(active().initialDraft, null)
  active().onSelectModule(firstId)
})
test('system change and clear remove assignments without changing topology', () => {
  active().onFreeProfileSystemChange(otherSystem.id)
  clean(active().profileResolution, otherSystem.id)
  assert.strictEqual(active().initialDraft, draft)
  active().onFreeProfileSystemChange('')
  assert.equal(active().profileResolution, null)
  assert.equal(active().freeProfileSystemId, '')
  assert.equal(JSON.stringify(active().initialDraft), sketchBefore)
  active().onFreeProfileSystemChange(prelude.id)
  clean(active().profileResolution, prelude.id)
})
test('reset affects only active sketch, keeps system and clears profile assignments', () => {
  active().onProfileResolutionChange(approvedResolution)
  active().onResetModule()
  assert.equal(active().initialDraft, null)
  assert.equal(active().freeProfileSystemId, prelude.id)
  clean(active().profileResolution, prelude.id)
  active().onSelectModule(secondId)
  assert.equal(active().freeProfileSystemId, otherSystem.id)
  assert.equal(active().moduleSummary.productType, 'door')
  active().onSelectModule(firstId)
  active().onDraftChange(draft)
})
for (const systemId of [prelude.id, '']) {
  test(`offer transfer: ${systemId || 'neutral'} only; other commercial selections empty`, () => {
    active().onFreeProfileSystemChange(systemId)
    active().onCreateOfferFromSketch(draft)
    appTree = renderApp()
    const radios = nodes(appTree, (node) => node.type === 'input' && node.props.name === 'profileSystemId')
    assert.equal(radios.filter((node) => node.props.checked).length, systemId ? 1 : 0)
    if (systemId) assert.equal(radios.find((node) => node.props.checked).props.value, systemId)
    for (const name of ['colorId', 'foilModeId', 'glazingId', 'hardwareStandardId']) {
      assert.ok(nodes(appTree, (node) => node.type === 'input' && node.props.name === name).every((node) => !node.props.checked))
    }
    // Inspect real App state as controls can be gated until client/object input.
    const offer = host.values.find((value) => value && 'clientName' in Object(value))
    assert.equal(offer.profileSystemId, systemId)
    for (const name of ['colorId', 'foilModeId', 'glazingId', 'hardwareStandardId', 'clientName', 'objectName']) assert.equal(offer[name], '')
    button(appTree, 'Свободна скица · без оферта').props.onClick()
  })
}
assert.equal(JSON.stringify(draft), sketchBefore)
console.log(`FREE CONSTRUCTOR PROFILE CONTEXT 01 RUNTIME PASS: ${passed} cases`)
