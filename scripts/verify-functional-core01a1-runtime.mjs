import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const { LocalProjectStorage } = load('src/persistence/localProjectStorage')
const system = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const choices = {
  profileSystemId: system.id, colorId: 'anthracite', foilModeId: 'both-sides',
  glazingId: 'b-b-24', hardwareStandardId: 'standard-european', hardwareManufacturerId: 'unspecified',
}
let sequence = 0
const id = () => `fc01a1-${++sequence}`
class MemoryStorage {
  data = new Map()
  writes = 0
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.writes++; this.data.set(key, value) }
}
const nodes = tree => !tree || typeof tree !== 'object' ? []
  : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]

// Execute App and the actual workspace hook, including persistence effects.
// Child components remain React elements so this test invokes App's real callbacks.
function mount(snapshot) {
  const memory = new MemoryStorage()
  new LocalProjectStorage(() => memory).save(snapshot)
  const h = { values: [], index: 0, effects: [], dirty: true, memory }
  const react = {
    useState(initial) {
      const index = h.index++
      if (!(index in h.values)) h.values[index] = typeof initial === 'function' ? initial() : initial
      return [h.values[index], update => {
        const value = typeof update === 'function' ? update(h.values[index]) : update
        if (!Object.is(value, h.values[index])) { h.values[index] = value; h.dirty = true }
      }]
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0] },
    useEffect(effect, deps) {
      const index = h.index++, previous = h.values[index]
      if (!previous || deps.some((value, i) => !Object.is(value, previous[i]))) {
        h.values[index] = deps; h.effects.push(effect)
      }
    },
  }
  const runtime = createRuntimeLoader({ react })
  const App = runtime('src/App.tsx').default
  h.render = () => {
    globalThis.window = { localStorage: memory }
    for (let i = 0; i < 30; i++) {
      h.index = 0; h.effects = []; h.dirty = false
      h.tree = App()
      h.effects.forEach(effect => effect())
      if (!h.dirty) return
    }
    throw new Error('App did not settle')
  }
  h.find = predicate => {
    const node = nodes(h.tree).find(predicate)
    assert.ok(node, 'Expected App control exists')
    return node
  }
  h.control = name => h.find(n => ['input', 'select'].includes(n.type) && n.props.name === name)
  h.snapshot = () => new LocalProjectStorage(() => memory).load()
  h.change = (name, value) => {
    const control = h.control(name)
    assert.equal(control.props.disabled, false, `${name} can be completed`)
    control.props.onChange({ target: { value } }); h.render()
  }
  h.submit = () => {
    const button = h.find(n => n.type === 'button' && n.props.type === 'submit')
    assert.equal(button.props.disabled, false, 'Offer can continue')
    h.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); h.render()
  }
  h.render()
  return h
}
function freeFixture(withSystem) {
  let snapshot = model.createProjectSnapshot(id)
  let topology = construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1500 })
  topology = construction.splitField(topology, 'field-1', 'vertical', 800)
  const initial = construction.resolveConstructionTopology(topology)
  topology = construction.setConstructionFieldType(topology, initial.fields[0].id, 'fixed')
  topology = construction.setConstructionFieldType(topology, initial.fields[1].id, 'operable')
  topology = construction.setConstructionFieldOpeningMode(topology, initial.fields[1].id, 'tilt-turn')
  topology = construction.setConstructionFieldOpeningHanding(topology, initial.fields[1].id, 'left')
  const resolved = construction.resolveConstructionTopology(topology)
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', resolved.fields[1], '482.05')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, resolved.fields[0], 24)
  resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, resolved.fields[0], 24, '482.15')
  const sourceId = id(), draft = { version: 'constructor-01d', frame: topology.frame, topology }
  snapshot = ops.editProject(snapshot, next => {
    next.project.client.clientName = 'Regression client'; next.project.site.objectName = 'Regression site'
    ops.replaceFreeModules(next, [{ id: sourceId, sequence: 1, profileSystemId: withSystem ? system.id : '', productType: 'window', profileResolution: withSystem ? resolution : null }])
    next.constructionDraftsByModuleId[sourceId] = draft
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = sourceId
    next.workspace.screen = 'free-constructor'
  })
  return { snapshot, sourceId, draft }
}
function assertLocked(h) {
  const before = codec.serializeProject(h.snapshot()), writes = h.memory.writes
  for (const name of Object.keys(choices)) {
    const control = h.control(name)
    assert.equal(control.props.disabled, true, `${name} is visibly disabled`)
    // Invoke despite disabled UI to verify that callbacks guard before mutation.
    control.props.onChange({ target: { value: 'blocked-change' } }); h.render()
  }
  assert.equal(codec.serializeProject(h.snapshot()), before)
  assert.equal(h.memory.writes, writes, 'Blocked callbacks cause zero storage writes')
  const client = h.find(n => n.type === 'input' && n.props.value === 'Regression client')
  client.props.onChange({ target: { value: 'Edited client' } }); h.render()
  for (const name of Object.keys(choices)) assert.equal(h.control(name).props.disabled, true, 'Metadata edits never unlock technical defaults')
}
const previousWindow = globalThis.window
try {
  for (const withSystem of [true, false]) {
    const fixture = freeFixture(withSystem), h = mount(fixture.snapshot)
    h.find(n => n.props?.mode === 'free').props.onCreateOfferFromSketch(fixture.draft); h.render()
    const copied = h.snapshot(), targetId = model.getEditingOffer(copied).pendingCopyModuleId
    assert.ok(targetId); assert.notEqual(targetId, fixture.sourceId)
    for (const [name, value] of Object.entries(choices)) {
      h.change(name, value)
      const current = h.snapshot()
      assert.equal(model.getOfferModules(current)[0].id, targetId, 'Copied module is never deleted or recreated')
      assert.deepEqual(current.constructionDraftsByModuleId, copied.constructionDraftsByModuleId)
      assert.deepEqual(current.profileResolutionsByModuleId, copied.profileResolutionsByModuleId)
    }
    h.submit()
    const configured = h.snapshot()
    assert.equal(model.getEditingOffer(configured).pendingCopyModuleId, null)
    assert.equal(model.getEditingOffer(configured).setupStage, 'modules')
    assert.equal(model.getOfferModules(configured)[0].id, targetId)
    assert.deepEqual(configured.constructionDraftsByModuleId, copied.constructionDraftsByModuleId)
    assert.deepEqual(configured.profileResolutionsByModuleId[fixture.sourceId], copied.profileResolutionsByModuleId[fixture.sourceId])
    if (withSystem) assert.deepEqual(configured.profileResolutionsByModuleId[targetId], copied.profileResolutionsByModuleId[targetId])
    else assert.deepEqual(configured.profileResolutionsByModuleId[targetId], profiles.createModuleProfileResolution(system.id))
    assertLocked(h)
    console.log(`PASS Free → Offer (${withSystem ? 'selected profiles/glazing' : 'no initial system'}): completion, identities and selections preserved, then locked`)
  }
  let snapshot = model.createProjectSnapshot(id)
  snapshot = ops.editProject(snapshot, next => {
    next.project.client.clientName = 'Regression client'; next.project.site.objectName = 'Regression site'
    next.workspace.screen = 'offer-setup'
  })
  const normal = mount(snapshot)
  for (const [name, value] of Object.entries(choices)) normal.change(name, value)
  normal.submit()
  assert.equal(model.getOfferModules(normal.snapshot()).length, 1)
  assertLocked(normal)
  console.log('PASS normal Offer → Module 1: six technical controls locked; callbacks cause zero mutations')
} finally {
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
}

// Exercise every key on App's real generic setter, including keys normally
// routed through the specialized profile/finish/hardware callbacks.
const source = ts.createSourceFile('App.tsx', readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let setter
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'updateOffer') setter = node.initializer.getText(source)
  ts.forEachChild(node, visit)
}
visit(source); assert.ok(setter)
const setterCode = ts.transpileModule(`const updateOffer = ${setter}; return updateOffer`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
let mutations = 0
const mutate = () => { mutations++ }
const update = new Function('offerDefaultsLocked', 'setOffer', 'setSaved', 'workspace', setterCode)(true, mutate, mutate, { clearConfiguredModules: mutate })
for (const name of Object.keys(choices)) update(name, 'blocked-change')
assert.equal(mutations, 0, 'Generic setter protects all six fields before any mutation')
console.log('FUNCTIONAL CORE 01A.1 RUNTIME PASS')
