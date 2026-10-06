import {
  evaluateEvidencePromotionCandidate,
  type EvidencePromotionBinding,
  type EvidencePromotionFact,
  type EvidencePromotionParticipant,
  type EvidencePromotionResult,
  type EvidencePromotionSource,
} from './evidencePromotion'
import type { HumanEvidenceReviewResult } from './humanEvidenceReview'

/**
 * APPLY PROMOTION IS A REVALIDATION PLAN, NOT MUTATION.
 *
 * This second barrier re-evaluates the proposed package and returns only a
 * read-only plan. It never writes evidence, changes a gate, creates geometry,
 * enables machining, or applies a human decision automatically.
 */
export type PromotionApplicationStatus =
  | 'NOT_APPLICABLE'
  | 'REVALIDATION_FAILED'
  | 'BLOCKED_BY_FREEZE'
  | 'BLOCKED_BY_CONFLICT'
  | 'READY_FOR_EXPLICIT_APPLY'

export type PromotionApplicationValidation = Readonly<{
  status: 'VALID' | 'FAILED' | 'BLOCKED' | 'UNKNOWN'
  reasons: readonly string[]
}>

export type PromotionApplicationPlan = Readonly<{
  factsToPromote: readonly string[]
  provenanceToPersist: readonly EvidencePromotionSource[]
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  requiredVerifierUpdates: readonly string[]
  gateChangesThatMayBeConsideredLater: readonly string[]
  readOnly: true
}>

export type PromotionApplicationResult = Readonly<{
  applicationStatus: PromotionApplicationStatus
  eligibleForApplication: boolean
  revalidationPassed: boolean
  pairValidation: PromotionApplicationValidation
  contextValidation: PromotionApplicationValidation
  provenanceValidation: PromotionApplicationValidation
  factValidation: PromotionApplicationValidation
  conflictValidation: PromotionApplicationValidation
  freezeValidation: PromotionApplicationValidation
  applicationPlan: PromotionApplicationPlan | null
  canMutateEvidence: false
  canUnlockPhysicalGeometry: false
  canEnableMachineGeometry: false
  validationErrors: readonly string[]
}>

function validation(status: PromotionApplicationValidation['status'], ...reasons: string[]): PromotionApplicationValidation {
  return { status, reasons }
}

function frozenKmgPair(args: {
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

function unresolvedPreludeFrameIdentifier(args: {
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  identifierResolution?: 'EXACT' | 'UNRESOLVED'
}): boolean {
  return args.relationshipContext === 'FRAME_TO_SASH'
    && args.participantB.profileId === '482.05'
    && (args.participantA.profileId === '482.30' || args.participantA.profileId === '482.30-K')
    && args.identifierResolution !== 'EXACT'
}

function sameParticipant(a: EvidencePromotionParticipant, b: EvidencePromotionParticipant): boolean {
  return a.profileId === b.profileId && a.role === b.role && a.systemId === b.systemId
}

function samePromotionSnapshot(a: EvidencePromotionResult, b: EvidencePromotionResult): boolean {
  return a.promotionStatus === b.promotionStatus
    && JSON.stringify(a.satisfiedRequirements) === JSON.stringify(b.satisfiedRequirements)
    && JSON.stringify(a.missingRequirements) === JSON.stringify(b.missingRequirements)
    && JSON.stringify(a.conflicts) === JSON.stringify(b.conflicts)
    && a.physicalGeometryEligible === b.physicalGeometryEligible
    && a.machineGeometryEligible === b.machineGeometryEligible
}

export function evaluatePromotionApplication(args: {
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  promotionEvaluation: EvidencePromotionResult
  humanReview: HumanEvidenceReviewResult
  proposedFacts: readonly EvidencePromotionFact[]
  proposedSources: readonly EvidencePromotionSource[]
  pairBinding: EvidencePromotionBinding
  identifierResolution?: 'EXACT' | 'UNRESOLVED'
}): PromotionApplicationResult {
  const noPlan = {
    applicationPlan: null,
    canMutateEvidence: false as const,
    canUnlockPhysicalGeometry: false as const,
    canEnableMachineGeometry: false as const,
  }
  if (args.promotionEvaluation.promotionStatus !== 'ELIGIBLE_FOR_REVIEW'
    || args.humanReview.decision !== 'APPROVE'
    || !args.humanReview.valid) {
    return {
      applicationStatus: 'NOT_APPLICABLE',
      eligibleForApplication: false,
      revalidationPassed: false,
      pairValidation: validation('UNKNOWN', 'Entry requires an ELIGIBLE_FOR_REVIEW promotion and a valid APPROVE review.'),
      contextValidation: validation('UNKNOWN'),
      provenanceValidation: validation('UNKNOWN'),
      factValidation: validation('UNKNOWN'),
      conflictValidation: validation('UNKNOWN'),
      freezeValidation: validation('UNKNOWN'),
      validationErrors: ['Promotion application entry requirements are not satisfied.'],
      ...noPlan,
    }
  }

  const errors: string[] = []
  const pairReasons: string[] = []
  const contextReasons: string[] = []
  if (!sameParticipant(args.participantA, args.humanReview.participantA)
    || !sameParticipant(args.participantB, args.humanReview.participantB)
    || args.humanReview.systemId !== args.systemId) {
    pairReasons.push('Application participants/system do not exactly match the reviewed participants.')
  }
  if (args.humanReview.relationshipContext !== args.relationshipContext) {
    contextReasons.push('Application relationship context does not match the reviewed context.')
  }
  if (unresolvedPreludeFrameIdentifier(args)) {
    pairReasons.push('482.30 versus 482.30-K identifier mapping remains unresolved.')
  }
  const pairValid = pairReasons.length === 0
  const contextValid = contextReasons.length === 0 && args.relationshipContext.trim().length > 0
  if (!pairValid) errors.push(...pairReasons)
  if (!contextValid) errors.push(...contextReasons)

  const revalidated = evaluateEvidencePromotionCandidate({
    systemId: args.systemId,
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    proposedFacts: args.proposedFacts,
    proposedSources: args.proposedSources,
    pairBinding: args.pairBinding,
  })
  const snapshotMatches = samePromotionSnapshot(args.promotionEvaluation, revalidated)
  if (!snapshotMatches) errors.push('Independent promotion revalidation does not match the supplied promotion evaluation.')

  const factValid = revalidated.missingRequirements.length === 0 && revalidated.satisfiedRequirements.length > 0
  if (!factValid) errors.push('One or more required facts are missing, partial, unknown, or otherwise unsatisfied.')
  const provenanceValid = revalidated.provenanceValidation.status === 'VALID'
  if (!provenanceValid) errors.push('Required direct provenance failed independent revalidation.')
  const conflictFree = revalidated.conflicts.length === 0 && revalidated.promotionStatus !== 'CONFLICTED'
  if (!conflictFree) errors.push('A required fact has unresolved conflicting evidence.')

  const isFrozen = frozenKmgPair(args)
  if (isFrozen) {
    return {
      applicationStatus: 'BLOCKED_BY_FREEZE',
      eligibleForApplication: false,
      revalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED', ...revalidated.provenanceValidation.reasons),
      factValidation: validation(factValid ? 'VALID' : 'FAILED', ...revalidated.missingRequirements),
      conflictValidation: validation(conflictFree ? 'VALID' : 'BLOCKED', ...revalidated.conflicts),
      freezeValidation: validation('BLOCKED', 'The formal KMG 482.20 ↔ 482.21 FRAME_TO_MULLION freeze remains active.'),
      validationErrors: [...errors, 'Application is blocked by the active geometry freeze.'],
      ...noPlan,
    }
  }

  if (!conflictFree) {
    return {
      applicationStatus: 'BLOCKED_BY_CONFLICT',
      eligibleForApplication: false,
      revalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED', ...revalidated.provenanceValidation.reasons),
      factValidation: validation('FAILED', ...revalidated.conflicts),
      conflictValidation: validation('BLOCKED', ...revalidated.conflicts),
      freezeValidation: validation('VALID'),
      validationErrors: [...errors, 'Application is blocked by unresolved conflicting evidence.'],
      ...noPlan,
    }
  }

  if (!pairValid || !contextValid || !snapshotMatches || !factValid || !provenanceValid) {
    return {
      applicationStatus: 'REVALIDATION_FAILED',
      eligibleForApplication: false,
      revalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED', ...revalidated.provenanceValidation.reasons),
      factValidation: validation(factValid ? 'VALID' : 'FAILED', ...revalidated.missingRequirements),
      conflictValidation: validation(conflictFree ? 'VALID' : 'BLOCKED', ...revalidated.conflicts),
      freezeValidation: validation('VALID', 'No active freeze matched this exact candidate.'),
      validationErrors: errors,
      ...noPlan,
    }
  }

  return {
    applicationStatus: 'READY_FOR_EXPLICIT_APPLY',
    eligibleForApplication: true,
    revalidationPassed: true,
    pairValidation: validation('VALID'),
    contextValidation: validation('VALID'),
    provenanceValidation: validation('VALID'),
    factValidation: validation('VALID', ...revalidated.satisfiedRequirements),
    conflictValidation: validation('VALID'),
    freezeValidation: validation('VALID'),
    validationErrors: [],
    ...noPlan,
    applicationPlan: {
      factsToPromote: revalidated.satisfiedRequirements,
      provenanceToPersist: args.proposedSources,
      systemId: args.systemId,
      participantA: args.participantA,
      participantB: args.participantB,
      relationshipContext: args.relationshipContext,
      requiredVerifierUpdates: ['Re-run evidence, readiness, freeze, and physical-gate verifiers after any future explicit mutation.'],
      gateChangesThatMayBeConsideredLater: ['A separate explicit task may consider physical-gate changes; this workflow does not apply them.'],
      readOnly: true,
    },
  }
}
