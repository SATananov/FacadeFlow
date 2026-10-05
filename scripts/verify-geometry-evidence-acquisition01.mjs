import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const geometry = load('src/data/profileSystems/geometryEvidence.ts')
const relationship = load('src/data/profileSystems/jointRelationshipEvidence.ts')

const args = {
  systemId: 'kmg-prelude-60',
  profileAId: '482.20',
  profileBId: '482.21',
  profileARole: 'frame',
  profileBRole: 'mullion',
  relationshipContext: 'FRAME_TO_MULLION',
}

for (const orientation of ['horizontal', 'vertical']) {
  const record = geometry.getGeometryEvidence({ ...args, orientation })
  assert.ok(record)
  assert.equal(record.evidenceStatus, 'DATABASE_RELATIONSHIP_ONLY')
  assert.equal(record.profileASectionEvidence.status, 'CATALOGUE_VERIFIED')
  assert.equal(record.profileBSectionEvidence.status, 'CATALOGUE_VERIFIED')
  assert.equal(record.overlapEvidence.status, 'UNKNOWN')
  assert.equal(record.rebateEvidence.status, 'UNKNOWN')
  assert.equal(record.notchContourEvidence.status, 'UNKNOWN')
  assert.equal(record.cutAngleEvidence.status, 'UNKNOWN')
  assert.equal(record.cutLengthEvidence.status, 'UNKNOWN')
  assert.equal(record.sourceType, 'DATABASE')
  assert.ok(record.sourceReference)
  assert.ok(record.unknowns.length > 0)
}

const horizontalRelationship = relationship.evaluateJointRelationshipEvidence({
  ...args,
  orientation: 'horizontal',
})
const verticalRelationship = relationship.evaluateJointRelationshipEvidence({
  ...args,
  orientation: 'vertical',
})
assert.equal(horizontalRelationship.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(verticalRelationship.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(horizontalRelationship.geometryStatus, 'UNKNOWN')
assert.equal(verticalRelationship.geometryStatus, 'UNKNOWN')
assert.deepEqual(horizontalRelationship.sourceRelationTokens, ['L_Fr', 'R_Fr'])
assert.deepEqual(verticalRelationship.sourceRelationTokens, ['U_Fr', 'D_Fr'])
assert.deepEqual(horizontalRelationship.sourceMarkers, ['MM1', 'MM4'])
assert.deepEqual(verticalRelationship.sourceMarkers, ['MM1', 'MM1'])
assert.deepEqual(horizontalRelationship.positionExpressions, ['POS[]', 'POS[]'])
assert.deepEqual(verticalRelationship.positionExpressions, ['POS[]', 'POS[]'])
assert.equal(horizontalRelationship.directArticlePairBindingStatus, 'UNKNOWN')
assert.equal(verticalRelationship.directArticlePairBindingStatus, 'UNKNOWN')

assert.equal(geometry.getGeometryEvidence({ ...args, orientation: 'horizontal', profileAId: '482.21', profileBId: '482.20' }), undefined)
assert.equal(geometry.getGeometryEvidence({ ...args, orientation: 'horizontal', profileBRole: 'frame' }), undefined)
assert.equal(geometry.getGeometryEvidence({ ...args, orientation: 'horizontal', profileAId: 'unknown-profile' }), undefined)
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

const source = await readFile(new URL('../src/data/profileSystems/geometryEvidence.ts', import.meta.url), 'utf8')
assert.match(source, /GEOMETRY EVIDENCE != GENERATED GEOMETRY/)
assert.match(source, /AUTOMATIC GEOMETRY = NO/)
assert.doesNotMatch(source, /setFrameProfileAssignment|setDividerProfileAssignment|createJoint|generateGeometry/i)

console.log('GEOMETRY EVIDENCE ACQUISITION 01 VERIFY PASS')
console.log('KMG GEOMETRY EVIDENCE RECORD: PASS')
console.log('SOURCE PROVENANCE: PASS')
console.log('RELATIONSHIP / GEOMETRY SEPARATION: PASS')
console.log('SglobkaDelitel DATABASE-ONLY: PASS')
console.log('OPAQUE MM/POS TOKENS: PASS')
console.log('UNKNOWN GEOMETRY GUARD: PASS')
console.log('RUNTIME MUTATION GUARD: PASS')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
