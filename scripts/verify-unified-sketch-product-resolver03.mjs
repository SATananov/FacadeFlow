import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const composition = load('src/domain/combinedModuleComposition')
const resolver = load('src/domain/productResolver')
const prelude = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const resolverSource = await readFile(new URL('../src/domain/productResolver.ts', import.meta.url), 'utf8')

assert.ok(prelude)
assert.doesNotMatch(resolverSource, /from ['"]react['"]|localStorage|sessionStorage|fetch\(|writeFile|readFile/)
assert.match(resolverSource, /machineReady: false/)

const baseSelectedSystem = (profileResolution, overrides = {}) => ({
  profileSystemId: prelude.id,
  standardId: null,
  profileResolution,
  offerDefaultGlazingId: null,
  hardware: { standardId: null, manufacturerId: null },
  ...overrides,
})

function makeResolution({ frame = '482.30', sash = null, fieldId = 'field-1', bead = null, thickness = null } = {}) {
  const resolution = profiles.createModuleProfileResolution(prelude.id)
  resolution.frame = frame ? { profileCode: frame, source: 'human' } : null
  if (sash) resolution.fieldSashes[fieldId] = { profileCode: sash, source: 'human' }
  if (bead) resolution.fieldGlazingBeads[fieldId] = { profileCode: bead, source: 'human' }
  if (thickness !== null) resolution.fieldGlazingThicknesses[fieldId] = { thicknessMm: thickness, source: 'human' }
  return resolution
}

function makeSketch({ moduleId, productType, fieldType, openingMode = null, openingHanding = null, topology, combinedComposition = null }) {
  let next = topology ?? construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 1200 })
  next = construction.setConstructionFieldType(next, 'field-1', fieldType)
  if (fieldType === 'operable') {
    next = construction.setConstructionFieldOpeningMode(next, 'field-1', openingMode)
    next = construction.setConstructionFieldOpeningHanding(next, 'field-1', openingHanding)
  }
  return { moduleId, topology: next, productIntent: { productType }, combinedComposition }
}

function status(fact) { return fact.status }

// Ordinary fixed window: field identity survives, no sash intent is created,
// and current bead compatibility/inset evidence remains explicitly incomplete.
{
  const sketch = makeSketch({ moduleId: 'window-01', productType: 'window', fieldType: 'fixed' })
  const system = baseSelectedSystem(makeResolution({ bead: '482.15', thickness: 24 }))
  const before = structuredClone(sketch)
  const result = resolver.resolveProductFromSketch({ sketch, system })
  assert.deepEqual(resolver.resolveProductFromSketch({ sketch, system }), result)
  assert.equal(result.model.machineReady, false)
  assert.equal(result.model.fields[0].value.sketchId, 'field-1')
  assert.equal(result.model.sashIntent.length, 0)
  assert.ok(result.model.glazing.some((fact) => fact.semanticValue?.role === 'glazing-inset' && status(fact) === 'UNKNOWN'))
  assert.deepEqual(sketch, before)
}

// Door: operable intent survives, but absent handing is UNKNOWN and the
// concrete hardware kit remains UNKNOWN even with an explicit hardware standard.
{
  const sketch = makeSketch({ moduleId: 'door-01', productType: 'door', fieldType: 'operable', openingMode: 'side-hinged' })
  const system = baseSelectedSystem(makeResolution({ sash: '482.26' }), { hardware: { standardId: 'standard-european', manufacturerId: null } })
  const result = resolver.resolveProductFromSketch({ sketch, system })
  assert.equal(result.model.sashIntent[0].status, 'RESOLVED')
  assert.ok(result.model.members.some((fact) => fact.value?.role === 'sash' && fact.status === 'RESOLVED'))
  assert.ok(result.model.openings.some((fact) => fact.status === 'UNKNOWN' && fact.semanticValue?.openingHanding === null))
  assert.ok(result.model.hardware.some((fact) => fact.status === 'UNKNOWN'))
}

// Combined door + window: explicit regions and field references survive;
// semantic zero dividers never receive a physical profile.
{
  let topology = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1800, heightMm: 2200 })
  topology = construction.setConstructionFieldType(topology, 'field-1', 'fixed')
  topology = construction.splitFieldSemantic(topology, 'field-1', 900)
  const fields = construction.resolveConstructionTopology(topology).fields
  const combined = composition.createCombinedRegionComposition('window-left')
  combined.regions[0].fieldId = fields[0].id
  combined.regions[1].fieldId = fields[1].id
  const sketch = { moduleId: 'combined-01', topology, productIntent: { productType: 'combined-door-window' }, combinedComposition: combined }
  const result = resolver.resolveProductFromSketch({ sketch, system: baseSelectedSystem(makeResolution()) })
  assert.deepEqual(result.model.regions.map((fact) => fact.value?.sketchId), ['combined-region-1', 'combined-region-2'])
  assert.ok(result.model.regions.some((fact) => fact.value?.role === 'WINDOW_REGION'))
  assert.ok(result.model.regions.some((fact) => fact.value?.role === 'DOOR_REGION'))
  assert.ok(result.model.dividers.some((fact) => fact.value?.role === 'ZERO_DIVIDER' && fact.value.semanticOnly === true && fact.value.profileCode === undefined))
}

// Unsupported assignment is fail-closed, not guessed.
{
  const sketch = makeSketch({ moduleId: 'unsupported-01', productType: 'window', fieldType: 'operable', openingMode: 'tilt' })
  const result = resolver.resolveProductFromSketch({ sketch, system: baseSelectedSystem(makeResolution({ frame: 'NOT-A-CATALOG-PROFILE' })) })
  assert.equal(result.model.frame.status, 'UNSUPPORTED')
  assert.equal(result.status, 'UNRESOLVED')
}

// Missing assignments remain UNKNOWN, including sash profile and threshold geometry.
{
  let topology = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 1200 })
  topology = construction.setConstructionFrameEdgeKind(topology, 'bottom', 'threshold')
  const sketch = makeSketch({ moduleId: 'unknown-01', productType: 'window', fieldType: 'operable', openingMode: 'tilt', topology })
  const result = resolver.resolveProductFromSketch({ sketch, system: baseSelectedSystem(makeResolution({ frame: null })) })
  assert.ok(result.model.members.some((fact) => fact.status === 'UNKNOWN' && fact.semanticValue?.role === 'sash'))
  assert.equal(result.model.bottomBoundaries[0].status, 'UNKNOWN')
  assert.ok(result.model.glazing.some((fact) => fact.semanticValue?.role === 'glazing-inset' && fact.status === 'UNKNOWN'))
}

const changedFiles = execFileSync('git', ['diff', '--name-only', '--',
  'src/domain/project/projectSerialization.ts',
  'src/domain/project/projectMigration.ts',
  'src/components/ConstructorShell.tsx',
  'src/components/ConstructorShell.css',
], { encoding: 'utf8' })
assert.equal(changedFiles.trim(), '')

console.log('UNIFIED SKETCH -> PRODUCT RESOLVER 03 VERIFY PASS')
console.log('PURE / DETERMINISTIC / NON-MUTATING: VERIFIED')
console.log('FIXED / OPERABLE / COMBINED IDENTITIES: VERIFIED')
console.log('UNKNOWN / UNSUPPORTED FACTS: FAIL CLOSED')
console.log('ZERO_DIVIDER: SEMANTIC / NONPHYSICAL')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
