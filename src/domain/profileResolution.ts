import type {
  ProfileDefinition,
  ProfileRole,
  ProfileSystemCatalogEntry,
} from '../data/profileSystems/types'

export const PROFILE_RESOLUTION_VERSION = 'profile-resolution-01a' as const

export type ProfileAssignmentSource = 'human'

export type ProfileAssignment = {
  profileCode: string
  source: ProfileAssignmentSource
}

/**
 * Profile assignments are deliberately stored outside ConstructionModel.
 * Construction owns topology/geometry; Profile Resolution owns which real
 * catalogue profile code is assigned to each structural element.
 */
export type ModuleProfileResolution = {
  version: typeof PROFILE_RESOLUTION_VERSION
  profileSystemId: string
  frame: ProfileAssignment | null
  dividers: Record<string, ProfileAssignment>
  fieldSashes: Record<string, ProfileAssignment>
}

export type ProfileResolvableField = {
  id: string
  fieldType: 'fixed' | 'operable' | null
}

export function createModuleProfileResolution(
  profileSystemId: string,
): ModuleProfileResolution {
  return {
    version: PROFILE_RESOLUTION_VERSION,
    profileSystemId,
    frame: null,
    dividers: {},
    fieldSashes: {},
  }
}

export function getMainProfileCandidates(
  system: ProfileSystemCatalogEntry,
  role: ProfileRole,
): readonly ProfileDefinition[] {
  return system.mainProfiles.filter((profile) => profile.role === role)
}

export function getFrameProfileCandidates(
  system: ProfileSystemCatalogEntry,
): readonly ProfileDefinition[] {
  return getMainProfileCandidates(system, 'frame')
}

export function getDividerProfileCandidates(
  system: ProfileSystemCatalogEntry,
): readonly ProfileDefinition[] {
  return getMainProfileCandidates(system, 'mullion')
}

/**
 * FIELD semantics deterministically decide whether a sash profile is relevant,
 * but never which concrete catalogue code should be chosen.
 */
export function getFieldSashRole(
  productType: 'window' | 'door' | null,
  fieldType: ProfileResolvableField['fieldType'],
): 'sash' | 'door-sash' | null {
  if (fieldType !== 'operable') return null
  if (productType === 'door') return 'door-sash'
  if (productType === 'window') return 'sash'
  return null
}

export function getFieldSashProfileCandidates(
  system: ProfileSystemCatalogEntry,
  productType: 'window' | 'door' | null,
  fieldType: ProfileResolvableField['fieldType'],
): readonly ProfileDefinition[] {
  const role = getFieldSashRole(productType, fieldType)
  return role ? getMainProfileCandidates(system, role) : []
}

function hasCandidate(
  candidates: readonly ProfileDefinition[],
  profileCode: string,
): boolean {
  return candidates.some((candidate) => candidate.code === profileCode)
}

function withSystem(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
): ModuleProfileResolution {
  return current?.profileSystemId === system.id
    ? current
    : createModuleProfileResolution(system.id)
}

export function setFrameProfileAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  profileCode: string | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  if (profileCode === null) return { ...resolution, frame: null }

  if (!hasCandidate(getFrameProfileCandidates(system), profileCode)) {
    return resolution
  }

  return {
    ...resolution,
    frame: { profileCode, source: 'human' },
  }
}

export function setDividerProfileAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  dividerId: string,
  profileCode: string | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const dividers = { ...resolution.dividers }

  if (profileCode === null) {
    delete dividers[dividerId]
  } else if (hasCandidate(getDividerProfileCandidates(system), profileCode)) {
    dividers[dividerId] = { profileCode, source: 'human' }
  } else {
    return resolution
  }

  return { ...resolution, dividers }
}

export function setFieldSashProfileAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  productType: 'window' | 'door' | null,
  field: ProfileResolvableField,
  profileCode: string | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const fieldSashes = { ...resolution.fieldSashes }

  if (profileCode === null) {
    delete fieldSashes[field.id]
    return { ...resolution, fieldSashes }
  }

  const candidates = getFieldSashProfileCandidates(
    system,
    productType,
    field.fieldType,
  )

  if (!hasCandidate(candidates, profileCode)) {
    return resolution
  }

  fieldSashes[field.id] = { profileCode, source: 'human' }
  return { ...resolution, fieldSashes }
}

/**
 * Removes assignments whose structural targets no longer exist or whose role
 * is no longer valid after a human topology/FIELD-semantics change.
 */
export function reconcileModuleProfileResolution(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  productType: 'window' | 'door' | null,
  dividerIds: readonly string[],
  fields: readonly ProfileResolvableField[],
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const validDividerIds = new Set(dividerIds)
  const dividers = Object.fromEntries(
    Object.entries(resolution.dividers).filter(([dividerId, assignment]) =>
      validDividerIds.has(dividerId) &&
      hasCandidate(getDividerProfileCandidates(system), assignment.profileCode),
    ),
  )

  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const fieldSashes = Object.fromEntries(
    Object.entries(resolution.fieldSashes).filter(([fieldId, assignment]) => {
      const field = fieldsById.get(fieldId)
      return Boolean(
        field &&
        hasCandidate(
          getFieldSashProfileCandidates(system, productType, field.fieldType),
          assignment.profileCode,
        ),
      )
    }),
  )

  const frame = resolution.frame &&
    hasCandidate(getFrameProfileCandidates(system), resolution.frame.profileCode)
    ? resolution.frame
    : null

  return {
    ...resolution,
    frame,
    dividers,
    fieldSashes,
  }
}

export function getProfileResolutionProgress(
  resolution: ModuleProfileResolution | null | undefined,
  hasFrame: boolean,
  productType: 'window' | 'door' | null,
  dividerIds: readonly string[],
  fields: readonly ProfileResolvableField[],
): { assigned: number; required: number } {
  const sashFieldIds = fields
    .filter((field) => getFieldSashRole(productType, field.fieldType) !== null)
    .map((field) => field.id)
  const required = (hasFrame ? 1 : 0) + dividerIds.length + sashFieldIds.length
  const assigned = (
    (hasFrame && resolution?.frame ? 1 : 0) +
    dividerIds.filter((id) => Boolean(resolution?.dividers[id])).length +
    sashFieldIds.filter((id) => Boolean(resolution?.fieldSashes[id])).length
  )

  return { assigned, required }
}
