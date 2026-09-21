import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const storageApi = load('src/persistence/localProjectStorage')
const revisions = load('src/domain/project/revisionOperations')
const { createModuleProfileResolution } = load('src/domain/profileResolution')
const { createOfferModule } = load('src/domain/offerModules')
const { buildOfferModuleDefaults } = load('src/domain/offerModuleDefaults')
const domain = load('src/domain/compositeModuleStructure')
const construction = load('src/domain/construction')
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
let passed = 0, sequence = 0
const idFactory = () => `integration-${++sequence}`
function test(name, run) { run(); passed++; console.log(`PASS ${name}`) }
class MemoryStorage {
  data = new Map(); failWrite = false; writes = 0
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { if (this.failWrite) throw Error('quota'); this.writes++; this.data.set(key, value) }
  removeItem(key) { this.data.delete(key) }
}
function fixture() {
  let snapshot = model.createProjectSnapshot(idFactory)
  snapshot = ops.editProject(snapshot, (next) => {
    ops.replaceFreeModules(next, ['A', 'B'].map((id, index) => ({ id, sequence: index + 1, profileSystemId: 'kmg-prelude-60', productType: null,
      profileResolution: createModuleProfileResolution('kmg-prelude-60') })))
    const form = { ...model.EMPTY_OFFER, profileSystemId: 'kmg-prelude-60' }
    ops.writeOfferForm(next, form)
    ops.replaceOfferModules(next, [createOfferModule(buildOfferModuleDefaults(model.settingsFromForm(form)), 1, 'C')])
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = 'A'
    next.workspace.screen = 'free-constructor'
  })
  return snapshot
}
function structure(prefix = 'A') {
  return domain.createCompositeModuleStructure({ systemId: 'kmg-prelude-60', frameParts: [
    { id: `${prefix}-window`, function: 'window', widthMm: 1500, heightMm: 1500, frameProfileCode: '482.30',
      frameSides: { top: true, right: true, bottom: true, left: true }, fieldIds: [], placement: { order: null, verticalAlignment: null } },
    { id: `${prefix}-door`, function: 'door', widthMm: 700, heightMm: 2000, frameProfileCode: '482.20',
      frameSides: { top: true, right: true, bottom: false, left: true }, fieldIds: [], placement: { order: null, verticalAlignment: null } },
  ], connections: [{ id: `${prefix}-connection`, fromFramePartId: `${prefix}-window`, toFramePartId: `${prefix}-door`, kind: 'ZERO_DIVIDER' }] })
}
const save = (snapshot, id, value) => ops.saveModuleCompositeStructure(snapshot, id, value, snapshot.modulesById[id]?.compositeStructure ?? null)
test('legacy PF02 absent/null structures stay valid; PF01 migration creates no structures', () => {
  const snapshot = fixture(), legacy = codec.serializeProject(snapshot)
  assert.equal(codec.serializeProject(codec.deserializeProject(legacy)), legacy)
  assert.ok(Object.values(codec.deserializeProject(legacy).modulesById).every((module) => !Object.hasOwn(module, 'compositeStructure')))
  const nullable = ops.editProject(snapshot, (next) => { next.modulesById.A.compositeStructure = null })
  codec.validateProjectSnapshot(nullable)
  const { revisions: _revisions, assurance: _assurance, ...pf01 } = snapshot
  pf01.schemaVersion = 'project-foundation-01'
  const migrated = codec.deserializeProject(JSON.stringify(pf01))
  assert.ok(Object.values(migrated.modulesById).every((module) => !Object.hasOwn(module, 'compositeStructure')))
  const forgedPf01 = structuredClone(pf01)
  forgedPf01.modulesById.A.compositeStructure = structure()
  assert.throws(() => codec.validatePF01Snapshot(forgedPf01), /unexpected property/)
  assert.throws(() => codec.validatePF01Snapshot(forgedPf01, true), /unexpected property/)
  assert.throws(() => codec.deserializeProject(JSON.stringify(forgedPf01)), /unexpected property/)
  forgedPf01.modulesById.A.compositeStructure = null
  assert.throws(() => codec.validatePF01Snapshot(forgedPf01), /unexpected property/)
  for (const original of [pf01, snapshot]) {
    const future = structuredClone(original)
    future.modulesById.A.futureModuleProperty = true
    assert.throws(() => codec.deserializeProject(JSON.stringify(future)), /unexpected property/)
  }
})
test('free/offer structures round-trip losslessly via actual local project storage', () => {
  const memory = new MemoryStorage(), storage = new storageApi.LocalProjectStorage(() => memory)
  let snapshot = fixture()
  storage.save(snapshot)
  for (const id of ['A', 'B', 'C']) snapshot = save(snapshot, id, structure(id))
  storage.save(snapshot)
  const restored = new storageApi.LocalProjectStorage(() => memory).load()
  assert.deepEqual(restored, snapshot)
  for (const id of ['A', 'B', 'C']) {
    const actual = restored.modulesById[id].compositeStructure
    assert.deepEqual(actual, structure(id))
    assert.equal(actual.schemaVersion, domain.COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION)
    assert.equal(actual.frameParts[1].frameSides.bottom, false)
    assert.deepEqual(actual.frameParts.map((part) => [part.widthMm, part.heightMm]), [[1500, 1500], [700, 2000]])
    assert.deepEqual(actual.frameParts.map((part) => part.frameProfileCode), ['482.30', '482.20'])
  }
  assert.equal(memory.data.size, 2, 'only existing project record and active pointer')
})
test('save touches target composite only; stable IDs; module updates and selection retain data', () => {
  const before = fixture(), snapshot = save(save(before, 'A', structure()), 'B', structure('B'))
  const edited = structure(); edited.frameParts[1].widthMm = 720
  const next = save(snapshot, 'A', edited)
  assert.deepEqual(next.modulesById.B, snapshot.modulesById.B)
  assert.deepEqual(next.modulesById.C, snapshot.modulesById.C)
  assert.deepEqual(next.constructionDraftsByModuleId, before.constructionDraftsByModuleId)
  assert.deepEqual(next.profileResolutionsByModuleId, before.profileResolutionsByModuleId)
  assert.deepEqual(next.modulesById.A.compositeStructure.frameParts.map((part) => part.id), structure().frameParts.map((part) => part.id))
  const updated = ops.editProject(next, (draft) => {
    ops.replaceFreeModules(draft, model.getFreeModules(draft).map((module) => ({ ...module, productType: 'door' })))
    draft.workspace.activeModuleIdByOffer[draft.workspace.freeOfferId] = 'B'
  })
  assert.deepEqual(updated.modulesById.A.compositeStructure, edited)
  const offer = save(updated, 'C', structure('C'))
  const updatedOffer = ops.editProject(offer, (draft) => ops.replaceOfferModules(draft, model.getOfferModules(draft)))
  assert.deepEqual(updatedOffer.modulesById.C.compositeStructure, structure('C'))
  assert.ok(!Object.hasOwn(before.modulesById.A, 'compositeStructure'))
  edited.frameParts[0].widthMm = 1
  assert.equal(next.modulesById.A.compositeStructure.frameParts[0].widthMm, 1500)
})
test('deleting free and offer modules leaves no orphan storage; other structures survive', () => {
  let snapshot = fixture()
  for (const id of ['A', 'B', 'C']) snapshot = save(snapshot, id, structure(id))
  const next = ops.editProject(snapshot, (draft) => {
    ops.replaceFreeModules(draft, model.getFreeModules(draft).filter((module) => module.id !== 'A'))
    ops.replaceOfferModules(draft, [])
  })
  const restored = codec.deserializeProject(codec.serializeProject(next))
  assert.deepEqual(Object.keys(restored.modulesById), ['B'])
  assert.deepEqual(restored.modulesById.B.compositeStructure, structure('B'))
  assert.ok(!JSON.stringify(restored.modulesById).includes('A-window'))
})
test('saving the same input to two modules does not share nested mutable references', () => {
  const input = structure(), snapshot = save(save(fixture(), 'A', input), 'B', input)
  assert.notEqual(snapshot.modulesById.A.compositeStructure, snapshot.modulesById.B.compositeStructure)
  snapshot.modulesById.A.compositeStructure.frameParts[1].frameSides.bottom = true
  snapshot.modulesById.A.compositeStructure.connections[0].id = 'edited-connection'
  assert.deepEqual(snapshot.modulesById.B.compositeStructure, input)
  assert.equal(input.frameParts[1].frameSides.bottom, false)
})
test('editing a historical composite preserves existing split topology, FIELD identities and profile assignments', () => {
  const topology = construction.splitField(construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1400 }), 'field-1', 'vertical', 700)
  const before = ops.editProject(fixture(), (next) => {
    for (const id of ['A', 'B', 'C']) {
      // Historical coexistence stays editable; 01D.2A separately rejects NEW conflicts.
      next.modulesById[id].compositeStructure = structure(id)
      next.constructionDraftsByModuleId[id] = { version: 'constructor-01d', frame: structuredClone(topology.frame), topology: structuredClone(topology) }
      next.profileResolutionsByModuleId[id].frame = { profileCode: '482.30', source: 'human' }
    }
  })
  codec.validateProjectSnapshot(before)
  let saved = before
  for (const id of ['A', 'B', 'C']) {
    const edited = structure(id); edited.frameParts[0].widthMm = 1550
    saved = save(saved, id, edited)
    assert.equal(saved.modulesById[id].compositeStructure.frameParts[0].widthMm, 1550)
  }
  const restored = codec.deserializeProject(codec.serializeProject(saved))
  assert.deepEqual(restored.constructionDraftsByModuleId, before.constructionDraftsByModuleId)
  assert.deepEqual(restored.profileResolutionsByModuleId, before.profileResolutionsByModuleId)
  for (const id of ['A', 'B', 'C']) {
    assert.deepEqual(restored.modulesById[id].definition, before.modulesById[id].definition)
    assert.ok(restored.modulesById[id].compositeStructure.frameParts.every((part) => part.fieldIds.length === 0))
  }
})
test('domain save rejects invalid input, mismatched system, stale editor and missing module', () => {
  const snapshot = fixture(), before = codec.serializeProject(snapshot)
  for (const mutate of [
    (value) => { value.frameParts[0].widthMm = 0 },
    (value) => { value.frameParts[0].frameProfileCode = '549.15' },
    (value) => { value.connections[0].toFramePartId = 'absent' },
    (value) => { delete value.frameParts[1].frameSides.bottom },
  ]) { const value = structure(); mutate(value); assert.throws(() => save(snapshot, 'A', value)) }
  const mismatch = structure()
  mismatch.systemId = 'kmg-prestige-70'
  mismatch.frameParts.forEach((part) => { part.frameProfileCode = null })
  assert.throws(() => save(snapshot, 'A', mismatch), /системата на модула/)
  assert.throws(() => save(snapshot, 'absent', structure()), /не съществува/)
  assert.throws(() => save(snapshot, 'A', null))
  const saved = save(snapshot, 'A', structure())
  assert.throws(() => ops.saveModuleCompositeStructure(saved, 'A', structure(), null), /променена след отварянето/)
  assert.equal(codec.serializeProject(snapshot), before)
})
test('canonical system changes are blocked, including replacement/offer setup paths', () => {
  const snapshot = save(save(fixture(), 'A', structure()), 'C', structure('C'))
  const before = codec.serializeProject(snapshot)
  assert.throws(() => ops.editProject(snapshot, (draft) => {
    ops.replaceFreeModules(draft, model.getFreeModules(draft).map((module) => module.id === 'A' ? { ...module, profileSystemId: 'kmg-prestige-70' } : module))
  }), /заключена/)
  assert.throws(() => ops.editProject(snapshot, (draft) => {
    draft.modulesById.A.definition.profileSystemId = 'kmg-prestige-70'
    draft.modulesById.A.compositeStructure = null
  }), /заключена/)
  assert.throws(() => ops.editProject(snapshot, (draft) => ops.replaceOfferModules(draft, model.getOfferModules(draft).map((module) => ({ ...module,
    inheritedDefaults: { ...module.inheritedDefaults, profileSystemId: 'kmg-prestige-70' },
  })))), /заключена/)
  assert.throws(() => ops.editProject(snapshot, (draft) => ops.writeOfferForm(draft, { ...model.getOfferForm(draft), profileSystemId: 'kmg-prestige-70' })), /заключена/)
  assert.equal(codec.serializeProject(snapshot), before)
})
test('corrupted stored composite/mismatch/future version blocks loading and preserves raw record', () => {
  const snapshot = save(fixture(), 'A', structure())
  const key = storageApi.PROJECT_KEY_PREFIX + snapshot.project.id
  for (const mutate of [
    (value) => { value.modulesById.A.compositeStructure.frameParts[1].heightMm = -1 },
    (value) => { value.modulesById.A.compositeStructure.schemaVersion = 99 },
    (value) => { value.modulesById.A.definition.profileSystemId = 'kmg-prestige-70' },
  ]) {
    const data = structuredClone(snapshot); mutate(data)
    const raw = JSON.stringify(data), memory = new MemoryStorage(), storage = new storageApi.LocalProjectStorage(() => memory)
    memory.data.set(key, raw); memory.data.set(storageApi.ACTIVE_PROJECT_KEY, snapshot.project.id)
    assert.throws(() => storage.load())
    assert.throws(() => storage.save(snapshot))
    assert.equal(storageApi.hydrateProject(storage).blocked, true)
    assert.equal(memory.getItem(key), raw)
    assert.equal(memory.writes, 0)
  }
})
test('copy-to-offer preserves independent structure and explicit sides; new modules do not inherit it', () => {
  const snapshot = save(fixture(), 'A', structure())
  const next = ops.copyFreeModuleToOffer(snapshot, 'A', null, idFactory)
  const copied = next.modulesById[next.workspace.activeModuleIdByOffer[next.workspace.offerId]]
  assert.deepEqual(copied.compositeStructure, structure())
  assert.notEqual(copied.compositeStructure, next.modulesById.A.compositeStructure)
  codec.validateProjectSnapshot(next)
  const completed = ops.completeOfferSetup(next, idFactory)
  assert.deepEqual(completed.modulesById[copied.id].compositeStructure, structure())
  const changed = structure(); changed.frameParts[1].frameSides.bottom = true
  const edited = save(completed, copied.id, changed)
  assert.equal(edited.modulesById.A.compositeStructure.frameParts[1].frameSides.bottom, false)
  assert.equal(edited.modulesById.B.compositeStructure, undefined)
})
test('composite edits track module generation and preserve immutable revision history', () => {
  let snapshot = fixture()
  const actor = { id: 'human', label: 'Human', identityBasis: 'local-self-asserted' }
  snapshot = revisions.recordProjectRevision(snapshot, actor, '2026-09-20T12:00:00.000Z', idFactory)
  const oldHistory = JSON.stringify(snapshot.revisions), before = snapshot.assurance.changeGenerations['module:A']
  let next = save(snapshot, 'A', structure())
  assert.equal(next.assurance.changeGenerations['module:A'], before + 1)
  assert.equal(next.assurance.changeGenerations['module:B'], snapshot.assurance.changeGenerations['module:B'])
  assert.deepEqual(next.assurance.confirmationsById, snapshot.assurance.confirmationsById)
  assert.equal(JSON.stringify(next.revisions), oldHistory)
  assert.equal(revisions.revisionStatus(next).matches, false)
  next = revisions.recordProjectRevision(next, actor, '2026-09-20T12:01:00.000Z', idFactory)
  const restored = codec.deserializeProject(codec.serializeProject(next))
  assert.deepEqual(restored.revisions.revisionsById[restored.revisions.headRevisionId].content.modulesById.A.compositeStructure, structure())
})

function hooksHarness() {
  let slots = [], cursor = 0
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useEffect() {},
  }
  return { react, render(fn) { cursor = 0; return fn() }, reset() { slots = [] } }
}
function panelHarness(props) {
  const hooks = hooksHarness(), Panel = createRuntimeLoader({ react: hooks.react })('src/components/CompositeModuleStructurePanel').CompositeModuleStructurePanel
  let tree
  const render = () => { tree = hooks.render(() => Panel(props)) }
  function elements(node = tree) {
    if (Array.isArray(node)) return node.flatMap((item) => elements(item))
    if (!node || typeof node !== 'object') return []
    return [node, ...elements(node.props?.children ?? null)]
  }
  function text(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return ''
    if (Array.isArray(node)) return node.map(text).join('')
    return typeof node === 'object' ? text(node.props?.children) : String(node)
  }
  render()
  return {
    change(id, value) { elements().find((node) => node.props?.id === id).props.onChange({ target: { value, valueAsNumber: Number(value), checked: value } }); render() },
    click(label) { const button = elements().find((node) => node.type === 'button' && text(node) === label); assert.ok(button && !button.props.disabled); button.props.onClick(); render() },
    elements, text,
  }
}
test('bound panel Cancel preserves saved bytes; Save callback runs only on explicit click; failures keep draft', () => {
  const initialValue = structure(), before = JSON.stringify(initialValue)
  let saves = 0, cancels = 0, accepted = null, fail = true
  const h = panelHarness({ moduleNumber: 2, systemId: 'kmg-prelude-60', initialValue,
    onSave(value, expected) { saves++; assert.equal(JSON.stringify(expected), before); if (fail) return 'Записът не успя.'; accepted = structuredClone(value); return null },
    onCancel() { cancels++ },
  })
  h.change('composite-width-A-window', '1600')
  assert.equal(saves, 0)
  assert.equal(JSON.stringify(initialValue), before)
  h.click('Откажи')
  assert.equal(cancels, 1)
  assert.equal(saves, 0)
  h.click('Запази')
  assert.ok(h.elements().some((node) => node.props?.role === 'alert' && h.text(node) === 'Записът не успя.'))
  assert.equal(cancels, 1)
  fail = false
  h.click('Запази')
  assert.equal(accepted.frameParts[0].widthMm, 1600)
  assert.equal(cancels, 2)
  assert.equal(JSON.stringify(initialValue), before)
})
test('workspace explicit save persists target; quota, blocked storage, changed project cannot commit', () => {
  const previousWindow = globalThis.window
  const memory = new MemoryStorage(), storage = new storageApi.LocalProjectStorage(() => memory)
  const snapshot = fixture(); storage.save(snapshot)
  globalThis.window = { localStorage: memory }
  const hooks = hooksHarness(), useWorkspace = createRuntimeLoader({ react: hooks.react })('src/hooks/useProjectWorkspace').useProjectWorkspace
  try {
    let workspace = hooks.render(useWorkspace)
    assert.equal(workspace.saveCompositeStructure(snapshot.project.id, 'A', structure(), null), null)
    workspace = hooks.render(useWorkspace)
    assert.deepEqual(storage.load().modulesById.A.compositeStructure, structure())
    assert.equal(storage.load().modulesById.B.compositeStructure, undefined)
    assert.equal(workspace.persistence.status, 'saved')
    const before = codec.serializeProject(workspace.snapshot), storedBefore = memory.getItem(storageApi.PROJECT_KEY_PREFIX + snapshot.project.id)
    const edit = structure(); edit.frameParts[1].widthMm = 730
    memory.failWrite = true
    assert.match(workspace.saveCompositeStructure(snapshot.project.id, 'A', edit, structure()), /не можа да бъде записана/)
    workspace = hooks.render(useWorkspace)
    assert.equal(codec.serializeProject(workspace.snapshot), before)
    assert.equal(memory.getItem(storageApi.PROJECT_KEY_PREFIX + snapshot.project.id), storedBefore)
    assert.match(workspace.saveCompositeStructure('other-project', 'A', edit, structure()), /Проектът е сменен/)
    memory.failWrite = false
    workspace.setFreeModules((modules) => modules.map((module) => module.id === 'A' ? { ...module, profileSystemId: 'kmg-prestige-70' } : module))
    workspace = hooks.render(useWorkspace)
    assert.equal(model.getProjectModuleSystemId(workspace.snapshot.modulesById.A), 'kmg-prelude-60')
    assert.match(workspace.persistence.error, /заключена/)
    memory.data.set(storageApi.PROJECT_KEY_PREFIX + snapshot.project.id, '{bad')
    hooks.reset(); workspace = hooks.render(useWorkspace)
    assert.equal(workspace.persistence.blocked, true)
    assert.match(workspace.saveCompositeStructure(workspace.snapshot.project.id, 'A', edit, null), /блокиран/)
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
})
test('panel to workspace: Cancel writes nothing; Save and reopen retain only the target edit', () => {
  const previousWindow = globalThis.window
  const memory = new MemoryStorage(), storage = new storageApi.LocalProjectStorage(() => memory)
  const snapshot = save(save(fixture(), 'A', structure()), 'B', structure('B'))
  storage.save(snapshot)
  globalThis.window = { localStorage: memory }
  const hooks = hooksHarness(), useWorkspace = createRuntimeLoader({ react: hooks.react })('src/hooks/useProjectWorkspace').useProjectWorkspace
  try {
    let workspace = hooks.render(useWorkspace), closed = 0
    const open = () => panelHarness({ moduleNumber: 1,
      systemId: model.getProjectModuleSystemId(workspace.snapshot.modulesById.A),
      initialValue: workspace.snapshot.modulesById.A.compositeStructure,
      onSave: (value, expected) => workspace.saveCompositeStructure(snapshot.project.id, 'A', value, expected),
      onCancel: () => { closed++ },
    })
    const before = codec.serializeProject(workspace.snapshot), storedBefore = [...memory.data], writes = memory.writes
    const cancelled = open()
    cancelled.change('composite-width-A-window', '1600')
    cancelled.click('Откажи')
    workspace = hooks.render(useWorkspace)
    assert.equal(closed, 1)
    assert.equal(codec.serializeProject(workspace.snapshot), before)
    assert.deepEqual([...memory.data], storedBefore)
    assert.equal(memory.writes, writes)
    const editor = open()
    assert.equal(editor.elements().find((node) => node.props?.id === 'composite-width-A-window').props.value, 1500)
    editor.change('composite-width-A-window', '1600')
    editor.click('Запази')
    assert.equal(closed, 2)
    hooks.reset(); workspace = hooks.render(useWorkspace)
    const expected = structure(); expected.frameParts[0].widthMm = 1600
    assert.deepEqual(workspace.snapshot.modulesById.A.compositeStructure, expected)
    assert.deepEqual(workspace.snapshot.modulesById.B, snapshot.modulesById.B)
    assert.deepEqual(storage.load(), workspace.snapshot)
    const reopened = open()
    assert.equal(reopened.elements().find((node) => node.props?.id === 'composite-width-A-window').props.value, 1600)
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
})
test('no field/model/geometry integration; protected topology and Model Library remain unchanged', () => {
  const hashes = {
    'src/domain/construction/constructionModel.ts': '238525a7a6587f3f0aa572ce6ebae48c86774522d68cdc2a44ba35785d655487',
    'src/domain/construction/fieldTopology.ts': '314ec981dddc033cd4a536ac31199892f6f88361ebe89f1d7263641a9380f1dd',
    'src/domain/profileResolution.ts': 'c25ad2c821678f4a3e6ec6585c8b30fccf6b2625d24f8d1bae813582f26c4cb7',
    'src/persistence/localModelLibraryStorage.ts': '62805b3f13cd6a75a0355e0199b1f1ee555d11d6772409e20fe7d4e1cf77643c',
  }
  for (const [path, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(read(path)).digest('hex'), hash, path)
  assert.match(read('src/components/compositeModuleStructureDraft.ts'), /fieldIds: \[\]/)
  assert.doesNotMatch(read('src/components/CompositeModuleStructurePanel.tsx'), /modelId|ConstructorShell|localStorage/)
  const app = read('src/App.tsx')
  assert.doesNotMatch(app, /id: 'composite-structure'/)
  assert.match(app, /compositeEditor\?\.projectId === workspace.snapshot.project.id/)
  assert.match(app, /moduleNumber=\{compositeEditing.sequence\}/)
  assert.equal(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY.automaticGeometry, false)
})
console.log(`COMPOSITE MODULE INTEGRATION 01C PASS: ${passed} cases`)
console.log('APPLICATION NOT STARTED\nNO FIELD INTEGRATION\nNO MODEL ASSIGNMENT\nAUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
