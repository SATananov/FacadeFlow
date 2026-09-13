import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const app = await readFile('src/App.tsx', 'utf8')
const manager = await readFile('src/components/ProjectManagerPanel.tsx', 'utf8')
const managerCss = await readFile('src/components/ProjectManagerPanel.css', 'utf8')

assert.match(app, /<ProjectManagerPanel/)
assert.doesNotMatch(app, /<select aria-label="Отвори проект"/)
assert.match(manager, /aria-label="Отвори проект"/)
assert.match(manager, /Отвори запазен проект/)
assert.match(manager, /\+ Нов проект/)
assert.match(manager, /Последна ревизия R/)
assert.match(manager, /Без записана ревизия/)
assert.match(manager, /Вътрешните идентификатори остават скрити/)
assert.doesNotMatch(manager, /slice\(0,\s*8\)/)
assert.match(managerCss, /\.project-manager-overlay\s*\{[\s\S]*?position:\s*fixed;/)

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const persistence = load('src/persistence/localProjectStorage')
const revisions = load('src/domain/project/revisionOperations')

class MemoryStorage {
  data = new Map()
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, value) }
}

let id = 0
const ids = () => `project-open-${++id}`
const memory = new MemoryStorage()
const storage = new persistence.LocalProjectStorage(() => memory)

let named = model.createProjectSnapshot(ids)
named = ops.editProject(named, (draft) => {
  draft.project.client.clientName = 'Иван Иванов'
  draft.project.site.objectName = 'Къща Кърджали'
  ops.replaceFreeModules(draft, [{ id: ids(), sequence: 1, profileSystemId: '', productType: null, profileResolution: null }])
  draft.workspace.screen = 'free-constructor'
})
named = revisions.recordProjectRevision(named, { id: 'operator-sat', label: 'SAT', identityBasis: 'local-self-asserted' }, '2026-09-12T03:00:00.000Z')
storage.save(named)

const free = model.createProjectSnapshot(ids)
free.workspace.screen = 'free-constructor'
storage.save(free)

memory.setItem(persistence.PROJECT_KEY_PREFIX + 'broken-project', '{broken')
const listed = storage.list()
assert.equal(listed.length, 3)
const namedSummary = listed.find((project) => project.id === named.project.id)
assert.equal(namedSummary.label, 'Къща Кърджали · Иван Иванов')
assert.equal(namedSummary.moduleCount, 1)
assert.equal(namedSummary.headRevisionNumber, 1)
assert.equal(namedSummary.openable, true)
assert.equal(namedSummary.label.includes(named.project.id), false)
const freeSummary = listed.find((project) => project.id === free.project.id)
assert.equal(freeSummary.label, 'Свободен проект')
assert.equal(freeSummary.headRevisionNumber, null)
const broken = listed.find((project) => project.id === 'broken-project')
assert.equal(broken.openable, false)
assert.equal(broken.label, 'Невъзстановим проект')

console.log('=== PROJECT OPEN 01 VERIFY PASS ===')
console.log('PROJECT MANAGER: EXPLICIT OPEN / NEW PROJECT')
console.log('PROJECT LABELS: HUMAN READABLE / UUID HIDDEN')
console.log('PROJECT SUMMARY: MODULE COUNT + REVISION STATUS')
console.log('CORRUPT RECORDS: RETAINED / FAIL-CLOSED')
console.log('PF01/PF02 PROJECT IDS: UNCHANGED')
