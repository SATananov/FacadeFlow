import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const domain = load('src/domain/compositeModuleStructure')
const ui = load('src/components/compositeModuleStructureDraft')
const { profileSystemCatalog: systems } = load('src/data/profileSystems/catalog')
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
let passed = 0
function test(name, run) { run(); passed++; console.log(`PASS ${name}`) }
function example() {
  let draft = ui.changeCompositeSystem(ui.emptyCompositeDraft(), 'kmg-prelude-60')
  draft = ui.addCompositeFramePart(draft, 'window-part')
  draft = ui.addCompositeFramePart(draft, 'door-part')
  return { ...draft, frameParts: draft.frameParts.map((part, index) => ({ ...part,
    function: index ? 'door' : 'window', widthMm: index ? 700 : 1500, heightMm: index ? 2000 : 1500,
    frameProfileCode: index ? '482.20' : '482.30', frameSides: { ...part.frameSides, bottom: !index },
  })) }
}

test('empty state and new parts require manual system/function/profile/dimensions', () => {
  const draft = ui.emptyCompositeDraft()
  assert.equal(draft.systemId, '')
  assert.equal(draft.frameParts.length, 0)
  assert.equal(ui.compositeDraftProblem(draft), 'Избери система.')
  const next = ui.addCompositeFramePart(ui.changeCompositeSystem(draft, systems[0].id), 'explicit-id')
  const part = next.frameParts[0]
  assert.equal(part.id, 'explicit-id')
  assert.equal(part.function, null)
  assert.equal(part.frameProfileCode, null)
  assert.ok(Number.isNaN(part.widthMm) && Number.isNaN(part.heightMm))
  assert.deepEqual(part.fieldIds, [])
  assert.deepEqual(part.frameSides, { top: true, right: true, bottom: true, left: true })
  assert.match(ui.compositeDraftProblem(next), /ширина/)
  assert.equal(draft.frameParts.length, 0)
})
test('candidate options come exclusively from selected system and catalogue frame role', () => {
  assert.deepEqual(ui.compositeFrameCandidates(''), [])
  for (const system of systems) {
    assert.deepEqual(ui.compositeFrameCandidates(system.id), system.mainProfiles.filter((profile) => profile.role === 'frame'))
  }
})
test('system switch clears incompatible profiles while preserving sides/dimensions/connections', () => {
  const original = ui.connectCompositeParts(example(), 'link', 'window-part', 'door-part').draft
  const before = structuredClone(original)
  const next = ui.changeCompositeSystem(original, 'kmg-prestige-70')
  assert.deepEqual(next.frameParts.map((part) => part.frameProfileCode), [null, null])
  assert.deepEqual(next.frameParts.map(({ frameProfileCode: _profile, ...part }) => part), original.frameParts.map(({ frameProfileCode: _profile, ...part }) => part))
  assert.deepEqual(next.connections, original.connections)
  assert.deepEqual(ui.changeCompositeSystem(original, original.systemId), original)
  assert.deepEqual(original, before)
  assert.deepEqual(ui.changeCompositeSystem(original, '').frameParts.map((part) => part.frameProfileCode), [null, null])
})
test('explicit unequal WINDOW/DOOR sizes and open bottom satisfy unchanged 01A validation', () => {
  const draft = example()
  domain.validateCompositeModuleStructure(draft)
  assert.equal(ui.compositeDraftProblem(draft), null)
  assert.deepEqual(draft.frameParts.map((part) => [part.widthMm, part.heightMm]), [[1500, 1500], [700, 2000]])
  assert.equal(draft.frameParts[1].frameSides.bottom, false)
})
test('invalid dimensions receive Bulgarian guidance instead of raw domain errors', () => {
  for (const field of ['widthMm', 'heightMm']) {
    for (const value of [NaN, Infinity, -Infinity, 0, -50]) {
      const draft = example()
      draft.frameParts[1][field] = value
      assert.match(ui.compositeDraftProblem(draft), /Рамкова част 2: въведи/)
    }
  }
})
test('ZERO_DIVIDER, self/missing/duplicate rejection and human error messages', () => {
  const draft = example()
  const valid = ui.connectCompositeParts(draft, 'link', 'window-part', 'door-part')
  assert.equal(valid.error, null)
  assert.deepEqual(valid.draft.connections, [{ id: 'link', fromFramePartId: 'window-part', toFramePartId: 'door-part', kind: 'ZERO_DIVIDER' }])
  for (const [from, to, expected] of [
    ['window-part', 'window-part', /две различни/], ['window-part', 'absent', /две съществуващи/], ['', '', /две съществуващи/],
  ]) {
    const result = ui.connectCompositeParts(draft, 'link', from, to)
    assert.equal(result.draft, draft)
    assert.match(result.error, expected)
  }
  const duplicate = ui.connectCompositeParts(valid.draft, 'link2', 'door-part', 'window-part')
  assert.equal(duplicate.draft, valid.draft)
  assert.match(duplicate.error, /вече има връзка/)
})
test('deleting a part removes all its connections and preserves unrelated parts/links', () => {
  let draft = example()
  draft.frameParts = [...draft.frameParts, { ...draft.frameParts[0], id: 'third-part' }]
  draft = ui.connectCompositeParts(draft, 'link1', 'window-part', 'door-part').draft
  draft = ui.connectCompositeParts(draft, 'link2', 'window-part', 'third-part').draft
  draft = ui.connectCompositeParts(draft, 'link3', 'door-part', 'third-part').draft
  const before = structuredClone(draft)
  const next = ui.removeCompositeFramePart(draft, 'window-part')
  assert.deepEqual(next.connections.map((connection) => connection.id), ['link3'])
  domain.validateCompositeModuleStructure(next)
  assert.deepEqual(draft, before)
})
test('UI helper delegates validation to 01A including foreign profiles and malformed sides', () => {
  let calls = 0
  const observed = createRuntimeLoader({ '../domain/compositeModuleStructure': { ...domain,
    validateCompositeModuleStructure(value) { calls++; domain.validateCompositeModuleStructure(value) },
  } })('src/components/compositeModuleStructureDraft')
  assert.equal(observed.compositeDraftProblem(example()), null)
  const foreign = example()
  foreign.frameParts[0].frameProfileCode = '549.15'
  assert.match(observed.compositeDraftProblem(foreign), /касa|касовите профили/)
  foreign.frameParts[0].frameProfileCode = '482.05'
  assert.match(observed.compositeDraftProblem(foreign), /касовите профили/)
  const malformed = example()
  delete malformed.frameParts[0].frameSides.bottom
  assert.match(observed.compositeDraftProblem(malformed), /невалидни данни/)
  assert.equal(calls, 4)
})

// Element/event harness, not React DOM or browser acceptance. It tests the actual
// panel handlers with an in-memory useState implementation and explicit events.
function panelHarness() {
  let systemId = 'kmg-prelude-60'
  let slots = [], cursor = 0, tree
  const react = { useState(initial) {
    const index = cursor++
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
  } }
  const Panel = createRuntimeLoader({ react })('src/components/CompositeModuleStructurePanel').CompositeModuleStructurePanel
  function render() { cursor = 0; tree = Panel({ moduleNumber: 1, systemId, initialValue: null, onSave: () => null, onCancel: () => {} }) }
  function elements(node = tree) {
    if (Array.isArray(node)) return node.flatMap((child) => elements(child))
    if (!node || typeof node !== 'object') return []
    return [node, ...elements(node.props?.children ?? null)]
  }
  function text(node = tree) {
    if (node === null || node === undefined || typeof node === 'boolean') return ''
    if (Array.isArray(node)) return node.map((child) => text(child)).join('')
    return typeof node === 'object' ? text(node.props?.children ?? null) : String(node)
  }
  const byId = (id) => { const node = elements().find((element) => element.props?.id === id); assert.ok(node, id); return node }
  const change = (id, value) => { byId(id).props.onChange({ target: { value, valueAsNumber: value === '' ? NaN : Number(value), checked: value } }); render() }
  const click = (label) => { const button = elements().find((element) => element.type === 'button' && text(element) === label); assert.ok(button, label); assert.ok(!button.props.disabled); button.props.onClick(); render() }
  render()
  return { byId, change, click, elements, text, draft: () => slots[1], remount(nextSystem = systemId) { systemId = nextSystem; slots = []; render() } }
}
test('panel workflow: two parts, independent sides and dimensions, ZERO_DIVIDER and summary', () => {
  const h = panelHarness()
  assert.equal(h.byId('composite-system').props.value, 'PRELUDE 60')
  assert.equal(h.byId('composite-system').props.readOnly, true)
  h.click('Добави рамкова част')
  h.click('Добави рамкова част')
  const [windowId, doorId] = h.draft().frameParts.map((part) => part.id)
  assert.notEqual(windowId, doorId)
  for (const [id, func, width, height, profile] of [[windowId, 'window', 1500, 1500, '482.30'], [doorId, 'door', 700, 2000, '482.20']]) {
    assert.equal(h.byId(`composite-profile-${id}`).props.value, '')
    h.change(`composite-function-${id}`, func)
    h.change(`composite-width-${id}`, String(width))
    h.change(`composite-height-${id}`, String(height))
    h.change(`composite-profile-${id}`, profile)
  }
  h.change(`composite-bottom-${doorId}`, false)
  const sideSelection = structuredClone(h.draft().frameParts[1].frameSides)
  h.change(`composite-function-${doorId}`, 'window')
  assert.deepEqual(h.draft().frameParts[1].frameSides, sideSelection)
  h.change(`composite-function-${doorId}`, 'door')
  assert.deepEqual(h.draft().frameParts[1].frameSides, sideSelection)
  for (const side of ['top', 'right', 'bottom', 'left']) assert.equal(h.byId(`composite-${side}-${doorId}`).props.type, 'checkbox')
  h.change('composite-from', windowId)
  h.change('composite-to', windowId)
  h.click('Добави връзка')
  assert.equal(h.draft().connections.length, 0)
  assert.ok(h.elements().some((node) => node.props?.role === 'alert' && h.text(node).includes('две различни')))
  h.change('composite-to', doorId)
  h.click('Добави връзка')
  domain.validateCompositeModuleStructure(h.draft())
  assert.equal(h.draft().connections[0].kind, 'ZERO_DIVIDER')
  const summary = h.elements().find((node) => node.type === 'aside')
  for (const expected of ['PRELUDE 60', '1500 × 1500 mm', '700 × 2000 mm', '482.30', '482.20', 'Долу: няма каса', 'Нулев делител', 'Структурно дефинирано']) assert.ok(h.text(summary).includes(expected), expected)
  assert.ok(h.draft().frameParts.every((part) => part.fieldIds.length === 0))
  const options = h.elements(h.byId(`composite-profile-${doorId}`)).filter((node) => node.type === 'option' && node.props.value)
  assert.deepEqual(options.map((node) => node.props.value), ui.compositeFrameCandidates('kmg-prelude-60').map((profile) => profile.code))
  h.change('composite-from', windowId)
  h.change('composite-to', doorId)
  h.click('Изтрий рамкова част 1')
  assert.equal(h.draft().connections.length, 0)
  assert.equal(h.draft().frameParts[0].id, doorId)
  assert.equal(h.byId('composite-from').props.value, '')
  assert.equal(h.byId('composite-to').props.value, doorId)
  h.change(`composite-width-${doorId}`, '')
  assert.ok(Number.isNaN(h.draft().frameParts[0].widthMm))
  assert.ok(!h.text().includes('Структурно дефинирано'))
  h.remount('')
  assert.equal(h.draft().frameParts.length, 0)
  assert.equal(h.draft().systemId, '')
})
test('source contracts: 01A reuse, isolated navigation, no geometry/models/persistence claims', () => {
  const panel = read('src/components/CompositeModuleStructurePanel.tsx')
  const adapter = read('src/components/compositeModuleStructureDraft.ts')
  const app = read('src/App.tsx')
  assert.match(panel, /type \{ CompositeFramePart, CompositeModuleStructure, FrameSides \} from '\.\.\/domain\/compositeModuleStructure'/)
  assert.match(adapter, /validateCompositeModuleStructure\(draft\)/)
  assert.doesNotMatch(app, /id: 'composite-structure'/)
  assert.match(app, /<CompositeModuleStructurePanel key=/)
  assert.match(app, /<CompositeModuleEntry/)
  assert.match(read('src/components/CompositeModuleEntry.tsx'), /Структура на модула · Модул/)
  for (const source of [panel, adapter]) {
    assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|modelId|ConstructorShell|ProjectSnapshot|window\.open/)
    assert.doesNotMatch(source, /(?:type|interface) (?:CompositeModuleStructure|CompositeFramePart|FrameSides|FramePartConnection)\s*[={]/)
    assert.doesNotMatch(source, /Готово за производство|Валидна сглобка|Автоматично одобрено/)
  }
  assert.match(panel, /Точната геометрия на връзката не е определена/)
  assert.match(panel, /Съвместимостта между касите изисква човешка проверка/)
  assert.match(panel, /Промените се записват в проекта само с „Запази“/)
  assert.match(adapter, /fieldIds: \[\]/)
  for (const [source, expected] of [[adapter, ['../data/profileSystems/catalog', '../domain/compositeModuleStructure']],
    [panel, ['react', '../data/profileSystems/catalog', './compositeModuleStructureDraft', './CompositeModuleStructurePanel.css']]]) {
    const ast = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true)
    const imports = ast.statements.filter(ts.isImportDeclaration).filter((node) => !node.importClause?.isTypeOnly).map((node) => node.moduleSpecifier.text)
    assert.deepEqual(imports, expected)
  }
})
test('storage adapters retain approved checkpoint content; 01A and 01D.1 cover the versioned domain', () => {
  const baseline = {
    'src/persistence/localProjectStorage.ts': '5f49043f6edc4b068853c6bce85fdbc35799975b5e475bd5bcf731b12ca660e7',
    'src/persistence/localModelLibraryStorage.ts': '62805b3f13cd6a75a0355e0199b1f1ee555d11d6772409e20fe7d4e1cf77643c',
  }
  for (const [path, hash] of Object.entries(baseline)) assert.equal(createHash('sha256').update(read(path)).digest('hex'), hash, path)
  assert.deepEqual(domain.COMPOSITE_MODULE_STRUCTURE_SAFETY, {
    automaticGeometry: false, rulesValidated: false, machineReady: false,
    zeroDividerExactGeometry: 'UNKNOWN', frameToFrameCompatibility: 'HUMAN REVIEW', exactCutOverlapInset: 'UNKNOWN',
    automaticPlacement: false, framePartPlacement: 'HUMAN DEFINED',
  })
})
console.log(`COMPOSITE MODULE STRUCTURE 01B PASS: ${passed} cases`)
console.log('NO BROWSER ACCEPTANCE: pure functions/source contracts and event harness only; visual/input interaction awaits manual acceptance.')
console.log('AUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
