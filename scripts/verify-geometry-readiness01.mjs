import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const readiness = load('src/data/profileSystems/geometryReadiness.ts')

const kmgArgs = {
  systemId: 'kmg-prelude-60',
  profileAId: '482.20',
  profileBId: '482.21',
  profileARole: 'frame',
  profileBRole: 'mullion',
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}

const kmg = readiness.evaluateGeometryReadiness(kmgArgs)
assert.equal(kmg.profileResolutionStatus, 'SUPPORTED')
assert.equal(kmg.relationshipEvidenceStatus, 'DATABASE_RULE_EVIDENCE')
assert.equal(kmg.geometryEvidenceStatus, 'DATABASE_RELATIONSHIP_ONLY')
assert.equal(kmg.readinessLevel, 'SCHEMATIC_ONLY')
assert.equal(kmg.physicalGeometryStatus, 'BLOCKED')
assert.equal(kmg.machineGeometryStatus, 'BLOCKED')
assert.deepEqual(kmg.allowedUses.map((item) => item.use), [
  'PROFILE_DISPLAY',
  'RELATIONSHIP_CONTEXT_DISPLAY',
  'SCHEMATIC_RELATIONSHIP_DISPLAY',
])
assert.deepEqual(kmg.blockedUses.map((item) => item.use), ['PHYSICAL_JOINT_GEOMETRY', 'MACHINING_GEOMETRY'])
for (const blocker of [
  'CONTACT_SURFACES_UNKNOWN',
  'CONTACT_DEPTH_UNKNOWN',
  'OVERLAP_UNKNOWN',
  'REBATE_UNKNOWN',
  'NOTCH_CONTOUR_UNKNOWN',
  'CUT_ANGLE_UNKNOWN',
  'CUT_LENGTH_UNKNOWN',
  'ASSEMBLY_CROSS_SECTION_UNKNOWN',
  'CONNECTOR_PLACEMENT_UNKNOWN',
  'MACHINING_GEOMETRY_UNKNOWN',
]) assert.ok(kmg.missingEvidence.includes(blocker), `missing KMG blocker: ${blocker}`)

const reversed = readiness.evaluateGeometryReadiness({
  ...kmgArgs,
  profileAId: '482.21',
  profileBId: '482.20',
  profileARole: 'mullion',
  profileBRole: 'frame',
})
assert.equal(reversed.profileResolutionStatus, 'BLOCKED')
assert.equal(reversed.relationshipEvidenceStatus, 'UNKNOWN')
assert.equal(reversed.readinessLevel, 'PROFILE_CONTEXT_BLOCKED')
assert.equal(reversed.profileA.id, '482.21')
assert.equal(reversed.profileB.id, '482.20')

const nonKmg = readiness.evaluateGeometryReadiness({
  systemId: 'vivaplast',
  profileAId: 'ГОЛ.КАСА 5522',
  profileBId: 'ДЕЛ.ГОЛЯМ 5523',
  profileARole: 'frame',
  profileBRole: 'mullion',
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
})
assert.equal(nonKmg.profileResolutionStatus, 'SUPPORTED')
assert.equal(nonKmg.relationshipEvidenceStatus, 'UNKNOWN')
assert.equal(nonKmg.readinessLevel, 'PROFILE_CONTEXT_READY')
assert.ok(nonKmg.allowedUses.some((item) => item.use === 'PROFILE_DISPLAY'))
assert.ok(nonKmg.blockedUses.some((item) => item.use === 'RELATIONSHIP_CONTEXT_DISPLAY'))
assert.ok(nonKmg.blockedUses.some((item) => item.use === 'PHYSICAL_JOINT_GEOMETRY'))

const dimensionsCannotUpgrade = readiness.evaluateGeometryReadiness({
  ...kmgArgs,
  orientation: 'vertical',
})
assert.equal(dimensionsCannotUpgrade.physicalGeometryStatus, 'BLOCKED')
assert.equal(dimensionsCannotUpgrade.machineGeometryStatus, 'BLOCKED')
assert.ok(dimensionsCannotUpgrade.evidenceSummary.some((value) => value.includes('Envelope dimensions')))

const snapshot = JSON.stringify(kmg)
assert.equal(JSON.stringify(readiness.evaluateGeometryReadiness(kmgArgs)), snapshot)

console.log('GEOMETRY READINESS 01 VERIFY PASS')
console.log('KMG PROFILE CONTEXT: READY')
console.log('KMG RELATIONSHIP CONTEXT: READY')
console.log('KMG SCHEMATIC DISPLAY: ALLOWED / LABELLED ONLY')
console.log('KMG PHYSICAL JOINT GEOMETRY: BLOCKED')
console.log('KMG MACHINING GEOMETRY: BLOCKED')
console.log('DIMENSION FALLBACK: ABSENT')
console.log('NON-KMG MISSING RELATIONSHIP: EXPLICIT UNKNOWN')
console.log('MUTATION / AUTOMATIC GEOMETRY: NONE')
