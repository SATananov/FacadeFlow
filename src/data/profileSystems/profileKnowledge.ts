import { getProfileSystemById } from './catalog'
import {
  derivedDividerJointContexts,
  derivedJointOperationRows,
  derivedProfileEvidenceRows,
  hasDerivedProfileEvidenceConflict,
} from './knowledge/derivedProfileKnowledge'

export type ProfileKnowledgeEvidenceStatus = 'DATABASE_EVIDENCE'
export type JointKnowledgeEvidenceStatus = 'DATABASE_RULE_EVIDENCE'
export type RuntimeMappingStatus = 'RUNTIME_MAPPED' | 'RUNTIME_UNMAPPED'

export type ProfileKnowledgeEvidence = Readonly<{
  systemId: string
  runtimeMappingStatus: 'RUNTIME_MAPPED'
  systemLabel: string
  sourceSystem: string
  catalogue: string
  profileId: string
  profileName: string
  roleEn: string
  roleBg: string
  profileW: number
  profileZ: number
  evidenceStatus: ProfileKnowledgeEvidenceStatus
  sourcePath: string
}>

export type DividerJointAxis = 'horizontal' | 'vertical'

export type JointKnowledgeEvidence = Readonly<{
  systemId: string
  dividerProfileId: string
  dividerAxis: DividerJointAxis
  sourceSystem: string
  ruleId: string
  standardOperationName: string
  relationToken: string
  operationCode: string
  operation: string
  positionExpression: string
  parameter2: string
  sourceMarker: string
  extraTokens: string
  evidenceStatus: JointKnowledgeEvidenceStatus
  geometryStatus: 'UNKNOWN'
  sourcePath: string
  contextSourcePaths: readonly string[]
}>

function formatRoleLabel(label: string): string {
  return label ? `${label[0].toUpperCase()}${label.slice(1)}` : label
}

export function getProfileKnowledgeEvidence(
  systemId: string,
  profileId: string | null | undefined,
): ProfileKnowledgeEvidence | undefined {
  if (!profileId) return undefined
  const imported = derivedProfileEvidenceRows.find((record) =>
    record.runtimeMappingStatus === 'RUNTIME_MAPPED' &&
    'systemId' in record && record.systemId === systemId && record.profileId === profileId,
  )
  const profileSystem = getProfileSystemById(systemId)
  const catalogProfile = profileSystem?.mainProfiles.find((profile) =>
    profile.code === profileId,
  )
  if (!imported || !('systemId' in imported) || !profileSystem || !catalogProfile) return undefined
  if (hasDerivedProfileEvidenceConflict(systemId, profileId)) return undefined
  return {
    ...imported,
    systemLabel: `${profileSystem.manufacturer} ${profileSystem.name}`,
    roleEn: formatRoleLabel(catalogProfile.labelCatalog),
    roleBg: formatRoleLabel(imported.roleBg),
  }
}

export function getDividerJointKnowledgeEvidence(args: {
  systemId: string
  dividerProfileId: string | null | undefined
  dividerAxis: DividerJointAxis
}): readonly JointKnowledgeEvidence[] {
  if (!args.dividerProfileId) return []
  const context = derivedDividerJointContexts.find((record) =>
    record.systemId === args.systemId &&
    record.dividerProfileId === args.dividerProfileId &&
    record.dividerAxis === args.dividerAxis,
  )
  if (!context) return []
  return derivedJointOperationRows
    .filter((record) => record.ruleId === context.ruleId)
    .map((record) => ({
      systemId: context.systemId,
      dividerProfileId: context.dividerProfileId,
      dividerAxis: context.dividerAxis,
      contextSourcePaths: context.sourcePaths,
      ...record,
    }))
}
