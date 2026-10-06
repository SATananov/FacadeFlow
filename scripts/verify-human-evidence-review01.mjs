import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const promotion = load('src/data/profileSystems/evidencePromotion.ts')
const review = load('src/data/profileSystems/humanEvidenceReview.ts')

const source = {
  sourceFile: 'synthetic-manufacturer-assembly.pdf',
  sourceUrl: null,
  sourcePageOrReference: 12,
  sourceSha256: 'synthetic-not-production',
  sourceOrganization: 'Synthetic Manufacturer Fixture',
  classification: 'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE',
  sourceNote: 'Synthetic direct assembly evidence fixture; not production evidence.',
}
const current = {
  systemId: 'kmg-prelude-60',
  participantA: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' },
  participantB: { profileId: '482.18', role: 'sash', systemId: 'kmg-prelude-60' },
  relationshipContext: 'MULLION_TO_SASH',
}
const currentPromotion = promotion.evaluateEvidencePromotionCandidate({
  ...current,
  proposedFacts: [],
  proposedSources: [],
  pairBinding: { status: 'UNKNOWN', sources: [], note: 'Current evidence is incomplete.' },
})
const metadata = { reviewNote: 'Synthetic verifier review metadata.', reviewedBy: 'synthetic-reviewer', reviewedAt: '2099-01-01T00:00:00Z' }

const currentApproval = review.evaluateHumanEvidenceReview({
  ...current,
  promotionEvaluation: currentPromotion,
  reviewDecision: 'APPROVE',
  ...metadata,
})
assert.equal(currentApproval.valid, false)
assert.match(currentApproval.validationErrors.join(' '), /ELIGIBLE_FOR_REVIEW/i)
assert.equal(currentApproval.canApplyPromotion, false)

const requiredFacts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION']
const syntheticPromotion = promotion.evaluateEvidencePromotionCandidate({
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
  proposedFacts: requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: { synthetic: true }, sources: [source] })),
  proposedSources: [source],
  pairBinding: { status: 'VERIFIED', sources: [source], note: 'Synthetic exact pair binding.' },
})
assert.equal(syntheticPromotion.promotionStatus, 'ELIGIBLE_FOR_REVIEW')

const approved = review.evaluateHumanEvidenceReview({
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
  promotionEvaluation: syntheticPromotion,
  reviewDecision: 'APPROVE',
  ...metadata,
})
assert.equal(approved.valid, true)
assert.equal(approved.reviewStatus, 'VALID')
assert.equal(approved.canApplyPromotion, false)
assert.equal(approved.reviewedBy, metadata.reviewedBy)
assert.equal(approved.reviewedAt, metadata.reviewedAt)

const rejected = review.evaluateHumanEvidenceReview({
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
  promotionEvaluation: syntheticPromotion,
  reviewDecision: 'REJECT',
  reviewNote: 'The evidence package is not accepted for this review.',
  reviewedBy: metadata.reviewedBy,
  reviewedAt: metadata.reviewedAt,
})
assert.equal(rejected.valid, true)
assert.equal(rejected.decision, 'REJECT')
assert.equal(rejected.canApplyPromotion, false)

const moreEvidence = review.evaluateHumanEvidenceReview({
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
  promotionEvaluation: syntheticPromotion,
  reviewDecision: 'NEEDS_MORE_EVIDENCE',
  reviewNote: 'Need a dimensioned retention detail.',
  reviewedBy: metadata.reviewedBy,
  reviewedAt: metadata.reviewedAt,
})
assert.equal(moreEvidence.valid, true)
assert.equal(moreEvidence.decision, 'NEEDS_MORE_EVIDENCE')
assert.equal(moreEvidence.canApplyPromotion, false)

const frozenSyntheticApproval = review.evaluateHumanEvidenceReview({
  systemId: 'kmg-prelude-60',
  participantA: { profileId: '482.20', role: 'frame', systemId: 'kmg-prelude-60' },
  participantB: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' },
  relationshipContext: 'FRAME_TO_MULLION',
  promotionEvaluation: { ...syntheticPromotion, promotionStatus: 'ELIGIBLE_FOR_REVIEW' },
  reviewDecision: 'APPROVE',
  ...metadata,
})
assert.equal(frozenSyntheticApproval.valid, false)
assert.match(frozenSyntheticApproval.validationErrors.join(' '), /frozen KMG/i)
assert.equal(frozenSyntheticApproval.canApplyPromotion, false)

const before = JSON.stringify({ currentApproval, approved, rejected, moreEvidence, frozenSyntheticApproval })
review.evaluateHumanEvidenceReview({
  ...current,
  promotionEvaluation: currentPromotion,
  reviewDecision: 'NEEDS_MORE_EVIDENCE',
  ...metadata,
})
assert.equal(JSON.stringify({ currentApproval, approved, rejected, moreEvidence, frozenSyntheticApproval }), before)

console.log('HUMAN EVIDENCE REVIEW 01 VERIFY PASS')
console.log('CURRENT CANDIDATE APPROVE: INVALID')
console.log('SYNTHETIC ELIGIBLE APPROVE / REJECT / NEEDS_MORE_EVIDENCE: VALID')
console.log('FROZEN KMG APPROVE: INVALID')
console.log('PROMOTION APPLICATION / PHYSICAL GEOMETRY / MACHINING: NONE')
console.log('REVIEW METADATA / MUTATION GUARD: PASS')
