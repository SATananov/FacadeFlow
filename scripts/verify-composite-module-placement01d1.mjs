import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const domain = load('src/domain/compositeModuleStructure')
const ui = load('src/components/compositeModuleStructureDraft')
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const persistence = load('src/persistence/localProjectStorage')
const revisions = load('src/domain/project/revisionOperations')
const construction = load('src/domain/construction')
const { createOfferModule } = load('src/domain/offerModules')
const { buildOfferModuleDefaults } = load('src/domain/offerModuleDefaults')
let passed = 0, sequence = 0
const idFactory = () => `placement-${++sequence}`
function test(name, run) { run(); passed++; console.log(`PASS ${name}`) }
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const unknown = () => ({ order: null, verticalAlignment: null })
function legacy() {
  return { schemaVersion: 1, systemId: 'kmg-prelude-60', frameParts: [
    { id: 'window', function: 'window', widthMm: 1500, heightMm: 1500, frameProfileCode: '482.30',
      frameSides: { top: true, right: true, bottom: true, left: true }, fieldIds: [] },
    { id: 'door', function: 'door', widthMm: 700, heightMm: 2000, frameProfileCode: '482.20',
      frameSides: { top: true, right: true, bottom: false, left: true }, fieldIds: [] },
  ], connections: [{ id: 'zero', fromFramePartId: 'window', toFramePartId: 'door', kind: 'ZERO_DIVIDER' }] }
}
function explicit(alignment = 'TOP') {
  const value = domain.upgradeCompositeModuleStructure(legacy())
  value.frameParts[0].placement = { order: 1, verticalAlignment: alignment }
  value.frameParts[1].placement = { order: 2, verticalAlignment: alignment }
  return value
}
const placements = (value) => Object.fromEntries(value.frameParts.map((part) => [part.id, domain.getFramePartPlacement(part)]))
const withoutPlacement = (value) => value.frameParts.map(({ placement: _placement, ...part }) => part)
function fixture(value = legacy()) {
  return ops.editProject(model.createProjectSnapshot(idFactory), (next) => {
    ops.replaceFreeModules(next, ['A', 'B'].map((id, index) => ({ id, sequence: index + 1,
      profileSystemId: 'kmg-prelude-60', productType: null, profileResolution: null })))
    const form = { ...model.EMPTY_OFFER, profileSystemId: 'kmg-prelude-60' }
    ops.writeOfferForm(next, form)
    ops.replaceOfferModules(next, [createOfferModule(buildOfferModuleDefaults(model.settingsFromForm(form)), 1, 'C')])
    const topology = construction.splitField(construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1800, heightMm: 1400 }), 'field-1', 'vertical', 700)
    for (const id of ['A', 'B', 'C']) {
      next.modulesById[id].compositeStructure = structuredClone(value)
      next.constructionDraftsByModuleId[id] = { version: 'constructor-01d', frame: structuredClone(topology.frame), topology: structuredClone(topology) }
    }
  })
}
const save = (snapshot, id, value) => ops.saveModuleCompositeStructure(snapshot, id, value, snapshot.modulesById[id].compositeStructure)
class MemoryStorage {
  data = new Map(); writes = 0; fail = false
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { if (this.fail) throw Error('quota'); this.writes++; this.data.set(key, value) }
  removeItem(key) { this.data.delete(key) }
}

test('01A–01C legacy schema loads unchanged, including nonempty topology and history', () => {
  const old = legacy(), before = JSON.stringify(old)
  domain.validateCompositeModuleStructure(old)
  assert.deepEqual(placements(old), { window: unknown(), door: unknown() })
  let snapshot = fixture()
  snapshot = revisions.recordProjectRevision(snapshot, { id: 'human', label: 'Human', identityBasis: 'local-self-asserted' }, '2026-09-21T12:00:00.000Z', idFactory)
  const raw = codec.serializeProject(snapshot), restored = codec.deserializeProject(raw)
  assert.equal(codec.serializeProject(restored), raw)
  assert.deepEqual(restored.revisions, snapshot.revisions)
  assert.equal(JSON.stringify(old), before)
  assert.equal(restored.modulesById.A.compositeStructure.schemaVersion, 1)
})
test('canonical draft upgrade creates only null placement, never array-derived order', () => {
  const original = legacy(), reversed = legacy(); reversed.frameParts.reverse()
  const next = domain.upgradeCompositeModuleStructure(original)
  assert.equal(next.schemaVersion, 2)
  assert.deepEqual(placements(next), placements(domain.upgradeCompositeModuleStructure(reversed)))
  assert.deepEqual(placements(next), { window: unknown(), door: unknown() })
  assert.deepEqual(withoutPlacement(next), original.frameParts)
  assert.deepEqual(next.connections, original.connections)
  next.frameParts[0].frameSides.bottom = false
  next.connections[0].id = 'draft-only'
  assert.deepEqual(original, legacy())
})
test('both schema contracts are strict; future fields and geometry are rejected', () => {
  const forged = legacy(); forged.frameParts[0].placement = unknown()
  assert.throws(() => domain.validateCompositeModuleStructure(forged), /unexpected property/)
  const missing = explicit(); delete missing.frameParts[0].placement
  assert.throws(() => domain.validateCompositeModuleStructure(missing), /missing explicit property/)
  for (const field of ['x', 'y', 'xMm', 'yMm', 'offsetMm', 'totalWidthMm', 'totalHeightMm', 'modelId', 'systemId']) {
    const value = explicit(); value.frameParts[0].placement[field] = 1
    assert.throws(() => domain.validateCompositeModuleStructure(value), /unexpected property/)
  }
  for (const field of ['widthMm', 'heightMm', 'totalWidthMm', 'totalHeightMm']) {
    const value = explicit(); value[field] = 2200
    assert.throws(() => domain.validateCompositeModuleStructure(value), /unexpected property/)
  }
  assert.throws(() => domain.validateCompositeModuleStructure({ ...explicit(), schemaVersion: 99 }), /schemaVersion/)
})
test('TOP and BOTTOM support different heights and either explicit horizontal order', () => {
  for (const alignment of ['TOP', 'BOTTOM']) {
    const value = explicit(alignment)
    domain.validateCompositeModuleStructure(value)
    assert.deepEqual(placements(value), { window: { order: 1, verticalAlignment: alignment }, door: { order: 2, verticalAlignment: alignment } })
    const reversed = ui.moveCompositePart(value, 'door', 'left')
    domain.validateCompositeModuleStructure(reversed)
    assert.deepEqual(ui.orderedCompositeParts(reversed).map((part) => part.id), ['door', 'window'])
    assert.deepEqual(withoutPlacement(reversed), legacy().frameParts)
  }
})
for (const order of [0, -1, 1.5, NaN, Infinity, -Infinity, '1', undefined, Number.MAX_SAFE_INTEGER + 1]) {
  test(`invalid order rejected: ${String(order)}`, () => {
    const value = explicit(); value.frameParts[0].placement.order = order
    assert.throws(() => domain.validateCompositeModuleStructure(value), /placement.order/)
    assert.throws(() => save(fixture(), 'A', value), /placement.order/)
  })
}
test('duplicate explicit orders are rejected even when alignment is unresolved', () => {
  const value = explicit(); value.frameParts[1].placement = { order: 1, verticalAlignment: null }
  assert.throws(() => domain.validateCompositeModuleStructure(value), /duplicate order/)
  assert.match(ui.compositeDraftProblem(value), /еднаква позиция/)
})
test('alignment accepts only TOP, BOTTOM or explicit null', () => {
  for (const alignment of ['CENTER', 'top', '', 1, undefined]) {
    const value = explicit(); value.frameParts[0].placement.verticalAlignment = alignment
    assert.throws(() => domain.validateCompositeModuleStructure(value), /alignment/)
  }
  const value = explicit(); value.frameParts.forEach((part) => { part.placement = unknown() })
  domain.validateCompositeModuleStructure(value)
  value.frameParts[0].placement.verticalAlignment = 'TOP'
  domain.validateCompositeModuleStructure(value)
})
test('storage array permutation does not change semantic order and never mutates input', () => {
  const a = explicit(), b = explicit(); b.frameParts.reverse()
  const before = structuredClone(b)
  assert.deepEqual(ui.orderedCompositeParts(a).map((p) => p.id), ui.orderedCompositeParts(b).map((p) => p.id))
  assert.deepEqual(placements(ui.moveCompositePart(a, 'door', 'left')), placements(ui.moveCompositePart(b, 'door', 'left')))
  assert.deepEqual(b, before)
})
test('new parts stay unresolved; explicit insertion supports N parts without ranking unresolved peers', () => {
  let value = ui.addCompositeFramePart(explicit(), 'third')
  value = ui.addCompositeFramePart(value, 'fourth')
  assert.deepEqual(placements(value).third, unknown())
  value = ui.placeCompositePart(value, 'fourth', 'window')
  assert.deepEqual(ui.orderedCompositeParts(value).map((p) => p.id), ['fourth', 'window', 'door'])
  assert.deepEqual(placements(value).third, unknown())
  value = ui.placeCompositePart(value, 'third', null)
  assert.deepEqual(ui.orderedCompositeParts(value).map((p) => p.id), ['fourth', 'window', 'door', 'third'])
  assert.deepEqual(ui.orderedCompositeParts(value).map((p) => p.placement.order), [1, 2, 3, 4])
  assert.deepEqual(value.frameParts.map((p) => p.id), ['window', 'door', 'third', 'fourth'])
})
test('gapped orders survive loading/deletion; only explicit reorder renumbers', () => {
  const value = explicit(); value.frameParts[0].placement.order = 5; value.frameParts[1].placement.order = 20
  domain.validateCompositeModuleStructure(value)
  assert.deepEqual(placements(codec.deserializeProject(codec.serializeProject(fixture(value))).modulesById.A.compositeStructure), placements(value))
  assert.equal(ui.removeCompositeFramePart(value, 'window').frameParts[0].placement.order, 20)
  assert.deepEqual(ui.orderedCompositeParts(ui.moveCompositePart(value, 'window', 'right')).map((p) => p.placement.order), [1, 2])
})
test('reorder changes only order, retains all sides/function/profile/dimensions/IDs and connections', () => {
  const original = explicit(), before = structuredClone(original)
  const next = ui.moveCompositePart(original, 'window', 'right')
  assert.deepEqual(withoutPlacement(next), withoutPlacement(before))
  assert.deepEqual(next.frameParts.map((p) => p.placement.verticalAlignment), before.frameParts.map((p) => p.placement.verticalAlignment))
  assert.deepEqual(next.connections, before.connections)
  assert.deepEqual(original, before)
  const noLinks = { ...original, connections: [] }
  assert.deepEqual(ui.moveCompositePart(noLinks, 'door', 'left').connections, [])
  assert.equal(ui.moveCompositePart(original, 'window', 'left'), original)
  assert.equal(ui.moveCompositePart(original, 'door', 'right'), original)
  assert.equal(ui.placeCompositePart(original, 'door', 'missing'), original)
})
test('factory and migration detach nested placement objects', () => {
  const original = explicit(), a = domain.createCompositeModuleStructure(original), b = domain.upgradeCompositeModuleStructure(original)
  a.frameParts[0].placement.order = 9
  b.frameParts[0].placement.verticalAlignment = 'BOTTOM'
  assert.deepEqual(original, explicit())
  const view = domain.getFramePartPlacement(original.frameParts[0]); view.order = 10
  assert.equal(original.frameParts[0].placement.order, 1)
})
test('placement persists for free/offer modules without touching topology, profiles or other modules', () => {
  const before = fixture(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  let next = save(before, 'A', explicit())
  next = save(next, 'C', explicit('BOTTOM'))
  storage.save(next)
  const restored = new persistence.LocalProjectStorage(() => memory).load()
  assert.deepEqual(restored, next)
  assert.deepEqual(restored.modulesById.B, before.modulesById.B)
  assert.deepEqual(restored.constructionDraftsByModuleId, before.constructionDraftsByModuleId)
  assert.deepEqual(restored.profileResolutionsByModuleId, before.profileResolutionsByModuleId)
  assert.equal(memory.data.size, 2)
  const changed = save(restored, 'A', ui.moveCompositePart(restored.modulesById.A.compositeStructure, 'window', 'right'))
  assert.deepEqual(changed.modulesById.C, restored.modulesById.C)
  assert.deepEqual(changed.modulesById.B, restored.modulesById.B)
  assert.equal(changed.assurance.changeGenerations['module:A'], restored.assurance.changeGenerations['module:A'] + 1)
  assert.deepEqual(changed.assurance.confirmationsById, restored.assurance.confirmationsById)
})
test('saved placement appears in new revisions; old schema history remains immutable', () => {
  const actor = { id: 'human', label: 'Human', identityBasis: 'local-self-asserted' }
  const old = revisions.recordProjectRevision(fixture(), actor, '2026-09-21T12:00:00.000Z', idFactory)
  const saved = save(old, 'A', explicit())
  assert.deepEqual(saved.revisions, old.revisions)
  const recorded = revisions.recordProjectRevision(saved, actor, '2026-09-21T12:01:00.000Z', idFactory)
  const restored = codec.deserializeProject(codec.serializeProject(recorded))
  assert.deepEqual(restored.revisions, recorded.revisions)
  assert.equal(restored.revisions.revisionsById[old.revisions.headRevisionId].content.modulesById.A.compositeStructure.schemaVersion, 1)
  assert.deepEqual(restored.revisions.revisionsById[recorded.revisions.headRevisionId].content.modulesById.A.compositeStructure, explicit())
})
test('invalid stored placement blocks load; module system authority is still enforced', () => {
  const before = fixture(explicit()), bad = structuredClone(before)
  bad.modulesById.A.compositeStructure.frameParts[0].placement.order = 2
  assert.throws(() => codec.deserializeProject(JSON.stringify(bad)), /duplicate order/)
  assert.throws(() => ops.editProject(before, (next) => { next.modulesById.A.definition.profileSystemId = 'kmg-prestige-70' }), /заключена/)
  assert.throws(() => ops.editProject(before, (next) => { next.modulesById.C.definition.draft.inheritedDefaults.profileSystemId = 'kmg-prestige-70' }), /заключена/)
})

// Event harness executes real panel/workspace handlers; it is not a browser or React effect simulation.
function hooksHarness() {
  let slots = [], cursor = 0
  return { react: {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useEffect() {},
  }, render(fn) { cursor = 0; return fn() }, reset() { slots = [] } }
}
function panelHarness(props) {
  const hooks = hooksHarness(), Panel = createRuntimeLoader({ react: hooks.react })('src/components/CompositeModuleStructurePanel').CompositeModuleStructurePanel
  let tree
  const render = () => { tree = hooks.render(() => Panel(props)) }
  function elements(node = tree) { return Array.isArray(node) ? node.flatMap(elements) : !node || typeof node !== 'object' ? [] : [node, ...elements(node.props?.children ?? null)] }
  function text(node) { return Array.isArray(node) ? node.map(text).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? text(node.props?.children) : String(node) }
  const byId = (id) => { const found = elements().find((n) => n.props?.id === id); assert.ok(found, id); return found }
  render()
  const ids = elements().map((n) => n.props?.id).filter(Boolean)
  assert.equal(new Set(ids).size, ids.length, 'unique DOM identities, including frame side controls')
  return { byId, elements, text,
    change(id, value) { byId(id).props.onChange({ target: { value, valueAsNumber: Number(value), checked: value } }); render() },
    click(id) { const button = byId(id); assert.ok(!button.props.disabled); button.props.onClick(); render() },
    action(label) { const button = elements().find((n) => n.type === 'button' && text(n) === label); assert.ok(button && !button.props.disabled); button.props.onClick(); render() },
  }
}
test('panel/workspace Cancel, explicit placement Save, quota failure and reopen with independent A/B', () => {
  const previousWindow = globalThis.window, memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  const initial = fixture(); storage.save(initial); globalThis.window = { localStorage: memory }
  const hooks = hooksHarness(), useWorkspace = createRuntimeLoader({ react: hooks.react })('src/hooks/useProjectWorkspace').useProjectWorkspace
  try {
    let workspace = hooks.render(useWorkspace), closes = 0
    const open = () => panelHarness({ moduleNumber: 1, systemId: model.getProjectModuleSystemId(workspace.snapshot.modulesById.A),
      initialValue: workspace.snapshot.modulesById.A.compositeStructure,
      onSave: (value, expected) => workspace.saveCompositeStructure(initial.project.id, 'A', value, expected), onCancel: () => { closes++ },
    })
    const before = codec.serializeProject(workspace.snapshot), writes = memory.writes
    let panel = open()
    assert.equal(panel.byId('composite-position-window').props.value, '')
    assert.equal(panel.byId('composite-alignment-door').props.value, '')
    assert.equal(panel.byId('composite-move-left-window').props.disabled, true)
    panel.change('composite-position-window', 'end'); panel.change('composite-alignment-window', 'TOP')
    panel.action('Откажи')
    workspace = hooks.render(useWorkspace)
    assert.equal(codec.serializeProject(workspace.snapshot), before)
    assert.equal(memory.writes, writes)
    panel = open()
    for (const id of ['window', 'door']) { panel.change(`composite-position-${id}`, 'end'); panel.change(`composite-alignment-${id}`, 'TOP') }
    assert.equal(memory.writes, writes)
    panel.click('composite-move-left-door')
    panel.change('composite-function-door', 'window')
    assert.equal(panel.byId('composite-bottom-door').props.checked, false)
    assert.equal(panel.byId('composite-alignment-door').props.value, 'TOP')
    panel.change('composite-function-door', 'door'); panel.click('composite-move-right-door')
    panel.change('composite-alignment-window', 'BOTTOM'); panel.change('composite-alignment-window', 'TOP')
    memory.fail = true; panel.action('Запази')
    assert.equal(closes, 1)
    assert.equal(codec.serializeProject(hooks.render(useWorkspace).snapshot), before)
    assert.ok(panel.elements().some((n) => n.props?.role === 'alert'))
    memory.fail = false; panel.action('Запази')
    hooks.reset(); workspace = hooks.render(useWorkspace)
    assert.equal(closes, 2)
    assert.deepEqual(workspace.snapshot.modulesById.A.compositeStructure, explicit())
    assert.deepEqual(workspace.snapshot.modulesById.B, initial.modulesById.B)
    assert.deepEqual(storage.load(), workspace.snapshot)
    panel = open()
    assert.equal(panel.byId('composite-position-window').props.value, 'current')
    assert.ok(panel.text(panel.byId('composite-position-window')).includes('Ред 1'))
    assert.ok(panel.text(panel.byId('composite-position-door')).includes('Ред 2'))
    assert.equal(panel.byId('composite-alignment-door').props.value, 'TOP')
    const saved = codec.serializeProject(workspace.snapshot), savedWrites = memory.writes
    panel.click('composite-move-left-door'); panel.change('composite-alignment-door', 'BOTTOM'); panel.action('Откажи')
    assert.equal(codec.serializeProject(hooks.render(useWorkspace).snapshot), saved)
    assert.equal(memory.writes, savedWrites)
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
})
test('protected topology/model persistence and safety boundaries remain unchanged', () => {
  const hashes = {
    'src/domain/construction/constructionModel.ts': '238525a7a6587f3f0aa572ce6ebae48c86774522d68cdc2a44ba35785d655487',
    'src/domain/construction/fieldTopology.ts': '314ec981dddc033cd4a536ac31199892f6f88361ebe89f1d7263641a9380f1dd',
    'src/persistence/localModelLibraryStorage.ts': '62805b3f13cd6a75a0355e0199b1f1ee555d11d6772409e20fe7d4e1cf77643c',
  }
  for (const [path, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(read(path)).digest('hex'), hash, path)
  for (const path of ['src/components/compositeModuleStructureDraft.ts', 'src/components/CompositeModuleStructurePanel.tsx']) {
    assert.doesNotMatch(read(path), /modelId|ConstructionModel|ConstructorShell|<svg|<canvas|xMm|yMm|offsetMm|totalWidth|totalHeight/)
  }
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.automaticGeometry, false)
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.automaticPlacement, false)
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.framePartPlacement, 'HUMAN DEFINED')
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.rulesValidated, false)
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.machineReady, false)
})
console.log(`COMPOSITE MODULE PLACEMENT 01D.1 PASS: ${passed} cases`)
console.log('APPLICATION NOT STARTED\nNO BROWSER ACCEPTANCE\nNO CONSTRUCTOR SKETCH CHANGE\nNO FIELD INTEGRATION\nNO MODEL ASSIGNMENT\nAUTOMATIC GEOMETRY = NO\nAUTOMATIC PLACEMENT = NO\nFRAME PART PLACEMENT = HUMAN DEFINED\nRULES VALIDATED = NO\nMACHINE READY = NO')
