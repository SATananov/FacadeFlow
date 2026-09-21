import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const guard = load('src/domain/project/compositeModuleGuard')
const codec = load('src/domain/project/projectSerialization')
const persistence = load('src/persistence/localProjectStorage')
const construction = load('src/domain/construction')
const composite = load('src/domain/compositeModuleStructure')
const { createOfferModule } = load('src/domain/offerModules')
const { buildOfferModuleDefaults } = load('src/domain/offerModuleDefaults')
let sequence = 0, passed = 0
const idFactory = () => `guard-${++sequence}`
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
function structure() {
  return composite.createCompositeModuleStructure({ systemId: 'kmg-prelude-60', frameParts: [
    { id: 'window', function: 'window', widthMm: 1500, heightMm: 1500, frameProfileCode: '482.30', fieldIds: [],
      frameSides: { top: true, right: true, bottom: true, left: true }, placement: { order: 1, verticalAlignment: 'TOP' } },
    { id: 'door', function: 'door', widthMm: 700, heightMm: 2000, frameProfileCode: '482.20', fieldIds: [],
      frameSides: { top: true, right: true, bottom: false, left: true }, placement: { order: 2, verticalAlignment: 'TOP' } },
  ], connections: [{ id: 'zero', fromFramePartId: 'window', toFramePartId: 'door', kind: 'ZERO_DIVIDER' }] })
}
function fixture(mode = 'free', occupied = true, existing = false) {
  return ops.editProject(model.createProjectSnapshot(idFactory), (next) => {
    ops.replaceFreeModules(next, [{ id: 'A', sequence: 1, profileSystemId: 'kmg-prelude-60', productType: null, profileResolution: null },
      { id: 'B', sequence: 4, profileSystemId: 'kmg-prelude-60', productType: null, profileResolution: null }])
    const form = { ...model.EMPTY_OFFER, profileSystemId: 'kmg-prelude-60' }
    ops.writeOfferForm(next, form)
    ops.replaceOfferModules(next, [createOfferModule(buildOfferModuleDefaults(model.settingsFromForm(form)), 1, 'C')])
    const moduleId = mode === 'free' ? 'A' : 'C'
    next.workspace.screen = mode === 'free' ? 'free-constructor' : 'offer-constructor'
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = 'A'
    next.workspace.activeModuleIdByOffer[next.workspace.offerId] = 'C'
    if (occupied) {
      let topology = construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1400 })
      topology = construction.splitField(topology, 'field-1', 'vertical', 700)
      next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: structuredClone(topology.frame), topology }
    }
    if (existing) next.modulesById[moduleId].compositeStructure = structure()
  })
}
class MemoryStorage {
  data = new Map(); writes = 0; fail = false; failPointer = false
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { if (this.fail || (this.failPointer && key === persistence.ACTIVE_PROJECT_KEY)) throw Error('quota'); this.data.set(key, value); this.writes++ }
  removeItem(key) { this.data.delete(key) }
}
test('empty modules, system, sequence/name and form dimensions are not construction', () => {
  const snapshot = fixture('offer', false)
  snapshot.modulesById.C.definition.draft.widthMm = 1500
  snapshot.modulesById.C.definition.draft.heightMm = 1500
  snapshot.modulesById.C.definition.draft.widthSource = 'preset'
  snapshot.modulesById.C.definition.draft.heightSource = 'preset'
  for (const id of ['A', 'B', 'C', 'absent']) {
    assert.equal(guard.hasModuleConstructorConstruction(snapshot, id), false)
    assert.equal(guard.needsCompositeModuleGuard(snapshot, id), false)
  }
  assert.equal(guard.proposeCompositeModule(snapshot, 'C'), null)
  const saved = ops.saveModuleCompositeStructure(snapshot, 'C', structure(), null)
  assert.deepEqual(saved.modulesById.C.compositeStructure, structure())
  assert.equal(Object.keys(saved.modulesById).length, 3)
})
test('persisted split topology, committed outer frame and legacy draft are construction', () => {
  const snapshot = fixture()
  assert.equal(guard.hasModuleConstructorConstruction(snapshot, 'A'), true)
  assert.equal(guard.needsCompositeModuleGuard(snapshot, 'A'), true)
  const frame = { xMm: 0, yMm: 0, widthMm: 1500, heightMm: 1500 }
  for (const draft of [
    { version: 'constructor-01b', frame },
    { version: 'constructor-01c', frame, dividers: [] },
    { version: 'constructor-01d', frame, topology: construction.createConstructionModel(frame) },
  ]) { snapshot.constructionDraftsByModuleId.A = draft; assert.equal(guard.hasModuleConstructorConstruction(snapshot, 'A'), true) }
})
test('new saves into occupied modules are blocked, including an editor opened before construction appeared', () => {
  const snapshot = fixture(), before = codec.serializeProject(snapshot)
  assert.throws(() => ops.saveModuleCompositeStructure(snapshot, 'A', structure(), null), /вече съдържа конструкция/)
  assert.equal(codec.serializeProject(snapshot), before)
})
for (const mode of ['free', 'offer']) {
  test(`${mode}: historical coexistence is loaded and edited, never migrated or split`, () => {
    const snapshot = fixture(mode, true, true), id = mode === 'free' ? 'A' : 'C'
    const legacy = ops.editProject(snapshot, (next) => {
      next.modulesById[id].compositeStructure.schemaVersion = 1
      next.modulesById[id].compositeStructure.frameParts.forEach((part) => { delete part.placement })
    })
    for (const value of [snapshot, legacy]) {
      const raw = codec.serializeProject(value), restored = codec.deserializeProject(raw)
      assert.equal(codec.serializeProject(restored), raw)
      assert.equal(guard.proposeCompositeModule(restored, id), null)
      const edited = composite.upgradeCompositeModuleStructure(restored.modulesById[id].compositeStructure)
      edited.frameParts[0].widthMm = 1550
      const next = ops.saveModuleCompositeStructure(restored, id, edited, restored.modulesById[id].compositeStructure)
      assert.deepEqual(next.constructionDraftsByModuleId, value.constructionDraftsByModuleId)
      assert.equal(Object.keys(next.modulesById).length, 3)
    }
  })
  test(`${mode}: confirm shares canonical creation/numbering, clean contents and active target`, () => {
    const snapshot = fixture(mode), id = mode === 'free' ? 'A' : 'C', owner = snapshot.modulesById[id].offerId
    const before = codec.serializeProject(snapshot), request = guard.proposeCompositeModule(snapshot, id)
    assert.equal(request.nextSequence, model.getNextModuleSequence(snapshot, owner))
    const created = ops.createConfirmedCompositeModule(snapshot, request, () => 'new-stable')
    const normal = ops.createNextProjectModule(snapshot, owner, id, () => 'new-stable')
    assert.deepEqual(created, normal)
    assert.equal(created.moduleId, 'new-stable')
    assert.equal(Object.keys(created.snapshot.modulesById).length, 4)
    const target = created.snapshot.modulesById[created.moduleId]
    assert.equal(target.sequence, request.nextSequence)
    assert.equal(target.offerId, owner)
    assert.equal(model.getProjectModuleSystemId(target), request.systemId)
    assert.equal(target.compositeStructure, undefined)
    assert.equal(created.snapshot.constructionDraftsByModuleId[target.id], null)
    assert.equal(created.snapshot.profileResolutionsByModuleId[target.id].frame, null)
    assert.equal(target.definition.kind === 'free' ? target.definition.productType : target.definition.draft.productType, null)
    if (target.definition.kind === 'offer') {
      assert.deepEqual(target.definition.draft.fields, [])
      assert.equal(target.definition.draft.widthMm, null)
      assert.equal(target.definition.draft.heightMm, null)
    }
    assert.equal(created.snapshot.workspace.activeModuleIdByOffer[owner], target.id)
    for (const previousId of ['A', 'B', 'C']) {
      assert.deepEqual(created.snapshot.modulesById[previousId], snapshot.modulesById[previousId])
      assert.deepEqual(created.snapshot.constructionDraftsByModuleId[previousId], snapshot.constructionDraftsByModuleId[previousId])
      assert.deepEqual(created.snapshot.profileResolutionsByModuleId[previousId], snapshot.profileResolutionsByModuleId[previousId])
    }
    assert.equal(codec.serializeProject(snapshot), before)
    codec.validateProjectSnapshot(created.snapshot)
    assert.throws(() => ops.createConfirmedCompositeModule(created.snapshot, request, idFactory), /променени/)
    assert.throws(() => ops.createNextProjectModule(snapshot, owner, id, () => id), /вече съществува/)
  })
}
test('deleted modules and stale proposals cannot introduce a second numbering authority', () => {
  const snapshot = fixture(), request = guard.proposeCompositeModule(snapshot, 'A')
  assert.equal(request.nextSequence, 5)
  const deleted = ops.editProject(snapshot, (next) => ops.replaceFreeModules(next, model.getFreeModules(next).filter((m) => m.id !== 'B')))
  assert.throws(() => ops.createConfirmedCompositeModule(deleted, request, idFactory), /променени/)
  const fresh = guard.proposeCompositeModule(deleted, 'A')
  assert.equal(fresh.nextSequence, 2)
  const created = ops.createConfirmedCompositeModule(deleted, fresh, idFactory)
  assert.equal(created.snapshot.modulesById[created.moduleId].sequence, 2)
  const other = fixture()
  assert.throws(() => ops.createConfirmedCompositeModule(other, request, idFactory), /променени/)
  const sourceDeleted = ops.editProject(snapshot, (next) => ops.replaceFreeModules(next, model.getFreeModules(next).filter((m) => m.id !== 'A')))
  assert.throws(() => ops.createConfirmedCompositeModule(sourceDeleted, request, idFactory), /променени/)
})

// Real App, entry, workspace and Constructor render/event functions; no browser/effects.
function harness() {
  let host
  const react = {
    useState(initial) { const current = host, index = current.index++
      if (!(index in current.values)) current.values[index] = typeof initial === 'function' ? initial() : initial
      return [current.values[index], (next) => { current.values[index] = typeof next === 'function' ? next(current.values[index]) : next }] },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0] },
    useMemo(compute) { return compute() }, useEffect() {},
  }
  const runtime = createRuntimeLoader({ react })
  return { load: runtime, mount(component) {
    const state = { index: 0, values: [] }
    return (props) => { host = state; state.index = 0; return component(props) }
  } }
}
function nodes(tree) { return Array.isArray(tree) ? tree.flatMap(nodes) : !tree || typeof tree !== 'object' ? [] : [tree, ...nodes(tree.props?.children)] }
function text(tree) { return Array.isArray(tree) ? tree.map(text).join('') : tree == null || typeof tree === 'boolean' ? '' : typeof tree === 'object' ? text(tree.props?.children) : String(tree) }
function click(tree, label) {
  const button = nodes(tree).find((n) => n.type === 'button' && text(n) === label)
  assert.ok(button && !button.props.disabled, label); button.props.onClick()
}
test('initial Constructor seed from form dimensions is local and does not occupy persisted module', () => {
  const snapshot = ops.editProject(fixture('offer', false), (next) => {
    const draft = next.modulesById.C.definition.draft
    draft.widthMm = 1500; draft.heightMm = 1500; draft.widthSource = 'preset'; draft.heightSource = 'preset'
  }), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(snapshot)
  const previous = globalThis.window; globalThis.window = { localStorage: memory }
  try {
    const h = harness(), App = h.load('src/App').default, Shell = h.load('src/components/ConstructorShell').default
    const tree = h.mount(App)(), props = nodes(tree).find((n) => n.type === Shell).props
    let writes = 0
    h.mount(Shell)({ ...props, onDraftChange: () => { writes++ } })
    assert.equal(writes, 0)
    assert.equal(guard.needsCompositeModuleGuard(storage.load(), 'C'), false)
    assert.equal(storage.load().constructionDraftsByModuleId.C, null)
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})
for (const mode of ['free', 'offer']) {
  test(`${mode}: actual App entry Cancel leaves persisted bytes/active/count unchanged; Confirm opens new editor`, () => {
    const original = fixture(mode), id = mode === 'free' ? 'A' : 'C'
    const memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
    storage.save(original)
    const previous = globalThis.window; globalThis.window = { localStorage: memory }
    try {
      const h = harness(), App = h.load('src/App').default, Entry = h.load('src/components/CompositeModuleEntry').CompositeModuleEntry
      const Panel = h.load('src/components/CompositeModuleStructurePanel').CompositeModuleStructurePanel
      const renderApp = h.mount(App), renderEntry = h.mount(Entry)
      let app = renderApp(), entryProps = nodes(app).find((n) => n.type === Entry).props
      const before = [...memory.data], writes = memory.writes
      let entry = renderEntry(entryProps)
      click(entry, 'Структура на модула · Модул 1'); entry = renderEntry(entryProps)
      assert.ok(text(entry).includes('Модул 1 вече съдържа конструкция'))
      assert.deepEqual(nodes(entry).filter((n) => n.type === 'dialog').flatMap((n) => nodes(n).filter((child) => child.type === 'button').map(text)),
        [`Създай Модул ${guard.proposeCompositeModule(original, id).nextSequence}`, 'Отказ'])
      assert.deepEqual([...memory.data], before)
      click(entry, 'Отказ'); entry = renderEntry(entryProps)
      assert.ok(!nodes(entry).some((n) => n.type === 'dialog'))
      assert.deepEqual([...memory.data], before)
      assert.equal(memory.writes, writes)
      assert.deepEqual(storage.load(), original)
      assert.ok(!nodes(renderApp()).some((n) => n.type === Panel))
      click(entry, 'Структура на модула · Модул 1'); entry = renderEntry(entryProps)
      const label = `Създай Модул ${guard.proposeCompositeModule(original, id).nextSequence}`
      memory.fail = true; click(entry, label); entry = renderEntry(entryProps)
      assert.ok(nodes(entry).some((n) => n.props?.role === 'alert'))
      assert.deepEqual([...memory.data], before)
      const failedApp = renderApp()
      assert.ok(!nodes(failedApp).some((n) => n.type === Panel))
      assert.deepEqual(nodes(failedApp).find((n) => n.type === Entry).props.snapshot, original)
      memory.fail = false; click(entry, label); click(entry, label)
      app = renderApp()
      const saved = storage.load(), targetId = saved.workspace.activeModuleIdByOffer[original.modulesById[id].offerId]
      assert.notEqual(targetId, id)
      assert.equal(Object.keys(saved.modulesById).length, 4)
      assert.deepEqual(saved.modulesById[id], original.modulesById[id])
      assert.deepEqual(saved.constructionDraftsByModuleId[id], original.constructionDraftsByModuleId[id])
      assert.equal(saved.constructionDraftsByModuleId[targetId], null)
      const editor = nodes(app).find((n) => n.type === Panel)
      assert.ok(editor, 'App opens the editor after successful create')
      assert.equal(editor.props.moduleNumber, saved.modulesById[targetId].sequence)
      assert.equal(editor.props.initialValue, null)
      assert.equal(editor.props.onSave(structure(), null), null)
      assert.deepEqual(storage.load().modulesById[targetId].compositeStructure, structure())
      assert.equal(storage.load().modulesById[id].compositeStructure, undefined)
    } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
  })
}
test('entry opens empty and existing composite modules directly, without writes or new modules', () => {
  for (const [occupied, existing] of [[false, false], [false, true], [true, true]]) {
    const snapshot = fixture('free', occupied, existing), before = codec.serializeProject(snapshot)
    const h = harness(), Entry = h.load('src/components/CompositeModuleEntry').CompositeModuleEntry
    const render = h.mount(Entry)
    let opened = null, creates = 0
    const props = { snapshot, moduleId: 'A', onOpen: (id) => { opened = id }, onCreate: () => { creates++; throw Error('unexpected create') } }
    click(render(props), 'Структура на модула · Модул 1')
    assert.equal(opened, 'A'); assert.equal(creates, 0)
    assert.ok(!nodes(render(props)).some((n) => n.type === 'dialog'))
    assert.equal(codec.serializeProject(snapshot), before)
  }
})
test('stale UI confirmation and blocked storage create nothing', () => {
  const original = fixture(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(original)
  const previous = globalThis.window; globalThis.window = { localStorage: memory }
  try {
    const h = harness(), render = h.mount(h.load('src/hooks/useProjectWorkspace').useProjectWorkspace)
    let workspace = render(), request = guard.proposeCompositeModule(workspace.snapshot, 'A')
    workspace.setFreeModules((modules) => modules.filter((m) => m.id !== 'B')); workspace = render()
    const count = Object.keys(workspace.snapshot.modulesById).length, writes = memory.writes
    assert.match(workspace.confirmCompositeModule(request).error, /променени/)
    assert.equal(Object.keys(render().snapshot.modulesById).length, count); assert.equal(memory.writes, writes)
    memory.data.set(persistence.PROJECT_KEY_PREFIX + original.project.id, '{bad')
    const blocked = h.mount(h.load('src/hooks/useProjectWorkspace').useProjectWorkspace)()
    assert.match(blocked.confirmCompositeModule(request).error, /блокиран/)
    assert.equal(memory.writes, writes)
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})
test('stale confirm rejects changed active module, cleared construction, existing composite and changed system', () => {
  const original = fixture(), request = guard.proposeCompositeModule(original, 'A')
  for (const change of [
    (s) => { s.workspace.activeModuleIdByOffer[s.workspace.freeOfferId] = 'B' },
    (s) => { s.constructionDraftsByModuleId.A = null },
    (s) => { s.modulesById.A.compositeStructure = structure() },
    (s) => { s.modulesById.A.definition.profileSystemId = 'kmg-prestige-70' },
  ]) {
    const next = ops.editProject(original, change), before = codec.serializeProject(next)
    assert.throws(() => ops.createConfirmedCompositeModule(next, request, idFactory), /променени/)
    assert.equal(codec.serializeProject(next), before)
  }
})
test('workspace Save rechecks a conflict added after opening, then reuses the confirmed creation action', () => {
  const original = fixture('free', false), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(original)
  const previous = globalThis.window; globalThis.window = { localStorage: memory }
  try {
    const h = harness(), render = h.mount(h.load('src/hooks/useProjectWorkspace').useProjectWorkspace)
    let workspace = render()
    assert.equal(guard.proposeCompositeModule(workspace.snapshot, 'A'), null)
    const draft = structure()
    workspace.setFreeModuleSketchDrafts((drafts) => ({ ...drafts, A: fixture().constructionDraftsByModuleId.A }))
    workspace = render()
    workspace.saveNow(); workspace = render()
    const before = codec.serializeProject(workspace.snapshot), stored = [...memory.data], writes = memory.writes
    assert.match(workspace.saveCompositeStructure(original.project.id, 'A', draft, null), /вече съдържа конструкция/)
    assert.equal(codec.serializeProject(render().snapshot), before)
    assert.deepEqual([...memory.data], stored); assert.equal(memory.writes, writes)
    const result = workspace.confirmCompositeModule(guard.proposeCompositeModule(workspace.snapshot, 'A'))
    assert.equal(result.error, null)
    assert.equal(storage.load().modulesById.A.compositeStructure, undefined)
    assert.equal(storage.load().modulesById[result.moduleId].compositeStructure, undefined)
    assert.equal(storage.load().constructionDraftsByModuleId[result.moduleId], null)
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})
test('Escape cancels and failed creation callback keeps the dialog without opening a hidden editor', () => {
  const snapshot = fixture(), before = codec.serializeProject(snapshot)
  const h = harness(), render = h.mount(h.load('src/components/CompositeModuleEntry').CompositeModuleEntry)
  let opened = 0, attempted = 0
  const props = { snapshot, moduleId: 'A', onOpen: () => { opened++ },
    onCreate: () => { attempted++; return { moduleId: null, error: 'Неуспешно създаване.' } } }
  let tree = render(props); click(tree, 'Структура на модула · Модул 1'); tree = render(props)
  click(tree, 'Създай Модул 5'); tree = render(props)
  assert.equal(attempted, 1); assert.equal(opened, 0)
  assert.ok(text(tree).includes('Неуспешно създаване.'))
  let prevented = false
  nodes(tree).find((n) => n.type === 'dialog').props.onCancel({ preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  assert.ok(!nodes(render(props)).some((n) => n.type === 'dialog'))
  assert.equal(codec.serializeProject(snapshot), before)
})
test('first-save pointer failure leaves no hidden new module and retry creates exactly one', () => {
  const memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  const previous = globalThis.window; globalThis.window = { localStorage: memory }
  try {
    const h = harness(), render = h.mount(h.load('src/hooks/useProjectWorkspace').useProjectWorkspace)
    let workspace = render()
    workspace.setFreeModules(model.getFreeModules(fixture()))
    workspace = render(); workspace.setActiveFreeModuleId('A')
    workspace = render(); workspace.setFreeModuleSketchDrafts({ A: fixture().constructionDraftsByModuleId.A, B: null })
    workspace = render()
    const before = codec.serializeProject(workspace.snapshot), projectId = workspace.snapshot.project.id
    const request = guard.proposeCompositeModule(workspace.snapshot, 'A')
    assert.equal(memory.data.size, 0)
    memory.failPointer = true
    const result = workspace.confirmCompositeModule(request)
    assert.equal(result.moduleId, null); assert.match(result.error, /Нов модул не е създаден/)
    assert.equal(codec.serializeProject(render().snapshot), before)
    assert.equal(memory.getItem(persistence.ACTIVE_PROJECT_KEY), null)
    assert.equal(codec.serializeProject(storage.load(projectId)), before, 'only the original modules may have been persisted')
    memory.failPointer = false
    const retry = render().confirmCompositeModule(request)
    assert.equal(retry.error, null)
    const saved = storage.load()
    assert.equal(Object.keys(saved.modulesById).length, 3)
    assert.equal(saved.workspace.activeModuleIdByOffer[saved.workspace.freeOfferId], retry.moduleId)
    assert.equal(saved.constructionDraftsByModuleId[retry.moduleId], null)
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})
test('01D.1, Constructor renderer/topology and Model Library storage fingerprints are untouched', () => {
  const hashes = {
    'src/components/ConstructorShell.tsx': '4ca53b6f54553bbc320692f13abd67104711b1d400fc6b44a564b1aa70296dbc',
    'src/domain/compositeModuleStructure.ts': 'c27aeb815b993ba61420da66bceed9d186b343b3a3f9fd4050367caf47ebf249',
    'src/components/CompositeModuleStructurePanel.tsx': '7eb5a5f63f40e2c1e47a9b17d022e2db9c1a5120919c774685ed6d5093b16760',
    'src/components/compositeModuleStructureDraft.ts': '017d8aa7877720ff368acb1f6f5383a77f71e431c30a5856101557f3920a6f63',
    'src/domain/construction/constructionModel.ts': '238525a7a6587f3f0aa572ce6ebae48c86774522d68cdc2a44ba35785d655487',
    'src/domain/construction/fieldTopology.ts': '314ec981dddc033cd4a536ac31199892f6f88361ebe89f1d7263641a9380f1dd',
    'src/persistence/localModelLibraryStorage.ts': '62805b3f13cd6a75a0355e0199b1f1ee555d11d6772409e20fe7d4e1cf77643c',
  }
  for (const [path, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(read(path)).digest('hex'), hash, path)
  assert.doesNotMatch(read('src/domain/project/compositeModuleGuard.ts'), /modelId|fieldIds|xMm|yMm/)
  assert.doesNotMatch(read('src/components/CompositeModuleEntry.tsx'), /Презапиши|Конвертирай|Замени конструкцията/)
  assert.doesNotMatch(read('src/App.tsx'), /const nextSequence|createOfferModule\(/)
})
console.log(`COMPOSITE MODULE GUARD 01D.2A PASS: ${passed} cases`)
console.log('APPLICATION NOT STARTED\nNO BROWSER ACCEPTANCE\nNO CONSTRUCTOR SKETCH CHANGE\nNO FIELD INTEGRATION\nNO MODEL ASSIGNMENT\nOCCUPIED MODULE OVERWRITE = BLOCKED\nNEW MODULE CREATION = USER CONFIRMED')
