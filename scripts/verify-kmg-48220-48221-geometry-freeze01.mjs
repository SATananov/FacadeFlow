import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const geometry = load('src/data/profileSystems/geometryEvidence.ts')
const relationship = load('src/data/profileSystems/jointRelationshipEvidence.ts')
const profileResolution = load('src/data/profileSystems/profileResolutionEvidence.ts')
const freezeDocument = await readFile(new URL('../docs/KMG_48220_48221_GEOMETRY_EVIDENCE_FREEZE01.md', import.meta.url), 'utf8')
const geometrySource = await readFile(new URL('../src/data/profileSystems/geometryEvidence.ts', import.meta.url), 'utf8')

const args = {
  systemId: 'kmg-prelude-60',
  profileAId: '482.20',
  profileBId: '482.21',
  profileARole: 'frame',
  profileBRole: 'mullion',
  relationshipContext: 'FRAME_TO_MULLION',
}
const sourceSha256 = '1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F'

for (const orientation of ['horizontal', 'vertical']) {
  const record = geometry.getGeometryEvidence({ ...args, orientation })
  assert.ok(record, `missing frozen geometry evidence record for ${orientation}`)
  assert.equal(record.evidenceStatus, 'DATABASE_RELATIONSHIP_ONLY')
  assert.equal(record.profileASectionEvidence.status, 'CATALOGUE_VERIFIED')
  assert.equal(record.profileBSectionEvidence.status, 'CATALOGUE_VERIFIED')
  for (const section of [record.profileASectionEvidence, record.profileBSectionEvidence]) {
    assert.equal(section.sourceFile, 'PVC Prelude_bg.pdf')
    assert.equal(section.sourcePage, 2)
    assert.equal(section.sourceSha256, sourceSha256)
  }
  for (const field of [
    'contactLineEvidence',
    'contactPointEvidence',
    'overlapEvidence',
    'rebateEvidence',
    'notchContourEvidence',
    'cutAngleEvidence',
    'cutLengthEvidence',
    'assemblyCrossSectionEvidence',
  ]) {
    assert.equal(record[field].status, 'UNKNOWN', `${field} must remain UNKNOWN`)
  }

  const relation = relationship.evaluateJointRelationshipEvidence({ ...args, orientation })
  assert.equal(relation.evidenceStatus, 'DATABASE_RULE_EVIDENCE')
  assert.equal(relation.geometryStatus, 'UNKNOWN')
  assert.equal(relation.directArticlePairBindingStatus, 'UNKNOWN')
  assert.ok(relation.operationNames.includes('SglobkaDelitel'))
  assert.ok(relation.operationCodes.includes('19'))
  assert.ok(relation.positionExpressions.every((value) => value === 'POS[]'))
  assert.ok(relation.sourceMarkers.every((value) => ['MM1', 'MM4'].includes(value)))
}

for (const [profileId, role, context] of [
  ['482.20', 'frame', 'FRAME_ASSIGNMENT'],
  ['482.21', 'mullion', 'MULLION_ASSIGNMENT'],
]) {
  const result = profileResolution.evaluateProfileResolutionEvidence({
    systemId: 'kmg-prelude-60',
    profileId,
    requestedRole: role,
    context,
  })
  assert.equal(result.resolutionStatus, 'SUPPORTED_BY_DATABASE_ROLE')
  assert.equal(result.evidenceStatus, 'DATABASE_EVIDENCE')
}

for (const requiredText of [
  'KM242',
  'VERIFIED AS SUPPORTING CATALOGUE EVIDENCE',
  '| Contact surfaces | `UNKNOWN` |',
  '| Contact depth | `UNKNOWN` |',
  '| Overlap | `UNKNOWN` |',
  '| Rebate | `UNKNOWN` |',
  '| Notch contour | `UNKNOWN` |',
  '| Cut angle | `UNKNOWN` |',
  '| Cut length | `UNKNOWN` |',
  '| Machining geometry | `UNKNOWN` |',
  '| Connector placement | `UNKNOWN` |',
  '| Assembly cross-section | `UNKNOWN` |',
  'primary manufacturer assembly drawing',
  'AUTOMATIC GEOMETRY = NO',
  'MACHINE READY = NO',
]) {
  assert.ok(freezeDocument.includes(requiredText), `freeze document missing: ${requiredText}`)
}

assert.doesNotMatch(geometrySource, /createJoint|generateGeometry|setFrameProfileAssignment|setDividerProfileAssignment/i)
assert.doesNotMatch(geometrySource, /directArticlePairBinding\s*:\s*['"]PROVEN['"]|directArticlePairBindingStatus\s*:\s*['"]PROVEN['"]/)

console.log('KMG 482.20/482.21 GEOMETRY EVIDENCE FREEZE 01 VERIFY PASS')
console.log('CATALOGUE PROVENANCE: PASS')
console.log('RELATIONSHIP / GEOMETRY SEPARATION: PASS')
console.log('UNKNOWN FIELD FREEZE: PASS')
console.log('KM242 PLACEMENT UNKNOWN: PASS')
console.log('DIRECT ARTICLE-PAIR BINDING: UNKNOWN')
console.log('AUTOMATIC GEOMETRY: NO')
