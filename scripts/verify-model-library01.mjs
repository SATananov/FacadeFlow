import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const domain = load('src/domain/facadeModel')
const { LocalModelLibraryStorage, MODEL_LIBRARY_STORAGE_KEY: key } = load('src/persistence/localModelLibraryStorage')
const { profileSystemCatalog: systems } = load('src/data/profileSystems/catalog')
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
let passed = 0
function test(name, run) { run(); passed++; console.log(`PASS ${name}`) }
class MemoryStorage {
  data = new Map()
  failRead = false
  failWrite = false
  writes = 0
  getItem(key) { if (this.failRead) throw Error('access denied'); return this.data.get(key) ?? null }
  setItem(key, value) { if (this.failWrite) throw Error('quota exceeded'); this.writes++; this.data.set(key, value) }
}
function fixture() {
  const storage = new MemoryStorage()
  let sequence = 0, tick = 0
  const library = new LocalModelLibraryStorage(() => storage, () => `model-${++sequence}`, () => new Date(1700000000000 + tick++ * 1000).toISOString())
  return { storage, library }
}
function input(system = systems[0]) {
  return { name: 'M001', systemId: system.id,
    frameProfileCode: system.mainProfiles.find((p) => p.role === 'frame').code,
    dividerProfileCode: system.mainProfiles.find((p) => p.role === 'mullion').code,
    sashProfileCode: system.mainProfiles.find((p) => p.role === 'sash').code }
}

test('create unique models; reload from independent versioned storage; no project writes', () => {
  const { storage, library } = fixture()
  storage.data.set('facadeflow.project-foundation-01.project.untouched', 'project sentinel')
  assert.deepEqual(library.list(), [])
  assert.equal(storage.writes, 0)
  const a = library.create(input()), b = library.create(input())
  assert.notEqual(a.id, b.id)
  assert.equal(a.schemaVersion, 1)
  assert.equal(a.createdAt, a.updatedAt)
  assert.deepEqual(new LocalModelLibraryStorage(() => storage).list(), [a, b])
  assert.deepEqual(library.getById(a.id), a)
  assert.equal(library.getById('missing'), null)
  assert.equal(storage.data.size, 2)
  assert.equal(storage.getItem('facadeflow.project-foundation-01.project.untouched'), 'project sentinel')
  assert.equal(JSON.parse(storage.getItem(key)).schemaVersion, 1)
})
test('default UUID identities are unique', () => {
  const storage = new MemoryStorage(), library = new LocalModelLibraryStorage(() => storage)
  assert.notEqual(library.create(input()).id, library.create(input()).id)
})
test('update retains identity and creation date; duplicate gets independent identity; delete persists', () => {
  const { storage, library } = fixture()
  const original = library.create(input())
  const updated = library.update(original.id, { ...input(), name: '  Changed  ' })
  assert.equal(updated.id, original.id)
  assert.equal(updated.name, 'Changed')
  assert.equal(updated.createdAt, original.createdAt)
  assert.notEqual(updated.updatedAt, original.updatedAt)
  const duplicate = library.duplicate(original.id)
  assert.notEqual(duplicate.id, original.id)
  assert.notEqual(duplicate.createdAt, original.createdAt)
  assert.equal(duplicate.frameProfileCode, original.frameProfileCode)
  library.update(duplicate.id, { ...duplicate, frameProfileCode: null })
  assert.equal(library.getById(original.id).frameProfileCode, original.frameProfileCode)
  library.delete(original.id)
  const reloaded = new LocalModelLibraryStorage(() => storage)
  assert.equal(reloaded.getById(original.id), null)
  assert.equal(reloaded.list().length, 1)
  for (const action of [() => library.update('missing', input()), () => library.duplicate('missing'), () => library.delete('missing')]) assert.throws(action)
})
test('filter by system and update system using explicit valid selections', () => {
  const { library } = fixture()
  const a = library.create(input()), b = library.create(input(systems[1]))
  assert.deepEqual(library.list(systems[0].id), [a])
  assert.deepEqual(library.list(systems[1].id), [b])
  assert.deepEqual(library.list('absent'), [])
  library.update(a.id, input(systems[1]))
  assert.equal(library.list(systems[0].id).length, 0)
  assert.equal(library.list(systems[1].id).length, 2)
})
for (const [name, patch] of [
  ['unknown system', { systemId: 'missing' }],
  ['cross-system profile', { frameProfileCode: input(systems[1]).frameProfileCode }],
  ['invalid profile code', { sashProfileCode: 'does-not-exist' }],
  ['wrong frame role', { frameProfileCode: input().sashProfileCode }],
  ['wrong divider role', { dividerProfileCode: input().frameProfileCode }],
  ['wrong sash role', { sashProfileCode: input().dividerProfileCode }],
  ['blank name', { name: '  ' }],
  ['malformed profile type', { frameProfileCode: 48230 }],
  ['missing profile property', { frameProfileCode: undefined }],
]) test(`domain and persistence reject ${name} on create/update without writes`, () => {
  const { storage, library } = fixture(), original = library.create(input())
  const before = storage.getItem(key), invalid = { ...input(), ...patch }
  assert.throws(() => domain.createFacadeModel(invalid, 'direct', original.createdAt))
  assert.throws(() => library.create(invalid))
  assert.throws(() => library.update(original.id, invalid))
  assert.equal(storage.getItem(key), before)
})
test('nullable roles and both explicit catalogue sash roles; compatibility stays unknown', () => {
  const { library } = fixture()
  library.create({ ...input(), frameProfileCode: null, dividerProfileCode: null, sashProfileCode: null })
  const doorSash = systems[0].mainProfiles.find((p) => p.role === 'door-sash')
  library.create({ ...input(), sashProfileCode: doorSash.code })
  assert.deepEqual(domain.MODEL_LIBRARY_SAFETY, { assemblyCompatibility: 'UNKNOWN / HUMAN REVIEW', automaticGeometry: false, rulesValidated: false, machineReady: false })
})
test('system changes clear invalid stale choices; no profile is selected automatically', () => {
  const before = input(), changed = domain.changeModelSystem(before, systems[1].id)
  for (const field of domain.MODEL_PROFILE_FIELDS) assert.equal(changed[field], null)
  assert.deepEqual(before, input())
  assert.deepEqual(domain.changeModelSystem(before, before.systemId), before)
  for (const field of domain.MODEL_PROFILE_FIELDS) {
    assert.equal(domain.changeModelSystem(before, '')[field], null)
    assert.ok(domain.getModelProfileCandidates(systems[1].id, field).every((p) => systems[1].mainProfiles.includes(p)))
  }
  const wrongRole = domain.changeModelSystem({ ...before, frameProfileCode: before.sashProfileCode }, before.systemId)
  assert.equal(wrongRole.frameProfileCode, null)
})
test('malformed/future/duplicate-ID records block every mutation and preserve raw data', () => {
  const { storage, library } = fixture(), model = library.create(input())
  for (const raw of [
    '{broken', 'null', JSON.stringify({ schemaVersion: 99, models: [] }),
    JSON.stringify({ schemaVersion: 1, models: [model, model] }),
    ...[{ schemaVersion: 99 }, { id: '' }, { updatedAt: 'bad-date' }, { systemId: 'absent' }, { frameProfileCode: input(systems[1]).frameProfileCode }]
      .map((patch) => JSON.stringify({ schemaVersion: 1, models: [{ ...model, ...patch }] })),
  ]) {
    storage.data.set(key, raw)
    for (const action of [() => library.list(), () => library.create(input()), () => library.update(model.id, input()), () => library.duplicate(model.id), () => library.delete(model.id)]) assert.throws(action)
    assert.equal(storage.getItem(key), raw)
  }
})
test('storage failures and identity collisions propagate without destructive fallback', () => {
  const { storage, library } = fixture(), model = library.create(input()), before = storage.getItem(key)
  const collision = new LocalModelLibraryStorage(() => storage, () => model.id)
  assert.throws(() => collision.create(input()))
  assert.throws(() => collision.duplicate(model.id))
  storage.failWrite = true
  for (const action of [() => library.create(input()), () => library.update(model.id, input()), () => library.duplicate(model.id), () => library.delete(model.id)]) assert.throws(action, /quota/)
  assert.equal(storage.getItem(key), before)
  storage.failRead = true
  assert.throws(() => library.list(), /access denied/)
  assert.throws(() => library.create(input()), /access denied/)
})

test('panel handlers: manual create/edit/duplicate/delete, system clearing, errors; no browser', () => {
  const previousWindow = globalThis.window
  const storage = new MemoryStorage()
  globalThis.window = { localStorage: storage, confirm: () => true }
  let slots = [], cursor = 0
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }] },
    useRef() { const index = cursor++; return slots[index] ??= { current: null } },
  }
  const Panel = createRuntimeLoader({ react }).call(null, 'src/components/ModelLibraryPanel').ModelLibraryPanel
  let tree
  const render = () => { cursor = 0; tree = Panel() }
  function elements(node = tree) {
    if (Array.isArray(node)) return node.flatMap((child) => elements(child))
    if (!node || typeof node !== 'object') return []
    return [node, ...elements(node.props?.children ?? null)]
  }
  const byId = (id) => elements().find((node) => node.props?.id === id)
  const change = (id, value) => { byId(id).props.onChange({ target: { value } }); render() }
  const action = (label) => { elements().find((node) => node.type === 'button' && node.props.children === label).props.onClick(); render() }
  const submit = () => { elements().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); render() }
  try {
    render()
    assert.equal(storage.writes, 0)
    assert.equal(byId('model-system').props.value, '')
    assert.ok(byId('model-frameProfileCode').props.disabled)
    change('model-system', systems[0].id)
    assert.equal(byId('model-frameProfileCode').props.value, '')
    for (const field of domain.MODEL_PROFILE_FIELDS) change(`model-${field}`, input()[field])
    change('model-name', 'UI model')
    submit()
    const library = new LocalModelLibraryStorage(() => storage), original = library.list()[0]
    assert.equal(original.name, 'UI model')
    action('Редактирай')
    change('model-name', 'UI edited')
    submit()
    assert.equal(library.list()[0].id, original.id)
    assert.equal(library.list()[0].name, 'UI edited')
    action('Дублирай')
    assert.equal(library.list().length, 2)
    assert.notEqual(library.list()[1].id, original.id)
    action('Редактирай')
    change('model-system', systems[1].id)
    for (const field of domain.MODEL_PROFILE_FIELDS) {
      assert.equal(byId(`model-${field}`).props.value, '')
      const options = elements(byId(`model-${field}`)).filter((node) => node.type === 'option' && node.props.value)
      assert.ok(options.every((node) => domain.getModelProfileCandidates(systems[1].id, field).some((p) => p.code === node.props.value)))
    }
    action('Откажи редакцията')
    globalThis.window.confirm = () => false
    action('Изтрий')
    assert.equal(library.list().length, 2)
    globalThis.window.confirm = () => true
    action('Изтрий')
    assert.equal(library.list().length, 1)
    change('model-system', systems[0].id)
    change('model-name', 'Retain draft on failure')
    storage.failWrite = true
    submit()
    assert.equal(byId('model-name').props.value, 'Retain draft on failure')
    assert.ok(elements().some((node) => node.props?.role === 'alert'))
    storage.failRead = true
    slots = []
    render()
    assert.ok(elements().find((node) => node.type === 'fieldset').props.disabled)
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
})

test('existing Constructor topology/Profile Resolution unchanged; library cannot generate geometry', () => {
  // Baseline digests from before MODEL LIBRARY 01, normalized for checkout line endings.
  // The domain boundary only imports catalogue data and canonical catalogue types.
  const source = read('src/domain/facadeModel.ts')
  const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(imports, ['../data/profileSystems/catalog', '../data/profileSystems/types'])
  for (const path of ['src/domain/construction/constructionModel.ts', 'src/domain/construction/fieldTopology.ts', 'src/domain/profileResolution.ts', 'src/domain/project/projectModel.ts', 'src/components/ConstructorShell.tsx']) {
    assert.doesNotMatch(read(path), /facadeModel|ModelLibrary|field\.modelId/)
  }
  const baseline = {
    'src/domain/construction/constructionModel.ts': '238525a7a6587f3f0aa572ce6ebae48c86774522d68cdc2a44ba35785d655487',
    'src/domain/construction/fieldTopology.ts': '314ec981dddc033cd4a536ac31199892f6f88361ebe89f1d7263641a9380f1dd',
    'src/domain/profileResolution.ts': 'c25ad2c821678f4a3e6ec6585c8b30fccf6b2625d24f8d1bae813582f26c4cb7',
  }
  for (const [path, hash] of Object.entries(baseline)) {
    const text = read(path).replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(text).digest('hex'), hash, `${path} baseline changed`)
  }
  assert.match(read('src/App.tsx'), /headerSection === 'models' \? \(\s*<ModelLibraryPanel \/>/)
})
console.log(`MODEL LIBRARY 01 PASS: ${passed} cases`)
console.log('AUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
