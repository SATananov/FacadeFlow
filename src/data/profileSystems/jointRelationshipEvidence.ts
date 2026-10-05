import { getProfileKnowledgeEvidence, getDividerJointKnowledgeEvidence } from './profileKnowledge'
import { getProfileSystemById } from './catalog'

/**
 * JOINT RELATIONSHIP EVIDENCE != JOINT GEOMETRY.
 * CONTEXT RELATIONSHIP EVIDENCE != DIRECT ARTICLE-PAIR BINDING.
 * NO EXPLICIT EVIDENCE != NO JOINT.
 *
 * This read-only layer reports imported relationship/operation context only.
 * It does not create a joint, infer a notch, or validate a physical result.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type JointRelationshipEvidenceRole = 'frame' | 'sash' | 'mullion'
export type JointRelationshipEvidenceOrientation = 'horizontal' | 'vertical'
export type JointRelationshipContext = 'FRAME_TO_MULLION'
export type JointRelationshipStatus =
  | 'RELATIONSHIP_EVIDENCE_FOUND'
  | 'NO_EXPLICIT_RELATIONSHIP_EVIDENCE'
  | 'PROFILE_NOT_FOUND'
  | 'SYSTEM_NOT_FOUND'
  | 'ROLE_MISMATCH'
  | 'UNRESOLVED'
export type JointRelationshipEvidenceStatus = 'DATABASE_RULE_EVIDENCE' | 'UNKNOWN'
export type JointRelationshipBindingEvidence = 'CONTEXT_RELATIONSHIP_EVIDENCE' | 'DIRECT_ARTICLE_PAIR_EVIDENCE' | 'UNKNOWN'
export type DirectArticlePairBindingStatus = 'UNKNOWN' | 'PROVEN'

export type JointRelationshipEvidenceResult = Readonly<{
  systemId: string
  profileAId: string
  profileBId: string
  profileARole: JointRelationshipEvidenceRole
  profileBRole: JointRelationshipEvidenceRole
  orientation: JointRelationshipEvidenceOrientation
  relationshipContext: JointRelationshipContext
  relationshipStatus: JointRelationshipStatus
  evidenceStatus: JointRelationshipEvidenceStatus
  bindingEvidence: JointRelationshipBindingEvidence
  directArticlePairBinding: DirectArticlePairBindingStatus
  directArticlePairBindingStatus: DirectArticlePairBindingStatus
  geometryStatus: 'UNKNOWN'
  ruleIds: readonly string[]
  operationNames: readonly string[]
  relationTokens: readonly string[]
  sourceRelationTokens: readonly string[]
  operationCodes: readonly string[]
  positionExpressions: readonly string[]
  sourceMarkers: readonly string[]
  sourcePaths: readonly string[]
  reasons: readonly string[]
  unknowns: readonly string[]
}>

const relationshipUnknowns = [
  'Physical notch contour, overlap, rebate, cut shape, and cutter path are UNKNOWN.',
  'Mechanical compatibility, welding allowance, machining coordinates, and machine readiness are UNKNOWN.',
  'Direct article-pair binding and catalogue approval for a specific construction are UNKNOWN.',
] as const

function result(
  args: {
    systemId: string
    profileAId: string
    profileBId: string
    profileARole: JointRelationshipEvidenceRole
    profileBRole: JointRelationshipEvidenceRole
    orientation: JointRelationshipEvidenceOrientation
    relationshipContext: JointRelationshipContext
  },
  relationshipStatus: JointRelationshipStatus,
  evidenceStatus: JointRelationshipEvidenceStatus,
  bindingEvidence: JointRelationshipBindingEvidence,
  ruleIds: readonly string[],
  operationNames: readonly string[],
  relationTokens: readonly string[],
  operationCodes: readonly string[],
  positionExpressions: readonly string[],
  sourceMarkers: readonly string[],
  sourcePaths: readonly string[],
  reasons: readonly string[],
): JointRelationshipEvidenceResult {
  return {
    ...args,
    relationshipStatus,
    evidenceStatus,
    bindingEvidence,
    directArticlePairBinding: 'UNKNOWN',
    directArticlePairBindingStatus: 'UNKNOWN',
    geometryStatus: 'UNKNOWN',
    ruleIds,
    operationNames,
    relationTokens,
    sourceRelationTokens: relationTokens,
    operationCodes,
    positionExpressions,
    sourceMarkers,
    sourcePaths,
    reasons,
    unknowns: relationshipUnknowns,
  }
}

export function evaluateJointRelationshipEvidence(args: {
  systemId: string
  profileAId: string
  profileBId: string
  profileARole: JointRelationshipEvidenceRole
  profileBRole: JointRelationshipEvidenceRole
  orientation: JointRelationshipEvidenceOrientation
  relationshipContext: JointRelationshipContext
}): JointRelationshipEvidenceResult {
  const system = getProfileSystemById(args.systemId)
  if (!system) {
    return result(
      args,
      'SYSTEM_NOT_FOUND',
      'UNKNOWN',
      'UNKNOWN',
      [], [], [], [], [], [], [],
      ['The requested runtime profile system does not exist.'],
    )
  }

  const profileA = getProfileKnowledgeEvidence(args.systemId, args.profileAId)
  const profileB = getProfileKnowledgeEvidence(args.systemId, args.profileBId)
  if (!profileA || !profileB) {
    return result(
      args,
      'PROFILE_NOT_FOUND',
      'UNKNOWN',
      'UNKNOWN',
      [], [], [], [], [], [], [],
      ['One or both exact runtime system/profile identities have no mapped database evidence.'],
    )
  }

  const recognizedARole = profileA.roleEn.toLowerCase() as JointRelationshipEvidenceRole
  const recognizedBRole = profileB.roleEn.toLowerCase() as JointRelationshipEvidenceRole
  if (
    recognizedARole !== args.profileARole ||
    recognizedBRole !== args.profileBRole ||
    args.profileARole !== 'frame' ||
    args.profileBRole !== 'mullion'
  ) {
    return result(
      args,
      'ROLE_MISMATCH',
      'UNKNOWN',
      'UNKNOWN',
      [], [], [], [], [], [], [],
      ['The requested profile roles do not match the required Frame-to-Mullion relationship context.'],
    )
  }

  const operationEvidence = getDividerJointKnowledgeEvidence({
    systemId: args.systemId,
    dividerProfileId: args.profileBId,
    dividerAxis: args.orientation,
  })
  if (operationEvidence.length === 0) {
    return result(
      args,
      'NO_EXPLICIT_RELATIONSHIP_EVIDENCE',
      'UNKNOWN',
      'UNKNOWN',
      [], [], [], [], [], [], [],
      ['The repository has no explicit relationship operation evidence for this system, profile context, and orientation. This does not prove that no joint exists.'],
    )
  }

  return result(
    args,
    'RELATIONSHIP_EVIDENCE_FOUND',
    'DATABASE_RULE_EVIDENCE',
    'CONTEXT_RELATIONSHIP_EVIDENCE',
    [...new Set(operationEvidence.map((record) => record.ruleId))],
    [...new Set(operationEvidence.map((record) => record.operation))],
    operationEvidence.map((record) => record.relationToken),
    operationEvidence.map((record) => record.operationCode),
    operationEvidence.map((record) => record.positionExpression),
    operationEvidence.map((record) => record.sourceMarker),
    [...new Set(operationEvidence.flatMap((record) => [record.sourcePath, ...record.contextSourcePaths]))],
    ['Imported operation/token evidence proves a relationship context, not physical joint geometry or direct article-pair binding.'],
  )
}
