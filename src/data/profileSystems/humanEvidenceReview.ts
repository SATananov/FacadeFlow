import type {
  EvidencePromotionParticipant,
  EvidencePromotionResult,
} from './evidencePromotion'

/**
 * HUMAN REVIEW IS A DECISION RECORD, NOT PROMOTION APPLICATION.
 *
 * This module validates a proposed review decision against an immutable
 * promotion evaluation. It never writes evidence, changes a geometry gate,
 * creates geometry, enables machining, or stores global review state.
 */
export type HumanEvidenceReviewDecision = 'APPROVE' | 'REJECT' | 'NEEDS_MORE_EVIDENCE'
export type HumanEvidenceReviewStatus = 'VALID' | 'INVALID'

export type HumanEvidenceReviewResult = Readonly<{
  decision: HumanEvidenceReviewDecision
  valid: boolean
  reviewStatus: HumanEvidenceReviewStatus
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  promotionStatusAtReview: EvidencePromotionResult['promotionStatus']
  reviewNote: string
  reviewedBy: string
  reviewedAt: string
  canApplyPromotion: false
  validationErrors: readonly string[]
}>

function isFrozenKmgPair(args: {
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
}): boolean {
  return args.systemId === 'kmg-prelude-60'
    && args.participantA.profileId === '482.20'
    && args.participantA.role === 'frame'
    && args.participantB.profileId === '482.21'
    && args.participantB.role === 'mullion'
    && args.relationshipContext === 'FRAME_TO_MULLION'
}

export function evaluateHumanEvidenceReview(args: {
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  promotionEvaluation: EvidencePromotionResult
  reviewDecision: HumanEvidenceReviewDecision
  reviewNote: string
  reviewedBy: string
  reviewedAt: string
}): HumanEvidenceReviewResult {
  const validationErrors: string[] = []
  if (!args.reviewNote.trim()) validationErrors.push('A review note is required and is preserved without mutation.')
  if (!args.reviewedBy.trim()) validationErrors.push('Reviewer metadata is required; identity is not inferred.')
  if (!args.reviewedAt.trim()) validationErrors.push('Review timestamp metadata is required; it is not generated here.')

  if (args.reviewDecision === 'APPROVE' && args.promotionEvaluation.promotionStatus !== 'ELIGIBLE_FOR_REVIEW') {
    validationErrors.push('APPROVE requires promotionStatus ELIGIBLE_FOR_REVIEW.')
  }
  if (args.reviewDecision === 'APPROVE' && isFrozenKmgPair(args)) {
    validationErrors.push('The frozen KMG 482.20 → 482.21 FRAME_TO_MULLION case cannot be approved by this review layer.')
  }

  const valid = validationErrors.length === 0
  return {
    decision: args.reviewDecision,
    valid,
    reviewStatus: valid ? 'VALID' : 'INVALID',
    systemId: args.systemId,
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    promotionStatusAtReview: args.promotionEvaluation.promotionStatus,
    reviewNote: args.reviewNote,
    reviewedBy: args.reviewedBy,
    reviewedAt: args.reviewedAt,
    canApplyPromotion: false,
    validationErrors,
  }
}
