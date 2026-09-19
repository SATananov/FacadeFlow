import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const projectModel = load('src/domain/project/projectModel')
const projectOps = load('src/domain/project/projectOperations')
const revisions = load('src/domain/project/revisionOperations')
const assurance = load('src/domain/assurance/assuranceOperations')
const selectors = load('src/domain/assurance/assuranceSelectors')
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')

const system = systemData.getProfileSystemById('kmg-prelude-60')
assert(system, 'PRELUDE 60 catalogue fixture missing')

let counter = 0
const idFactory = () => `evidence-review01b-${++counter}`
const actor = { id: 'reviewer-01b', label: '01B Reviewer', identityBasis: 'local-self-asserted' }
const revisionTime = '2026-09-17T12:00:00.000Z'
const reviewTime1 = '2026-09-17T12:01:00.000Z'
const reviewTime2 = '2026-09-17T12:02:00.000Z'

let snapshot = projectModel.createProjectSnapshot(idFactory)
const moduleId = idFactory()
let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
construction = topology.splitField(construction, 'field-1', 'vertical', 700)
assert(construction, '01B split fixture failed')
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

snapshot = projectOps.editProject(snapshot, (next) => {
  projectOps.replaceFreeModules(next, [{
    id: moduleId,
    sequence: 1,
    profileSystemId: system.id,
    productType: 'window',
    profileResolution: structuredClone(resolution),
  }])
  next.constructionDraftsByModuleId[moduleId] = {
    version: 'constructor-01d',
    frame: structuredClone(construction.frame),
    topology: structuredClone(construction),
  }
})

const reviewEvidence = selectors.inspectableStatements(snapshot, moduleId)
  .filter((entry) => ['official-sectional-bead-base-pairing', 'official-sectional-bead-placement'].includes(entry.statement.predicate))
assert.equal(reviewEvidence.length, 2, '01B must expose exactly two source-bound review statements for the current pair')
for (const entry of reviewEvidence) {
  assert.equal(entry.statement.scope.kind, 'module')
  assert.equal(entry.statement.scope.target.kind, 'module')
  assert.equal(entry.statement.parameters.profileSystemId, 'kmg-prelude-60')
  assert.equal(entry.statement.parameters.baseProfileCode, '482.05')
  assert.equal(entry.statement.parameters.beadCode, '482.15')
  assert.equal(entry.statement.parameters.thicknessMm, 24)
  assert.equal(entry.sourceReferenceIds.length, 1)
  const source = snapshot.assurance.sourcesById[entry.sourceReferenceIds[0]]
  assert(source, '01B source reference missing')
  assert.equal(source.sourceSystemId, 'altest-official-technical-pdf')
  assert.equal(source.locator.printedPage, '23')
  assert(source.locator.item?.includes('482.30'))
  assert(source.locator.item?.includes('482.05'))
  assert(source.locator.item?.includes('482.15'))
}

let model = product.buildSystemDrivenModuleReadModelFromSnapshot(snapshot, moduleId)
assert.equal(model.glazingEvidenceOpenGapCount, 3)
assert.equal(model.glazingEvidenceReviewedCount, 0)
const beforePairing = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'bead-base-compatibility')
const beforePlacement = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'placement-evidence')
assert(beforePairing?.candidateEvidenceId, '01B bead/base review evidence id missing')
assert(beforePlacement?.candidateEvidenceId, '01B placement review evidence id missing')
assert.equal(beforePairing.acceptedEvidenceStatus, 'none')
assert.equal(beforePlacement.acceptedEvidenceStatus, 'none')

snapshot = revisions.recordProjectRevision(snapshot, actor, revisionTime, idFactory)
const pairingEvidence = selectors.inspectableStatements(snapshot, moduleId)
  .find((entry) => entry.statement.predicate === 'official-sectional-bead-base-pairing')
assert(pairingEvidence)
const pairingRequest = assurance.prepareConfirmation(snapshot, pairingEvidence.id)
assert.equal(pairingRequest.sources.length, 1)
assert.equal(pairingRequest.sources[0].locator.printedPage, '23')
snapshot = assurance.confirmStatement(snapshot, pairingRequest, actor, reviewTime1, 'technical-review-attestation', idFactory)

model = product.buildSystemDrivenModuleReadModelFromSnapshot(snapshot, moduleId)
const reviewedPairing = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'bead-base-compatibility')
const stillOpenPlacement = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'placement-evidence')
assert.equal(reviewedPairing?.acceptedEvidenceStatus, 'reviewed')
assert.equal(reviewedPairing?.reviewedByLabel, '01B Reviewer')
assert.equal(reviewedPairing?.reviewedAt, reviewTime1)
assert(reviewedPairing?.reviewConfirmationId)
assert.equal(stillOpenPlacement?.acceptedEvidenceStatus, 'none')
assert.equal(model.glazingEvidenceReviewedCount, 1)
assert.equal(model.glazingEvidenceOpenGapCount, 3, '01B human review must not close/promote the 01F gaps')
assert.equal(model.glazingEvidenceCompatibilityReviewedCount, 0, '01B review must not promote application compatibility')
assert.equal(model.glazingEvidencePlacementReviewedCount, 0, '01B review must not promote placement geometry')
assert.equal(model.machineReady, false)

const placementEvidence = selectors.inspectableStatements(snapshot, moduleId)
  .find((entry) => entry.statement.predicate === 'official-sectional-bead-placement')
assert(placementEvidence)
const placementRequest = assurance.prepareConfirmation(snapshot, placementEvidence.id)
snapshot = assurance.confirmStatement(snapshot, placementRequest, actor, reviewTime2, 'technical-review-attestation', idFactory)

model = product.buildSystemDrivenModuleReadModelFromSnapshot(snapshot, moduleId)
const reviewedPlacement = model.glazingEvidenceReviewItems.find((item) => item.gapKind === 'placement-evidence')
assert.equal(reviewedPlacement?.acceptedEvidenceStatus, 'reviewed')
assert.equal(reviewedPlacement?.reviewedAt, reviewTime2)
assert.equal(model.glazingEvidenceReviewedCount, 2)
assert.equal(model.glazingEvidenceOpenGapCount, 3)
assert.equal(model.glazingEvidenceCompatibilityReviewedCount, 0)
assert.equal(model.glazingEvidencePlacementReviewedCount, 0)
assert.equal(model.machineReady, false)

const changedResolution = profiles.setFieldHumanGlazingThicknessAssignment(
  snapshot.profileResolutionsByModuleId[moduleId],
  system,
  resolved.fields[0],
  32,
)
const changed = projectOps.editProject(snapshot, (next) => {
  next.profileResolutionsByModuleId[moduleId] = changedResolution
})
const staleConfirmations = Object.values(snapshot.assurance.confirmationsById)
for (const confirmation of staleConfirmations) {
  assert.notEqual(selectors.confirmationFreshness(changed, confirmation).state, 'current', '01B review must stale when module technical context changes')
}

console.log('=== EVIDENCE REVIEW 01B RUNTIME PASS ===')
console.log('2 OFFICIAL SKETCH STATEMENTS -> 2 EXPLICIT PF02 REVIEW TARGETS PASS')
console.log('TECHNICAL-REVIEW ATTESTATION -> REVIEW CARD HUMAN-REVIEWED PASS')
console.log('REVIEWER + TIMESTAMP: PRESERVED')
console.log('01F OPEN GAPS: PRESERVED / NOT AUTO-CLOSED')
console.log('APPLICATION COMPATIBILITY / PLACEMENT: NOT PROMOTED')
console.log('CONTEXT CHANGE -> HUMAN REVIEW STALE PASS')
console.log('RULE PROMOTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
