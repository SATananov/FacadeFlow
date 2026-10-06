import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRuntimeLoader } from './runtime-loader.mjs'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(`${root}/${relativePath}`, 'utf8')

const freezeDoc = read('docs/PHYSICAL_GEOMETRY_CANDIDATE_FREEZE01.md')
assert.match(freezeDoc, /PHYSICAL_DISPLAY_READY_CANDIDATE_COUNT = 0/)
assert.match(freezeDoc, /MACHINE_READY_CANDIDATE_COUNT = 0/)
assert.match(freezeDoc, /No candidate is approved for physical display geometry/i)
assert.match(freezeDoc, /Machining evidence is a separate promotion decision/i)
assert.match(freezeDoc, /Existing FacadeFlow presentation or runtime\s+geometry is not source evidence/i)

const candidateDocs = [
  'docs/FIRST_FULLY_EVIDENCED_JOINT01_CANDIDATE_REVIEW.md',
  'docs/EVIDENCE_CANDIDATE_RANKING02.md',
  'docs/KMG_48230_48205_FRAME_TO_SASH_EVIDENCE_ACQUISITION01.md',
  'docs/KMG_48205_48215_SASH_TO_BEAD_EVIDENCE_ACQUISITION01.md',
  'docs/KMG_48221_48218_MULLION_TO_SASH_EVIDENCE_ACQUISITION01.md',
  'docs/KMG_48220_48221_GEOMETRY_EVIDENCE_FREEZE01.md',
]
for (const path of candidateDocs) {
  assert.ok(fs.existsSync(`${root}/${path}`), `missing candidate evidence document: ${path}`)
}

for (const path of candidateDocs.slice(2, 5)) {
  const document = read(path)
  assert.doesNotMatch(document, /Physical display geometry ready:\s*(?:\*\*)?YES/i, `candidate promoted unexpectedly: ${path}`)
  assert.match(document, /physical display geometry[\s\S]{0,120}\bNO\b/i, `candidate must preserve not-ready status: ${path}`)
}
assert.match(read(candidateDocs[0]), /NO FULLY-EVIDENCED JOINT FOUND/i)
assert.match(read(candidateDocs[1]), /NO PHYSICAL-DISPLAY-READY JOINT FOUND/i)

const geometryGate = read('src/data/profileSystems/physicalGeometryGate.ts')
const facts = read('src/data/profileSystems/geometryFacts.ts')
assert.doesNotMatch(geometryGate, /profileW|profileZ|dim_in|dim_out|cuttingang/i)
assert.match(facts, /facts: unknownFacts\(/)
assert.match(facts, /No direct physical assembly source proves this fact/i)

const load = createRuntimeLoader()
const context = load('src/data/profileSystems/geometryReadinessContext.ts')
const gate = load('src/data/profileSystems/physicalGeometryGate.ts')
const kmgArgs = {
  participantA: { role: 'frame', profileId: '482.20', systemId: 'kmg-prelude-60', selectionId: 'frame' },
  participantB: { role: 'mullion', profileId: '482.21', systemId: 'kmg-prelude-60', selectionId: 'divider-1' },
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}
const kmgGate = gate.evaluatePhysicalGeometryGate(context.evaluateSelectedGeometryReadiness(kmgArgs))
assert.equal(kmgGate.status, 'BLOCKED')
assert.notEqual(kmgGate.status, 'ALLOWED')

const reversed = gate.evaluatePhysicalGeometryGate(context.evaluateSelectedGeometryReadiness({
  ...kmgArgs,
  participantA: kmgArgs.participantB,
  participantB: kmgArgs.participantA,
}))
assert.equal(reversed.status, 'BLOCKED')
assert.equal(reversed.participantValidation, 'MISMATCH')

for (const runtimePath of [
  'src/domain/profileAwareGeometry',
  'src/domain/profileJointGeometry',
  'src/components/CompositeStructuralSketch',
]) {
  assert.equal(execFileSync('git', ['diff', '--', runtimePath], { encoding: 'utf8' }), '', `runtime path changed: ${runtimePath}`)
}

assert.doesNotMatch(freezeDoc, /PHYSICAL_DISPLAY_READY_CANDIDATE_COUNT\s*=\s*[1-9]/)
assert.doesNotMatch(freezeDoc, /MACHINE_READY_CANDIDATE_COUNT\s*=\s*[1-9]/)

console.log('PHYSICAL GEOMETRY CANDIDATE FREEZE 01 VERIFY PASS')
console.log('PHYSICAL DISPLAY READY CANDIDATES: 0')
console.log('MACHINE READY CANDIDATES: 0')
console.log('KMG CANDIDATES: NOT_READY / FROZEN_BLOCKED')
console.log('PROMOTION CONDITIONS: DIRECT SOURCE REQUIRED')
console.log('RUNTIME DRAWING / AUTOMATIC GEOMETRY: UNCHANGED')
