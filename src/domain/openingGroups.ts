export const OPENING_GROUP_VERSION = 'opening-groups-02a' as const

export type OpeningGroupMemberRole = 'active' | 'passive'

export type OpeningGroupMember = {
  fieldId: string
  role: OpeningGroupMemberRole
}

export type OpeningGroup = {
  version: typeof OPENING_GROUP_VERSION
  id: string
  source: 'human'
  members: readonly OpeningGroupMember[]
}

export type OpeningGroupValidation = {
  valid: boolean
  issues: readonly string[]
}

/**
 * Opening groups are a canonical place for future active/passive multi-sash
 * semantics. 02A deliberately provides no geometry or AI inference.
 */
export function createHumanOpeningGroup(
  id: string,
  members: readonly OpeningGroupMember[],
): OpeningGroup {
  return {
    version: OPENING_GROUP_VERSION,
    id,
    source: 'human',
    members: members.map((member) => ({ ...member })),
  }
}

export function validateOpeningGroup(group: OpeningGroup): OpeningGroupValidation {
  const issues: string[] = []
  const ids = group.members.map((member) => member.fieldId)
  const uniqueIds = new Set(ids)
  const activeCount = group.members.filter((member) => member.role === 'active').length

  if (group.members.length < 2) issues.push('OPENING_GROUP_REQUIRES_AT_LEAST_TWO_FIELDS')
  if (ids.length !== uniqueIds.size) issues.push('OPENING_GROUP_FIELD_DUPLICATED')
  if (activeCount !== 1) issues.push('OPENING_GROUP_REQUIRES_EXACTLY_ONE_ACTIVE_FIELD')

  return { valid: issues.length === 0, issues }
}
