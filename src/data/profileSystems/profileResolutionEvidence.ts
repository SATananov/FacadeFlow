import { getProfileSystemById } from './catalog'
import { getProfileKnowledgeEvidence } from './profileKnowledge'

/**
 * PROFILE RECOGNITION != PROFILE RESOLUTION.
 * PROFILE RESOLUTION EVIDENCE != AUTOMATIC PROFILE SELECTION.
 * DATABASE ROLE SUPPORT != CATALOGUE VALIDATION.
 *
 * This read-only layer reports only whether imported evidence recognizes an
 * exact profile/system identity for a requested structural role. It does not
 * assign profiles, validate construction compatibility, or produce geometry.
 * Context support means only that the requested assignment context names the
 * same structural role; it does not prove product or component compatibility.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type ProfileResolutionEvidenceRole = 'frame' | 'sash' | 'mullion'

export type ProfileResolutionEvidenceContext =
  | 'FRAME_ASSIGNMENT'
  | 'SASH_ASSIGNMENT'
  | 'MULLION_ASSIGNMENT'

export type ProfileResolutionEvidenceStatus = 'DATABASE_EVIDENCE' | 'UNKNOWN'

export type ProfileResolutionEvidenceStatusCode =
  | 'SUPPORTED_BY_DATABASE_ROLE'
  | 'ROLE_MISMATCH'
  | 'CONTEXT_MISMATCH'
  | 'PROFILE_NOT_FOUND'
  | 'SYSTEM_NOT_FOUND'
  | 'UNRESOLVED'

export type ProfileResolutionEvidenceResult = Readonly<{
  systemId: string
  profileId: string
  requestedRole: ProfileResolutionEvidenceRole
  context: ProfileResolutionEvidenceContext
  recognizedRole: ProfileResolutionEvidenceRole | null
  evidenceStatus: ProfileResolutionEvidenceStatus
  resolutionStatus: ProfileResolutionEvidenceStatusCode
  reasons: readonly string[]
  unknowns: readonly string[]
}>

const recognizedRoleByEvidenceRole: Readonly<Record<string, ProfileResolutionEvidenceRole>> = {
  Frame: 'frame',
  Sash: 'sash',
  Mullion: 'mullion',
}

const resolutionUnknowns = [
  'Catalogue approval is UNKNOWN.',
  'Structural and mechanical compatibility is UNKNOWN.',
  'Joint, reinforcement, machining, and machine-readiness facts are UNKNOWN.',
] as const

function result(
  systemId: string,
  profileId: string,
  requestedRole: ProfileResolutionEvidenceRole,
  context: ProfileResolutionEvidenceContext,
  recognizedRole: ProfileResolutionEvidenceRole | null,
  evidenceStatus: ProfileResolutionEvidenceStatus,
  resolutionStatus: ProfileResolutionEvidenceStatusCode,
  reasons: readonly string[],
): ProfileResolutionEvidenceResult {
  return {
    systemId,
    profileId,
    requestedRole,
    context,
    recognizedRole,
    evidenceStatus,
    resolutionStatus,
    reasons,
    unknowns: resolutionUnknowns,
  }
}

export function evaluateProfileResolutionEvidence(args: {
  systemId: string
  profileId: string
  requestedRole: ProfileResolutionEvidenceRole
  context: ProfileResolutionEvidenceContext
}): ProfileResolutionEvidenceResult {
  const { systemId, profileId, requestedRole, context } = args
  const system = getProfileSystemById(systemId)
  if (!system) {
    return result(
      systemId,
      profileId,
      requestedRole,
      context,
      null,
      'UNKNOWN',
      'SYSTEM_NOT_FOUND',
      ['The requested runtime profile system does not exist.'],
    )
  }

  const evidence = getProfileKnowledgeEvidence(systemId, profileId)
  if (!evidence) {
    return result(
      systemId,
      profileId,
      requestedRole,
      context,
      null,
      'UNKNOWN',
      'PROFILE_NOT_FOUND',
      ['No runtime-mapped database evidence exists for this exact system/profile identity.'],
    )
  }

  const recognizedRole = recognizedRoleByEvidenceRole[evidence.roleEn] ?? null
  if (!recognizedRole) {
    return result(
      systemId,
      profileId,
      requestedRole,
      context,
      null,
      evidence.evidenceStatus,
      'UNRESOLVED',
      ['The evidence role is not one of the supported structural resolution roles.'],
    )
  }

  const contextRoleByContext: Readonly<Record<ProfileResolutionEvidenceContext, ProfileResolutionEvidenceRole>> = {
    FRAME_ASSIGNMENT: 'frame',
    SASH_ASSIGNMENT: 'sash',
    MULLION_ASSIGNMENT: 'mullion',
  }
  const contextRole = contextRoleByContext[context]
  if (contextRole !== requestedRole) {
    return result(
      systemId,
      profileId,
      requestedRole,
      context,
      recognizedRole,
      evidence.evidenceStatus,
      'CONTEXT_MISMATCH',
      [`Requested role ${requestedRole} contradicts context ${context}, which requires ${contextRole}.`],
    )
  }

  if (recognizedRole !== requestedRole) {
    return result(
      systemId,
      profileId,
      requestedRole,
      context,
      recognizedRole,
      evidence.evidenceStatus,
      'ROLE_MISMATCH',
      [`Database evidence recognizes this profile as ${recognizedRole}, not ${requestedRole}.`],
    )
  }

  return result(
    systemId,
    profileId,
    requestedRole,
    context,
    recognizedRole,
    evidence.evidenceStatus,
    'SUPPORTED_BY_DATABASE_ROLE',
    ['Exact runtime system/profile evidence recognizes the requested structural role.'],
  )
}
