import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const promotion = load('src/data/profileSystems/evidencePromotion.ts')
const review = load('src/data/profileSystems/humanEvidenceReview.ts')
const apply = load('src/data/profileSystems/applyEvidencePromotion.ts')

const source = {
  sourceFile: 'synthetic-manufacturer-assembly.pdf',
  sourceUrl: null,
  sourcePageOrReference: 12,
  sourceSha256: 'synthetic-not-production',
  sourceOrganization: 'Synthetic Manufacturer Fixture',
  classification: 'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE',
  sourceNote: 'Synthetic direct assembly evidence fixture; not production evidence.',
}
const requiredFacts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION']
const completeFacts = requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: { synthetic: true }, sources: [source] }))
const completeBinding = { status: 'VERIFIED', sources: [source], note: 'Synthetic exact pair binding.' }
const completeCandidate = {
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
}
const completePromotion = promotion.evaluateEvidencePromotionCandidate({ ...completeCandidate, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(completePromotion.promotionStatus, 'ELIGIBLE_FOR_REVIEW')
const completeReview = review.evaluateHumanEvidenceReview({ ...completeCandidate, promotionEvaluation: completePromotion, reviewDecision: 'APPROVE', reviewNote: 'Synthetic approval.', reviewedBy: 'synthetic-reviewer', reviewedAt: '2099-01-01T00:00:00Z' })
assert.equal(completeReview.valid, true)

const ready = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(ready.applicationStatus, 'READY_FOR_EXPLICIT_APPLY')
assert.equal(ready.eligibleForApplication, true)
assert.equal(ready.revalidationPassed, true)
assert.equal(ready.applicationPlan.readOnly, true)
assert.equal(ready.canMutateEvidence, false)
assert.equal(ready.canUnlockPhysicalGeometry, false)
assert.equal(ready.canEnableMachineGeometry, false)

const notApproved = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: { ...completeReview, decision: 'NEEDS_MORE_EVIDENCE', valid: true }, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(notApproved.applicationStatus, 'NOT_APPLICABLE')

const notEligible = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: { ...completePromotion, promotionStatus: 'INCOMPLETE' }, humanReview: completeReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(notEligible.applicationStatus, 'NOT_APPLICABLE')

const incompleteFact = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts.map((fact) => fact.factType === 'OVERLAP' ? { ...fact, status: 'PARTIAL' } : fact), proposedSources: [source], pairBinding: completeBinding })
assert.equal(incompleteFact.applicationStatus, 'REVALIDATION_FAILED')

const conflictedFact = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts.map((fact) => fact.factType === 'OVERLAP' ? { ...fact, status: 'CONFLICTED', sources: [source, { ...source, sourceFile: 'second-source.pdf' }] } : fact), proposedSources: [source], pairBinding: completeBinding })
assert.equal(conflictedFact.applicationStatus, 'BLOCKED_BY_CONFLICT')

const mismatch = apply.evaluatePromotionApplication({ ...completeCandidate, participantB: { profileId: 'OTHER-SASH', role: 'sash', systemId: 'synthetic-system' }, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(mismatch.applicationStatus, 'REVALIDATION_FAILED')

const reversed = apply.evaluatePromotionApplication({ ...completeCandidate, participantA: completeCandidate.participantB, participantB: completeCandidate.participantA, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(reversed.applicationStatus, 'REVALIDATION_FAILED')

const ambiguous = apply.evaluatePromotionApplication({
  systemId: 'kmg-prelude-60',
  participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' },
  participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' },
  relationshipContext: 'FRAME_TO_SASH',
  promotionEvaluation: completePromotion,
  humanReview: { ...completeReview, systemId: 'kmg-prelude-60', participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_SASH' },
  proposedFacts: completeFacts,
  proposedSources: [source],
  pairBinding: completeBinding,
  identifierResolution: 'UNRESOLVED',
})
assert.equal(ambiguous.applicationStatus, 'REVALIDATION_FAILED')

const catalogueSource = { ...source, classification: 'SUPPORTING_CATALOGUE_EVIDENCE' }
const catalogueOnly = apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts.map((fact) => ({ ...fact, sources: [catalogueSource] })), proposedSources: [catalogueSource], pairBinding: { ...completeBinding, sources: [catalogueSource] } })
assert.equal(catalogueOnly.applicationStatus, 'REVALIDATION_FAILED')

const frozenCandidate = {
  systemId: 'kmg-prelude-60',
  participantA: { profileId: '482.20', role: 'frame', systemId: 'kmg-prelude-60' },
  participantB: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' },
  relationshipContext: 'FRAME_TO_MULLION',
}
const frozenFacts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'NOTCH_CONTOUR', 'ASSEMBLY_CROSS_SECTION'].map((factType) => ({ factType, status: 'VERIFIED', value: { synthetic: true }, sources: [source] }))
const frozenPromotion = promotion.evaluateEvidencePromotionCandidate({ ...frozenCandidate, proposedFacts: frozenFacts, proposedSources: [source], pairBinding: completeBinding })
const frozenReview = { ...completeReview, systemId: 'kmg-prelude-60', participantA: frozenCandidate.participantA, participantB: frozenCandidate.participantB, relationshipContext: 'FRAME_TO_MULLION', promotionStatusAtReview: 'ELIGIBLE_FOR_REVIEW', decision: 'APPROVE', valid: true }
const frozen = apply.evaluatePromotionApplication({ ...frozenCandidate, promotionEvaluation: frozenPromotion, humanReview: frozenReview, proposedFacts: frozenFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(frozen.applicationStatus, 'BLOCKED_BY_FREEZE')

const before = JSON.stringify(ready)
apply.evaluatePromotionApplication({ ...completeCandidate, promotionEvaluation: completePromotion, humanReview: completeReview, proposedFacts: completeFacts, proposedSources: [source], pairBinding: completeBinding })
assert.equal(JSON.stringify(ready), before)

console.log('APPLY PROMOTION WORKFLOW 01 VERIFY PASS')
console.log('ENTRY / INDEPENDENT REVALIDATION / EXACT PAIR: PASS')
console.log('FACT / PROVENANCE / CONFLICT / IDENTIFIER CHECKS: PASS')
console.log('FROZEN KMG: BLOCKED_BY_FREEZE')
console.log('SYNTHETIC COMPLETE PACKAGE: READY_FOR_EXPLICIT_APPLY')
console.log('MUTATION / PHYSICAL UNLOCK / MACHINE ENABLEMENT: NONE')
