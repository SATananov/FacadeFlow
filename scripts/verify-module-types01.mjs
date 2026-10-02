import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const construction = load('src/domain/construction')
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const { LocalProjectStorage } = load('src/persistence/localProjectStorage')
const { MODULE_PRODUCT_TYPE_PRESETS } = load('src/domain/offerModules')
const composite = load('src/domain/compositeModuleStructure')
const editor = load('src/components/compositeModuleStructureDraft')
const { buildCompositeStructuralSketchProjection } = load('src/components/compositeStructuralSketchProjection')
const { CompositeStructuralSketch } = load('src/components/CompositeStructuralSketch')
const { getFieldSashRole } = load('src/domain/profileResolution')
const { getSystemSashConstructionRule } = load('src/data/profileSystems/systemConstructionRules')
const { deriveResolvedAssembly } = load('src/domain/assembly/resolveAssembly')
const { assessReadiness } = load('src/domain/assembly/assemblyReadiness')
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : []
const text = tree => Array.isArray(tree) ? tree.map(text).join(' ') : tree && typeof tree === 'object' ? text(tree.props?.children) : String(tree ?? '')
assert.deepEqual(MODULE_PRODUCT_TYPE_PRESETS.map(p => [p.id, p.labelBg]), [
  ['window', 'Прозорец'], ['terrace-door', 'Терасна врата'], ['door', 'Врата'],
])

// Exercise the actual Constructor component with deterministic React hooks.
// No browser layout or guessed profile geometry is simulated here.
const oldWindow = globalThis.window
globalThis.window = { requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {} }
let counter = 0
const id = () => `module-types-${++counter}`
const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
function fixture(mode) {
  const h = { slots: [], index: 0, effects: [], dirty: false, writes: 0 }
  const hooks = {
    useState(initial) {
      const i = h.index++
      if (!(i in h.slots)) h.slots[i] = typeof initial === 'function' ? initial() : initial
      return [h.slots[i], next => { const value = typeof next === 'function' ? next(h.slots[i]) : next; if (!Object.is(value, h.slots[i])) { h.slots[i] = value; h.dirty = true } }]
    },
    useRef(initial) { const i = h.index++; return h.slots[i] ??= { current: initial } },
    useMemo(fn, deps) { const i = h.index++; if (!same(h.slots[i]?.deps, deps)) h.slots[i] = { deps, value: fn() }; return h.slots[i].value },
    useEffect(fn, deps) { const i = h.index++; if (!same(h.slots[i], deps)) { h.slots[i] = deps; h.effects.push(fn) } },
  }
  const Shell = createRuntimeLoader({ react: hooks })('src/components/ConstructorShell.tsx').default
  const frame = { xMm: 0, yMm: 0, widthMm: 1800, heightMm: 2100 }
  const topology = construction.splitField(construction.createConstructionModel(frame), 'field-1', 'vertical', 800)
  h.draft = { version: 'constructor-01d', frame, topology }
  const props = {
    mode, activeModuleId: id(), moduleNumber: 1, initialDraft: h.draft,
    moduleSummary: { productType: null, productTypeLabel: 'Не е зададен', widthMm: 1800, heightMm: 2100 },
    onClose() {}, onModuleProductTypeChange(productType) { props.moduleSummary = { ...props.moduleSummary, productType }; h.dirty = true },
    onDraftChange(draft) { h.draft = draft; h.writes++ },
    onModuleSizeChange() { h.writes++ }, onFieldTopologyChange() { h.writes++ },
  }
  props.moduleItems = [{ id: props.activeModuleId, sequence: 1 }]
  h.render = () => {
    for (let n = 0; n < 20; n++) {
      h.index = 0; h.effects = []; h.dirty = false
      h.tree = Shell(props); h.effects.forEach(fn => fn())
      if (!h.dirty) return
    }
    throw Error('Constructor did not settle')
  }
  h.click = label => {
    const button = nodes(h.tree).find(n => n.type === 'button' && text(n).trim() === label)
    assert.ok(button, label); assert.ok(!button.props.disabled, label)
    button.props.onClick(); h.render()
  }
  h.type = () => props.moduleSummary.productType
  h.render()
  return h
}

class MemoryStorage {
  data = new Map()
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(k) { return this.data.get(k) ?? null }
  setItem(k, v) { this.data.set(k, v) }
  removeItem(k) { this.data.delete(k) }
}
function saveAndReopen(h, productType) {
  let snapshot = model.createProjectSnapshot(id)
  const moduleId = id()
  snapshot = ops.editProject(snapshot, next => {
    ops.replaceFreeModules(next, [{ id: moduleId, sequence: 1, profileSystemId: '', productType, profileResolution: null }])
    next.constructionDraftsByModuleId[moduleId] = structuredClone(h.draft)
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = moduleId
    next.workspace.screen = 'free-constructor'
  })
  const memory = new MemoryStorage()
  new LocalProjectStorage(() => memory).save(snapshot)
  const reopened = new LocalProjectStorage(() => memory).load(snapshot.project.id)
  assert.deepEqual(reopened, snapshot)
  const copied = ops.copyFreeModuleToOffer(reopened, moduleId, reopened.constructionDraftsByModuleId[moduleId], id)
  const offerModuleId = copied.workspace.activeModuleIdByOffer[copied.workspace.offerId]
  assert.equal(copied.modulesById[offerModuleId].definition.draft.productType, productType)
  assert.deepEqual(copied.constructionDraftsByModuleId[offerModuleId], h.draft)
  let result = copied
  for (const screen of ['offer-constructor', 'offer-setup', 'offer-constructor']) {
    result = ops.editProject(result, next => { next.workspace.screen = screen })
    new LocalProjectStorage(() => memory).save(result)
    result = new LocalProjectStorage(() => memory).load()
    assert.equal(result.modulesById[offerModuleId].definition.draft.productType, productType)
    assert.deepEqual(result.constructionDraftsByModuleId[offerModuleId], h.draft)
  }
  const invalid = structuredClone(result)
  invalid.modulesById[offerModuleId].definition.draft.productType = 'unknown-type'
  assert.throws(() => codec.serializeProject(invalid), /invalid enum/)
}

try {
  for (const mode of ['free', 'offer']) {
    const h = fixture(mode)
    const original = structuredClone(h.draft)
    const writes = h.writes
    for (const option of MODULE_PRODUCT_TYPE_PRESETS) {
      h.click(option.labelBg)
      assert.equal(h.type(), option.id)
      const groups = nodes(h.tree).filter(n => n.props?.['aria-label'] === 'Тип модул')
      assert.equal(groups.length, 1, 'Exactly one Constructor type selector')
      const selected = nodes(groups[0]).filter(n => n.type === 'button' && n.props['aria-pressed'] === true)
      assert.equal(selected.length, 1); assert.equal(text(selected[0]).trim(), option.labelBg)
      assert.deepEqual(h.draft, original, 'Changing intent must not rewrite dimensions, dividers or opening geometry')
      assert.equal(h.writes, writes, 'Type change alone publishes no geometry')
      saveAndReopen(h, option.id)
    }
    h.click('П-образна каса')
    assert.equal(h.draft.topology.frameEdges.bottom, 'none')
    assert.deepEqual(h.draft.frame, original.frame)
    assert.deepEqual(h.draft.topology.root, original.topology.root)
    saveAndReopen(h, 'door')
    h.click('Пълна каса')
    assert.equal(h.draft.topology.frameEdges.bottom, 'frame')
    h.click('↶ Отмени'); assert.equal(h.draft.topology.frameEdges.bottom, 'none')
    h.click('↷ Повтори'); assert.equal(h.draft.topology.frameEdges.bottom, 'frame')
    h.click('Терасна врата')
    assert.match(text(h.tree), /Нулев делител/); assert.match(text(h.tree), /NOT VERIFIED/)
    h.click('↶ Отмени'); assert.equal(h.type(), 'door')
    h.click('↷ Повтори'); assert.equal(h.type(), 'terrace-door')
    assert.deepEqual(h.draft.frame, original.frame)
    console.log(`PASS ${mode}: one selector, all types, dimensions preserved, P/full frame, undo/redo, storage and offer return`)
  }
} finally {
  if (oldWindow === undefined) delete globalThis.window
  else globalThis.window = oldWindow
}

// Reuse ZERO_DIVIDER as a relationship, with no ordinary divider/profile width.
const structure = composite.createCompositeModuleStructure({ systemId: 'kmg-prelude-60', frameParts: [
  { id: 'terrace', function: 'terrace-door', widthMm: 800, heightMm: 2100, frameProfileCode: null,
    frameSides: { left: true, top: true, right: true, bottom: false }, fieldIds: [], placement: { order: 1, verticalAlignment: 'TOP' } },
  { id: 'window', function: 'window', widthMm: 1000, heightMm: 1500, frameProfileCode: null,
    frameSides: { left: true, top: true, right: true, bottom: true }, fieldIds: [], placement: { order: 2, verticalAlignment: 'TOP' } },
], connections: [] })
const connected = editor.connectCompositeParts(structure, 'joint', 'window', 'terrace')
assert.equal(connected.error, null)
assert.deepEqual(connected.draft.connections, [{ id: 'joint', fromFramePartId: 'window', toFramePartId: 'terrace', kind: 'ZERO_DIVIDER' }])
const projection = buildCompositeStructuralSketchProjection(connected.draft)
assert.equal(projection.status, 'ready')
const marker = nodes(CompositeStructuralSketch({ projection, scale: 1, offset: { xPx: 0, yPx: 0 } })).find(n => n.props?.['data-connection-id'] === 'joint')
assert.equal(marker.props['data-zero-divider-anchor-id'], 'terrace', 'Marker stays on door side even when terrace part is leftmost')
assert.equal(composite.COMPOSITE_MODULE_STRUCTURE_SAFETY.zeroDividerExactGeometry, 'UNKNOWN')
for (const key of ['automaticGeometry', 'rulesValidated', 'machineReady']) assert.equal(composite.COMPOSITE_MODULE_STRUCTURE_SAFETY[key], false)
assert.equal(getFieldSashRole('terrace-door', 'operable'), null, 'No guessed sash profile role')
assert.equal(getSystemSashConstructionRule({ systemId: 'kmg-prelude-60', productType: 'terrace-door', frameProfileCode: '482.30', sashProfileCode: '482.05' }), null, 'Window reference rule is not generalized to terrace doors')
let snapshot = model.createProjectSnapshot(id)
snapshot = ops.editProject(snapshot, next => {
  ops.replaceFreeModules(next, [{ id: 'terrace-module', sequence: 1, profileSystemId: 'kmg-prelude-60', productType: 'terrace-door', profileResolution: null }])
})
snapshot = ops.saveModuleCompositeStructure(snapshot, 'terrace-module', connected.draft, null)
const restored = codec.deserializeProject(codec.serializeProject(snapshot))
assert.deepEqual(restored.modulesById['terrace-module'].compositeStructure, connected.draft)
const before = codec.serializeProject(restored)
const assembly = deriveResolvedAssembly(restored, 'terrace-module')
const gates = assessReadiness(assembly, restored)
assert.ok(gates.length > 0 && gates.every(gate => gate.status === 'BLOCKED'), 'No downstream gate becomes ready from module intent')
assert.equal(codec.serializeProject(restored), before)
const shell = readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const topbar = shell.slice(shell.indexOf('<header className="constructor-topbar">'), shell.indexOf('{showModuleStrip &&'))
assert.match(topbar, /renderModuleProductTypeResolution\(\)/, 'Type selector is always in the visible header, outside the inspector')
console.log('MODULE TYPES 01: PASS — explicit types, persistence, independent bottom-frame state, ZERO_DIVIDER relationship and fail-closed readiness')
