import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const { buildCompositeStructuralSketchProjection: project, selectModuleConstructorView: select } = load('src/components/compositeStructuralSketchProjection')
const { CompositeStructuralSketch: Sketch } = load('src/components/CompositeStructuralSketch')
const model = load('src/domain/project/projectModel'), ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization'), persistence = load('src/persistence/localProjectStorage')
const guard = load('src/domain/project/compositeModuleGuard'), construction = load('src/domain/construction')
const { createOfferModule } = load('src/domain/offerModules')
const { buildOfferModuleDefaults } = load('src/domain/offerModuleDefaults')
let passed = 0, sequence = 0
const idFactory = () => `view-${++sequence}`
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
function structure() {
  return { schemaVersion: 2, systemId: 'kmg-prelude-60', frameParts: [
    { id: 'window', function: 'window', widthMm: 1500, heightMm: 1500, frameProfileCode: '482.30', fieldIds: [],
      frameSides: { top: true, right: true, bottom: true, left: true }, placement: { order: 1, verticalAlignment: 'TOP' } },
    { id: 'door', function: 'door', widthMm: 700, heightMm: 2000, frameProfileCode: '482.20', fieldIds: [],
      frameSides: { top: true, right: true, bottom: false, left: true }, placement: { order: 2, verticalAlignment: 'TOP' } },
  ], connections: [{ id: 'zero', fromFramePartId: 'window', toFramePartId: 'door', kind: 'ZERO_DIVIDER' }] }
}
function fixture(mode = 'free', occupied = false, composite = true) {
  return ops.editProject(model.createProjectSnapshot(idFactory), (next) => {
    ops.replaceFreeModules(next, ['A', 'B'].map((id, i) => ({ id, sequence: i + 1, profileSystemId: 'kmg-prelude-60', productType: null, profileResolution: null })))
    const form = { ...model.EMPTY_OFFER, profileSystemId: 'kmg-prelude-60' }
    ops.writeOfferForm(next, form)
    ops.replaceOfferModules(next, [createOfferModule(buildOfferModuleDefaults(model.settingsFromForm(form)), 3, 'C')])
    const id = mode === 'free' ? 'A' : 'C'
    next.workspace.screen = mode === 'free' ? 'free-constructor' : 'offer-constructor'
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = 'A'
    next.workspace.activeModuleIdByOffer[next.workspace.offerId] = 'C'
    if (occupied) {
      let topology = construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1400 })
      topology = construction.splitField(topology, 'field-1', 'vertical', 700)
      next.constructionDraftsByModuleId[id] = { version: 'constructor-01d', frame: structuredClone(topology.frame), topology }
    }
    if (composite) next.modulesById[id].compositeStructure = structure()
  })
}
function nodes(tree) { return Array.isArray(tree) ? tree.flatMap(nodes) : !tree || typeof tree !== 'object' ? [] : [tree, ...nodes(tree.props?.children)] }
function text(tree) { return Array.isArray(tree) ? tree.map(text).join('') : tree == null || typeof tree === 'boolean' ? '' : typeof tree === 'object' ? text(tree.props?.children) : String(tree) }
const findClass = (tree, name) => nodes(tree).find((n) => n.props?.className?.split(' ').includes(name))
function click(tree, label) {
  const button = nodes(tree).find((n) => n.type === 'button' && (text(n) === label || n.props['aria-label'] === label))
  assert.ok(button && !button.props.disabled, label); button.props.onClick()
}
function harness() {
  let host
  const react = {
    useState(initial) { const state = host, index = state.index++
      if (!(index in state.values)) state.values[index] = typeof initial === 'function' ? initial() : initial
      return [state.values[index], (next) => { state.values[index] = typeof next === 'function' ? next(state.values[index]) : next }] },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0] },
    useMemo(compute) { return compute() },
    useEffect(effect) { host.effects.push(effect) },
  }
  return { load: createRuntimeLoader({ react }), mount(component) {
    const state = { index: 0, values: [], effects: [] }
    const render = (props) => { host = state; state.index = 0; state.effects = []; return component(props) }
    render.effects = () => state.effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === 'function')
    return render
  } }
}
class MemoryStorage {
  data = new Map(); writes = 0
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, value); this.writes++ }
  removeItem(key) { this.data.delete(key) }
}
function withStorage(snapshot, run) {
  const memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(snapshot)
  const previous = globalThis.window
  globalThis.window = { localStorage: memory }
  try { run(storage, memory) } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
}
function deepFreeze(value) { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child); return value }
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`)

test('TOP, proportions, nominal dimensions and Bulgarian labels; source is immutable', () => {
  const value = deepFreeze(structure()), before = JSON.stringify(value), result = project(value)
  assert.equal(result.status, 'ready')
  const [window, door] = result.parts
  assert.deepEqual(result.parts.map((p) => p.id), ['window', 'door'])
  assert.ok(window.x < door.x); near(window.y, door.y)
  near(window.width / door.width, 1500 / 700); near(window.height / door.height, 1500 / 2000)
  assert.equal(window.label, 'Прозорец'); assert.equal(door.label, 'Врата')
  assert.equal(window.dimensions, '1500 × 1500 mm'); assert.equal(door.dimensions, '700 × 2000 mm')
  assert.equal(JSON.stringify(value), before)
  assert.deepEqual(project(value), result)
})
test('array reordering is inert; explicit order swap reverses parts and keeps stable endpoints', () => {
  const value = structure(), before = project(value)
  value.frameParts.reverse(); assert.deepEqual(project(value), before)
  value.frameParts[0].placement.order = 1; value.frameParts[1].placement.order = 2
  const result = project(value)
  assert.deepEqual(result.parts.map((p) => p.id), ['door', 'window'])
  assert.equal(result.connections[0].fromId, 'window'); assert.equal(result.connections[0].toId, 'door')
  assert.ok(result.connections[0].fromX > result.connections[0].toX)
})
test('BOTTOM shares nominal bottoms; mixed alignment honors each part independently', () => {
  const value = structure(); value.frameParts.forEach((p) => { p.placement.verticalAlignment = 'BOTTOM' })
  let [a, b] = project(value).parts
  near(a.y + a.height, b.y + b.height); assert.ok(a.y > b.y)
  value.frameParts.push({ ...structuredClone(value.frameParts[0]), id: 'third', heightMm: 600, placement: { order: 3, verticalAlignment: 'TOP' } })
  const [bottom, tallest, top] = project(value).parts
  near(bottom.y + bottom.height, tallest.y + tallest.height); near(top.y, tallest.y)
})
test('N parts, gapped explicit orders and non-adjacent connections fit normalized view bounds', () => {
  const value = structure()
  for (let i = 2; i < 12; i++) value.frameParts.push({ ...structuredClone(value.frameParts[0]), id: `part-${i}`, placement: { order: i * 10, verticalAlignment: i % 2 ? 'BOTTOM' : 'TOP' } })
  value.connections.push({ id: 'far', fromFramePartId: 'window', toFramePartId: 'part-11', kind: 'ZERO_DIVIDER' })
  const result = project(value)
  assert.equal(result.parts.length, 12); assert.equal(result.connections.length, 2)
  near(Math.max(result.bounds.width, result.bounds.height), 2000)
  for (const p of result.parts) { assert.ok(p.x >= 0 && p.y >= 0); assert.ok(p.x + p.width <= result.bounds.width + 1e-9); assert.ok(p.y + p.height <= result.bounds.height + 1e-9) }
  assert.deepEqual(new Set(result.parts.map((p) => p.id)), new Set(value.frameParts.map((p) => p.id)))
})
for (const fn of ['window', 'door', null]) test(`all 16 explicit side combinations are rendered independently of function ${fn}`, () => {
  for (let mask = 0; mask < 16; mask++) {
    const value = structure(), part = value.frameParts[0]; part.function = fn
    const sides = ['top', 'right', 'bottom', 'left']
    sides.forEach((side, i) => { part.frameSides[side] = Boolean(mask & (1 << i)) })
    const tree = Sketch({ projection: project(value), scale: 0.28, offset: { xPx: 10, yPx: 15 } })
    const rendered = nodes(tree).find((n) => n.props?.['data-frame-part-id'] === part.id)
    assert.deepEqual(nodes(rendered).filter((n) => n.props?.['data-frame-side']).map((n) => n.props['data-frame-side']), sides.filter((side) => part.frameSides[side]))
    assert.ok(!nodes(rendered).some((n) => n.type === 'rect' || n.type === 'button' || n.props?.onPointerDown))
  }
})
test('connections are explicit ID relationships only; adjacency invents none', () => {
  const value = structure(), result = project(value)
  let tree = Sketch({ projection: result, scale: 0.28, offset: { xPx: 0, yPx: 0 } })
  assert.equal(nodes(tree).filter((n) => n.props?.['data-connection-id']).length, 1)
  assert.ok(text(tree).includes('Нулев делител'))
  const connection = result.connections[0]
  assert.deepEqual(Object.keys(connection).sort(), ['id', 'fromId', 'toId', 'fromX', 'fromY', 'toX', 'toY', 'laneY'].sort())
  value.connections = []; tree = Sketch({ projection: project(value), scale: 1, offset: { xPx: 0, yPx: 0 } })
  assert.equal(nodes(tree).filter((n) => n.type === 'path').length, 0)
  assert.ok(!text(tree).includes('Нулев делител'))
  assert.match(read('src/components/CompositeStructuralSketch.css'), /stroke-dasharray:/)
})
test('missing order or alignment and schema v1 show unresolved without any layout', () => {
  for (const key of ['order', 'verticalAlignment']) for (let i = 0; i < 2; i++) {
    const value = structure(); value.frameParts[i].placement[key] = null
    const result = project(value); assert.equal(result.status, 'unresolved'); assert.equal(result.parts, undefined)
    const tree = Sketch({ projection: result, scale: 1, offset: { xPx: 0, yPx: 0 } })
    assert.ok(text(tree).includes('Позицията на рамковите части не е определена.'))
    assert.ok(text(tree).includes('Отвори „Структура на модула“ и подреди рамковите части.'))
    assert.ok(!nodes(tree).some((n) => n.props?.['data-frame-part-id']))
  }
  const legacy = structure(); legacy.schemaVersion = 1; legacy.frameParts.forEach((p) => { delete p.placement })
  assert.equal(project(legacy).status, 'unresolved'); assert.equal(legacy.schemaVersion, 1)
})
test('empty and malformed inputs give messages without fabricated rectangles', () => {
  assert.equal(project({ ...structure(), frameParts: [] }).message, 'Добави рамкови части от „Структура на модула“.')
  const mutations = [(v) => { v.frameParts[0].widthMm = NaN }, (v) => { v.frameParts[0].heightMm = -1 },
    (v) => { v.frameParts[0].placement.order = 2 }, (v) => { v.connections[0].toFramePartId = 'absent' },
    (v) => { v.frameParts[0].frameSides = {} }, (v) => { v.schemaVersion = 999 }]
  for (const value of [null, {}, ...mutations.map((fn) => { const v = structure(); fn(v); return v })]) {
    const result = project(value); assert.equal(result.status, 'invalid'); assert.equal(result.parts, undefined)
    assert.equal(result.message, 'Структурата на модула изисква преглед.')
  }
})
for (const mode of ['free', 'offer']) {
  test(`${mode}: canonical occupancy chooses legacy/history/composite without changing project or guard`, () => {
    for (const occupied of [false, true]) for (const composite of [false, true]) {
      const snapshot = fixture(mode, occupied, composite), id = mode === 'free' ? 'A' : 'C', before = codec.serializeProject(snapshot)
      const result = select(snapshot, id)
      assert.equal(result.kind, composite && !occupied ? 'composite' : 'legacy')
      if (result.kind === 'legacy') assert.equal(result.historicalConflict, composite && occupied)
      assert.equal(guard.hasModuleConstructorConstruction(snapshot, id), occupied)
      assert.equal(codec.serializeProject(snapshot), before)
      assert.equal(codec.serializeProject(codec.deserializeProject(before)), before)
    }
    assert.equal(select(fixture(mode), 'missing').kind, 'legacy')
  })
  test(`${mode}: real App binds canonical active identity and suppresses form seed only in composite view`, () => {
    const snapshot = fixture(mode), id = mode === 'free' ? 'A' : 'C'
    if (mode === 'offer') { snapshot.modulesById.C.definition.draft.widthMm = 1500; snapshot.modulesById.C.definition.draft.heightMm = 1500 }
    withStorage(snapshot, (storage, memory) => {
      const h = harness(), Shell = h.load('src/components/ConstructorShell').default
      const app = h.mount(h.load('src/App').default)(), props = nodes(app).find((n) => n.type === Shell).props
      assert.equal(props.activeModuleId, id); assert.equal(props.constructorView.kind, 'composite')
      const before = [...memory.data], tree = h.mount(Shell)(props)
      assert.equal(nodes(tree).filter((n) => n.props?.className?.split(' ').includes('constructor-canvas')).length, 1)
      assert.equal(findClass(tree, 'constructor-parametric-frame'), undefined)
      assert.equal(findClass(tree, 'constructor-field-details-panel'), undefined)
      assert.ok(!nodes(tree).some((n) => n.props?.onChange || n.props?.className === 'constructor-reset-sketch'))
      assert.deepEqual([...memory.data], before); assert.equal(storage.load().constructionDraftsByModuleId[id], null)
    })
  })
  test(`${mode}: real editor Cancel keeps canvas; Save updates canonical projection in same module and reload`, () => {
    const snapshot = fixture(mode), id = mode === 'free' ? 'A' : 'C'
    withStorage(snapshot, (storage, memory) => {
      const h = harness(), App = h.load('src/App').default, Shell = h.load('src/components/ConstructorShell').default
      const Entry = h.load('src/components/CompositeModuleEntry').CompositeModuleEntry
      const Panel = h.load('src/components/CompositeModuleStructurePanel').CompositeModuleStructurePanel
      const app = h.mount(App), before = [...memory.data]
      const initialProjection = nodes(app()).find((n) => n.type === Shell).props.constructorView.projection
      for (const action of ['Откажи', 'Запази']) {
        const entryProps = nodes(app()).find((n) => n.type === Entry).props
        const entry = h.mount(Entry)(entryProps); click(entry, `Структура на модула · Модул ${snapshot.modulesById[id].sequence}`)
        const panelProps = nodes(app()).find((n) => n.type === Panel).props, renderPanel = h.mount(Panel)
        let panel = renderPanel(panelProps)
        nodes(panel).find((n) => n.props?.id === 'composite-width-window').props.onChange({ target: { value: '1700', valueAsNumber: 1700 } })
        panel = renderPanel(panelProps); click(panel, action)
        const shell = nodes(app()).find((n) => n.type === Shell)
        assert.equal(shell.props.activeModuleId, id)
        if (action === 'Откажи') { assert.deepEqual([...memory.data], before); assert.deepEqual(shell.props.constructorView.projection, initialProjection) }
        else { assert.equal(shell.props.constructorView.projection.parts[0].dimensions, '1700 × 1500 mm'); assert.deepEqual(select(storage.load(), id), shell.props.constructorView) }
      }
      const saved = storage.load()
      assert.deepEqual(saved.constructionDraftsByModuleId, snapshot.constructionDraftsByModuleId)
      assert.equal(Object.keys(saved.modulesById).length, Object.keys(snapshot.modulesById).length)
      assert.deepEqual(saved.modulesById.B, snapshot.modulesById.B)
      assert.doesNotMatch(JSON.stringify(saved.modulesById[id].compositeStructure), /"(?:x|y|scale|bounds|laneY|modelId)"/)
    })
  })
}

test('shared fit/zoom/pan and effects are view-only; keyboard history cannot create topology', () => {
  const h = harness(), Shell = h.load('src/components/ConstructorShell').default, render = h.mount(Shell)
  const projection = project(structure()), events = new Map(), previous = globalThis.window
  let writes = 0
  globalThis.window = { requestAnimationFrame(fn) { fn(); return 1 }, cancelAnimationFrame() {},
    addEventListener(name, fn) { events.set(name, fn) }, removeEventListener(name) { events.delete(name) } }
  try {
    const props = { mode: 'free', activeModuleId: 'view-only', moduleItems: [{ id: 'view-only', sequence: 1 }],
      constructorView: { kind: 'composite', projection }, onClose() {}, onDraftChange() { writes++ }, onProfileResolutionChange() { writes++ } }
    let tree = render(props), canvas = findClass(tree, 'constructor-canvas')
    const element = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 620 }), setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return true } }
    canvas.props.ref.current = element
    const cleanups = render.effects(); tree = render(props)
    const sketchNode = () => nodes(tree).find((n) => n.props?.projection === projection)
    let view = sketchNode().props
    assert.ok(view.offset.xPx >= 0 && view.offset.yPx >= 0)
    assert.ok(view.offset.xPx + projection.bounds.width * view.scale < 900)
    assert.ok(view.offset.yPx + projection.bounds.height * view.scale < 620)
    const fittedScale = view.scale
    click(tree, 'Увеличи мащаба'); tree = render(props); assert.ok(sketchNode().props.scale > fittedScale)
    click(tree, 'Панорама'); tree = render(props); canvas = findClass(tree, 'constructor-canvas')
    const pointer = { pointerId: 7, clientX: 10, clientY: 20, currentTarget: element, preventDefault() {} }
    canvas.props.onPointerDownCapture(pointer); tree = render(props)
    const oldOffset = sketchNode().props.offset
    findClass(tree, 'constructor-canvas').props.onPointerMove({ ...pointer, clientX: 40, clientY: 70 })
    tree = render(props); view = sketchNode().props
    assert.equal(view.offset.xPx, oldOffset.xPx + 30); assert.equal(view.offset.yPx, oldOffset.yPx + 50)
    findClass(tree, 'constructor-canvas').props.onPointerUp(pointer); tree = render(props)
    click(tree, 'Побери'); tree = render(props); near(sketchNode().props.scale, fittedScale)
    for (const key of ['z', 'y', 'Delete']) events.get('keydown')({ key, ctrlKey: true, preventDefault() { throw Error('composite must not handle editing keys') } })
    assert.equal(writes, 0)
    cleanups.forEach((fn) => fn())
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('legacy historical canvas keeps FIELD/divider/resize/opening controls and emits no mount replacement', () => {
  for (const mode of ['free', 'offer']) {
    const snapshot = fixture(mode, true, true), id = mode === 'free' ? 'A' : 'C', h = harness()
    const Shell = h.load('src/components/ConstructorShell').default
    let writes = 0
    const tree = h.mount(Shell)({ mode, activeModuleId: id, moduleItems: [{ id, sequence: 1 }], constructorView: select(snapshot, id),
      initialDraft: snapshot.constructionDraftsByModuleId[id], onClose() {}, onDraftChange() { writes++ } })
    assert.ok(findClass(tree, 'constructor-parametric-frame')); assert.ok(findClass(tree, 'constructor-field-details-panel'))
    assert.ok(nodes(tree).some((n) => n.props?.className?.includes('constructor-divider')))
    assert.ok(nodes(tree).some((n) => n.props?.className?.includes('constructor-edge-handle')))
    assert.ok(nodes(tree).some((n) => n.type === 'button' && text(n).includes('Отваряемо поле') && !n.props.disabled))
    assert.ok(text(tree).includes('Показана е записаната конструкция')); assert.equal(writes, 0)
    assert.ok(findClass(findClass(tree, 'constructor-topbar'), 'composite-sketch-note'), 'conflict note stays inside header, preserving shell grid rows')
  }
})

test('projection has no persistence or engineering integration; original legacy frame rendering stays byte-identical', () => {
  const source = read('src/components/compositeStructuralSketchProjection.ts')
  assert.doesNotMatch(source, /localStorage|sessionStorage|ConstructionModel|createConstruction|splitField|modelId|xMm|yMm|offsetMm|overlapMm|insetMm/)
  const shell = read('src/components/ConstructorShell.tsx')
  const legacyFrame = shell.slice(shell.indexOf('                className={frameClassName}'), shell.indexOf('\n          {!isCompositeView && frame && dragState'))
  assert.equal(createHash('sha256').update(legacyFrame).digest('hex'), '4265dc12fd9ca4a3d0dc30d6f04ee72dc9d11714a63f9e08655d4a12542d08a2')
})
console.log(`COMPOSITE MODULE VIEW 01D.2B PASS: ${passed} cases`)
console.log('APPLICATION NOT STARTED\nNO BROWSER ACCEPTANCE\nSTRUCTURAL SKETCH PROJECTION = VIEW ONLY\nNO CONSTRUCTOR TOPOLOGY REPLACEMENT\nNO FIELD INTEGRATION\nNO MODEL ASSIGNMENT\nNO PRODUCTION GEOMETRY FROM SKETCH\nAUTOMATIC GEOMETRY = NO\nAUTOMATIC PLACEMENT = NO\nFRAME PART PLACEMENT = HUMAN DEFINED\nRULES VALIDATED = NO\nMACHINE READY = NO\nZERO DIVIDER EXACT GEOMETRY = UNKNOWN\nFRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW\nEXACT CUT / OVERLAP / INSET = UNKNOWN')
