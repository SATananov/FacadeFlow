import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')
const evidence = load('src/data/profileSystems/glazingEvidence')
const system = systemData.getProfileSystemById('kmg-prelude-60')
assert(system, 'PRELUDE 60 catalogue fixture missing')

const beadBaseCandidate = evidence.findPrelude60SectionalEvidenceCandidate({
  systemId: 'kmg-prelude-60',
  kind: 'bead-base-compatibility',
  baseProfileCode: '482.05',
  beadCode: '482.15',
  glazingThicknessMm: 24,
})
assert(beadBaseCandidate, 'EA01A bead-base candidate missing')
assert.equal(beadBaseCandidate.sourcePublisher, 'ALTEST')
assert.equal(beadBaseCandidate.sourcePage, 23)
assert.equal(beadBaseCandidate.reviewed, false)
assert.equal(beadBaseCandidate.rulePromotionAllowed, false)

const placementCandidate = evidence.findPrelude60SectionalEvidenceCandidate({
  systemId: 'kmg-prelude-60',
  kind: 'placement-evidence',
  baseProfileCode: '482.05',
  beadCode: '482.15',
  glazingThicknessMm: 24,
})
assert(placementCandidate, 'EA01A placement candidate missing')
assert.equal(placementCandidate.sourceLocatorBg, '482.30 · 482.05 · 482.15 · 24 mm')
assert.equal(placementCandidate.automaticGeometryAllowed, false)

assert.equal(evidence.findPrelude60SectionalEvidenceCandidate({
  systemId: 'kmg-prelude-60',
  kind: 'bead-base-compatibility',
  baseProfileCode: '482.05',
  beadCode: '482.01',
  glazingThicknessMm: 24,
}), undefined, 'EA01A must not generalize the source to another 24 mm bead')

function build(construction, resolution) {
  return product.buildSystemDrivenModuleReadModel({ moduleId: 'runtime-module', moduleSequence: 1, productType: 'window', system, construction, resolution })
}

let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
construction = topology.splitField(construction, 'field-1', 'vertical', 700)
assert(construction, 'EA01A split fixture failed')
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
assert.equal(model.glazingEvidenceReviewCandidateCount, 3, 'EA01A should surface source candidates for bead-base and placement while preserving glass-cut candidate')
assert.equal(model.glazingEvidenceReviewedCount, 0, 'EA01A must not count candidates as reviewed')

const compatibility = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'bead-base-compatibility')
const placement = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'placement-evidence')
const glassCut = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'glass-cut-rule')
assert(compatibility && placement && glassCut)

for (const item of [compatibility, placement]) {
  assert.equal(item.reviewState, 'reference-candidate')
  assert.equal(item.candidateSourcePage, 23)
  assert.equal(item.candidateSourceSection, 'sectional drawings · scale 1:1')
  assert.equal(item.candidateSourceLocatorBg, '482.30 · 482.05 · 482.15 · 24 mm')
  assert.equal(item.acceptedEvidenceStatus, 'none')
  assert.equal(item.rulePromotionAllowed, false)
  assert.equal(item.automaticGeometryAllowed, false)
  assert.equal(item.machineReady, false)
}
assert.equal(glassCut.reviewState, 'reference-candidate')
assert.equal(glassCut.acceptedEvidenceStatus, 'none')
assert(glassCut.candidateSummaryBg?.includes('12 / 12 mm'))

console.log('=== EVIDENCE ACQUISITION 01A RUNTIME PASS ===')
console.log('3 OPEN GAPS -> 3 REFERENCE CANDIDATES PASS')
console.log('ALTEST PAGE 23: EXACT CURRENT CODES + 24 mm SOURCE LOCATOR PASS')
console.log('482.15 -> 482.05 BEAD-BASE: CANDIDATE / NOT REVIEWED')
console.log('482.15 / 482.05 PLACEMENT: CANDIDATE / NOT REVIEWED')
console.log('GLASS CUT 12/12: REFERENCE CANDIDATE / NOT PROMOTED')
console.log('RULE PROMOTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
