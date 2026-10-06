import {
  evaluateEvidencePromotionCandidate,
  type EvidencePromotionBinding,
  type EvidencePromotionFact,
  type EvidencePromotionParticipant,
  type EvidencePromotionResult,
  type EvidencePromotionSource,
} from './evidencePromotion'
import {
  evaluatePromotionApplication,
  type PromotionApplicationResult,
} from './applyEvidencePromotion'
import type { HumanEvidenceReviewResult } from './humanEvidenceReview'

/**
 * AUTHORIZED MUTATION IS PREPARATION ONLY.
 *
 * This final barrier may return a read-only mutation plan after explicit
 * authorization and independent revalidation. It never performs the mutation,
 * changes a gate, creates geometry, or enables machining.
 */
export type AuthorizedEvidenceMutationStatus =
  | 'NOT_AUTHORIZED'
  | 'NOT_READY'
  | 'FINAL_REVALIDATION_FAILED'
  | 'BLOCKED_BY_FREEZE'
  | 'BLOCKED_BY_CONFLICT'
  | 'AUTHORIZED_FOR_MUTATION'

export type AuthorizedMutationValidation = Readonly<{
  status: 'VALID' | 'FAILED' | 'BLOCKED' | 'UNKNOWN'
  reasons: readonly string[]
}>

export type EvidenceMutationAuthorization = Readonly<{
  explicit: boolean
  authorizedBy: string
  authorizedAt: string
  authorizationNote: string
  scope: Readonly<{
    systemId: string
    participantA: EvidencePromotionParticipant
    participantB: EvidencePromotionParticipant
    relationshipContext: string
  }>
}>

export type AuthorizedEvidenceMutationPlan = Readonly<{
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  factsToPersist: readonly Readonly<{
    factType: string
    value: NonNullable<EvidencePromotionFact['value']>
    sources: readonly EvidencePromotionSource[]
  }>[]
  provenanceRecordsToPersist: readonly EvidencePromotionSource[]
  expectedEvidenceStatusTransitions: readonly string[]
  requiredVerifierUpdates: readonly string[]
  requiredGateReevaluation: readonly string[]
  readOnly: true
}>

export type AuthorizedEvidenceMutationResult = Readonly<{
  mutationStatus: AuthorizedEvidenceMutationStatus
  authorizationValid: boolean
  finalRevalidationPassed: boolean
  pairValidation: AuthorizedMutationValidation
  contextValidation: AuthorizedMutationValidation
  factValidation: AuthorizedMutationValidation
  provenanceValidation: AuthorizedMutationValidation
  conflictValidation: AuthorizedMutationValidation
  freezeValidation: AuthorizedMutationValidation
  mutationPlan: AuthorizedEvidenceMutationPlan | null
  canMutateEvidence: false
  canUnlockPhysicalGeometry: false
  canEnableMachineGeometry: false
  validationErrors: readonly string[]
}>

const directClasses = new Set([
  'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE',
  'PRIMARY_MANUFACTURER_CAD_EVIDENCE',
  'FABRICATION_EVIDENCE',
  'DIRECT_MANUFACTURER_TECHNICAL_EVIDENCE',
])

function validation(status: AuthorizedMutationValidation['status'], ...reasons: string[]): AuthorizedMutationValidation {
  return { status, reasons }
}

function participantMatches(a: EvidencePromotionParticipant, b: EvidencePromotionParticipant): boolean {
  return a.profileId === b.profileId && a.role === b.role && a.systemId === b.systemId
}

function scopeMatches(args: {
  authorization: EvidenceMutationAuthorization
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
}): boolean {
  return args.authorization.scope.systemId === args.systemId
    && participantMatches(args.authorization.scope.participantA, args.participantA)
    && participantMatches(args.authorization.scope.participantB, args.participantB)
    && args.authorization.scope.relationshipContext === args.relationshipContext
}

function sourceIsValid(source: EvidencePromotionSource): boolean {
  return directClasses.has(source.classification)
    && Boolean(source.sourceFile || source.sourceUrl)
    && source.sourcePageOrReference !== null
    && source.sourceOrganization.trim().length > 0
    && source.sourceNote.trim().length > 0
}

function sameApplicationSnapshot(a: PromotionApplicationResult, b: PromotionApplicationResult): boolean {
  return a.applicationStatus === b.applicationStatus
    && a.eligibleForApplication === b.eligibleForApplication
    && a.revalidationPassed === b.revalidationPassed
    && JSON.stringify(a.validationErrors) === JSON.stringify(b.validationErrors)
}

export function evaluateAuthorizedEvidenceMutation(args: {
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  promotionEvaluation: EvidencePromotionResult
  humanReview: HumanEvidenceReviewResult
  applicationEvaluation: PromotionApplicationResult
  authorization: EvidenceMutationAuthorization
  proposedFacts: readonly EvidencePromotionFact[]
  proposedSources: readonly EvidencePromotionSource[]
  pairBinding: EvidencePromotionBinding
  identifierResolution?: 'EXACT' | 'UNRESOLVED'
}): AuthorizedEvidenceMutationResult {
  const noPlan = {
    mutationPlan: null,
    canMutateEvidence: false as const,
    canUnlockPhysicalGeometry: false as const,
    canEnableMachineGeometry: false as const,
  }
  if (!args.authorization.explicit) {
    return {
      mutationStatus: 'NOT_AUTHORIZED',
      authorizationValid: false,
      finalRevalidationPassed: false,
      pairValidation: validation('UNKNOWN'),
      contextValidation: validation('UNKNOWN'),
      factValidation: validation('UNKNOWN'),
      provenanceValidation: validation('UNKNOWN'),
      conflictValidation: validation('UNKNOWN'),
      freezeValidation: validation('UNKNOWN'),
      validationErrors: ['Explicit mutation authorization is required; review and readiness do not imply authorization.'],
      ...noPlan,
    }
  }
  if (!args.authorization.authorizedBy.trim() || !args.authorization.authorizedAt.trim() || !args.authorization.authorizationNote.trim()) {
    return {
      mutationStatus: 'NOT_AUTHORIZED',
      authorizationValid: false,
      finalRevalidationPassed: false,
      pairValidation: validation('UNKNOWN'),
      contextValidation: validation('UNKNOWN'),
      factValidation: validation('UNKNOWN'),
      provenanceValidation: validation('UNKNOWN'),
      conflictValidation: validation('UNKNOWN'),
      freezeValidation: validation('UNKNOWN'),
      validationErrors: ['Authorization metadata is incomplete.'],
      ...noPlan,
    }
  }
  if (args.promotionEvaluation.promotionStatus !== 'ELIGIBLE_FOR_REVIEW'
    || args.humanReview.decision !== 'APPROVE'
    || !args.humanReview.valid
    || args.applicationEvaluation.applicationStatus !== 'READY_FOR_EXPLICIT_APPLY') {
    return {
      mutationStatus: 'NOT_READY',
      authorizationValid: true,
      finalRevalidationPassed: false,
      pairValidation: validation('UNKNOWN'),
      contextValidation: validation('UNKNOWN'),
      factValidation: validation('UNKNOWN'),
      provenanceValidation: validation('UNKNOWN'),
      conflictValidation: validation('UNKNOWN'),
      freezeValidation: validation('UNKNOWN'),
      validationErrors: ['Promotion, human approval, and explicit-apply readiness are all required before mutation preparation.'],
      ...noPlan,
    }
  }

  const errors: string[] = []
  const pairReasons: string[] = []
  const contextReasons: string[] = []
  if (!scopeMatches(args)) pairReasons.push('Authorization scope does not exactly match system, participants, order, and context.')
  if (!participantMatches(args.humanReview.participantA, args.participantA)
    || !participantMatches(args.humanReview.participantB, args.participantB)
    || args.humanReview.systemId !== args.systemId) {
    pairReasons.push('Reviewed participant identity does not match the mutation target.')
  }
  if (args.humanReview.relationshipContext !== args.relationshipContext) contextReasons.push('Reviewed relationship context does not match the mutation target.')
  const pairValid = pairReasons.length === 0
  const contextValid = contextReasons.length === 0 && args.relationshipContext.trim().length > 0
  if (!pairValid) errors.push(...pairReasons)
  if (!contextValid) errors.push(...contextReasons)

  const finalPromotion = evaluateEvidencePromotionCandidate({
    systemId: args.systemId,
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    proposedFacts: args.proposedFacts,
    proposedSources: args.proposedSources,
    pairBinding: args.pairBinding,
  })
  const finalApplication = evaluatePromotionApplication({
    systemId: args.systemId,
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    promotionEvaluation: finalPromotion,
    humanReview: args.humanReview,
    proposedFacts: args.proposedFacts,
    proposedSources: args.proposedSources,
    pairBinding: args.pairBinding,
    identifierResolution: args.identifierResolution,
  })
  if (finalPromotion.promotionStatus !== 'ELIGIBLE_FOR_REVIEW') errors.push('Final promotion revalidation is not ELIGIBLE_FOR_REVIEW.')
  if (!sameApplicationSnapshot(args.applicationEvaluation, finalApplication)) errors.push('Final application revalidation does not match the supplied application evaluation.')

  const requiredFactTypes = finalPromotion.satisfiedRequirements
  const factByType = new Map<string, EvidencePromotionFact>(args.proposedFacts.map((fact) => [fact.factType, fact]))
  const mutationFacts = requiredFactTypes.map((factType) => factByType.get(factType)).filter((fact): fact is EvidencePromotionFact => Boolean(fact))
  const invalidMutationFacts = mutationFacts.filter((fact) => fact.status !== 'VERIFIED' || fact.value === null || (fact.evidenceBasis && fact.evidenceBasis !== 'DIRECT_PHYSICAL_INTERFACE') || !fact.sources.some(sourceIsValid))
  const factValid = finalPromotion.missingRequirements.length === 0 && requiredFactTypes.length > 0 && invalidMutationFacts.length === 0
  if (!factValid) errors.push('Only VERIFIED physical facts with valid direct provenance may enter a mutation plan.')
  const provenanceValid = finalPromotion.provenanceValidation.status === 'VALID' && args.proposedSources.every(sourceIsValid)
  if (!provenanceValid) errors.push('Final direct provenance validation failed.')
  const conflictFree = finalPromotion.conflicts.length === 0 && finalApplication.applicationStatus !== 'BLOCKED_BY_CONFLICT'
  if (!conflictFree) errors.push('Unresolved conflicting evidence blocks mutation preparation.')

  if (finalApplication.applicationStatus === 'BLOCKED_BY_FREEZE') {
    return {
      mutationStatus: 'BLOCKED_BY_FREEZE',
      authorizationValid: pairValid && contextValid,
      finalRevalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      factValidation: validation(factValid ? 'VALID' : 'FAILED'),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED'),
      conflictValidation: validation(conflictFree ? 'VALID' : 'BLOCKED'),
      freezeValidation: validation('BLOCKED', 'The active formal freeze blocks this exact candidate.'),
      validationErrors: [...errors, 'Mutation preparation is blocked by the active freeze.'],
      ...noPlan,
    }
  }
  if (!conflictFree) {
    return {
      mutationStatus: 'BLOCKED_BY_CONFLICT',
      authorizationValid: pairValid && contextValid,
      finalRevalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      factValidation: validation('FAILED'),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED'),
      conflictValidation: validation('BLOCKED', ...finalPromotion.conflicts),
      freezeValidation: validation('VALID'),
      validationErrors: errors,
      ...noPlan,
    }
  }
  if (!pairValid || !contextValid || finalApplication.applicationStatus !== 'READY_FOR_EXPLICIT_APPLY' || !factValid || !provenanceValid || errors.length > 0) {
    return {
      mutationStatus: 'FINAL_REVALIDATION_FAILED',
      authorizationValid: pairValid && contextValid,
      finalRevalidationPassed: false,
      pairValidation: validation(pairValid ? 'VALID' : 'FAILED', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'FAILED', ...contextReasons),
      factValidation: validation(factValid ? 'VALID' : 'FAILED'),
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'FAILED'),
      conflictValidation: validation('VALID'),
      freezeValidation: validation('VALID'),
      validationErrors: errors,
      ...noPlan,
    }
  }

  return {
    mutationStatus: 'AUTHORIZED_FOR_MUTATION',
    authorizationValid: true,
    finalRevalidationPassed: true,
    pairValidation: validation('VALID'),
    contextValidation: validation('VALID'),
    factValidation: validation('VALID', ...requiredFactTypes),
    provenanceValidation: validation('VALID'),
    conflictValidation: validation('VALID'),
    freezeValidation: validation('VALID'),
    ...noPlan,
    mutationPlan: {
      systemId: args.systemId,
      participantA: args.participantA,
      participantB: args.participantB,
      relationshipContext: args.relationshipContext,
      factsToPersist: mutationFacts.map((fact) => ({ factType: fact.factType, value: fact.value!, sources: fact.sources })),
      provenanceRecordsToPersist: args.proposedSources,
      expectedEvidenceStatusTransitions: ['Future explicit execution may record the directly verified facts; this workflow performs no transition.'],
      requiredVerifierUpdates: ['Re-run evidence, readiness, freeze, and physical-gate verifiers after any future explicit mutation.'],
      requiredGateReevaluation: ['Re-evaluate physical geometry separately; this preparation does not unlock the gate.'],
      readOnly: true,
    },
    validationErrors: [],
  }
}
