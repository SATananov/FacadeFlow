import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const promotion = load('src/data/profileSystems/evidencePromotion.ts')
const review = load('src/data/profileSystems/humanEvidenceReview.ts')
const apply = load('src/data/profileSystems/applyEvidencePromotion.ts')
const mutation = load('src/data/profileSystems/authorizedEvidenceMutation.ts')

const source = {
  sourceFile: 'synthetic-manufacturer-assembly.pdf', sourceUrl: null, sourcePageOrReference: 12,
  sourceSha256: 'synthetic-not-production', sourceOrganization: 'Synthetic Manufacturer Fixture',
  classification: 'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE', sourceNote: 'Synthetic direct evidence; verifier only.',
}
const facts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION']
const completeFacts = facts.map((factType) => ({ factType, status: 'VERIFIED', value: { synthetic: true }, sources: [source] }))
const binding = { status: 'VERIFIED', sources: [source], note: 'Synthetic exact pair binding.' }
const candidate = { systemId: 'synthetic-system', participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' }, participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' }, relationshipContext: 'FRAME_TO_SASH' }
const promotionEvaluation = promotion.evaluateEvidencePromotionCandidate({ ...candidate, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
const humanReview = review.evaluateHumanEvidenceReview({ ...candidate, promotionEvaluation, reviewDecision: 'APPROVE', reviewNote: 'Synthetic approval.', reviewedBy: 'synthetic-reviewer', reviewedAt: '2099-01-01T00:00:00Z' })
const applicationEvaluation = apply.evaluatePromotionApplication({ ...candidate, promotionEvaluation, humanReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(applicationEvaluation.applicationStatus, 'READY_FOR_EXPLICIT_APPLY')
const authorization = { explicit: true, authorizedBy: 'synthetic-authorizer', authorizedAt: '2099-01-02T00:00:00Z', authorizationNote: 'Synthetic explicit authorization.', scope: { ...candidate } }

const authorized = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation, humanReview, applicationEvaluation, authorization, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(authorized.mutationStatus, 'AUTHORIZED_FOR_MUTATION')
assert.equal(authorized.authorizationValid, true)
assert.equal(authorized.finalRevalidationPassed, true)
assert.equal(authorized.mutationPlan.readOnly, true)
assert.equal(authorized.canMutateEvidence, false)
assert.equal(authorized.canUnlockPhysicalGeometry, false)
assert.equal(authorized.canEnableMachineGeometry, false)

const noAuth = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation, humanReview, applicationEvaluation, authorization: { ...authorization, explicit: false }, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(noAuth.mutationStatus, 'NOT_AUTHORIZED')

const scopeMismatch = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation, humanReview, applicationEvaluation, authorization: { ...authorization, scope: { ...authorization.scope, participantB: { ...candidate.participantB, profileId: 'OTHER' } } }, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(scopeMismatch.mutationStatus, 'FINAL_REVALIDATION_FAILED')

const pairMismatch = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, participantB: { ...candidate.participantB, profileId: 'OTHER' }, promotionEvaluation, humanReview, applicationEvaluation, authorization, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(pairMismatch.mutationStatus, 'FINAL_REVALIDATION_FAILED')

const reversed = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, participantA: candidate.participantB, participantB: candidate.participantA, promotionEvaluation, humanReview, applicationEvaluation, authorization, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(reversed.mutationStatus, 'FINAL_REVALIDATION_FAILED')

for (const status of ['UNKNOWN', 'PARTIAL']) {
  const failedFacts = completeFacts.map((fact) => fact.factType === 'OVERLAP' ? { ...fact, status } : fact)
  const result = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation: { ...promotionEvaluation, promotionStatus: 'ELIGIBLE_FOR_REVIEW' }, humanReview, applicationEvaluation: { ...applicationEvaluation, applicationStatus: 'READY_FOR_EXPLICIT_APPLY' }, authorization, proposedFacts: failedFacts, proposedSources: [source], pairBinding: binding })
  assert.equal(result.mutationStatus, 'FINAL_REVALIDATION_FAILED')
}

const conflictedFacts = completeFacts.map((fact) => fact.factType === 'OVERLAP' ? { ...fact, status: 'CONFLICTED', sources: [source, { ...source, sourceFile: 'second-source.pdf' }] } : fact)
const conflicted = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation: { ...promotionEvaluation, promotionStatus: 'ELIGIBLE_FOR_REVIEW' }, humanReview, applicationEvaluation: { ...applicationEvaluation, applicationStatus: 'READY_FOR_EXPLICIT_APPLY' }, authorization, proposedFacts: conflictedFacts, proposedSources: [source], pairBinding: binding })
assert.equal(conflicted.mutationStatus, 'BLOCKED_BY_CONFLICT')

const weakSource = { ...source, classification: 'SUPPORTING_CATALOGUE_EVIDENCE' }
const weak = mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation: { ...promotionEvaluation, promotionStatus: 'ELIGIBLE_FOR_REVIEW' }, humanReview, applicationEvaluation: { ...applicationEvaluation, applicationStatus: 'READY_FOR_EXPLICIT_APPLY' }, authorization, proposedFacts: completeFacts.map((fact) => ({ ...fact, sources: [weakSource] })), proposedSources: [weakSource], pairBinding: { ...binding, sources: [weakSource] } })
assert.equal(weak.mutationStatus, 'FINAL_REVALIDATION_FAILED')

const ambiguous = mutation.evaluateAuthorizedEvidenceMutation({ systemId: 'kmg-prelude-60', participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_SASH', promotionEvaluation: { ...promotionEvaluation, promotionStatus: 'ELIGIBLE_FOR_REVIEW' }, humanReview: { ...humanReview, systemId: 'kmg-prelude-60', participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_SASH' }, applicationEvaluation: { ...applicationEvaluation, applicationStatus: 'READY_FOR_EXPLICIT_APPLY' }, authorization: { ...authorization, scope: { systemId: 'kmg-prelude-60', participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_SASH' } }, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding, identifierResolution: 'UNRESOLVED' })
assert.equal(ambiguous.mutationStatus, 'FINAL_REVALIDATION_FAILED')

const frozen = { systemId: 'kmg-prelude-60', participantA: { profileId: '482.20', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_MULLION' }
const frozenFacts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'NOTCH_CONTOUR', 'ASSEMBLY_CROSS_SECTION'].map((factType) => ({ factType, status: 'VERIFIED', value: { synthetic: true }, sources: [source] }))
const frozenPromotion = { ...promotionEvaluation, promotionStatus: 'ELIGIBLE_FOR_REVIEW' }
const frozenReview = { ...humanReview, systemId: frozen.systemId, participantA: frozen.participantA, participantB: frozen.participantB, relationshipContext: frozen.relationshipContext, promotionStatusAtReview: 'ELIGIBLE_FOR_REVIEW', decision: 'APPROVE', valid: true }
const frozenApplication = { ...applicationEvaluation, applicationStatus: 'READY_FOR_EXPLICIT_APPLY' }
const frozenAuthorization = { ...authorization, scope: frozen }
const frozenResult = mutation.evaluateAuthorizedEvidenceMutation({ ...frozen, promotionEvaluation: frozenPromotion, humanReview: frozenReview, applicationEvaluation: frozenApplication, authorization: frozenAuthorization, proposedFacts: frozenFacts, proposedSources: [source], pairBinding: binding })
assert.equal(frozenResult.mutationStatus, 'BLOCKED_BY_FREEZE')

const before = JSON.stringify(authorized)
mutation.evaluateAuthorizedEvidenceMutation({ ...candidate, promotionEvaluation, humanReview, applicationEvaluation, authorization, proposedFacts: completeFacts, proposedSources: [source], pairBinding: binding })
assert.equal(JSON.stringify(authorized), before)

console.log('AUTHORIZED EVIDENCE MUTATION 01 VERIFY PASS')
console.log('EXPLICIT AUTHORIZATION / SCOPE / FINAL REVALIDATION: PASS')
console.log('CURRENT CANDIDATES: NOT AUTHORIZED')
console.log('FROZEN KMG: BLOCKED_BY_FREEZE')
console.log('SYNTHETIC COMPLETE PACKAGE: AUTHORIZED_FOR_MUTATION')
console.log('MUTATION / PHYSICAL UNLOCK / MACHINE READINESS: NONE')
