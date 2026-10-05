import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
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
const knowledge = load('src/data/profileSystems/profileKnowledge.ts')
const knowledgeData = load('src/data/profileSystems/knowledge/derivedProfileKnowledge.ts')
const profiles = load('src/domain/profileResolution.ts')
const construction = load('src/domain/construction/index.ts')
const catalog = load('src/data/profileSystems/index.ts')
const ConstructorShell = load('src/components/ConstructorShell.tsx').default

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

const mullion = knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', '482.21')
assert.equal(mullion.roleEn, 'Mullion')
assert.equal(mullion.roleBg, 'Делител')
assert.equal(mullion.profileW, 60)
assert.equal(mullion.profileZ, 84)
assert.equal(mullion.evidenceStatus, 'DATABASE_EVIDENCE')
assert.equal(mullion.systemLabel, 'KMG PRELUDE 60')
assert.match(mullion.sourcePath, /MASTER_CORE_PROFILES\.csv$/)
const frame = knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', '482.20')
assert.equal(frame.roleEn, 'Frame')
assert.equal(frame.roleBg, 'Каса')
assert.equal(frame.profileW, 60)
assert.equal(frame.profileZ, 68)
assert.equal(knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', 'unknown'), undefined)

const horizontalJoint = knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'kmg-prelude-60',
  dividerProfileId: '482.21',
  dividerAxis: 'horizontal',
})
assert.deepEqual(horizontalJoint.map((record) => record.operation), ['SglobkaDelitel', 'SglobkaDelitel'])
assert.deepEqual(horizontalJoint.map((record) => record.ruleId), ['BeamHorizontalKMG4k', 'BeamHorizontalKMG4k'])
assert.deepEqual(horizontalJoint.map((record) => record.relationToken), ['L_Fr', 'R_Fr'])
assert.deepEqual(horizontalJoint.map((record) => record.operationCode), ['19', '19'])
assert.deepEqual(horizontalJoint.map((record) => record.positionExpression), ['POS[]', 'POS[]'])
assert.deepEqual(horizontalJoint.map((record) => record.sourceMarker), ['MM1', 'MM4'])
assert.ok(horizontalJoint.every((record) => record.geometryStatus === 'UNKNOWN'))
assert.ok(horizontalJoint.every((record) => record.sourceSystem === 'Altest'))
assert.ok(horizontalJoint.every((record) => record.sourcePath.endsWith('STANDARD_JOINT_RULE_TOKENS.csv')))
assert.ok(horizontalJoint.every((record) => record.contextSourcePaths.some((path) => path.endsWith('RELATION_TOKEN_RULES.md'))))
assert.deepEqual(knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'kmg-prelude-60',
  dividerProfileId: '482.24',
  dividerAxis: 'horizontal',
}), [])

assert.equal(knowledgeData.derivedProfileKnowledgeMetadata.classification, 'DERIVED_DATABASE_EVIDENCE')
assert.equal(knowledgeData.derivedProfileKnowledgeMetadata.catalogueTruth, false)
assert.equal(knowledgeData.derivedProfileKnowledgeMetadata.automaticGeometry, false)
assert.equal(knowledgeData.derivedProfileKnowledgeMetadata.rulesValidated, false)
assert.equal(knowledgeData.derivedProfileKnowledgeMetadata.machineReady, false)

const system = catalog.getProfileSystemById('kmg-prelude-60')
let model = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1400 })
model = construction.splitField(model, 'field-1', 'horizontal', 700)
const divider = construction.resolveConstructionTopology(model).dividers[0]
let resolution = profiles.createModuleProfileResolution(system.id)
resolution = profiles.setFrameProfileAssignment(resolution, system, '482.20')
resolution = profiles.setDividerProfileAssignment(resolution, system, divider.id, '482.21')

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

let tree = render()
let profileTab = nodes(tree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
assert.ok(profileTab, 'module profile inspector tab')
profileTab.props.onClick()
tree = render()
const frameInspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(frameInspector), /482\.20/)
assert.match(text(frameInspector), /Frame \/ Каса/)

const dividerControl = nodes(tree, (node) => node.props?.className?.startsWith('constructor-divider is-local'))[0]
assert.ok(dividerControl, 'horizontal divider selection control')
dividerControl.props.onClick({ stopPropagation() {} })
tree = render()
profileTab = nodes(tree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
assert.ok(profileTab, 'divider profile inspector tab')
profileTab.props.onClick()
tree = render()

const inspector = nodes(tree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.ok(inspector, 'read-only Profile knowledge panel')
const inspectorText = text(inspector)
for (const expected of [
  'ПРОФИЛНИ ДАННИ', '482.21', 'Mullion / Делител',
  'profileW60', 'profileZ84', 'DATABASE_EVIDENCE', 'Данни за сглобката',
  'BeamHorizontalKMG4k / SglobkaDelitel', 'L_Fr', 'R_Fr', '19', 'POS[]', 'MM1', 'MM4',
  'Геометрия на сглобката: НЕИЗВЕСТНА',
]) assert.match(inspectorText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
assert.equal(nodes(inspector, (node) => ['input', 'select', 'button'].includes(node.type)).length, 0)

const shellSource = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const adapterSource = await readFile(new URL('../src/data/profileSystems/profileKnowledge.ts', import.meta.url), 'utf8')
const datasetSource = await readFile(new URL('../src/data/profileSystems/knowledge/derivedProfileKnowledge.ts', import.meta.url), 'utf8')
const verifierSource = await readFile(new URL('./verify-profile-knowledge-inspector01.mjs', import.meta.url), 'utf8')
assert.match(shellSource, /getProfileKnowledgeEvidence/)
assert.match(shellSource, /Няма потвърдени профилни данни/)
assert.doesNotMatch(adapterSource, /\.\.\/\.\.\/domain|set[A-Z]|mutat/i)
for (const hardcodedFact of ['482.20', '482.21', 'BeamHorizontalKMG4k', 'BeamVerticalKMG4k', 'SglobkaDelitel', 'MM1', 'MM4']) {
  assert.doesNotMatch(adapterSource, new RegExp(hardcodedFact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
assert.match(datasetSource, /STATIC RUNTIME MIRROR OF DERIVED DATABASE EVIDENCE/)
assert.match(datasetSource, /roleBg: 'Каса'/)
assert.match(datasetSource, /roleBg: 'Делител'/)
const mojibakeFragments = [
  [0x420, 0x459], [0x420, 0x00b0], [0x421, 0x403], [0x420, 0x201d],
  [0x420, 0x00b5], [0x420, 0x00bb], [0x420, 0x451], [0x421, 0x201a],
].map((codePoints) => String.fromCodePoint(...codePoints))
for (const source of [adapterSource, datasetSource, verifierSource]) {
  for (const fragment of mojibakeFragments) assert.doesNotMatch(source, new RegExp(fragment, 'u'))
}
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('PROFILE KNOWLEDGE INSPECTOR 01 VERIFY PASS')
console.log('KMG 482.21 DISPLAY: PASS')
console.log('JOINT EVIDENCE DISPLAY: PASS')
console.log('UNKNOWN-GEOMETRY DISPLAY: PASS')
console.log('READ-ONLY BOUNDARY: PASS')
console.log('UTF-8 BULGARIAN: PASS')
console.log('HARDCODED LOOKUP KNOWLEDGE: NONE')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
