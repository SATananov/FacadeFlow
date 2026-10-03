import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const { kmgPrelude60: catalog } = load('src/data/profileSystems/prelude60')
const { buildProfileSystemComponentInventory: inventory } = load('src/data/profileSystems/componentInventory')
const before = JSON.stringify(catalog)
const inventoryBefore = JSON.stringify(inventory(catalog))
const { prelude60DoorEvidence: evidence } = load('src/data/profileSystems/prelude60DoorEvidence')
const { fingerprint } = load('src/domain/assurance/canonical')
assert.equal(evidence.systemId, catalog.id)
assert.equal(evidence.version, 'prelude60-door-evidence-foundation-01')
assert.equal(JSON.stringify(catalog), before, 'Evidence must not mutate the canonical catalogue')
assert.equal(JSON.stringify(inventory(catalog)), inventoryBefore, 'No selectable inventory changes')
assert.equal(Object.isFrozen(catalog), false, 'Evidence must not freeze the existing catalogue')

const sections = ['pdf', 'components', 'databaseDimensions', 'configurations', 'expressions', 'corrections', 'gap', 'openFrame', 'conflicts', 'unknowns']
const records = sections.flatMap((key) => evidence[key])
const byId = new Map(records.map((record) => [record.id, record]))
const sources = new Map(evidence.sources.map((source) => [source.id, source]))
const fact = (id) => { assert(byId.has(id), `Missing ${id}`); return byId.get(id).value }
assert.equal(byId.size, records.length, 'Unique capture IDs')
assert.equal(sources.size, evidence.sources.length, 'Unique source IDs')
assert.deepEqual(new Set(records.map((r) => r.classification)), new Set([
  'VERIFIED SOURCE FACT', 'STRONG EVIDENCE', 'RAW LEGACY VALUE', 'CONFLICT', 'UNKNOWN',
]))
for (const record of records) {
  assert(record.sourceReferenceIds.length > 0, record.id)
  assert(Object.isFrozen(record) && Object.isFrozen(record.value), record.id)
  for (const id of record.sourceReferenceIds) {
    const source = sources.get(id)
    assert(source, `Dangling provenance ${id}`)
    assert(source.documentTitle && source.locator.row && source.locator.section)
    assert.equal(source.profileSystemId, catalog.id)
    assert.equal(source.documentContentDigest, null, 'No invented source-file hashes')
    assert.equal(source.documentVersion.state, 'unknown')
    assert.equal(source.capturedRecordDigest, fingerprint({ id: record.id, classification: record.classification, value: record.value }))
  }
  for (const id of record.value.supportingCaptureIds ?? []) assert(byId.has(id), `Dangling supporting capture ${id}`)
}

for (const code of ['482.20', '482.30-K', '482.26', '482.27', 'E3308', 'E 3307', 'TZ18', 'KM530', 'AP3173', 'AP3174',
  'TRE0312', 'TRE0315', 'TRE0320 - 2', '482.11', 'TRE1700 - 1.2', 'KM344A', 'KM3441A', 'KM3442A']) {
  assert.equal(typeof fact(`db:${code}`).name, 'string')
}
assert.equal(fact('db:482.26').englishLabel, 'inward opening')
assert.equal(fact('db:482.27').englishLabel, 'outward opening')
assert.equal(fact('pdf:482.26').classification, 'door sash')
assert.equal(fact('pdf:482.27').classification, 'door sash')
assert.equal(fact('pdf:E 3308').classification, 'aluminium threshold')
assert.equal(fact('pdf:E 3307').classification, 'aluminium brush profile')
assert.equal(fact('pdf:482.30').catalogCode, '482.30')
assert(!byId.has('db:482.30'), 'Do not normalize -K away')
for (const code of ['482.23', '482.25']) assert.equal(fact(`db:${code}`).doorSashSubstitutionAllowed, false)

const pdfExpected = {
  '482.20': [60, 68, 46], '482.30': [60, 64, 42], '482.26': [60, 102, 102],
  '482.27': [60, 124, 80], 'E 3308': [59.5, 20], 'E 3307': [56.6, 24.3, 2], 'TRE 03': [29.5, 65, 70],
}
for (const [code, expected] of Object.entries(pdfExpected)) assert.deepEqual(fact(`pdf:${code}`).calloutsMm, expected)
assert.deepEqual(fact('pdf:TRE 03').statedFor, ['482.26', '482.27'])
assert.deepEqual(fact('pdf:TRE 03').thicknessOptionsMm, [2])
const rawExpected = {
  '482.20': [46, 0, 60, 68], '482.30-K': [42, 0, 60, 64], '482.26': [82, 20, 60, 124],
  '482.27': [82, 20, 60, 124], E3308: [20, 0, 59.5, 20], 'E 3307': [24.3, 0, 56.56, 0],
}
for (const [code, expected] of Object.entries(rawExpected)) {
  const raw = fact(`dimensions:${code}`)
  assert.deepEqual([raw.dim_in, raw.dim_out, raw.profilew, raw.profilez], expected)
  assert.equal(raw.physicalSemantics, 'UNKNOWN')
  assert.equal(raw.zeroProvesZeroPhysicalSize, false)
  assert.equal(byId.get(`dimensions:${code}`).classification, 'RAW LEGACY VALUE')
}
assert.deepEqual(fact('gap:option'), { ID: 56, value: '10', comment: 'DIST2BOTTOM_SAVED' })
assert.equal(byId.get('gap:option').classification, 'RAW LEGACY VALUE')
const gap = fact('gap:interpretation')
assert.equal(byId.get('gap:interpretation').classification, 'STRONG EVIDENCE')
for (const key of ['units', 'precedence', 'permittedRange']) assert.equal(gap[key], 'UNKNOWN')
assert.equal(gap.preludeApplicability, 'UNRESOLVED')
assert.equal(gap.verifiedPhysicalClearanceMm, null)
assert.equal(gap.fixedSystemDefault, false)
assert.equal(gap.productionClearance, false)
assert.deepEqual(fact('gap:fields'), ['Working_table.dist2bottom', 'Modul_propertis.Dist2bottom'])
const open = fact('open-frame:interpretation')
assert.equal(open.geometry, 'UNRESOLVED')
for (const key of ['storageRepresentation', 'bottomMemberOmission', 'leafBottomRelation', 'serializationCommandOrSubtype']) assert.equal(open[key], 'UNKNOWN')
assert.equal(fact('open-frame:labels')['Without threshold'], 'Отворена каса')
for (const [family, frame] of [['4K', '482.20'], ['3K', '482.30-K']]) {
  assert.equal(fact(`threshold:${family}`).D0B0, `${frame};${frame};E3308;${frame}`)
  assert.equal(fact(`closed:${family}`).D0B0, `${frame};${frame};${frame};${frame}`)
  assert.equal(fact(`threshold:${family}`).D4B0, '0110')
  assert.equal(fact(`closed:${family}`).D4B0, '0000')
  assert.equal(fact(`threshold:${family}`).D4B0Meaning, 'UNKNOWN')
}
assert.equal(fact('threshold:interpretation').ruleValidated, false)
assert.deepEqual(evidence.expressions.map((r) => r.value.expression), [
  'E 3307 = L - 64', 'TZ18 = L * 2', '482.11 = H - 75', 'TRE1700 - 1.2 = H - 102',
])
for (const { value } of evidence.expressions) {
  assert.equal(value.evaluationAllowed, false)
  assert.equal(value.status, 'UNEVALUATED LEGACY EVIDENCE')
  assert.equal(value.L, 'UNKNOWN'); assert.equal(value.H, 'UNKNOWN')
}
assert.deepEqual(fact('correction:single-door'), { dist_u: 8, dist_b: 8, dist_l: 8, dist_r: 8,
  Pl: 6, Assembly_Use_Rabbet: 1, ReinfCorr: 20, units: 'UNKNOWN', physicalSemantics: 'UNKNOWN' })
for (const key of ['overlapMm', 'floorGapMm', 'sashClearanceMm', 'cuttingDeductionMm']) assert.equal(fact('correction:interpretation')[key], null)
assert.deepEqual(evidence.conflicts.map((r) => r.id), ['accessory-codes', 'frame-comment-assignment', 'opening-direction',
  'threshold-flag', 'threshold-cap-context', 'reinforcement-thickness'].map((id) => `conflict:${id}`))
for (const r of [...evidence.conflicts, ...evidence.unknowns]) assert.equal(r.value.resolution, 'UNRESOLVED')
assert.deepEqual(evidence.policy, {
  authority: 'SOURCE EVIDENCE ONLY', automaticGeometryAllowed: false, rulesValidated: false, machineReady: false,
  automaticSashPlacementAllowed: false, automaticBottomClearanceAllowed: false,
  automaticThresholdPlacementAllowed: false, automaticPFrameGenerationAllowed: false,
  automaticOverlapGeometryAllowed: false, formulaEvaluationAllowed: false,
  automaticHardwareSelectionAllowed: false, productionReady: false,
})
assert.throws(() => { gap.verifiedPhysicalClearanceMm = 10 }, TypeError, 'Immutable evidence must reject promotion')

// Enforce isolation from every existing runtime source (including barrel exports).
function inspect(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, item.name)
    if (item.isDirectory()) inspect(file)
    else if (/\.tsx?$/.test(file) && item.name !== 'prelude60DoorEvidence.ts') {
      assert(!readFileSync(file, 'utf8').includes('prelude60DoorEvidence'), `Unexpected runtime evidence consumer: ${file}`)
    }
  }
}
inspect('src')
console.log(`PRELUDE 60 DOOR EVIDENCE FOUNDATION 01: PASS (${records.length} source-linked captures)`)
console.log('RUNTIME BEHAVIOR CHANGED = NO')
console.log('AUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
