import {
  evaluateGeometryReadiness,
  type GeometryReadinessResult,
} from './geometryReadiness'
import type { JointRelationshipEvidenceOrientation, JointRelationshipContext } from './jointRelationshipEvidence'
import type { ProfileResolutionEvidenceRole } from './profileResolutionEvidence'

/**
 * This adapter describes the participants already selected by the UI.
 * It does not reorder, resolve, assign, or mutate participants.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type GeometryReadinessParticipant = Readonly<{
  role: ProfileResolutionEvidenceRole
  profileId: string | null
  systemId: string | null
  selectionId: string
}>

export type SelectedGeometryReadinessContextStatus =
  | 'READY'
  | 'INCOMPLETE_SELECTION'
  | 'CONTEXT_UNAVAILABLE'
  | 'ROLE_MISMATCH'
  | 'PROFILE_ID_UNKNOWN'

export type SelectedGeometryReadinessContext = Readonly<{
  participantA: GeometryReadinessParticipant | null
  participantB: GeometryReadinessParticipant | null
  relationshipContext: JointRelationshipContext | null
  orientation: JointRelationshipEvidenceOrientation | null
  status: SelectedGeometryReadinessContextStatus
  evaluation: GeometryReadinessResult | null
}>

export function evaluateSelectedGeometryReadiness(args: {
  participantA: GeometryReadinessParticipant | null
  participantB: GeometryReadinessParticipant | null
  relationshipContext: JointRelationshipContext | null
  orientation: JointRelationshipEvidenceOrientation | null
}): SelectedGeometryReadinessContext {
  const base = {
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    orientation: args.orientation,
  }
  if (!args.participantA || !args.participantB) return { ...base, status: 'INCOMPLETE_SELECTION', evaluation: null }
  if (!args.relationshipContext || !args.orientation) return { ...base, status: 'CONTEXT_UNAVAILABLE', evaluation: null }
  if (args.participantA.role !== 'frame' || args.participantB.role !== 'mullion') {
    return { ...base, status: 'ROLE_MISMATCH', evaluation: null }
  }
  if (!args.participantA.profileId || !args.participantB.profileId || !args.participantA.systemId || !args.participantB.systemId) {
    return { ...base, status: 'PROFILE_ID_UNKNOWN', evaluation: null }
  }
  if (args.participantA.systemId !== args.participantB.systemId) {
    return { ...base, status: 'CONTEXT_UNAVAILABLE', evaluation: null }
  }
  return {
    ...base,
    status: 'READY',
    evaluation: evaluateGeometryReadiness({
      systemId: args.participantA.systemId,
      profileAId: args.participantA.profileId,
      profileBId: args.participantB.profileId,
      profileARole: args.participantA.role,
      profileBRole: args.participantB.role,
      relationshipContext: args.relationshipContext,
      orientation: args.orientation,
    }),
  }
}
