import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')
const system = systemData.getProfileSystemById('kmg-prelude-60')
assert(system, 'PRELUDE 60 catalogue fixture missing')

function build(construction, resolution) {
  return product.buildSystemDrivenModuleReadModel({ moduleId: 'runtime-module', moduleSequence: 1, productType: 'window', system, construction, resolution })
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, '01G split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  for (const field of resolved.fields) construction = topology.setConstructionFieldType(construction, field.id, 'operable')
  resolved = topology.resolveConstructionTopology(construction)

  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  for (const field of resolved.fields) {
    resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
    resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
    resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, field, 24, '482.15')
  }

  const model = build(construction, resolution)
  assert.equal(model.glazingEvidenceOpenGapCount, 3)
  assert.equal(model.glazingEvidenceReviewItems.length, 3)
  assert(model.glazingEvidenceReviewCandidateCount >= 1, '01G requires at least the glass-cut reference candidate; later acquisition stages may add more source-bound candidates')
  assert.equal(model.glazingEvidenceReviewedCount, 0, 'reference candidate must not count as reviewed')

  const compatibility = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'bead-base-compatibility')
  const placement = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'placement-evidence')
  const glassCut = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'glass-cut-rule')
  assert(compatibility && placement && glassCut)

  assert(['evidence-required', 'reference-candidate'].includes(compatibility.reviewState), 'bead-base must remain open or reference-only')
  assert(['evidence-required', 'reference-candidate'].includes(placement.reviewState), 'placement must remain open or reference-only')
  assert.equal(glassCut.reviewState, 'reference-candidate')
  assert.equal(glassCut.candidateSourceId, 'kmg-prelude60-glazing-24-reference-01')
  assert(glassCut.candidateSummaryBg?.includes('12 / 12 mm'))

  for (const item of model.glazingEvidenceReviewItems) {
    assert.equal(item.occurrenceCount, 8)
    assert.deepEqual(item.fieldSequences, [1, 2])
    assert.equal(item.acceptedEvidenceStatus, 'none')
    assert.equal(item.rulePromotionAllowed, false)
    assert.equal(item.automaticGeometryAllowed, false)
    assert.equal(item.machineReady, false)
  }
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'fixed')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
  const model = build(construction, resolution)
  assert.equal(model.glazingEvidenceReviewItems.length, 1)
  assert.equal(model.glazingEvidenceReviewItems[0].gapKind, 'field-input')
  assert.equal(model.glazingEvidenceReviewItems[0].reviewState, 'human-input-required')
  assert.equal(model.glazingEvidenceReviewItems[0].candidateSourceId, null)
  assert.equal(model.glazingEvidenceReviewCandidateCount, 0)
  assert.equal(model.glazingEvidenceReviewedCount, 0)
}

console.log('=== ASSEMBLY FUNCTIONALITY 01G RUNTIME PASS ===')
console.log('3 UNIQUE 01F GAPS -> 3 REVIEW ITEMS PASS')
console.log('GLASS CUT 24 mm: REFERENCE 12/12 CANDIDATE VISIBLE / NOT PROMOTED')
console.log('BEAD-BASE + PLACEMENT: OPEN OR REFERENCE-ONLY / NOT REVIEWED')
console.log('REFERENCE CANDIDATE != REVIEWED EVIDENCE')
console.log('RULE PROMOTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
