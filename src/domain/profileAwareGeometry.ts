import type { ProfileSystemCatalogEntry } from '../data/profileSystems'
import type { ResolvedConstructionDivider, ResolvedConstructionField } from './construction'
import type { ModuleProfileResolution } from './profileResolution'
import {
  getAssignedProfileDimensionalReadModel,
  type AssignedProfileDimensionalReadModel,
} from './profileDimensionalSemantics'

export const PROFILE_AWARE_GEOMETRY_VERSION = 'profile-resolution-01c' as const

export type ReviewedFaceGeometry = {
  profileCode: string | null
  visibleFaceMm: number | null
  reviewed: boolean
  source: 'human-confirmed' | 'unresolved'
  noteBg: string
}

export type ReviewedSashGeometry = {
  fieldId: string
  profileCode: string | null
  visibleFaceMm: number | null
  overlapMm: number | null
  glazingInsetMm: number | null
  reviewed: boolean
  noteBg: string
}

export type ProfileAwareGeometryReadModel = {
  version: typeof PROFILE_AWARE_GEOMETRY_VERSION
  frame: ReviewedFaceGeometry
  dividers: Record<string, ReviewedFaceGeometry>
  sashes: Record<string, ReviewedSashGeometry>
  reviewedFaceCount: number
  requiredFaceCount: number
  sashReviewedCount: number
  sashRequiredCount: number
  partialReviewedGeometry: boolean
  completeReviewedGeometry: boolean
  topologyAuthoritative: true
  machineReady: false
}

function reviewedFace(
  assigned: AssignedProfileDimensionalReadModel | null,
  unresolvedNoteBg: string,
): ReviewedFaceGeometry {
  const visibleFace = assigned?.visibleFace
  const reviewed = Boolean(
    assigned &&
    visibleFace &&
    visibleFace.valueMm !== null &&
    visibleFace.status === 'human-confirmed',
  )

  return {
    profileCode: assigned?.profileCode ?? null,
    visibleFaceMm: reviewed ? visibleFace?.valueMm ?? null : null,
    reviewed,
    source: reviewed ? 'human-confirmed' : 'unresolved',
    noteBg: reviewed
      ? `${assigned?.profileCode}: видимото лице е human-confirmed и може да се използва само за REVIEWED 2D face overlay.`
      : unresolvedNoteBg,
  }
}

function reviewedSash(
  field: ResolvedConstructionField,
  assigned: AssignedProfileDimensionalReadModel | null,
): ReviewedSashGeometry {
  const isOperable = field.fieldType === 'operable'
  const visibleFaceMm = assigned?.visibleFace.valueMm ?? null
  const overlapMm = assigned?.sashOverlap.valueMm ?? null
  const glazingInsetMm = assigned?.glazingInset.valueMm ?? null
  const reviewed = Boolean(
    isOperable &&
    assigned &&
    assigned.visibleFace.status === 'human-confirmed' &&
    assigned.sashOverlap.status === 'human-confirmed' &&
    assigned.glazingInset.status === 'human-confirmed' &&
    visibleFaceMm !== null &&
    overlapMm !== null &&
    glazingInsetMm !== null,
  )

  return {
    fieldId: field.id,
    profileCode: assigned?.profileCode ?? null,
    visibleFaceMm: reviewed ? visibleFaceMm : null,
    overlapMm: reviewed ? overlapMm : null,
    glazingInsetMm: reviewed ? glazingInsetMm : null,
    reviewed,
    noteBg: !isOperable
      ? 'FIX поле — sash geometry не се изисква.'
      : reviewed
        ? 'Sash face + overlap + glazing inset са human-confirmed; REVIEWED 2D sash geometry е разрешена.'
        : 'UNRESOLVED — крилото остава schematic, докато visible face + overlap + glazing inset не са human-confirmed.',
  }
}

export function buildProfileAwareGeometryReadModel(args: {
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  dividers: readonly ResolvedConstructionDivider[]
  fields: readonly ResolvedConstructionField[]
  angledDividerCount?: number
}): ProfileAwareGeometryReadModel {
  const { system, resolution, dividers, fields, angledDividerCount = 0 } = args

  const frameAssigned = getAssignedProfileDimensionalReadModel(system, resolution.frame)
  const frame = reviewedFace(
    frameAssigned,
    'UNRESOLVED — касата остава schematic, докато избраният frame profile няма human-confirmed visible face.',
  )

  const dividerEntries = dividers.map((divider) => {
    const assigned = getAssignedProfileDimensionalReadModel(system, resolution.dividers[divider.id])
    return [
      divider.id,
      reviewedFace(
        assigned,
        'UNRESOLVED — делителят остава schematic, докато избраният mullion profile няма human-confirmed visible face.',
      ),
    ] as const
  })
  const dividerFaces = Object.fromEntries(dividerEntries)

  const sashEntries = fields.map((field) => {
    const assigned = getAssignedProfileDimensionalReadModel(system, resolution.fieldSashes[field.id])
    return [field.id, reviewedSash(field, assigned)] as const
  })
  const sashes = Object.fromEntries(sashEntries)

  const reviewedFaceCount = Number(frame.reviewed) + Object.values(dividerFaces).filter((item) => item.reviewed).length
  // Angled-divider reviewed face reconstruction is intentionally deferred.
  // Counting those elements as required prevents a false COMPLETE state.
  const requiredFaceCount = 1 + dividers.length + angledDividerCount
  const operableFields = fields.filter((field) => field.fieldType === 'operable')
  const sashReviewedCount = operableFields.filter((field) => sashes[field.id]?.reviewed).length
  const sashRequiredCount = operableFields.length
  const partialReviewedGeometry = reviewedFaceCount > 0 || sashReviewedCount > 0
  const completeReviewedGeometry = (
    reviewedFaceCount === requiredFaceCount &&
    sashReviewedCount === sashRequiredCount
  )

  return {
    version: PROFILE_AWARE_GEOMETRY_VERSION,
    frame,
    dividers: dividerFaces,
    sashes,
    reviewedFaceCount,
    requiredFaceCount,
    sashReviewedCount,
    sashRequiredCount,
    partialReviewedGeometry,
    completeReviewedGeometry,
    topologyAuthoritative: true,
    machineReady: false,
  }
}
