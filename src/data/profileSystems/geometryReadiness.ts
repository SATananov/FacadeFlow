import { evaluateProfileResolutionEvidence, type ProfileResolutionEvidenceRole } from './profileResolutionEvidence'
import { evaluateJointRelationshipEvidence, type JointRelationshipEvidenceOrientation } from './jointRelationshipEvidence'
import { getGeometryEvidence, type GeometryEvidenceFact, type GeometryEvidenceRecord } from './geometryEvidence'

/**
 * GEOMETRY READINESS IS EVIDENCE READINESS, NOT GENERATED GEOMETRY.
 *
 * This layer is read-only. It does not assign profiles, create joints,
 * calculate contact, produce coordinates, or enable machining.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type GeometryReadinessLevel =
  | 'PROFILE_CONTEXT_BLOCKED'
  | 'PROFILE_CONTEXT_READY'
  | 'RELATIONSHIP_CONTEXT_BLOCKED'
  | 'RELATIONSHIP_CONTEXT_READY'
  | 'SCHEMATIC_ONLY'
  | 'PHYSICAL_GEOMETRY_BLOCKED'
  | 'MACHINE_GEOMETRY_BLOCKED'

export type GeometryReadinessUse =
  | 'PROFILE_DISPLAY'
  | 'RELATIONSHIP_CONTEXT_DISPLAY'
  | 'SCHEMATIC_RELATIONSHIP_DISPLAY'
  | 'PHYSICAL_JOINT_GEOMETRY'
  | 'MACHINING_GEOMETRY'

export type GeometryReadinessUseDecision = Readonly<{
  use: GeometryReadinessUse
  status: 'ALLOWED' | 'BLOCKED'
  condition?: string
}>

export type GeometryReadinessBlocker =
  | 'PROFILE_CONTEXT_UNKNOWN'
  | 'RELATIONSHIP_CONTEXT_UNKNOWN'
  | 'CONTACT_LINE_UNKNOWN'
  | 'CONTACT_POINT_UNKNOWN'
  | 'CONTACT_SURFACES_UNKNOWN'
  | 'CONTACT_DEPTH_UNKNOWN'
  | 'OVERLAP_UNKNOWN'
  | 'REBATE_UNKNOWN'
  | 'NOTCH_CONTOUR_UNKNOWN'
  | 'MULLION_END_TREATMENT_UNKNOWN'
  | 'CUT_ANGLE_UNKNOWN'
  | 'CUT_LENGTH_UNKNOWN'
  | 'MACHINING_GEOMETRY_UNKNOWN'
  | 'MACHINING_COORDINATES_UNKNOWN'
  | 'TOOLPATH_UNKNOWN'
  | 'CONNECTOR_PLACEMENT_UNKNOWN'
  | 'ASSEMBLY_CROSS_SECTION_UNKNOWN'
  | 'WELD_ALLOWANCE_UNKNOWN'
  | 'DIRECT_ARTICLE_PAIR_BINDING_UNKNOWN'

export type GeometryReadinessResult = Readonly<{
  systemId: string
  profileA: Readonly<{ id: string; role: ProfileResolutionEvidenceRole }>
  profileB: Readonly<{ id: string; role: ProfileResolutionEvidenceRole }>
  context: 'FRAME_TO_MULLION'
  orientation: JointRelationshipEvidenceOrientation
  profileResolutionStatus: 'SUPPORTED' | 'BLOCKED' | 'UNKNOWN'
  relationshipEvidenceStatus: 'DATABASE_RULE_EVIDENCE' | 'UNKNOWN'
  geometryEvidenceStatus: 'CATALOGUE_VERIFIED' | 'CAD_VERIFIED' | 'DATABASE_RELATIONSHIP_ONLY' | 'UNKNOWN'
  readinessLevel: GeometryReadinessLevel
  physicalGeometryStatus: 'ALLOWED' | 'BLOCKED'
  machineGeometryStatus: 'ALLOWED' | 'BLOCKED'
  allowedUses: readonly GeometryReadinessUseDecision[]
  blockedUses: readonly GeometryReadinessUseDecision[]
  missingEvidence: readonly GeometryReadinessBlocker[]
  evidenceSummary: readonly string[]
}>

type PhysicalEvidenceField =
  | 'contactLineEvidence'
  | 'contactPointEvidence'
  | 'overlapEvidence'
  | 'rebateEvidence'
  | 'notchContourEvidence'
  | 'cutAngleEvidence'
  | 'cutLengthEvidence'
  | 'assemblyCrossSectionEvidence'

const physicalBlockersByField: ReadonlyArray<readonly [PhysicalEvidenceField, GeometryReadinessBlocker]> = [
  ['contactLineEvidence', 'CONTACT_LINE_UNKNOWN'],
  ['contactPointEvidence', 'CONTACT_POINT_UNKNOWN'],
  ['overlapEvidence', 'OVERLAP_UNKNOWN'],
  ['rebateEvidence', 'REBATE_UNKNOWN'],
  ['notchContourEvidence', 'NOTCH_CONTOUR_UNKNOWN'],
  ['cutAngleEvidence', 'CUT_ANGLE_UNKNOWN'],
  ['cutLengthEvidence', 'CUT_LENGTH_UNKNOWN'],
  ['assemblyCrossSectionEvidence', 'ASSEMBLY_CROSS_SECTION_UNKNOWN'],
]

function decision(use: GeometryReadinessUse, status: 'ALLOWED' | 'BLOCKED', condition?: string): GeometryReadinessUseDecision {
  return condition ? { use, status, condition } : { use, status }
}

function geometryStatus(record: GeometryEvidenceRecord | undefined): GeometryReadinessResult['geometryEvidenceStatus'] {
  if (!record) return 'UNKNOWN'
  if (record.evidenceStatus === 'DATABASE_RELATIONSHIP_ONLY') return 'DATABASE_RELATIONSHIP_ONLY'
  const status = record.profileASectionEvidence.status
  return status === 'ASSUMED' ? 'UNKNOWN' : status
}

export function evaluateGeometryReadiness(args: {
  systemId: string
  profileAId: string
  profileBId: string
  profileARole: ProfileResolutionEvidenceRole
  profileBRole: ProfileResolutionEvidenceRole
  relationshipContext: 'FRAME_TO_MULLION'
  orientation: JointRelationshipEvidenceOrientation
}): GeometryReadinessResult {
  const profileAResolution = evaluateProfileResolutionEvidence({
    systemId: args.systemId,
    profileId: args.profileAId,
    requestedRole: args.profileARole,
    context: 'FRAME_ASSIGNMENT',
  })
  const profileBResolution = evaluateProfileResolutionEvidence({
    systemId: args.systemId,
    profileId: args.profileBId,
    requestedRole: args.profileBRole,
    context: 'MULLION_ASSIGNMENT',
  })
  const profilesSupported = profileAResolution.resolutionStatus === 'SUPPORTED_BY_DATABASE_ROLE' &&
    profileBResolution.resolutionStatus === 'SUPPORTED_BY_DATABASE_ROLE'
  const relationship = evaluateJointRelationshipEvidence({
    systemId: args.systemId,
    profileAId: args.profileAId,
    profileBId: args.profileBId,
    profileARole: args.profileARole,
    profileBRole: args.profileBRole,
    orientation: args.orientation,
    relationshipContext: args.relationshipContext,
  })
  const exactFrameMullion = args.profileARole === 'frame' && args.profileBRole === 'mullion'
  const geometry = exactFrameMullion
    ? getGeometryEvidence({
      systemId: args.systemId,
      profileAId: args.profileAId,
      profileBId: args.profileBId,
      profileARole: 'frame',
      profileBRole: 'mullion',
      relationshipContext: args.relationshipContext,
      orientation: args.orientation,
    })
    : undefined

  const missingEvidence: GeometryReadinessBlocker[] = []
  if (!profilesSupported) missingEvidence.push('PROFILE_CONTEXT_UNKNOWN')
  if (relationship.relationshipStatus !== 'RELATIONSHIP_EVIDENCE_FOUND') missingEvidence.push('RELATIONSHIP_CONTEXT_UNKNOWN')
  if (geometry) {
    for (const [field, blocker] of physicalBlockersByField) {
      const evidenceFact: GeometryEvidenceFact = geometry[field]
      if (evidenceFact.status === 'UNKNOWN') missingEvidence.push(blocker)
    }
  } else {
    missingEvidence.push('DIRECT_ARTICLE_PAIR_BINDING_UNKNOWN', 'ASSEMBLY_CROSS_SECTION_UNKNOWN', 'MACHINING_GEOMETRY_UNKNOWN')
  }
  missingEvidence.push('CONTACT_SURFACES_UNKNOWN', 'CONTACT_DEPTH_UNKNOWN', 'MULLION_END_TREATMENT_UNKNOWN', 'MACHINING_GEOMETRY_UNKNOWN', 'MACHINING_COORDINATES_UNKNOWN', 'TOOLPATH_UNKNOWN', 'CONNECTOR_PLACEMENT_UNKNOWN', 'WELD_ALLOWANCE_UNKNOWN')

  const uniqueMissingEvidence = [...new Set(missingEvidence)]
  const relationshipAllowed = relationship.relationshipStatus === 'RELATIONSHIP_EVIDENCE_FOUND'
  const profileAllowed = profilesSupported
  const physicalAllowed = false
  const machineAllowed = false
  let readinessLevel: GeometryReadinessLevel
  if (!profileAllowed) readinessLevel = 'PROFILE_CONTEXT_BLOCKED'
  else if (!relationshipAllowed) readinessLevel = 'PROFILE_CONTEXT_READY'
  else readinessLevel = physicalAllowed ? 'RELATIONSHIP_CONTEXT_READY' : 'SCHEMATIC_ONLY'

  return {
    systemId: args.systemId,
    profileA: { id: args.profileAId, role: args.profileARole },
    profileB: { id: args.profileBId, role: args.profileBRole },
    context: args.relationshipContext,
    orientation: args.orientation,
    profileResolutionStatus: profileAllowed ? 'SUPPORTED' : 'BLOCKED',
    relationshipEvidenceStatus: relationship.evidenceStatus,
    geometryEvidenceStatus: geometryStatus(geometry),
    readinessLevel,
    physicalGeometryStatus: physicalAllowed ? 'ALLOWED' : 'BLOCKED',
    machineGeometryStatus: machineAllowed ? 'ALLOWED' : 'BLOCKED',
    allowedUses: [
      decision('PROFILE_DISPLAY', profileAllowed ? 'ALLOWED' : 'BLOCKED'),
      decision('RELATIONSHIP_CONTEXT_DISPLAY', relationshipAllowed ? 'ALLOWED' : 'BLOCKED'),
      decision('SCHEMATIC_RELATIONSHIP_DISPLAY', relationshipAllowed ? 'ALLOWED' : 'BLOCKED', 'Only as explicitly evidence-labeled non-physical schematic context.'),
    ].filter((item) => item.status === 'ALLOWED'),
    blockedUses: [
      decision('PROFILE_DISPLAY', profileAllowed ? 'ALLOWED' : 'BLOCKED'),
      decision('RELATIONSHIP_CONTEXT_DISPLAY', relationshipAllowed ? 'ALLOWED' : 'BLOCKED'),
      decision('SCHEMATIC_RELATIONSHIP_DISPLAY', relationshipAllowed ? 'ALLOWED' : 'BLOCKED'),
      decision('PHYSICAL_JOINT_GEOMETRY', 'BLOCKED', 'Direct physical contact and assembly evidence is incomplete.'),
      decision('MACHINING_GEOMETRY', 'BLOCKED', 'Machining geometry, coordinates, and toolpath are UNKNOWN.'),
    ].filter((item) => item.status === 'BLOCKED'),
    missingEvidence: uniqueMissingEvidence,
    evidenceSummary: [
      profileAllowed ? 'Exact profile/system roles are recognized by profile-resolution evidence.' : 'Profile/system role evidence is not sufficient for this request.',
      relationshipAllowed ? 'Relationship evidence exists without proving physical geometry.' : 'Relationship evidence is absent or role/context-mismatched; absence does not prove impossibility.',
      geometry ? `Geometry evidence status is ${geometry.evidenceStatus}; UNKNOWN physical fields remain blockers.` : 'No exact geometry evidence record applies to this requested role/order.',
      'Envelope dimensions and cuttingang do not upgrade geometry readiness.',
      'This evaluator is read-only and never creates geometry, joints, assignments, or machining data.',
    ],
  }
}
