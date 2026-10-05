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

const verticalJoint = knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'kmg-prelude-60',
  dividerProfileId: '482.21',
  dividerAxis: 'vertical',
})
assert.deepEqual(verticalJoint.map((record) => record.ruleId), ['BeamVerticalKMG4k', 'BeamVerticalKMG4k'])
assert.deepEqual(verticalJoint.map((record) => record.relationToken), ['U_Fr', 'D_Fr'])
assert.deepEqual(verticalJoint.map((record) => record.operationCode), ['19', '19'])
assert.deepEqual(verticalJoint.map((record) => record.positionExpression), ['POS[]', 'POS[]'])
assert.deepEqual(verticalJoint.map((record) => record.sourceMarker), ['MM1', 'MM1'])
assert.ok(verticalJoint.every((record) => record.geometryStatus === 'UNKNOWN'))

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

const verticalModel = construction.splitField(
  construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1400 }),
  'field-1',
  'vertical',
  800,
)
const verticalDivider = construction.resolveConstructionTopology(verticalModel).dividers[0]
let verticalResolution = profiles.createModuleProfileResolution(system.id)
verticalResolution = profiles.setFrameProfileAssignment(verticalResolution, system, '482.20')
verticalResolution = profiles.setDividerProfileAssignment(verticalResolution, system, verticalDivider.id, '482.21')

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

const verticalRender = mount(ConstructorShell, {
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
  initialDraft: { version: 'constructor-01d', frame: verticalModel.frame, topology: verticalModel },
  profileResolution: verticalResolution,
  onClose() {},
})
let verticalTree = verticalRender()
let verticalProfileTab = nodes(verticalTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
verticalProfileTab.props.onClick()
verticalTree = verticalRender()
const verticalDividerControl = nodes(verticalTree, (node) => node.props?.className?.startsWith('constructor-divider is-local'))[0]
assert.ok(verticalDividerControl, 'vertical divider selection control')
verticalDividerControl.props.onClick({ stopPropagation() {} })
verticalTree = verticalRender()
verticalProfileTab = nodes(verticalTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
verticalProfileTab.props.onClick()
verticalTree = verticalRender()
const verticalInspector = nodes(verticalTree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
const verticalInspectorText = text(verticalInspector)
for (const expected of [
  '482.21', 'Mullion / Делител', 'profileW', '60', 'profileZ', '84',
  'BeamVerticalKMG4k / SglobkaDelitel', 'U_Fr', 'D_Fr', '19', 'POS[]', 'MM1',
  'Геометрия на сглобката: НЕИЗВЕСТНА',
]) assert.match(verticalInspectorText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

const sashTargetFieldId = construction.resolveConstructionTopology(model).fields[0]?.id
assert.ok(sashTargetFieldId, 'operable sash target field id')
const sashField = construction.resolveConstructionTopology(
  construction.setConstructionFieldType(model, sashTargetFieldId, 'operable'),
).fields.find((field) => field.id === sashTargetFieldId)
assert.ok(sashField, 'operable sash context')
const sashCandidate = profiles.getFieldSashProfileCandidates(system, 'window', sashField.fieldType)[0]
assert.ok(sashCandidate, 'operable sash profile candidate')
const sashResolution = {
  ...resolution,
  fieldSashes: { [sashField.id]: { profileCode: sashCandidate.code, source: 'human' } },
}
const sashKnowledge = knowledge.getProfileKnowledgeEvidence(system.id, sashCandidate.code)
assert.equal(sashKnowledge === undefined || sashKnowledge.profileId === sashCandidate.code, true)
const sashRender = mount(ConstructorShell, {
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
  initialDraft: { version: 'constructor-01d', frame: model.frame, topology: construction.setConstructionFieldType(model, sashTargetFieldId, 'operable') },
  profileResolution: sashResolution,
  onClose() {},
})
let sashTree = sashRender()
const sashFieldCard = nodes(sashTree, (node) => node.props?.className?.startsWith('constructor-field-detail-card'))[0]
assert.ok(sashFieldCard, 'operable field selection card')
sashFieldCard.props.onClick()
sashTree = sashRender()
let sashProfileTab = nodes(sashTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
sashProfileTab.props.onClick()
sashTree = sashRender()
const sashInspector = nodes(sashTree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
const sashInspectorText = text(sashInspector)
if (sashKnowledge) {
  assert.match(sashInspectorText, new RegExp(sashKnowledge.profileId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
} else {
  assert.match(sashInspectorText, /Няма потвърдени профилни данни/)
}

const unsupportedResolution = {
  ...sashResolution,
  fieldSashes: { [sashField.id]: { profileCode: 'UNKNOWN-PROFILE', source: 'human' } },
}
assert.equal(knowledge.getProfileKnowledgeEvidence(system.id, 'UNKNOWN-PROFILE'), undefined)
const unsupportedRender = mount(ConstructorShell, {
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
  initialDraft: { version: 'constructor-01d', frame: model.frame, topology: construction.setConstructionFieldType(model, sashTargetFieldId, 'operable') },
  profileResolution: unsupportedResolution,
  onClose() {},
})
let unsupportedTree = unsupportedRender()
const unsupportedFieldCard = nodes(unsupportedTree, (node) => node.props?.className?.startsWith('constructor-field-detail-card'))[0]
unsupportedFieldCard.props.onClick()
unsupportedTree = unsupportedRender()
let unsupportedProfileTab = nodes(unsupportedTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
unsupportedProfileTab.props.onClick()
unsupportedTree = unsupportedRender()
const unsupportedInspector = nodes(unsupportedTree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(unsupportedInspector), /Няма потвърдени профилни данни/)
assert.doesNotMatch(text(unsupportedInspector), /482\.21|BeamHorizontalKMG4k|MM1|MM4/)

const staleGuardRender = mount(ConstructorShell, {
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
let staleTree = staleGuardRender()
let staleProfileTab = nodes(staleTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
staleProfileTab.props.onClick()
staleTree = staleGuardRender()
const staleDividerControl = nodes(staleTree, (node) => node.props?.className?.startsWith('constructor-divider is-local'))[0]
staleDividerControl.props.onClick({ stopPropagation() {} })
staleTree = staleGuardRender()
const moduleContextLink = nodes(staleTree, (node) => node.props?.className === 'constructor-context-link')[0]
assert.ok(moduleContextLink, 'module context selection control')
moduleContextLink.props.onClick()
staleTree = staleGuardRender()
staleProfileTab = nodes(staleTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
staleProfileTab.props.onClick()
staleTree = staleGuardRender()
const moduleContextInspector = nodes(staleTree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(moduleContextInspector), /482\.20|Frame \/ Каса/)
assert.doesNotMatch(text(moduleContextInspector), /482\.21|BeamHorizontalKMG4k|L_Fr|R_Fr|MM1|MM4/)
const staleFieldCard = nodes(staleTree, (node) => node.props?.className?.startsWith('constructor-field-detail-card'))[0]
staleFieldCard.props.onClick()
staleTree = staleGuardRender()
staleProfileTab = nodes(staleTree, (node) => node.type === 'button' && node.props?.role === 'tab' && text(node) === 'Профил')[0]
staleProfileTab.props.onClick()
staleTree = staleGuardRender()
const staleFieldInspector = nodes(staleTree, (node) => node.props?.className === 'constructor-profile-knowledge')[0]
assert.match(text(staleFieldInspector), /Няма потвърдени профилни данни/)
assert.doesNotMatch(text(staleFieldInspector), /482\.21|BeamHorizontalKMG4k|L_Fr|R_Fr|MM1|MM4/)

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
