import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const composition = load('src/domain/combinedModuleComposition')
const action = load('src/domain/productBuildAction')
const fingerprints = load('src/domain/productBuildFingerprint')
const prelude = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const actionSource = await readFile(new URL('../src/domain/productBuildAction.ts', import.meta.url), 'utf8')

assert.ok(prelude)
assert.match(actionSource, /resolveProductFromSketch\(input\)/)
assert.doesNotMatch(actionSource, /localStorage|sessionStorage|fetch\(|from ['"]react['"]|recordProjectRevision|setProject|saveProject/)

function resolution({ frame = '482.30', sash = null, fieldId = 'field-1', bead = null, thickness = null } = {}) {
  const value = profiles.createModuleProfileResolution(prelude.id)
  value.frame = frame ? { profileCode: frame, source: 'human' } : null
  if (sash) value.fieldSashes[fieldId] = { profileCode: sash, source: 'human' }
  if (bead) value.fieldGlazingBeads[fieldId] = { profileCode: bead, source: 'human' }
  if (thickness !== null) value.fieldGlazingThicknesses[fieldId] = { thicknessMm: thickness, source: 'human' }
  return value
}

function selected(profileResolution, overrides = {}) {
  return {
    profileSystemId: prelude.id,
    standardId: null,
    profileResolution,
    offerDefaultGlazingId: null,
    hardware: { standardId: null, manufacturerId: null },
    ...overrides,
  }
}

function sketch({ moduleId, productType, fieldType, topology, openingMode = null, openingHanding = null, combinedComposition = null }) {
  let next = topology ?? construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 1200 })
  next = construction.setConstructionFieldType(next, 'field-1', fieldType)
  if (fieldType === 'operable') {
    next = construction.setConstructionFieldOpeningMode(next, 'field-1', openingMode)
    next = construction.setConstructionFieldOpeningHanding(next, 'field-1', openingHanding)
  }
  return { moduleId, topology: next, productIntent: { productType }, combinedComposition }
}

function inputFor(overrides = {}) {
  return {
    sketch: sketch({ moduleId: 'window-01', productType: 'window', fieldType: 'fixed', ...overrides.sketch }),
    system: selected(resolution({ bead: '482.15', thickness: 24 }), overrides.system),
  }
}

// Ordinary module: action is idempotent and does not mutate the sketch.
{
  const input = inputFor()
  const before = structuredClone(input)
  const first = action.buildProductFromSketch(input)
  const second = action.buildProductFromSketch(input)
  assert.deepEqual(second, first)
  assert.equal(first.inputFingerprint, fingerprints.fingerprintProductBuildInputs(input))
  assert.equal(action.getProductBuildState(input, null).state, 'NOT_BUILT')
  assert.equal(action.getProductBuildState(input, first).state, 'CURRENT')
  assert.equal(first.machineReady, false)
  assert.deepEqual(input, before)
}

const staleCases = [
  ['topology', (input) => ({ ...input, sketch: { ...input.sketch, topology: construction.resizeConstructionFrame(input.sketch.topology, { ...input.sketch.topology.frame, widthMm: 1100 }) } })],
  ['fixed-operable', (input) => ({ ...input, sketch: { ...input.sketch, topology: construction.setConstructionFieldType(input.sketch.topology, 'field-1', 'operable') } })],
  ['opening-mode', (input) => ({ ...input, sketch: { ...input.sketch, topology: construction.setConstructionFieldOpeningMode(construction.setConstructionFieldType(input.sketch.topology, 'field-1', 'operable'), 'field-1', 'tilt') } })],
  ['handing', (input) => ({ ...input, sketch: { ...input.sketch, topology: construction.setConstructionFieldOpeningHanding(construction.setConstructionFieldOpeningMode(construction.setConstructionFieldType(input.sketch.topology, 'field-1', 'operable'), 'field-1', 'side-hinged'), 'field-1', 'right') } })],
  ['system', (input) => ({ ...input, system: { ...input.system, profileSystemId: null } })],
  ['profile', (input) => ({ ...input, system: { ...input.system, profileResolution: { ...input.system.profileResolution, frame: { profileCode: '482.20', source: 'human' } } } })],
  ['glazing', (input) => ({ ...input, system: { ...input.system, profileResolution: { ...input.system.profileResolution, fieldGlazingThicknesses: { 'field-1': { thicknessMm: 32, source: 'human' } } } } })],
  ['hardware', (input) => ({ ...input, system: { ...input.system, hardware: { standardId: 'standard-european', manufacturerId: 'test-manufacturer' } } })],
]
for (const [name, change] of staleCases) {
  const input = inputFor()
  const built = action.buildProductFromSketch(input)
  assert.equal(action.getProductBuildState(change(input), built).state, 'STALE', name)
}

// UI-only state is excluded from the authoritative fingerprint.
{
  const input = inputFor()
  const withViewState = { ...input, pan: { x: 42, y: 18 }, zoom: 1.75, selection: 'field-1', openPanel: 'glazing' }
  assert.equal(fingerprints.fingerprintProductBuildInputs(withViewState), fingerprints.fingerprintProductBuildInputs(input))
}

// Combined module: region identity and ZERO_DIVIDER semantics survive a build.
{
  let topology = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1800, heightMm: 2200 })
  topology = construction.splitFieldSemantic(topology, 'field-1', 900)
  const fields = construction.resolveConstructionTopology(topology).fields
  const combined = composition.createCombinedRegionComposition('window-left')
  combined.regions[0].fieldId = fields[0].id
  combined.regions[1].fieldId = fields[1].id
  const input = {
    sketch: sketch({ moduleId: 'combined-01', productType: 'combined-door-window', fieldType: 'fixed', topology, combinedComposition: combined }),
    system: selected(resolution()),
  }
  const built = action.buildProductFromSketch(input)
  assert.deepEqual(built.product.regions.map((fact) => fact.value?.sketchId), ['combined-region-1', 'combined-region-2'])
  assert.ok(built.product.dividers.some((fact) => fact.value?.role === 'ZERO_DIVIDER' && fact.value.semanticOnly === true && fact.value.profileCode === undefined))
}

// Incomplete input returns structured output, not an exception.
{
  const input = inputFor({ system: { profileSystemId: null, profileResolution: null } })
  const built = action.buildProductFromSketch(input)
  assert.equal(built.machineReady, false)
  assert.equal(built.status, 'UNRESOLVED')
  assert.ok(built.blockers.length > 0)
}

const protectedChanges = execFileSync('git', ['diff', '--name-only', '--',
  'src/domain/project/projectSerialization.ts',
  'src/domain/project/projectMigration.ts',
  'src/components/ConstructorShell.tsx',
  'src/components/ConstructorShell.css',
], { encoding: 'utf8' })
assert.equal(protectedChanges.trim(), '')

console.log('UNIFIED SKETCH -> BUILD PRODUCT ACTION 04 VERIFY PASS')
console.log('PURE RESOLVER DELEGATION: VERIFIED')
console.log('CURRENT / STALE / NOT_BUILT: VERIFIED')
console.log('AUTHORITATIVE INPUT FINGERPRINT: VERIFIED')
console.log('ZERO_DIVIDER: SEMANTIC / NONPHYSICAL')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
