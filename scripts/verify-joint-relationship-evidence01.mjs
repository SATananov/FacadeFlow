import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const joint = load('src/data/profileSystems/jointRelationshipEvidence.ts')
const profiles = load('src/domain/profileResolution.ts')
const catalog = load('src/data/profileSystems/catalog.ts')

const evaluate = (systemId, profileAId, profileBId, profileARole, profileBRole, orientation) =>
  joint.evaluateJointRelationshipEvidence({ systemId, profileAId, profileBId, profileARole, profileBRole, orientation, relationshipContext: 'FRAME_TO_MULLION' })

const horizontal = evaluate('kmg-prelude-60', '482.20', '482.21', 'frame', 'mullion', 'horizontal')
assert.equal(horizontal.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(horizontal.evidenceStatus, 'DATABASE_RULE_EVIDENCE')
assert.equal(horizontal.bindingEvidence, 'CONTEXT_RELATIONSHIP_EVIDENCE')
assert.equal(horizontal.directArticlePairBinding, 'UNKNOWN')
assert.deepEqual(horizontal.ruleIds, ['BeamHorizontalKMG4k'])
assert.deepEqual(horizontal.operationNames, ['SglobkaDelitel'])
assert.deepEqual(horizontal.relationTokens, ['L_Fr', 'R_Fr'])
assert.deepEqual(horizontal.operationCodes, ['19', '19'])
assert.deepEqual(horizontal.positionExpressions, ['POS[]', 'POS[]'])
assert.deepEqual(horizontal.sourceMarkers, ['MM1', 'MM4'])
assert.ok(horizontal.unknowns.some((value) => value.includes('Physical notch contour')))

const vertical = evaluate('kmg-prelude-60', '482.20', '482.21', 'frame', 'mullion', 'vertical')
assert.equal(vertical.relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(vertical.bindingEvidence, 'CONTEXT_RELATIONSHIP_EVIDENCE')
assert.equal(vertical.directArticlePairBinding, 'UNKNOWN')
assert.deepEqual(vertical.ruleIds, ['BeamVerticalKMG4k'])
assert.deepEqual(vertical.relationTokens, ['U_Fr', 'D_Fr'])
assert.deepEqual(vertical.operationCodes, ['19', '19'])
assert.deepEqual(vertical.positionExpressions, ['POS[]', 'POS[]'])
assert.deepEqual(vertical.sourceMarkers, ['MM1', 'MM1'])
assert.notDeepEqual(horizontal.relationTokens, vertical.relationTokens)
assert.notDeepEqual(horizontal.sourceMarkers, vertical.sourceMarkers)

assert.equal(evaluate('kmg-prelude-60', '482.20', '482.21', 'frame', 'frame', 'horizontal').relationshipStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '482.21', '482.20', 'mullion', 'frame', 'horizontal').relationshipStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', 'UNKNOWN', '482.21', 'frame', 'mullion', 'horizontal').relationshipStatus, 'PROFILE_NOT_FOUND')
assert.equal(evaluate('unknown-system', '482.20', '482.21', 'frame', 'mullion', 'horizontal').relationshipStatus, 'SYSTEM_NOT_FOUND')

for (const [systemId, profileAId, profileBId] of [
  ['vivaplast', 'ГОЛ.КАСА 5522', 'ДЕЛ.ГОЛЯМ 5523'],
  ['profilink16', '1330000056', '311007'],
  ['schuco', 'SCH 19411', 'SCH 19460'],
  ['baufen', '1607', '1632'],
  ['weissprofil2018-113', '3001', '3003'],
]) {
  const result = evaluate(systemId, profileAId, profileBId, 'frame', 'mullion', 'horizontal')
  assert.equal(result.relationshipStatus, 'NO_EXPLICIT_RELATIONSHIP_EVIDENCE')
  assert.equal(result.evidenceStatus, 'UNKNOWN')
  assert.equal(result.bindingEvidence, 'UNKNOWN')
  assert.equal(result.directArticlePairBinding, 'UNKNOWN')
  assert.equal(result.relationTokens.length, 0)
}

const system = catalog.getProfileSystemById('kmg-prelude-60')
const resolution = profiles.createModuleProfileResolution(system.id)
const snapshot = JSON.stringify(resolution)
assert.equal(evaluate('kmg-prelude-60', '482.20', '482.21', 'frame', 'mullion', 'horizontal').relationshipStatus, 'RELATIONSHIP_EVIDENCE_FOUND')
assert.equal(JSON.stringify(resolution), snapshot)
assert.equal(profiles.setFrameProfileAssignment(resolution, system, '482.20').frame.profileCode, '482.20')
assert.equal(JSON.stringify(resolution), snapshot)

const jointSource = await readFile(new URL('../src/data/profileSystems/jointRelationshipEvidence.ts', import.meta.url), 'utf8')
const profileKnowledgeSource = await readFile(new URL('../src/data/profileSystems/profileKnowledge.ts', import.meta.url), 'utf8')
const assignmentSource = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
assert.match(jointSource, /JOINT RELATIONSHIP EVIDENCE != JOINT GEOMETRY/)
assert.match(jointSource, /CONTEXT RELATIONSHIP EVIDENCE != DIRECT ARTICLE-PAIR BINDING/)
assert.match(jointSource, /NO EXPLICIT EVIDENCE != NO JOINT/)
assert.doesNotMatch(jointSource, /setFrameProfileAssignment|setDividerProfileAssignment|setFieldSashProfileAssignment|profileAwareGeometry|profileJointGeometry/)
assert.doesNotMatch(profileKnowledgeSource, /jointRelationshipEvidence/)
assert.doesNotMatch(assignmentSource, /jointRelationshipEvidence|evaluateJointRelationshipEvidence/)
for (const systemName of ['VivaPlast', 'Profilink16', 'Schuco', 'Baufen', 'WeissProfil']) {
  assert.doesNotMatch(jointSource, new RegExp(systemName, 'i'))
}
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('JOINT RELATIONSHIP EVIDENCE 01 VERIFY PASS')
console.log('KMG HORIZONTAL RELATIONSHIP: PASS')
console.log('KMG VERTICAL RELATIONSHIP: PASS')
console.log('ORIENTATION TOKEN GUARD: PASS')
console.log('MM TOKEN PRESERVATION: PASS')
console.log('POS[] PRESERVATION: PASS')
console.log('ROLE MISMATCH GUARD: PASS')
console.log('NON-KMG EVIDENCE STATUS: PASS')
console.log('DIRECT ARTICLE-PAIR BINDING: UNKNOWN')
console.log('GEOMETRY INFERENCE: ABSENT')
console.log('AUTOMATIC JOINT CREATION CHANGED: NO')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
