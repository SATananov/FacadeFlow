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

const system = catalog.getProfileSystemById('schuco')
assert.ok(system, 'Schuco runtime system')
assert.equal(system.sourceStatus, 'database-imported')
assert.deepEqual(system.mainProfiles.map((profile) => profile.code), ['SCH 19411', 'SCH 19431', 'SCH 19460'])
assert.deepEqual(system.mainProfiles.map((profile) => profile.role), ['frame', 'sash', 'mullion'])

const frame = knowledge.getProfileKnowledgeEvidence('schuco', 'SCH 19411')
const sash = knowledge.getProfileKnowledgeEvidence('schuco', 'SCH 19431')
const mullion = knowledge.getProfileKnowledgeEvidence('schuco', 'SCH 19460')
assert.equal(frame.roleEn, 'Frame')
assert.equal(frame.roleBg, 'Каса')
assert.equal(frame.catalogue, 'Schuco')
assert.equal(frame.profileW, 0)
assert.equal(frame.profileZ, 0)
assert.equal(sash.roleEn, 'Sash')
assert.equal(sash.roleBg, 'Крило')
assert.equal(sash.catalogue, 'Schuco')
assert.equal(sash.profileW, 0)
assert.equal(sash.profileZ, 0)
assert.equal(mullion.roleEn, 'Mullion')
assert.equal(mullion.roleBg, 'Делител')
assert.equal(mullion.catalogue, 'Schuco')
assert.equal(mullion.profileW, 0)
assert.equal(mullion.profileZ, 0)
assert.equal(knowledge.getProfileKnowledgeEvidence('schuco', 'SCH 19412'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('schuco', 'SCH UNKNOWN'), undefined)

const duplicateCodeRows = knowledgeData.derivedProfileEvidenceRows.filter((row) => row.profileId === 'SCH 19411')
assert.equal(new Set(duplicateCodeRows.map((row) => row.sourceSystem)).size, 1)
assert.equal(knowledge.getProfileKnowledgeEvidence('profilink16', 'SCH 19411'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('vivaplast', 'SCH 19411'), undefined)
assert.equal(knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'schuco',
  dividerProfileId: 'SCH 19460',
  dividerAxis: 'horizontal',
}).length, 0)
assert.equal(knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'kmg-prelude-60',
  dividerProfileId: '482.21',
  dividerAxis: 'horizontal',
}).length, 2)

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
resolution = profiles.setFrameProfileAssignment(resolution, system, 'SCH 19411')
resolution = profiles.setDividerProfileAssignment(resolution, system, divider.id, 'SCH 19460')
resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', sashField, 'SCH 19431')

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
assert.match(text(inspector), /SCH 19411/)
assert.match(text(inspector), /Frame \/ Каса/)

const sashCard = nodes(tree, (node) => node.props?.className?.startsWith('constructor-field-detail-card'))[0]
assert.ok(sashCard, 'Schuco sash field')
sashCard.props.onClick()
tree = render()
selectProfileTab(tree)
tree = render()
inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(inspector), /SCH 19431/)
assert.match(text(inspector), /Sash \/ Крило/)

const dividerControl = nodes(tree, (node) => node.props?.className?.startsWith('constructor-divider is-local'))[0]
assert.ok(dividerControl, 'Schuco mullion')
dividerControl.props.onClick({ stopPropagation() {} })
tree = render()
selectProfileTab(tree)
tree = render()
inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(inspector), /SCH 19460/)
assert.match(text(inspector), /Mullion \/ Делител/)
assert.doesNotMatch(text(inspector), /Данни за сглобката/)

const shellSource = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(shellSource, /Schuco|schuco/)
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('SCHUCO RUNTIME PROFILE SYSTEM 01 VERIFY PASS')
console.log('SCHUCO SYSTEM: PASS')
console.log('FRAME LOOKUP: PASS')
console.log('SASH LOOKUP: PASS')
console.log('MULLION LOOKUP: PASS')
console.log('PROFILE INSPECTOR: PASS')
console.log('SCHUCO JOINT EVIDENCE: UNKNOWN')
console.log('KMG REGRESSION: PASS')
console.log('VIVAPLAST REGRESSION: PASS')
console.log('PROFILINK16 REGRESSION: PASS')
console.log('DUPLICATE-ID COLLISION GUARD: PASS')
console.log('GEOMETRY/DOMAIN/PERSISTENCE BEHAVIOR CHANGED: NO')
