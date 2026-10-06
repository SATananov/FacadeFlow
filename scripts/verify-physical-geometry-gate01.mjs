import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const gate = load('src/data/profileSystems/physicalGeometryGate.ts')
const context = load('src/data/profileSystems/geometryReadinessContext.ts')
const source = fs.readFileSync('src/data/profileSystems/physicalGeometryGate.ts', 'utf8')
const docs = fs.readFileSync('docs/PHYSICAL_GEOMETRY_GATE_01.md', 'utf8')

const kmgArgs = {
  participantA: { role: 'frame', profileId: '482.20', systemId: 'kmg-prelude-60', selectionId: 'frame' },
  participantB: { role: 'mullion', profileId: '482.21', systemId: 'kmg-prelude-60', selectionId: 'divider-1' },
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}
const kmgContext = context.evaluateSelectedGeometryReadiness(kmgArgs)
const kmg = gate.evaluatePhysicalGeometryGate(kmgContext)
assert.equal(kmg.status, 'BLOCKED')
assert.equal(kmg.participantValidation, 'VALID')
assert.equal(kmg.contextValidation, 'VALID')
assert.ok(kmg.missingEvidence.includes('CONTACT_DEFINITION'))
assert.ok(kmg.missingEvidence.includes('OVERLAP_OR_REBATE'))
assert.ok(kmg.missingEvidence.includes('END_TREATMENT_OR_NOTCH'))
assert.ok(kmg.missingEvidence.includes('ASSEMBLY_CROSS_SECTION'))
assert.equal(kmg.sourceReadinessStatus, 'DATABASE_RELATIONSHIP_ONLY')
for (const blocker of [
  'CONTACT_LINE_UNKNOWN',
  'CONTACT_DEPTH_UNKNOWN',
  'OVERLAP_UNKNOWN',
  'REBATE_UNKNOWN',
  'NOTCH_CONTOUR_UNKNOWN',
  'CUT_ANGLE_UNKNOWN',
  'CUT_LENGTH_UNKNOWN',
  'CONNECTOR_PLACEMENT_UNKNOWN',
  'ASSEMBLY_CROSS_SECTION_UNKNOWN',
]) {
  assert.ok(kmg.readiness.missingEvidence.includes(blocker), `KMG freeze blocker missing: ${blocker}`)
}
assert.ok(kmg.readiness.allowedUses.some((decision) => decision.use === 'SCHEMATIC_RELATIONSHIP_DISPLAY' && decision.status === 'ALLOWED'))
assert.equal(kmg.readiness.physicalGeometryStatus, 'BLOCKED')
assert.equal('machineGeometryStatus' in kmg, false, 'physical gate must not become machine readiness')

const reversed = gate.evaluatePhysicalGeometryGate(context.evaluateSelectedGeometryReadiness({
  ...kmgArgs,
  participantA: kmgArgs.participantB,
  participantB: kmgArgs.participantA,
}))
assert.equal(reversed.status, 'BLOCKED')
assert.equal(reversed.participantValidation, 'MISMATCH')
assert.match(reversed.reasons.join(' '), /not reordered/i)

for (const incomplete of [
  { ...kmgArgs, participantA: null },
  { ...kmgArgs, participantB: null },
  { ...kmgArgs, relationshipContext: null },
  { ...kmgArgs, participantB: { ...kmgArgs.participantB, profileId: null } },
]) {
  const result = gate.evaluatePhysicalGeometryGate(context.evaluateSelectedGeometryReadiness(incomplete))
  assert.ok(['UNKNOWN', 'BLOCKED'].includes(result.status))
}

const nonKmg = gate.evaluatePhysicalGeometryGate(context.evaluateSelectedGeometryReadiness({
  ...kmgArgs,
  participantA: { ...kmgArgs.participantA, profileId: '5522', systemId: 'vivaplast' },
  participantB: { ...kmgArgs.participantB, profileId: '5523', systemId: 'vivaplast' },
}))
assert.ok(['BLOCKED', 'UNKNOWN'].includes(nonKmg.status))
assert.ok(nonKmg.missingEvidence.length > 0)

assert.doesNotMatch(source, /profileW|profileZ|dim_in|dim_out|cuttingang/i)
assert.doesNotMatch(source, /SCHEMATIC_RELATIONSHIP_DISPLAY.*ALLOWED|SCHEMATIC_RELATIONSHIP_DISPLAY.*=>.*ALLOWED/i)
assert.match(docs, /machine readiness remains a separate/i)

const before = JSON.stringify(kmgArgs)
gate.evaluatePhysicalGeometryGate(kmgContext)
assert.equal(JSON.stringify(kmgArgs), before)

for (const runtimePath of ['src/domain/profileAwareGeometry', 'src/domain/profileJointGeometry', 'src/components/CompositeStructuralSketch']) {
  assert.equal(execFileSync('git', ['diff', '--', runtimePath], { encoding: 'utf8' }), '', `runtime path changed: ${runtimePath}`)
}

console.log('PHYSICAL GEOMETRY GATE 01 VERIFY PASS')
console.log('KMG 482.20 -> 482.21: BLOCKED')
console.log('FREEZE / UNKNOWN PHYSICAL FACTS: RESPECTED')
console.log('CATALOGUE / RELATIONSHIP / SCHEMATIC / DIMENSION FALLBACK: ABSENT')
console.log('REVERSED PARTICIPANTS: EXPLICIT MISMATCH')
console.log('NON-KMG: SAFE BLOCKED / UNKNOWN')
console.log('MUTATION / AUTOMATIC GEOMETRY / MACHINE READINESS: NONE')
