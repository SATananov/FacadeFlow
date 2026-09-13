import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const persistence = load('src/persistence/localProjectStorage')
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const glazing = load('src/domain/glazingContext')
const system = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const moduleFactory = load('src/domain/offerModules').createOfferModule
const defaultsFactory = load('src/domain/offerModuleDefaults').buildOfferModuleDefaults
let counter = 0, passed = 0
const idFactory = () => `test-stable-${++counter}`
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }

function fixture() {
  let snapshot = model.createProjectSnapshot(idFactory)
  let topology = construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1400 })
  topology = construction.splitField(topology, 'field-1', 'vertical', 700)
  let fields = construction.resolveConstructionTopology(topology).fields
  topology = construction.setConstructionFieldType(topology, fields[0].id, 'fixed')
  topology = construction.setConstructionFieldType(topology, fields[1].id, 'operable')
  fields = construction.resolveConstructionTopology(topology).fields
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  const divider = construction.resolveConstructionTopology(topology).dividers[0]
  resolution = profiles.setDividerProfileAssignment(resolution, system, divider.id, '482.21')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', fields[1], '482.05')
  resolution = profiles.setReinforcementAssignment(resolution, system, { kind: 'frame', id: 'frame' }, '482.30', 'TRE 13', 1.2)
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, fields[0], 24)
  resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, fields[0], 24, '482.15')
  const moduleId = idFactory()
  const draft = { version: 'constructor-01d', frame: topology.frame, topology }
  snapshot = ops.editProject(snapshot, (next) => {
    ops.writeOfferForm(next, { ...model.EMPTY_OFFER, clientName: 'Fixture client', clientEmail: 'test@example.invalid',
      objectName: 'Fixture site', objectAddress: 'Site address', profileSystemId: system.id,
      colorId: 'anthracite', foilModeId: 'both-sides', glazingId: 'b-b-24', hardwareStandardId: 'standard-european', commonConditions: 'Test conditions' })
    ops.replaceFreeModules(next, [{ id: moduleId, sequence: 1, profileSystemId: system.id, productType: 'window', profileResolution: resolution }])
    next.constructionDraftsByModuleId[moduleId] = draft
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = moduleId
    next.workspace.screen = 'free-constructor'
  })
  codec.validateProjectSnapshot(snapshot)
  return { snapshot, moduleId, draft, resolution, fields }
}

class MemoryStorage {
  data = new Map(); writes = []; failRead = false; failWrite = false
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(key) { if (this.failRead) throw Error('access denied'); return this.data.get(key) ?? null }
  setItem(key, value) { if (this.failWrite) throw Error('quota exceeded'); this.writes.push([key, value]); this.data.set(key, value) }
}
function storageFixture(snapshot) {
  const memory = new MemoryStorage()
  const adapter = new persistence.LocalProjectStorage(() => memory)
  if (snapshot) adapter.save(snapshot)
  memory.writes = []
  return { memory, adapter }
}

test('stable Project / Offer / Module IDs, same numbering is not identity', () => {
  const a = fixture(), b = fixture()
  const ids = [a.snapshot.project.id, ...Object.keys(a.snapshot.offersById), a.moduleId,
    b.snapshot.project.id, ...Object.keys(b.snapshot.offersById), b.moduleId]
  assert.equal(new Set(ids).size, ids.length)
  const defaults = defaultsFactory(model.EMPTY_OFFER)
  assert.notEqual(moduleFactory(defaults, 1).id, moduleFactory(defaults, 1).id)
  const renamed = ops.editProject(a.snapshot, (next) => { next.modulesById[a.moduleId].sequence = 17 })
  assert.equal(renamed.modulesById[a.moduleId].id, a.moduleId)
  assert.deepEqual(renamed.constructionDraftsByModuleId, a.snapshot.constructionDraftsByModuleId)
  codec.validateProjectSnapshot(renamed)
})
test('round trip restores metadata, workspace, topology, profile, reinforcement and glazing', () => {
  const { snapshot, moduleId, draft, resolution } = fixture()
  const restored = codec.deserializeProject(codec.serializeProject(snapshot))
  assert.deepEqual(restored, snapshot)
  assert.deepEqual(restored.constructionDraftsByModuleId[moduleId], draft)
  assert.deepEqual(restored.profileResolutionsByModuleId[moduleId], resolution)
  assert.equal(restored.profileResolutionsByModuleId[moduleId].reinforcements['frame:frame'].reinforcementCode, 'TRE 13')
  assert.equal(model.getOfferForm(restored).objectAddress, 'Site address')
  assert.equal(restored.workspace.screen, 'free-constructor')
})
for (const [name, corrupt] of [
  ['offer ownership', (s) => { model.getEditingOffer(s).projectId = 'missing' }],
  ['module ownership', (s) => { Object.values(s.modulesById)[0].offerId = 'missing' }],
  ['payload owner', (s) => { s.constructionDraftsByModuleId.orphan = null }],
  ['selection', (s) => { s.workspace.activeModuleIdByOffer[s.workspace.freeOfferId] = 'missing' }],
  ['missing payload', (s) => { delete s.profileResolutionsByModuleId[Object.keys(s.modulesById)[0]] }],
  ['duplicate identity', (s) => { const key = Object.keys(s.modulesById)[0]; s.modulesById[key].id = s.project.id }],
  ['FIELD reference', (s) => { Object.values(s.profileResolutionsByModuleId)[0].fieldGlazingThicknesses.absent = { thicknessMm: 24, source: 'human' } }],
  ['nested invalid topology', (s) => { Object.values(s.constructionDraftsByModuleId)[0].topology.root.first.field.fieldType = 'invented' }],
  ['nested missing profile data', (s) => { delete Object.values(s.profileResolutionsByModuleId)[0].fieldGlazingThicknesses }],
  ['free commercial fields', (s) => { s.offersById[s.workspace.freeOfferId].pricing = {} }],
  ['unsafe keys', (s) => { s.modulesById.constructor = {} }],
]) test(`reject ${name}`, () => {
  const snapshot = fixture().snapshot
  corrupt(snapshot)
  assert.throws(() => codec.deserializeProject(JSON.stringify(snapshot)))
})
test('module isolation and reordering preserve local FIELD identities', () => {
  const { snapshot, moduleId } = fixture()
  const second = idFactory()
  const updated = ops.editProject(snapshot, (next) => {
    ops.replaceFreeModules(next, [...model.getFreeModules(next), { id: second, sequence: 2, profileSystemId: '', productType: null, profileResolution: null }])
    next.modulesById[moduleId].sequence = 2; next.modulesById[second].sequence = 1
  })
  assert.deepEqual(updated.constructionDraftsByModuleId[moduleId], snapshot.constructionDraftsByModuleId[moduleId])
  assert.deepEqual(updated.profileResolutionsByModuleId[moduleId], snapshot.profileResolutionsByModuleId[moduleId])
  assert.equal(model.getFreeModules(updated)[0].id, second)
  codec.validateProjectSnapshot(updated)
})
test('Free → Offer atomically copies technical state, keeps source and all identities independent', () => {
  const { snapshot, moduleId, draft, resolution } = fixture()
  const before = structuredClone(snapshot)
  const copied = ops.copyFreeModuleToOffer(snapshot, moduleId, draft, idFactory)
  codec.validateProjectSnapshot(copied)
  const target = model.getOfferModules(copied)[0]
  assert.notEqual(target.id, moduleId)
  assert.notEqual(copied.workspace.offerId, snapshot.workspace.offerId)
  assert.deepEqual(copied.profileResolutionsByModuleId[target.id], resolution)
  assert.deepEqual(copied.constructionDraftsByModuleId[target.id], draft)
  assert.notEqual(copied.constructionDraftsByModuleId[target.id], copied.constructionDraftsByModuleId[moduleId])
  assert.notEqual(copied.profileResolutionsByModuleId[target.id], copied.profileResolutionsByModuleId[moduleId])
  assert.equal(target.widthMm, draft.frame.widthMm)
  assert.equal(target.fields.length, 2)
  assert.equal(copied.modulesById[target.id].definition.draft.fields.length, 0, 'no persisted derived FIELD duplicate')
  assert.deepEqual(snapshot, before)
  const restored = codec.deserializeProject(codec.serializeProject(copied))
  ops.clearConfiguredModules(restored)
  assert.equal(model.getOfferModules(restored)[0].id, target.id, 'pending copy survives offer settings entry')
  const completed = ops.completeOfferSetup(restored, idFactory)
  assert.deepEqual(completed.profileResolutionsByModuleId[target.id], resolution)
  assert.deepEqual(completed.constructionDraftsByModuleId[moduleId], draft)
  assert.equal(model.getEditingOffer(completed).pendingCopyModuleId, null)
})
test('copied Offer mutation stays independent from the original Free module after reload', () => {
  const { snapshot, moduleId, draft, resolution } = fixture()
  const copied = ops.copyFreeModuleToOffer(snapshot, moduleId, draft, idFactory)
  const target = model.getOfferModules(copied)[0].id
  const changed = ops.editProject(copied, (next) => {
    next.constructionDraftsByModuleId[target] = null
    next.profileResolutionsByModuleId[target] = null
  })
  assert.deepEqual(changed.constructionDraftsByModuleId[moduleId], draft)
  assert.deepEqual(changed.profileResolutionsByModuleId[moduleId], resolution)
  assert.equal(changed.constructionDraftsByModuleId[target], null)
  assert.equal(changed.profileResolutionsByModuleId[target], null)
  const restored = codec.deserializeProject(codec.serializeProject(changed))
  assert.deepEqual(restored.constructionDraftsByModuleId[moduleId], draft)
  assert.deepEqual(restored.profileResolutionsByModuleId[moduleId], resolution)
  assert.equal(restored.constructionDraftsByModuleId[target], null)
  assert.equal(restored.profileResolutionsByModuleId[target], null)
})
test('copied assignments use existing system reconciliation on explicit offer setup', () => {
  const { snapshot, moduleId, draft } = fixture()
  let copied = ops.copyFreeModuleToOffer(snapshot, moduleId, draft, idFactory)
  const target = model.getOfferModules(copied)[0].id
  copied = ops.editProject(copied, (next) => { model.getEditingOffer(next).settingsDraft.profileSystemId = 'kmg-prestige-70' })
  copied = ops.completeOfferSetup(copied, idFactory)
  assert.deepEqual(copied.profileResolutionsByModuleId[target], profiles.createModuleProfileResolution('kmg-prestige-70'))
  assert.deepEqual(copied.constructionDraftsByModuleId[moduleId], draft)
  assert.deepEqual(copied.constructionDraftsByModuleId[target], draft)
  codec.validateProjectSnapshot(copied)
})
test('UNKNOWN and UNCONFIRMED remain unchanged; 01B candidates never auto-select', () => {
  const { snapshot, moduleId, fields } = fixture()
  let resolution = codec.deserializeProject(codec.serializeProject(snapshot)).profileResolutionsByModuleId[moduleId]
  let context = glazing.resolveHumanGlazingContext(system, 24, resolution.fieldGlazingBeads[fields[0].id].profileCode)
  assert.equal(context.baseProfileCompatibility, 'UNCONFIRMED')
  assert.equal(context.exactGlazingInsetKnown, false); assert.equal(context.glassCutKnown, false); assert.equal(context.machineReady, false)
  assert.deepEqual(context.candidates.map((item) => item.beadCode), ['482.15', '482.01'])
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, fields[0], 32)
  assert.equal(resolution.fieldGlazingBeads[fields[0].id], undefined)
  context = glazing.resolveHumanGlazingContext(system, 32)
  assert.deepEqual(context.candidates.map((item) => item.beadCode), ['482.22'])
  assert.equal(context.selectedCandidate, null); assert.equal(context.automaticBeadSelectionAllowed, false)
  assert.equal(profiles.getFieldHumanGlazingThicknessMm(resolution, fields[1].id), null)
})
test('hydration precedes autosave and restores existing data without writing initial empty state', () => {
  const { snapshot } = fixture(), { adapter, memory } = storageFixture(snapshot)
  const session = persistence.hydrateProject(adapter, idFactory)
  assert.equal(memory.writes.length, 0)
  assert.deepEqual(session.snapshot, snapshot)
  assert.equal(session.hydrated, true)
  assert.equal(session.status, 'saved')
  persistence.saveProjectSession({ ...session, hydrated: false }, adapter)
  assert.equal(memory.writes.length, 0)
  persistence.saveProjectSession(session, adapter)
  assert.deepEqual(adapter.load(), snapshot)
})
for (const [name, json] of [['corrupt JSON', '{broken'], ['future schema', JSON.stringify({ ...fixture().snapshot, schemaVersion: 'project-foundation-99' })]]) {
  test(`${name} fails closed and is never overwritten`, () => {
    const { adapter, memory } = storageFixture()
    memory.data.set(persistence.ACTIVE_PROJECT_KEY, 'original')
    memory.data.set(persistence.PROJECT_KEY_PREFIX + 'original', json)
    const session = persistence.hydrateProject(adapter, idFactory)
    assert.equal(session.blocked, true); assert.equal(session.status, 'failed')
    persistence.saveProjectSession(session, adapter)
    assert.equal(memory.writes.length, 0)
    assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + 'original'), json)
  })
}
test('read access and quota errors retain in-memory and previous persisted project', () => {
  const { snapshot } = fixture(), { adapter, memory } = storageFixture(snapshot)
  memory.failRead = true
  assert.equal(persistence.hydrateProject(adapter).blocked, true)
  memory.failRead = false
  const session = persistence.hydrateProject(adapter)
  const changed = ops.editProject(session.snapshot, (next) => { next.project.site.objectName = 'Unsaved change' })
  memory.failWrite = true
  const failed = persistence.saveProjectSession({ ...session, snapshot: changed }, adapter)
  assert.equal(failed.status, 'failed'); assert.equal(failed.snapshot, changed)
  assert.equal(failed.snapshot.project.site.objectName, 'Unsaved change')
  assert.deepEqual(adapter.load(), snapshot)
  memory.failWrite = false
  assert.equal(persistence.saveProjectSession(failed, adapter).status, 'saved')
  assert.deepEqual(adapter.load(), changed)
})
test('multiple local projects stay accessible; invalid records are retained in the list', () => {
  const { adapter, memory } = storageFixture(fixture().snapshot)
  adapter.save(fixture().snapshot)
  memory.data.set(persistence.PROJECT_KEY_PREFIX + 'broken', 'bad')
  assert.equal(adapter.list().length, 3)
  assert.throws(() => adapter.load('broken'))
  assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + 'broken'), 'bad')
})

// Exercise the actual React workspace hook including dependency-driven effects.
function mountWorkspace(memory) {
  globalThis.window = { localStorage: memory }
  let host
  const react = {
    useState(initial) {
      const h = host, index = h.index++
      if (!(index in h.values)) h.values[index] = typeof initial === 'function' ? initial() : initial
      return [h.values[index], (update) => {
        const value = typeof update === 'function' ? update(h.values[index]) : update
        if (!Object.is(value, h.values[index])) { h.values[index] = value; h.dirty = true }
      }]
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0] },
    useEffect(effect, dependencies) {
      const h = host, index = h.index++, previous = h.values[index]
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
        h.values[index] = dependencies; h.effects.push(effect)
      }
    },
  }
  const hook = createRuntimeLoader({ react })('src/hooks/useProjectWorkspace').useProjectWorkspace
  const state = { index: 0, values: [], effects: [], dirty: false }
  return () => {
    let result, renders = 0
    do {
      assert.ok(++renders < 30, 'no hydration / autosave render loop')
      host = state; state.index = 0; state.effects = []; state.dirty = false
      result = hook()
      for (const effect of state.effects) effect()
    } while (state.dirty)
    return result
  }
}
test('actual workspace hook hydrates before its first effect and persists subsequent metadata edits', () => {
  const { snapshot } = fixture(), { memory, adapter } = storageFixture(snapshot)
  const render = mountWorkspace(memory)
  let workspace = render()
  assert.deepEqual(workspace.snapshot, snapshot); assert.equal(memory.writes.length, 0)
  workspace.setOffer((offer) => ({ ...offer, objectName: 'Updated site' }))
  workspace = render()
  assert.equal(workspace.persistence.status, 'saved')
  assert.equal(adapter.load().project.site.objectName, 'Updated site')
  assert.deepEqual(mountWorkspace(memory)().snapshot, workspace.snapshot)
})
test('actual hook retains independent module state through callback adapters, reload and reset', () => {
  const { snapshot, moduleId, draft } = fixture(), { memory } = storageFixture(snapshot)
  let render = mountWorkspace(memory), workspace = render()
  const secondId = idFactory()
  workspace.setFreeModules((modules) => [...modules, { id: secondId, sequence: 2, profileSystemId: '', productType: null, profileResolution: null }])
  workspace = render()
  workspace.setActiveFreeModuleId(secondId); workspace = render()
  assert.equal(workspace.activeFreeModuleId, secondId)
  workspace.setFreeModuleSketchDrafts((drafts) => ({ ...drafts, [secondId]: structuredClone(draft) }))
  workspace = render()
  assert.equal(workspace.persistence.status, 'saved')
  render = mountWorkspace(memory); workspace = render()
  assert.equal(workspace.activeFreeModuleId, secondId)
  workspace.setFreeModuleSketchDrafts((drafts) => ({ ...drafts, [secondId]: null }))
  workspace = render()
  assert.deepEqual(workspace.freeModuleSketchDrafts[moduleId], draft)
  assert.equal(workspace.freeModuleSketchDrafts[secondId], null)
  assert.equal(workspace.persistence.status, 'saved')
})
test('actual hook Free → Offer setup survives reload without losing human selections', () => {
  const { snapshot, moduleId, draft, resolution } = fixture(), { memory } = storageFixture(snapshot)
  let render = mountWorkspace(memory), workspace = render()
  workspace.copyFreeModuleToOffer(moduleId, draft)
  workspace = render()
  const target = workspace.modules[0].id
  assert.equal(workspace.persistence.status, 'saved')
  render = mountWorkspace(memory); workspace = render()
  workspace.setOffer((offer) => ({ ...offer, colorId: 'anthracite' }))
  workspace.clearConfiguredModules()
  workspace = render()
  assert.equal(workspace.modules[0].id, target)
  workspace.completeOfferSetup(); workspace = render()
  assert.deepEqual(workspace.moduleProfileResolutions[target], resolution)
  assert.equal(workspace.saved, true); assert.equal(workspace.persistence.status, 'saved')
  workspace.setConstructorMode('offer'); workspace = render()
  workspace.setConstructorMode(null); workspace = render()
  assert.equal(workspace.offerStartOpen, true, 'close returns to existing offer')
  const restored = mountWorkspace(memory)()
  assert.equal(restored.modules[0].id, target)
  assert.deepEqual(restored.moduleSketchDrafts[target], draft)
})
test('actual hook reports save failure without losing edits or replacing a corrupt startup record', () => {
  const { snapshot } = fixture(), { memory } = storageFixture(snapshot)
  let render = mountWorkspace(memory), workspace = render()
  memory.failWrite = true
  workspace.setOffer((offer) => ({ ...offer, clientName: 'Still in memory' })); workspace = render()
  assert.equal(workspace.offer.clientName, 'Still in memory'); assert.equal(workspace.persistence.status, 'failed')
  memory.failWrite = false
  workspace.saveNow(); workspace = render(); assert.equal(workspace.persistence.status, 'saved')
  memory.data.set(persistence.PROJECT_KEY_PREFIX + snapshot.project.id, '{broken')
  memory.writes = []
  render = mountWorkspace(memory); workspace = render()
  assert.equal(workspace.persistence.blocked, true); assert.equal(memory.writes.length, 0)
  workspace.setOffer((offer) => ({ ...offer, clientName: 'Recovery draft' })); workspace = render()
  assert.equal(memory.writes.length, 0)
  workspace.newProject(); workspace = render()
  assert.notEqual(workspace.snapshot.project.id, snapshot.project.id)
  assert.equal(workspace.persistence.status, 'saved')
  assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + snapshot.project.id), '{broken')
})
delete globalThis.window
console.log(`PROJECT FOUNDATION 01 RUNTIME PASS: ${passed} cases`)
