import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const joint = load('src/data/profileSystems/jointRelationshipEvidence.ts')
const profiles = load('src/domain/profileResolution.ts')
const catalog = load('src/data/profileSystems/catalog.ts')

const evaluate = (args) => joint.evaluateJointRelationshipEvidence({
  ...args,
  relationshipContext: 'FRAME_TO_MULLION',
})

const horizontal = evaluate({
  systemId: 'kmg-prelude-60',
  profileAId: '482.20',
  profileBId: '482.21',
  profileARole: 'frame',
  profileBRole: 'mullion',
  orientation: 'horizontal',
})
assert.equal(horizontal.relationshipContext, 'FRAME_TO_MULLION')
assert.equal(horizontal.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.deepEqual(horizontal.sourceRelationTokens, ['L_Fr', 'R_Fr'])
assert.deepEqual(horizontal.operationCodes, ['19', '19'])
assert.deepEqual(horizontal.positionExpressions, ['POS[]', 'POS[]'])
assert.deepEqual(horizontal.sourceMarkers, ['MM1', 'MM4'])
assert.equal(horizontal.directArticlePairBindingStatus, 'UNKNOWN')
assert.equal(horizontal.geometryStatus, 'UNKNOWN')

const vertical = evaluate({
  systemId: 'kmg-prelude-60',
  profileAId: '482.20',
  profileBId: '482.21',
  profileARole: 'frame',
  profileBRole: 'mullion',
  orientation: 'vertical',
})
assert.equal(vertical.relationshipContext, 'FRAME_TO_MULLION')
assert.equal(vertical.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.deepEqual(vertical.sourceRelationTokens, ['U_Fr', 'D_Fr'])
assert.deepEqual(vertical.sourceMarkers, ['MM1', 'MM1'])
assert.notDeepEqual(horizontal.sourceRelationTokens, vertical.sourceRelationTokens)
assert.notDeepEqual(horizontal.sourceMarkers, vertical.sourceMarkers)

const reversed = evaluate({
  systemId: 'kmg-prelude-60',
  profileAId: '482.21',
  profileBId: '482.20',
  profileARole: 'mullion',
  profileBRole: 'frame',
  orientation: 'horizontal',
})
assert.equal(reversed.relationshipStatus, 'ROLE_MISMATCH')
assert.equal(reversed.profileAId, '482.21')
assert.equal(reversed.profileBId, '482.20')
assert.deepEqual(reversed.sourceRelationTokens, [])

for (const [systemId, profileAId, profileBId] of [
  ['vivaplast', 'ГОЛ.КАСА 5522', 'ДЕЛ.ГОЛЯМ 5523'],
  ['profilink16', '1330000056', '311007'],
  ['schuco', 'SCH 19411', 'SCH 19460'],
  ['baufen', '1607', '1632'],
  ['weissprofil2018-113', '3001', '3003'],
]) {
  const result = evaluate({ systemId, profileAId, profileBId, profileARole: 'frame', profileBRole: 'mullion', orientation: 'horizontal' })
  assert.equal(result.relationshipContext, 'FRAME_TO_MULLION')
  assert.equal(result.relationshipStatus, 'NO_EXPLICIT_RELATIONSHIP_EVIDENCE')
  assert.equal(result.directArticlePairBindingStatus, 'UNKNOWN')
  assert.equal(result.geometryStatus, 'UNKNOWN')
}

const system = catalog.getProfileSystemById('kmg-prelude-60')
const resolution = profiles.createModuleProfileResolution(system.id)
const snapshot = JSON.stringify(resolution)
assert.equal(evaluate({
  systemId: 'kmg-prelude-60', profileAId: '482.20', profileBId: '482.21',
  profileARole: 'frame', profileBRole: 'mullion', orientation: 'horizontal',
}).relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(JSON.stringify(resolution), snapshot)
assert.doesNotThrow(() => profiles.setFrameProfileAssignment(resolution, system, '482.20'))
assert.equal(JSON.stringify(resolution), snapshot)

const jointSource = await readFile(new URL('../src/data/profileSystems/jointRelationshipEvidence.ts', import.meta.url), 'utf8')
const assignmentSource = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
assert.match(jointSource, /FRAME_TO_MULLION/)
assert.match(jointSource, /geometryStatus: 'UNKNOWN'/)
assert.match(jointSource, /directArticlePairBindingStatus: 'UNKNOWN'/)
assert.doesNotMatch(jointSource, /setFrameProfileAssignment|setDividerProfileAssignment|setFieldSashProfileAssignment|profileAwareGeometry|profileJointGeometry/)
assert.doesNotMatch(assignmentSource, /jointRelationshipEvidence|evaluateJointRelationshipEvidence/)
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('JOINT RELATIONSHIP CONTEXT 02 VERIFY PASS')
console.log('FRAME_TO_MULLION CONTEXT: PASS')
console.log('HORIZONTAL CONTEXT: PASS')
console.log('VERTICAL CONTEXT: PASS')
console.log('REVERSED-PAIR GUARD: PASS')
console.log('ORIENTATION TOKEN GUARD: PASS')
console.log('DIRECT ARTICLE-PAIR BINDING: UNKNOWN')
console.log('GEOMETRY STATUS: UNKNOWN')
console.log('NON-KMG RELATIONSHIP EVIDENCE: UNKNOWN')
console.log('AUTO-REORDERING: ABSENT')
console.log('AUTOMATIC JOINT CREATION CHANGED: NO')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
