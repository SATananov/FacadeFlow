import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const context = load('src/data/profileSystems/geometryReadinessContext.ts')
const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')

assert.match(shell, /evaluateSelectedGeometryReadiness/)
assert.match(shell, /participantA/)
assert.match(shell, /participantB/)
assert.match(shell, /relationshipContext/)
assert.doesNotMatch(shell, /profileAId:\s*['"]482\.20['"]|profileBId:\s*['"]482\.21['"]/)
assert.doesNotMatch(shell, /participantA\s*=\s*participantB|participantB\s*=\s*participantA/)

const base = {
  participantA: { role: 'frame', profileId: '482.20', systemId: 'kmg-prelude-60', selectionId: 'frame' },
  participantB: { role: 'mullion', profileId: '482.21', systemId: 'kmg-prelude-60', selectionId: 'divider-1' },
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}
const kmg = context.evaluateSelectedGeometryReadiness(base)
assert.equal(kmg.status, 'READY')
assert.equal(kmg.evaluation.profileA.id, '482.20')
assert.equal(kmg.evaluation.profileB.id, '482.21')
assert.equal(kmg.evaluation.physicalGeometryStatus, 'BLOCKED')
assert.equal(kmg.evaluation.machineGeometryStatus, 'BLOCKED')
assert.ok(kmg.evaluation.allowedUses.some((item) => item.use === 'SCHEMATIC_RELATIONSHIP_DISPLAY'))

const reversed = context.evaluateSelectedGeometryReadiness({
  ...base,
  participantA: base.participantB,
  participantB: base.participantA,
})
assert.equal(reversed.status, 'ROLE_MISMATCH')
assert.equal(reversed.evaluation, null)
assert.equal(reversed.participantA.role, 'mullion')
assert.equal(reversed.participantB.role, 'frame')

assert.equal(context.evaluateSelectedGeometryReadiness({ ...base, participantA: null }).status, 'INCOMPLETE_SELECTION')
assert.equal(context.evaluateSelectedGeometryReadiness({ ...base, participantB: null }).status, 'INCOMPLETE_SELECTION')
assert.equal(context.evaluateSelectedGeometryReadiness({ ...base, relationshipContext: null }).status, 'CONTEXT_UNAVAILABLE')
assert.equal(context.evaluateSelectedGeometryReadiness({ ...base, participantB: { ...base.participantB, profileId: null } }).status, 'PROFILE_ID_UNKNOWN')

const nonKmg = context.evaluateSelectedGeometryReadiness({
  ...base,
  participantA: { ...base.participantA, profileId: '5522', systemId: 'vivaplast' },
  participantB: { ...base.participantB, profileId: '5523', systemId: 'vivaplast' },
})
assert.equal(nonKmg.status, 'READY')
assert.equal(nonKmg.evaluation.relationshipEvidenceStatus, 'UNKNOWN')
assert.equal(nonKmg.evaluation.physicalGeometryStatus, 'BLOCKED')

const before = JSON.stringify(base)
context.evaluateSelectedGeometryReadiness(base)
assert.equal(JSON.stringify(base), before)

for (const runtimePath of ['src/domain/profileAwareGeometry', 'src/domain/profileJointGeometry', 'src/components/CompositeStructuralSketch']) {
  assert.equal(execFileSync('git', ['diff', '--', runtimePath], { encoding: 'utf8' }), '', `runtime path changed: ${runtimePath}`)
}

console.log('GEOMETRY READINESS CONTEXT 01 VERIFY PASS')
console.log('REAL SELECTED PARTICIPANTS: PASS')
console.log('FRAME_TO_MULLION ORDER: EXPLICIT')
console.log('REVERSED ORDER: ROLE_MISMATCH / NOT REORDERED')
console.log('INCOMPLETE / UNKNOWN CONTEXT: EXPLICIT')
console.log('KMG READINESS: BLOCKED PHYSICAL AND MACHINING')
console.log('MUTATION / GEOMETRY SIDE EFFECTS: NONE')
