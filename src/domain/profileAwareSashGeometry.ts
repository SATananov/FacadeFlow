import type { ProfileSystemCatalogEntry } from '../data/profileSystems'
import type {
  ConstructionFrame,
  ResolvedConstructionDivider,
  ResolvedConstructionField,
} from './construction'
import type { ProfileJointGeometryReadModel, ProfileJointBoundaryReadModel } from './profileJointGeometry'
import type { ModuleProfileResolution } from './profileResolution'
import { getAssignedProfileDimensionalReadModel } from './profileDimensionalSemantics'

export const PROFILE_AWARE_SASH_GEOMETRY_VERSION = 'profile-aware-sash-geometry-01' as const

export type SashGeometryRectMm = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

export type ReviewedSashPlacementStatus =
  | 'reviewed-front-elevation'
  | 'not-required'
  | 'unsupported-topology'
  | 'missing-reviewed-overlap'
  | 'missing-reviewed-face'
  | 'unresolved-support-face'
  | 'invalid-geometry'

export type ReviewedSashPlacementReadModel = {
  fieldId: string
  sequence: number
  profileCode: string | null
  status: ReviewedSashPlacementStatus
  placementReady: boolean
  sashVisibleFaceMm: number | null
  overlapByEdgeMm: Record<'left' | 'right' | 'top' | 'bottom', number | null>
  outerBoundsMm: SashGeometryRectMm | null
  innerProfileBoundsMm: SashGeometryRectMm | null
  glazingInsetMm: null
  frontElevationOnly: true
  mutatesConstructionGeometry: false
  machineReady: false
  noteBg: string
}

export type ProfileAwareSashGeometryReadModel = {
  version: typeof PROFILE_AWARE_SASH_GEOMETRY_VERSION
  systemId: string
  fields: Record<string, ReviewedSashPlacementReadModel>
  reviewedPlacementCount: number
  requiredPlacementCount: number
  frontElevationOnly: true
  mutatesConstructionGeometry: false
  machineReady: false
}

const EDGES = ['left', 'right', 'top', 'bottom'] as const

type Edge = (typeof EDGES)[number]

function emptyPlacement(
  field: ResolvedConstructionField,
  status: ReviewedSashPlacementStatus,
  noteBg: string,
): ReviewedSashPlacementReadModel {
  return {
    fieldId: field.id,
    sequence: field.sequence,
    profileCode: null,
    status,
    placementReady: false,
    sashVisibleFaceMm: null,
    overlapByEdgeMm: { left: null, right: null, top: null, bottom: null },
    outerBoundsMm: null,
    innerProfileBoundsMm: null,
    glazingInsetMm: null,
    frontElevationOnly: true,
    mutatesConstructionGeometry: false,
    machineReady: false,
    noteBg,
  }
}

function reviewedVisibleFaceMm(
  system: ProfileSystemCatalogEntry,
  assignment: ModuleProfileResolution['frame'] | ModuleProfileResolution['dividers'][string] | ModuleProfileResolution['fieldSashes'][string] | undefined,
): number | null {
  const model = getAssignedProfileDimensionalReadModel(system, assignment)
  return model?.visibleFace.status === 'human-confirmed' && model.visibleFace.valueMm !== null
    ? model.visibleFace.valueMm
    : null
}

function boundaryCoordinateMm(args: {
  boundary: ProfileJointBoundaryReadModel
  frame: ConstructionFrame
  dividers: readonly ResolvedConstructionDivider[]
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
}): number | null {
  const { boundary, frame, dividers, system, resolution } = args

  if (boundary.supportKind === 'frame') {
    const faceMm = reviewedVisibleFaceMm(system, resolution.frame)
    if (faceMm === null) return null
    if (boundary.edge === 'left' || boundary.edge === 'top') return faceMm
    if (boundary.edge === 'right') return frame.widthMm - faceMm
    return frame.heightMm - faceMm
  }

  if (boundary.supportKind !== 'divider' || !boundary.supportId) return null
  const divider = dividers.find((item) => item.id === boundary.supportId)
  if (!divider) return null
  const faceMm = reviewedVisibleFaceMm(system, resolution.dividers[divider.id])
  if (faceMm === null) return null

  if (boundary.edge === 'left' || boundary.edge === 'right') {
    if (divider.axis !== 'vertical') return null
    const centerMm = divider.positionMm + divider.thicknessMm / 2
    return boundary.edge === 'left'
      ? centerMm + faceMm / 2
      : centerMm - faceMm / 2
  }

  if (divider.axis !== 'horizontal') return null
  const centerMm = divider.positionMm + divider.thicknessMm / 2
  return boundary.edge === 'top'
    ? centerMm + faceMm / 2
    : centerMm - faceMm / 2
}

function buildFieldPlacement(args: {
  field: ResolvedConstructionField
  frame: ConstructionFrame
  dividers: readonly ResolvedConstructionDivider[]
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  joints: ProfileJointGeometryReadModel
}): ReviewedSashPlacementReadModel {
  const { field, frame, dividers, system, resolution, joints } = args

  if (field.fieldType !== 'operable') {
    return emptyPlacement(field, 'not-required', 'FIX / UNSET поле — profile-aware sash placement не се изисква.')
  }
  if (field.polygon) {
    return emptyPlacement(field, 'unsupported-topology', 'Polygon/angled поле — reviewed front-elevation sash placement е отложена.')
  }

  const sashAssignment = resolution.fieldSashes[field.id]
  const sashProfileCode = sashAssignment?.profileCode ?? null
  const sashFaceMm = reviewedVisibleFaceMm(system, sashAssignment)
  if (!sashProfileCode || sashFaceMm === null) {
    return emptyPlacement(field, 'missing-reviewed-face', 'Липсва human-confirmed visible face за избрания sash profile.')
  }

  const jointField = joints.fields[field.id]
  if (!jointField || jointField.boundaries.length !== 4) {
    return emptyPlacement(field, 'missing-reviewed-overlap', 'Няма пълен четиристранен joint read model за това OPERABLE поле.')
  }

  const boundaryByEdge = Object.fromEntries(
    jointField.boundaries.map((boundary) => [boundary.edge, boundary]),
  ) as Partial<Record<Edge, ProfileJointBoundaryReadModel>>

  const overlapByEdgeMm: Record<Edge, number | null> = {
    left: null,
    right: null,
    top: null,
    bottom: null,
  }
  const coordinates: Partial<Record<Edge, number>> = {}

  for (const edge of EDGES) {
    const boundary = boundaryByEdge[edge]
    if (!boundary || boundary.sashOverlapMm === null || !boundary.evidenceRule) {
      return {
        ...emptyPlacement(field, 'missing-reviewed-overlap', 'Не всички четири граници имат evidence-bound reviewed sash overlap.'),
        profileCode: sashProfileCode,
      }
    }
    if (
      boundary.evidenceRule.assemblyEvidenceStatus !== 'catalogue-overlap-reviewed' &&
      boundary.evidenceRule.assemblyEvidenceStatus !== 'human-confirmed-assembly'
    ) {
      return {
        ...emptyPlacement(field, 'missing-reviewed-overlap', 'Joint evidence не е прегледано за front-elevation overlap.'),
        profileCode: sashProfileCode,
      }
    }
    overlapByEdgeMm[edge] = boundary.sashOverlapMm
    const coordinate = boundaryCoordinateMm({ boundary, frame, dividers, system, resolution })
    if (coordinate === null) {
      return {
        ...emptyPlacement(field, 'unresolved-support-face', 'Support profile няма human-confirmed visible face за позициониране на sash outer edge.'),
        profileCode: sashProfileCode,
        sashVisibleFaceMm: sashFaceMm,
        overlapByEdgeMm,
      }
    }
    coordinates[edge] = coordinate
  }

  const left = coordinates.left
  const right = coordinates.right
  const top = coordinates.top
  const bottom = coordinates.bottom
  if (left === undefined || right === undefined || top === undefined || bottom === undefined || right <= left || bottom <= top) {
    return {
      ...emptyPlacement(field, 'invalid-geometry', 'Reviewed support faces не образуват валиден правоъгълен sash outer contour.'),
      profileCode: sashProfileCode,
      sashVisibleFaceMm: sashFaceMm,
      overlapByEdgeMm,
    }
  }

  const outerBoundsMm: SashGeometryRectMm = {
    xMm: left,
    yMm: top,
    widthMm: right - left,
    heightMm: bottom - top,
  }
  const innerProfileBoundsMm: SashGeometryRectMm = {
    xMm: left + sashFaceMm,
    yMm: top + sashFaceMm,
    widthMm: right - left - sashFaceMm * 2,
    heightMm: bottom - top - sashFaceMm * 2,
  }

  if (innerProfileBoundsMm.widthMm <= 0 || innerProfileBoundsMm.heightMm <= 0) {
    return {
      ...emptyPlacement(field, 'invalid-geometry', 'Полето е твърде малко за прегледаната sash visible-face ширина.'),
      profileCode: sashProfileCode,
      sashVisibleFaceMm: sashFaceMm,
      overlapByEdgeMm,
      outerBoundsMm,
    }
  }

  return {
    fieldId: field.id,
    sequence: field.sequence,
    profileCode: sashProfileCode,
    status: 'reviewed-front-elevation',
    placementReady: true,
    sashVisibleFaceMm: sashFaceMm,
    overlapByEdgeMm,
    outerBoundsMm,
    innerProfileBoundsMm,
    glazingInsetMm: null,
    frontElevationOnly: true,
    mutatesConstructionGeometry: false,
    machineReady: false,
    noteBg: 'Sash outer contour е позициониран по human-confirmed support visible faces и evidence-bound reviewed overlap. Glazing inset / cut geometry остават UNKNOWN.',
  }
}

export function buildProfileAwareSashGeometryReadModel(args: {
  frame: ConstructionFrame
  dividers: readonly ResolvedConstructionDivider[]
  fields: readonly ResolvedConstructionField[]
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  joints: ProfileJointGeometryReadModel
}): ProfileAwareSashGeometryReadModel {
  const { frame, dividers, fields, system, resolution, joints } = args
  const entries = fields.map((field) => [
    field.id,
    buildFieldPlacement({ field, frame, dividers, system, resolution, joints }),
  ] as const)
  const fieldModels = Object.fromEntries(entries)
  const requiredPlacementCount = fields.filter((field) => field.fieldType === 'operable').length
  const reviewedPlacementCount = Object.values(fieldModels).filter((item) => item.placementReady).length

  return {
    version: PROFILE_AWARE_SASH_GEOMETRY_VERSION,
    systemId: system.id,
    fields: fieldModels,
    reviewedPlacementCount,
    requiredPlacementCount,
    frontElevationOnly: true,
    mutatesConstructionGeometry: false,
    machineReady: false,
  }
}
