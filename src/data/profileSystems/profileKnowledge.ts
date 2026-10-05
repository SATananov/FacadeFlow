import { getProfileSystemById } from './catalog'
import {
  derivedDividerJointContexts,
  derivedJointOperationRows,
  derivedProfileEvidenceRows,
} from './knowledge/derivedProfileKnowledge'

export type ProfileKnowledgeEvidenceStatus = 'DATABASE_EVIDENCE'
export type JointKnowledgeEvidenceStatus = 'DATABASE_RULE_EVIDENCE'

export type ProfileKnowledgeEvidence = Readonly<{
  systemId: string
  systemLabel: string
  sourceSystem: string
  catalogue: string
  profileId: string
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
  return label.replace(/\b\w/g, (character) => character.toUpperCase())
}

export function getProfileKnowledgeEvidence(
  systemId: string,
  profileId: string | null | undefined,
): ProfileKnowledgeEvidence | undefined {
  if (!profileId) return undefined
  const imported = derivedProfileEvidenceRows.find((record) =>
    record.systemId === systemId && record.profileId === profileId,
  )
  const profileSystem = getProfileSystemById(systemId)
  const catalogProfile = profileSystem?.mainProfiles.find((profile) =>
    profile.code === profileId,
  )
  if (!imported || !profileSystem || !catalogProfile) return undefined
  return {
    ...imported,
    systemLabel: `${profileSystem.manufacturer} ${profileSystem.name}`,
    roleEn: formatRoleLabel(catalogProfile.labelCatalog),
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
