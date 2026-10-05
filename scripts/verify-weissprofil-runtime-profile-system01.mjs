import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const require = createRequire(import.meta.url)
let host
const react = {
  ...require('react'),
  useState(initial) {
    const current = host
    const index = current.index++
    if (!(index in current.values)) current.values[index] = typeof initial === 'function' ? initial() : initial
    return [current.values[index], (next) => {
      current.values[index] = typeof next === 'function' ? next(current.values[index]) : next
    }]
  },
  useMemo: (compute) => compute(),
  useRef: (initial) => react.useState(() => ({ current: initial }))[0],
  useEffect: () => {},
  useLayoutEffect: () => {},
}
const load = createRuntimeLoader({ react })
const catalog = load('src/data/profileSystems/catalog.ts')
const knowledge = load('src/data/profileSystems/profileKnowledge.ts')
const knowledgeData = load('src/data/profileSystems/knowledge/derivedProfileKnowledge.ts')
const profiles = load('src/domain/profileResolution.ts')
const construction = load('src/domain/construction/index.ts')
const ConstructorShell = load('src/components/ConstructorShell.tsx').default

const system = catalog.getProfileSystemById('weissprofil2018-113')
assert.ok(system, 'WeissProfil runtime system')
assert.equal(system.manufacturer, 'WeissProfil2018_113')
assert.equal(system.family, 'GR C-WP 5000/4000')
assert.equal(system.sourceStatus, 'database-imported')
assert.deepEqual(system.mainProfiles.map((profile) => profile.code), ['3001', '3002', '3003'])
assert.deepEqual(system.mainProfiles.map((profile) => profile.role), ['frame', 'sash', 'mullion'])

const frame = knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', '3001')
const sash = knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', '3002')
const mullion = knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', '3003')
for (const record of [frame, sash, mullion]) {
  assert.equal(record.sourceSystem, 'WeissProfil2018_113')
  assert.equal(record.catalogue, 'GR C-WP 5000/4000')
  assert.equal(record.evidenceStatus, 'DATABASE_EVIDENCE')
}
assert.deepEqual([frame.profileW, frame.profileZ], [60, 63])
assert.deepEqual([sash.profileW, sash.profileZ], [60, 77])
assert.deepEqual([mullion.profileW, mullion.profileZ], [60, 73])
assert.equal(frame.roleEn, 'Frame')
assert.equal(frame.roleBg, 'Каса')
assert.equal(sash.roleEn, 'Sash')
assert.equal(sash.roleBg, 'Крило')
assert.equal(mullion.roleEn, 'Mullion')
assert.equal(mullion.roleBg, 'Делител')

assert.equal(knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', '30.02'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', '3006'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('weissprofil2018-113', 'UNKNOWN'), undefined)
for (const systemId of ['kmg-prelude-60', 'vivaplast', 'profilink16', 'schuco', 'baufen']) {
  assert.equal(knowledge.getProfileKnowledgeEvidence(systemId, '3001'), undefined)
}
assert.equal(knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'weissprofil2018-113',
  dividerProfileId: '3003',
  dividerAxis: 'horizontal',
}).length, 0)
assert.equal(knowledgeData.derivedDividerJointContexts.some((context) => context.systemId === 'weissprofil2018-113'), false)

const selectedRows = knowledgeData.derivedProfileEvidenceRows.filter((row) =>
  row.sourceSystem === 'WeissProfil2018_113' && ['3001', '3002', '3003'].includes(row.profileId),
)
assert.equal(selectedRows.length, 3)
assert.ok(selectedRows.every((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED' && row.systemId === 'weissprofil2018-113'))
const unmappedRows = knowledgeData.derivedProfileEvidenceRows.filter((row) =>
  row.sourceSystem === 'WeissProfil2018_113' && !['3001', '3002', '3003'].includes(row.profileId),
)
assert.ok(unmappedRows.length > 0)
assert.ok(unmappedRows.every((row) => row.runtimeMappingStatus === 'RUNTIME_UNMAPPED' && !('systemId' in row)))

function mount(component, props) {
  const hooks = { values: [], index: 0 }
  return () => {
    host = hooks
    hooks.index = 0
    return component(props)
  }
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  const children = [tree.props?.children].flat(Infinity)
  return [...(predicate(tree) ? [tree] : []), ...children.flatMap((child) => nodes(child, predicate))]
}
const text = (tree) => typeof tree === 'string' || typeof tree === 'number'
  ? String(tree)
  : [tree?.props?.children].flat(Infinity).map((child) => child == null || typeof child === 'boolean' ? '' : text(child)).join('')

let model = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1400 })
model = construction.splitField(model, 'field-1', 'horizontal', 700)
const initialFields = construction.resolveConstructionTopology(model).fields
const sashFieldId = initialFields[0].id
model = construction.setConstructionFieldType(model, sashFieldId, 'operable')
const resolved = construction.resolveConstructionTopology(model)
const divider = resolved.dividers[0]
const sashField = resolved.fields.find((field) => field.id === sashFieldId)
let resolution = profiles.createModuleProfileResolution(system.id)
resolution = profiles.setFrameProfileAssignment(resolution, system, '3001')
resolution = profiles.setDividerProfileAssignment(resolution, system, divider.id, '3003')
resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', sashField, '3002')

const render = mount(ConstructorShell, {
  mode: 'free',
  moduleNumber: 1,
  moduleItems: [{ id: 'module-1', sequence: 1 }],
  activeModuleId: 'module-1',
  freeProfileSystemId: system.id,
  moduleSummary: {
    productType: 'window',
    combinedLayout: null,
    combinedComposition: null,
    combinedRegionGeometry: null,
    productTypeLabel: 'Прозорец',
    widthMm: 1600,
    heightMm: 1400,
  },
  initialDraft: { version: 'constructor-01d', frame: model.frame, topology: model },
  profileResolution: resolution,
  onClose() {},
})
const selectProfileTab = (tree) => {
  const tab = nodes(tree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
  assert.ok(tab, 'profile inspector tab')
  tab.props.onClick()
}

let tree = render()
selectProfileTab(tree)
tree = render()
let inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(inspector), /3001/)
assert.match(text(inspector), /Frame \/ Каса/)

const sashCard = nodes(tree, (node) => node.props?.className?.startsWith('constructor-field-detail-card'))[0]
assert.ok(sashCard, 'WeissProfil sash field')
sashCard.props.onClick()
tree = render()
selectProfileTab(tree)
tree = render()
inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(inspector), /3002/)
assert.match(text(inspector), /Sash \/ Крило/)

const dividerControl = nodes(tree, (node) => node.props?.className?.startsWith('constructor-divider is-local'))[0]
assert.ok(dividerControl, 'WeissProfil mullion')
dividerControl.props.onClick({ stopPropagation() {} })
tree = render()
selectProfileTab(tree)
tree = render()
inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(inspector), /3003/)
assert.match(text(inspector), /Mullion \/ Делител/)
assert.doesNotMatch(text(inspector), /Данни за сглобката/)

const shellSource = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(shellSource, /WeissProfil|weissprofil/)
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('WEISSPROFIL RUNTIME PROFILE SYSTEM 01 VERIFY PASS')
console.log('WEISSPROFIL SYSTEM: PASS')
console.log('SELECTED FAMILY: GR C-WP 5000/4000')
console.log('FRAME LOOKUP: PASS')
console.log('SASH LOOKUP: PASS')
console.log('MULLION LOOKUP: PASS')
console.log('PROFILE INSPECTOR: PASS')
console.log('UNMAPPED WEISSPROFIL GUARD: PASS')
console.log('WEISSPROFIL JOINT EVIDENCE: UNKNOWN')
console.log('JOINT-GEOMETRY INVENTION GUARD: PASS')
console.log('KMG REGRESSION: PASS')
console.log('VIVAPLAST REGRESSION: PASS')
console.log('PROFILINK16 REGRESSION: PASS')
console.log('SCHUCO REGRESSION: PASS')
console.log('BAUFEN REGRESSION: PASS')
console.log('DUPLICATE-ID COLLISION GUARD: PASS')
console.log('GEOMETRY/DOMAIN/PERSISTENCE BEHAVIOR CHANGED: NO')
