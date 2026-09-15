import type {
  GlazingBeadDefinition,
  ProfileDefinition,
  ProfileRole,
  ProfileSystemCatalogEntry,
  ReinforcementDefinition,
} from '../data/profileSystems/types'
import {
  evaluateGlazingBeadCompatibility,
  getGlazingBeadCandidates,
  getReinforcementCandidatesForProfile,
  type GlazingBeadStructuralContext,
} from './componentCompatibility'
import { resolveHumanGlazingContext } from './glazingContext'
import { getGlazingOptionById } from '../data/profileSystems/glazingOptions'

export const PROFILE_RESOLUTION_VERSION = 'profile-resolution-01a' as const
export const PROFILE_COMPONENT_RESOLUTION_VERSION = 'profile-components-02a2' as const
export const PROFILE_SASH_ROLE_INTEGRITY_VERSION = 'profile-sash-role-02a3' as const
export const HUMAN_FIELD_GLAZING_VERSION = 'human-field-glazing-01b' as const
export const FIELD_GLAZING_OWNERSHIP_VERSION = 'field-glazing-ownership-01' as const

export type ProfileAssignmentSource = 'human'

export type ProfileAssignment = {
  profileCode: string
  source: ProfileAssignmentSource
}

export type ReinforcementAssignment = {
  reinforcementCode: string
  thicknessMm: number
  appliesToProfileCode: string
  source: ProfileAssignmentSource
}

export type HumanGlazingThicknessAssignment = {
  thicknessMm: number
  source: ProfileAssignmentSource
}

export type GlazingSpecificationAssignment = {
  glazingId: string
  source: ProfileAssignmentSource
}

export type EffectiveFieldGlazingSpecification = {
  glazingId: string | null
  thicknessMm: number | null
  source: 'field-override' | 'module-override' | 'offer-default' | 'unset'
}

export type ReinforcementTarget =
  | { kind: 'frame'; id: 'frame' }
  | { kind: 'divider'; id: string }
  | { kind: 'field-sash'; id: string }

export function getReinforcementTargetKey(target: ReinforcementTarget): string {
  return `${target.kind}:${target.id}`
}

/**
 * Profile assignments are deliberately stored outside ConstructionModel.
 * Construction owns topology/geometry; Profile Resolution owns which real
 * catalogue component is assigned to each structural element.
 *
 * 02A.3 keeps the 02A.2 component integrity and additionally makes every
 * OPERABLE FIELD a canonical sash-profile target even before WINDOW / DOOR
 * module context has been selected. Module context chooses sash vs door-sash;
 * it no longer decides whether the profile target exists. It still does NOT mutate topology or generate production
 * geometry, BOM, cuts, or machine output.
 */
export type ModuleProfileResolution = {
  version: typeof PROFILE_RESOLUTION_VERSION
  componentResolutionVersion: typeof PROFILE_COMPONENT_RESOLUTION_VERSION
  profileSystemId: string
  frame: ProfileAssignment | null
  dividers: Record<string, ProfileAssignment>
  fieldSashes: Record<string, ProfileAssignment>
  moduleGlazingSpecification: GlazingSpecificationAssignment | null
  fieldGlazingSpecifications: Record<string, GlazingSpecificationAssignment>
  fieldGlazingThicknesses: Record<string, HumanGlazingThicknessAssignment>
  fieldGlazingBeads: Record<string, ProfileAssignment>
  reinforcements: Record<string, ReinforcementAssignment>
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
    componentResolutionVersion: PROFILE_COMPONENT_RESOLUTION_VERSION,
    profileSystemId,
    frame: null,
    dividers: {},
    fieldSashes: {},
    moduleGlazingSpecification: null,
    fieldGlazingSpecifications: {},
    fieldGlazingThicknesses: {},
    fieldGlazingBeads: {},
    reinforcements: {},
  }
}

function normalizeResolution(
  current: ModuleProfileResolution,
): ModuleProfileResolution {
  return {
    ...current,
    componentResolutionVersion: PROFILE_COMPONENT_RESOLUTION_VERSION,
    moduleGlazingSpecification: current.moduleGlazingSpecification ?? null,
    fieldGlazingSpecifications: current.fieldGlazingSpecifications ?? {},
    fieldGlazingThicknesses: current.fieldGlazingThicknesses ?? {},
    fieldGlazingBeads: current.fieldGlazingBeads ?? {},
    reinforcements: current.reinforcements ?? {},
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

export function getFieldGlazingBeadCandidates(
  system: ProfileSystemCatalogEntry,
  glazingThicknessMm: number | null | undefined,
): readonly GlazingBeadDefinition[] {
  return getGlazingBeadCandidates(system, glazingThicknessMm)
}


export type FieldGlazingBeadResolutionContext = GlazingBeadStructuralContext & {
  targetRequired: boolean
}

/**
 * A glazing-bead target exists only after the FIELD has explicit semantics.
 * FIX resolves against the human-selected frame profile; OPERABLE resolves
 * against the human-selected sash profile. This is context only - it does not
 * prove bead compatibility.
 */
export function getFieldGlazingBeadResolutionContext(
  resolution: ModuleProfileResolution | null | undefined,
  field: ProfileResolvableField,
): FieldGlazingBeadResolutionContext {
  if (field.fieldType === null) {
    return {
      targetRequired: false,
      fieldType: null,
      baseProfileCode: null,
      baseProfileRole: null,
    }
  }

  if (field.fieldType === 'fixed') {
    return {
      targetRequired: true,
      fieldType: 'fixed',
      baseProfileCode: resolution?.frame?.profileCode ?? null,
      baseProfileRole: 'frame',
    }
  }

  return {
    targetRequired: true,
    fieldType: 'operable',
    baseProfileCode: resolution?.fieldSashes[field.id]?.profileCode ?? null,
    baseProfileRole: 'sash',
  }
}

export function getProfileReinforcementCandidates(
  system: ProfileSystemCatalogEntry,
  profileCode: string | null | undefined,
): readonly ReinforcementDefinition[] {
  return getReinforcementCandidatesForProfile(system, profileCode)
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
    ? normalizeResolution(current)
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

export function getFieldHumanGlazingThicknessMm(
  resolution: ModuleProfileResolution | null | undefined,
  fieldId: string,
): number | null {
  return resolution?.fieldGlazingThicknesses[fieldId]?.thicknessMm ?? null
}


function isKnownGlazingId(glazingId: string | null | undefined): glazingId is string {
  return Boolean(glazingId && getGlazingOptionById(glazingId))
}

export function getEffectiveFieldGlazingSpecification(
  resolution: ModuleProfileResolution | null | undefined,
  offerDefaultGlazingId: string | null | undefined,
  fieldId: string,
): EffectiveFieldGlazingSpecification {
  const normalized = resolution ? normalizeResolution(resolution) : null
  const fieldGlazingId = normalized?.fieldGlazingSpecifications[fieldId]?.glazingId
  if (isKnownGlazingId(fieldGlazingId)) {
    const option = getGlazingOptionById(fieldGlazingId)!
    return { glazingId: option.id, thicknessMm: option.totalThicknessMm, source: 'field-override' }
  }

  const moduleGlazingId = normalized?.moduleGlazingSpecification?.glazingId
  if (isKnownGlazingId(moduleGlazingId)) {
    const option = getGlazingOptionById(moduleGlazingId)!
    return { glazingId: option.id, thicknessMm: option.totalThicknessMm, source: 'module-override' }
  }

  if (isKnownGlazingId(offerDefaultGlazingId)) {
    const option = getGlazingOptionById(offerDefaultGlazingId)!
    return { glazingId: option.id, thicknessMm: option.totalThicknessMm, source: 'offer-default' }
  }

  return { glazingId: null, thicknessMm: null, source: 'unset' }
}

export function getEffectiveFieldGlazingThicknessMm(
  resolution: ModuleProfileResolution | null | undefined,
  offerDefaultGlazingId: string | null | undefined,
  fieldId: string,
): number | null {
  return getFieldHumanGlazingThicknessMm(resolution, fieldId)
    ?? getEffectiveFieldGlazingSpecification(resolution, offerDefaultGlazingId, fieldId).thicknessMm
}

function beadValidForEffectiveThickness(
  system: ProfileSystemCatalogEntry,
  thicknessMm: number | null,
  profileCode: string,
): boolean {
  return thicknessMm !== null &&
    resolveHumanGlazingContext(system, thicknessMm, profileCode).status === 'HUMAN_BEAD_SELECTION_VALID'
}

export function setModuleGlazingSpecificationAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  offerDefaultGlazingId: string | null | undefined,
  fields: readonly ProfileResolvableField[],
  glazingId: string | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  if (glazingId !== null && !isKnownGlazingId(glazingId)) return resolution

  const next: ModuleProfileResolution = {
    ...resolution,
    moduleGlazingSpecification: glazingId ? { glazingId, source: 'human' } : null,
    fieldGlazingSpecifications: { ...resolution.fieldGlazingSpecifications },
    fieldGlazingBeads: { ...resolution.fieldGlazingBeads },
  }

  for (const field of fields) {
    const bead = next.fieldGlazingBeads[field.id]
    if (!bead) continue
    const thicknessMm = getEffectiveFieldGlazingThicknessMm(next, offerDefaultGlazingId, field.id)
    if (!beadValidForEffectiveThickness(system, thicknessMm, bead.profileCode)) {
      delete next.fieldGlazingBeads[field.id]
    }
  }
  return next
}

export function setFieldGlazingSpecificationAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  offerDefaultGlazingId: string | null | undefined,
  field: ProfileResolvableField,
  glazingId: string | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  if (glazingId !== null && !isKnownGlazingId(glazingId)) return resolution

  const fieldGlazingSpecifications = { ...resolution.fieldGlazingSpecifications }
  const fieldGlazingBeads = { ...resolution.fieldGlazingBeads }
  if (glazingId === null) delete fieldGlazingSpecifications[field.id]
  else fieldGlazingSpecifications[field.id] = { glazingId, source: 'human' }

  const next = { ...resolution, fieldGlazingSpecifications, fieldGlazingBeads }
  const bead = fieldGlazingBeads[field.id]
  if (bead) {
    const thicknessMm = getEffectiveFieldGlazingThicknessMm(next, offerDefaultGlazingId, field.id)
    if (!beadValidForEffectiveThickness(system, thicknessMm, bead.profileCode)) delete fieldGlazingBeads[field.id]
  }
  return next
}

/**
 * Stores explicit human glazing thickness outside ConstructionModel.
 * Changing or clearing thickness fails closed by removing a bead assignment
 * that is not a candidate for the new system + thickness context.
 */
export function setFieldHumanGlazingThicknessAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  field: ProfileResolvableField,
  thicknessMm: number | null,
  offerDefaultGlazingId: string | null | undefined = null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const fieldGlazingThicknesses = { ...resolution.fieldGlazingThicknesses }
  const fieldGlazingBeads = { ...resolution.fieldGlazingBeads }

  if (thicknessMm === null) {
    delete fieldGlazingThicknesses[field.id]
    const next = { ...resolution, fieldGlazingThicknesses, fieldGlazingBeads }
    const existingBead = fieldGlazingBeads[field.id]
    const fallbackThicknessMm = getEffectiveFieldGlazingThicknessMm(next, offerDefaultGlazingId, field.id)
    if (existingBead && !beadValidForEffectiveThickness(system, fallbackThicknessMm, existingBead.profileCode)) {
      delete fieldGlazingBeads[field.id]
    }
    return next
  }

  if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) return resolution

  fieldGlazingThicknesses[field.id] = { thicknessMm, source: 'human' }
  const existingBead = fieldGlazingBeads[field.id]
  if (
    existingBead &&
    resolveHumanGlazingContext(system, thicknessMm, existingBead.profileCode).status !== 'HUMAN_BEAD_SELECTION_VALID'
  ) {
    delete fieldGlazingBeads[field.id]
  }

  return { ...resolution, fieldGlazingThicknesses, fieldGlazingBeads }
}

export function setFieldGlazingBeadAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  field: ProfileResolvableField,
  glazingThicknessMm: number | null | undefined,
  profileCode: string | null,
  offerDefaultGlazingId: string | null | undefined = null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const fieldGlazingBeads = { ...resolution.fieldGlazingBeads }

  if (profileCode === null) {
    delete fieldGlazingBeads[field.id]
    return { ...resolution, fieldGlazingBeads }
  }

  const context = getFieldGlazingBeadResolutionContext(resolution, field)
  if (!context.targetRequired || !context.baseProfileCode) return resolution

  const effectiveGlazingThicknessMm = getEffectiveFieldGlazingThicknessMm(resolution, offerDefaultGlazingId, field.id) ?? glazingThicknessMm
  const humanContext = resolveHumanGlazingContext(system, effectiveGlazingThicknessMm, profileCode)
  if (humanContext.status !== 'HUMAN_BEAD_SELECTION_VALID') return resolution

  fieldGlazingBeads[field.id] = { profileCode, source: 'human' }
  return { ...resolution, fieldGlazingBeads }
}

export function setReinforcementAssignment(
  current: ModuleProfileResolution | null | undefined,
  system: ProfileSystemCatalogEntry,
  target: ReinforcementTarget,
  appliesToProfileCode: string | null | undefined,
  reinforcementCode: string | null,
  thicknessMm: number | null,
): ModuleProfileResolution {
  const resolution = withSystem(current, system)
  const reinforcements = { ...resolution.reinforcements }
  const key = getReinforcementTargetKey(target)

  if (!reinforcementCode || thicknessMm === null || !appliesToProfileCode) {
    delete reinforcements[key]
    return { ...resolution, reinforcements }
  }

  const valid = getProfileReinforcementCandidates(system, appliesToProfileCode).some(
    (candidate) =>
      candidate.code === reinforcementCode &&
      candidate.thicknessOptionsMm.some((value) => Math.abs(value - thicknessMm) < 0.01),
  )
  if (!valid) return resolution

  reinforcements[key] = {
    reinforcementCode,
    thicknessMm,
    appliesToProfileCode,
    source: 'human',
  }
  return { ...resolution, reinforcements }
}

function getTargetBaseProfileCode(
  resolution: ModuleProfileResolution,
  target: ReinforcementTarget,
): string | null {
  if (target.kind === 'frame') return resolution.frame?.profileCode ?? null
  if (target.kind === 'divider') return resolution.dividers[target.id]?.profileCode ?? null
  return resolution.fieldSashes[target.id]?.profileCode ?? null
}

function parseReinforcementTargetKey(key: string): ReinforcementTarget | null {
  const separator = key.indexOf(':')
  if (separator <= 0) return null
  const kind = key.slice(0, separator)
  const id = key.slice(separator + 1)
  if (kind === 'frame' && id === 'frame') return { kind: 'frame', id: 'frame' }
  if (kind === 'divider') return { kind: 'divider', id }
  if (kind === 'field-sash') return { kind: 'field-sash', id }
  return null
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
  glazingThicknessMm: number | null = null,
  offerDefaultGlazingId: string | null | undefined = null,
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

  const fieldGlazingSpecifications = Object.fromEntries(
    Object.entries(resolution.fieldGlazingSpecifications).filter(([fieldId, assignment]) =>
      fieldsById.has(fieldId) && isKnownGlazingId(assignment.glazingId),
    ),
  )

  const fieldGlazingThicknesses = Object.fromEntries(
    Object.entries(resolution.fieldGlazingThicknesses).filter(([fieldId, assignment]) =>
      fieldsById.has(fieldId) && Number.isFinite(assignment.thicknessMm) && assignment.thicknessMm > 0,
    ),
  )

  const structuralResolution: ModuleProfileResolution = {
    ...resolution,
    frame,
    dividers,
    fieldSashes,
    moduleGlazingSpecification: resolution.moduleGlazingSpecification && isKnownGlazingId(resolution.moduleGlazingSpecification.glazingId)
      ? resolution.moduleGlazingSpecification
      : null,
    fieldGlazingSpecifications,
    fieldGlazingThicknesses,
    fieldGlazingBeads: {},
    reinforcements: {},
  }

  const fieldGlazingBeads = Object.fromEntries(
    Object.entries(resolution.fieldGlazingBeads).filter(([fieldId, assignment]) => {
      const field = fieldsById.get(fieldId)
      if (!field) return false
      const context = getFieldGlazingBeadResolutionContext(structuralResolution, field)
      if (!context.targetRequired || !context.baseProfileCode) return false
      const effectiveGlazingThicknessMm = getEffectiveFieldGlazingThicknessMm(structuralResolution, offerDefaultGlazingId, fieldId) ?? glazingThicknessMm
      return effectiveGlazingThicknessMm === null || (
        resolveHumanGlazingContext(system, effectiveGlazingThicknessMm, assignment.profileCode).status === 'HUMAN_BEAD_SELECTION_VALID'
      )
    }),
  )

  const baseResolution: ModuleProfileResolution = {
    ...structuralResolution,
    fieldGlazingBeads,
  }

  const validReinforcements = Object.fromEntries(
    Object.entries(resolution.reinforcements).filter(([key, assignment]) => {
      const target = parseReinforcementTargetKey(key)
      if (!target) return false
      if (target.kind === 'divider' && !validDividerIds.has(target.id)) return false
      if (target.kind === 'field-sash' && !fieldsById.has(target.id)) return false
      const baseCode = getTargetBaseProfileCode(baseResolution, target)
      if (!baseCode || baseCode !== assignment.appliesToProfileCode) return false
      return getProfileReinforcementCandidates(system, baseCode).some(
        (candidate) =>
          candidate.code === assignment.reinforcementCode &&
          candidate.thicknessOptionsMm.some(
            (value) => Math.abs(value - assignment.thicknessMm) < 0.01,
          ),
      )
    }),
  )

  return { ...baseResolution, reinforcements: validReinforcements }
}

export type ProfileResolutionMissingTarget =
  | { kind: 'frame'; id: 'frame' }
  | { kind: 'divider'; id: string }
  | { kind: 'field-sash'; id: string }

export function getProfileResolutionMissingTargets(
  resolution: ModuleProfileResolution | null | undefined,
  hasFrame: boolean,
  productType: 'window' | 'door' | null,
  dividerIds: readonly string[],
  fields: readonly ProfileResolvableField[],
): ProfileResolutionMissingTarget[] {
  const missing: ProfileResolutionMissingTarget[] = []

  if (hasFrame && !resolution?.frame) {
    missing.push({ kind: 'frame', id: 'frame' })
  }

  for (const dividerId of dividerIds) {
    if (!resolution?.dividers[dividerId]) {
      missing.push({ kind: 'divider', id: dividerId })
    }
  }

  for (const field of fields) {
    // Every explicit OPERABLE FIELD requires a canonical sash-profile target.
    // WINDOW / DOOR context selects the role (sash vs door-sash), but a missing
    // module context must never hide the target from Profile Resolution progress.
    if (field.fieldType !== 'operable') continue
    const role = getFieldSashRole(productType, field.fieldType)
    if (role === null || !resolution?.fieldSashes[field.id]) {
      missing.push({ kind: 'field-sash', id: field.id })
    }
  }

  return missing
}

export function getProfileResolutionProgress(
  resolution: ModuleProfileResolution | null | undefined,
  hasFrame: boolean,
  _productType: 'window' | 'door' | null,
  dividerIds: readonly string[],
  fields: readonly ProfileResolvableField[],
): { assigned: number; required: number } {
  const sashFieldIds = fields
    // Canonical target existence follows FIELD semantics, not template/context.
    .filter((field) => field.fieldType === 'operable')
    .map((field) => field.id)
  const required = (hasFrame ? 1 : 0) + dividerIds.length + sashFieldIds.length
  const assigned = (
    (hasFrame && resolution?.frame ? 1 : 0) +
    dividerIds.filter((id) => Boolean(resolution?.dividers[id])).length +
    sashFieldIds.filter((id) => Boolean(resolution?.fieldSashes[id])).length
  )

  return { assigned, required }
}

export function getSupplementalComponentResolutionProgress(args: {
  resolution: ModuleProfileResolution | null | undefined
  system: ProfileSystemCatalogEntry
  fields: readonly ProfileResolvableField[]
  dividerIds: readonly string[]
  glazingThicknessMm: number | null | undefined
}): {
  glazingBeads: { assigned: number; resolved: number; targetsRequired: number }
  reinforcements: { assigned: number; eligibleTargets: number }
} {
  const { resolution, system, fields, dividerIds, glazingThicknessMm } = args

  const beadTargets = fields.filter((field) => field.fieldType !== null)
  const assignedBeads = beadTargets.filter((field) =>
    Boolean(resolution?.fieldGlazingBeads[field.id]),
  ).length
  const resolvedBeads = beadTargets.filter((field) => {
    const assignment = resolution?.fieldGlazingBeads[field.id]
    const context = getFieldGlazingBeadResolutionContext(resolution, field)
    const effectiveGlazingThicknessMm = getFieldHumanGlazingThicknessMm(resolution, field.id) ?? glazingThicknessMm
    return evaluateGlazingBeadCompatibility(
      system,
      effectiveGlazingThicknessMm,
      assignment?.profileCode,
      context,
    ).status === 'valid'
  }).length

  const targetCodes: Array<[ReinforcementTarget, string | null]> = [
    [{ kind: 'frame', id: 'frame' }, resolution?.frame?.profileCode ?? null],
    ...dividerIds.map((id) => [
      { kind: 'divider', id } as ReinforcementTarget,
      resolution?.dividers[id]?.profileCode ?? null,
    ] as [ReinforcementTarget, string | null]),
    ...fields.map((field) => [
      { kind: 'field-sash', id: field.id } as ReinforcementTarget,
      resolution?.fieldSashes[field.id]?.profileCode ?? null,
    ] as [ReinforcementTarget, string | null]),
  ]

  const eligible = targetCodes.filter(([, code]) =>
    code && getProfileReinforcementCandidates(system, code).length > 0,
  )
  const assignedReinforcements = eligible.filter(([target]) =>
    Boolean(resolution?.reinforcements[getReinforcementTargetKey(target)]),
  ).length

  return {
    glazingBeads: {
      assigned: assignedBeads,
      resolved: resolvedBeads,
      targetsRequired: beadTargets.length,
    },
    reinforcements: { assigned: assignedReinforcements, eligibleTargets: eligible.length },
  }
}
