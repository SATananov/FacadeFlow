import {
  getProfileJointEvidenceRule,
  type ProfileJointEvidenceRule,
  type ProfileJointKind,
  type ProfileSystemCatalogEntry,
} from '../data/profileSystems'
import type {
  ConstructionFrame,
  ResolvedConstructionDivider,
  ResolvedConstructionField,
} from './construction'
import type { ModuleProfileResolution } from './profileResolution'

export const PROFILE_JOINT_GEOMETRY_VERSION = 'profile-aware-joint-geometry-01' as const

export type ProfileJointEdge = 'left' | 'right' | 'top' | 'bottom'
export type ProfileJointSupportKind = 'frame' | 'divider'
export type ProfileJointResolutionStatus =
  | 'resolved'
  | 'assembly-evidence-required'
  | 'missing-profile-assignment'
  | 'unsupported-pair'
  | 'unresolved-adjacency'
  | 'unsupported-topology'

export type ProfileJointBoundaryReadModel = {
  fieldId: string
  edge: ProfileJointEdge
  supportKind: ProfileJointSupportKind | null
  supportId: string | null
  jointKind: ProfileJointKind | null
  supportProfileCode: string | null
  sashProfileCode: string | null
  status: ProfileJointResolutionStatus
  sashOverlapMm: number | null
  sashInsetMm: number | null
  glazingInsetMm: number | null
  evidenceRule: ProfileJointEvidenceRule | null
  noteBg: string
}

export type ProfileJointFieldReadModel = {
  fieldId: string
  sequence: number
  fieldType: ResolvedConstructionField['fieldType']
  boundaries: readonly ProfileJointBoundaryReadModel[]
  resolvedJointCount: number
  requiredJointCount: number
  geometryReady: boolean
}

export type ProfileJointGeometryReadModel = {
  version: typeof PROFILE_JOINT_GEOMETRY_VERSION
  systemId: string
  fields: Record<string, ProfileJointFieldReadModel>
  resolvedJointCount: number
  requiredJointCount: number
  recognizedPairCount: number
  assemblyEvidenceRequiredCount: number
  reviewedOverlapCount: number
  geometryReady: boolean
  topologyAuthoritative: true
  mutatesConstructionGeometry: false
  machineReady: false
}

type BoundarySupport = {
  kind: ProfileJointSupportKind
  id: string
}

const EPSILON_MM = 0.05
const near = (a: number, b: number) => Math.abs(a - b) <= EPSILON_MM

function supportForEdge(args: {
  frame: ConstructionFrame
  frameFaceMm: number
  field: ResolvedConstructionField
  dividers: readonly ResolvedConstructionDivider[]
  edge: ProfileJointEdge
}): BoundarySupport | null {
  const { frame, frameFaceMm, field, dividers, edge } = args
  const left = field.bounds.xMm
  const right = field.bounds.xMm + field.bounds.widthMm
  const top = field.bounds.yMm
  const bottom = field.bounds.yMm + field.bounds.heightMm
  const frameLeft = frameFaceMm
  const frameRight = frame.widthMm - frameFaceMm
  const frameTop = frameFaceMm
  const frameBottom = frame.heightMm - frameFaceMm

  // A local divider must cover the whole edge, not just share its coordinate.
  // Multiple covering candidates are ambiguous and must fail closed.
  const uniqueSupport = (candidates: readonly ResolvedConstructionDivider[]): BoundarySupport | null =>
    candidates.length === 1 ? { kind: 'divider', id: candidates[0].id } : null
  const coversSpan = (divider: ResolvedConstructionDivider, start: number, end: number) =>
    divider.startMm <= start + EPSILON_MM && divider.endMm >= end - EPSILON_MM

  if (edge === 'left') {
    if (near(left, frameLeft)) return { kind: 'frame', id: 'frame' }
    return uniqueSupport(dividers.filter((item) =>
      item.axis === 'vertical' && near(left, item.positionMm + item.thicknessMm) && coversSpan(item, top, bottom),
    ))
  }

  if (edge === 'right') {
    if (near(right, frameRight)) return { kind: 'frame', id: 'frame' }
    return uniqueSupport(dividers.filter((item) =>
      item.axis === 'vertical' && near(right, item.positionMm) && coversSpan(item, top, bottom),
    ))
  }

  if (edge === 'top') {
    if (near(top, frameTop)) return { kind: 'frame', id: 'frame' }
    return uniqueSupport(dividers.filter((item) =>
      item.axis === 'horizontal' && near(top, item.positionMm + item.thicknessMm) && coversSpan(item, left, right),
    ))
  }

  if (near(bottom, frameBottom)) return { kind: 'frame', id: 'frame' }
  return uniqueSupport(dividers.filter((item) =>
    item.axis === 'horizontal' && near(bottom, item.positionMm) && coversSpan(item, left, right),
  ))
}

function unresolvedBoundary(
  fieldId: string,
  edge: ProfileJointEdge,
  status: ProfileJointResolutionStatus,
  noteBg: string,
): ProfileJointBoundaryReadModel {
  return {
    fieldId,
    edge,
    supportKind: null,
    supportId: null,
    jointKind: null,
    supportProfileCode: null,
    sashProfileCode: null,
    status,
    sashOverlapMm: null,
    sashInsetMm: null,
    glazingInsetMm: null,
    evidenceRule: null,
    noteBg,
  }
}

function resolveBoundary(args: {
  field: ResolvedConstructionField
  edge: ProfileJointEdge
  support: BoundarySupport | null
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
}): ProfileJointBoundaryReadModel {
  const { field, edge, support, system, resolution } = args
  const sashProfileCode = resolution.fieldSashes[field.id]?.profileCode ?? null

  if (!support) {
    return unresolvedBoundary(
      field.id,
      edge,
      'unresolved-adjacency',
      'Границата на ПОЛЕТО не може да бъде свързана еднозначно с каса или нормален делител.',
    )
  }

  const supportProfileCode = support.kind === 'frame'
    ? resolution.frame?.profileCode ?? null
    : resolution.dividers[support.id]?.profileCode ?? null
  const jointKind: ProfileJointKind = support.kind === 'frame' ? 'frame-sash' : 'mullion-sash'

  if (!sashProfileCode || !supportProfileCode) {
    return {
      fieldId: field.id,
      edge,
      supportKind: support.kind,
      supportId: support.id,
      jointKind,
      supportProfileCode,
      sashProfileCode,
      status: 'missing-profile-assignment',
      sashOverlapMm: null,
      sashInsetMm: null,
      glazingInsetMm: null,
      evidenceRule: null,
      noteBg: !sashProfileCode
        ? 'Липсва присвоен профил на крилото.'
        : `Липсва присвоен профил на ${support.kind === 'frame' ? 'касата' : 'делителя'}.`,
    }
  }

  const evidenceRule = getProfileJointEvidenceRule({
    systemId: system.id,
    jointKind,
    supportProfileCode,
    sashProfileCode,
  }) ?? null

  if (!evidenceRule) {
    return {
      fieldId: field.id,
      edge,
      supportKind: support.kind,
      supportId: support.id,
      jointKind,
      supportProfileCode,
      sashProfileCode,
      status: 'unsupported-pair',
      sashOverlapMm: null,
      sashInsetMm: null,
      glazingInsetMm: null,
      evidenceRule: null,
      noteBg: 'Няма evidence-bound правило за тази комбинация от профили. FacadeFlow не предполага съвместимост или overlap.',
    }
  }

  const resolved = (
    evidenceRule.assemblyEvidenceStatus === 'human-confirmed-assembly' &&
    evidenceRule.sashOverlapMm !== null &&
    evidenceRule.sashInsetMm !== null &&
    evidenceRule.glazingInsetMm !== null
  )

  return {
    fieldId: field.id,
    edge,
    supportKind: support.kind,
    supportId: support.id,
    jointKind,
    supportProfileCode,
    sashProfileCode,
    status: resolved ? 'resolved' : 'assembly-evidence-required',
    sashOverlapMm: evidenceRule.sashOverlapMm,
    sashInsetMm: evidenceRule.sashInsetMm,
    glazingInsetMm: evidenceRule.glazingInsetMm,
    evidenceRule,
    noteBg: resolved
      ? 'Сглобеният възел има human-confirmed assembly semantics.'
      : evidenceRule.noteBg,
  }
}

export function buildProfileJointGeometryReadModel(args: {
  frame: ConstructionFrame
  frameFaceMm: number
  dividers: readonly ResolvedConstructionDivider[]
  fields: readonly ResolvedConstructionField[]
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
}): ProfileJointGeometryReadModel {
  const { frame, frameFaceMm, dividers, fields, system, resolution } = args
  const edges: readonly ProfileJointEdge[] = ['left', 'right', 'top', 'bottom']

  const fieldEntries = fields.map((field) => {
    if (field.fieldType !== 'operable') {
      const readModel: ProfileJointFieldReadModel = {
        fieldId: field.id,
        sequence: field.sequence,
        fieldType: field.fieldType,
        boundaries: [],
        resolvedJointCount: 0,
        requiredJointCount: 0,
        geometryReady: true,
      }
      return [field.id, readModel] as const
    }

    if (field.polygon) {
      const boundary = unresolvedBoundary(
        field.id,
        'left',
        'unsupported-topology',
        'Polygon/angled ПОЛЕ: joint-edge reconstruction е отложена; не се измисля правоъгълна геометрия.',
      )
      const readModel: ProfileJointFieldReadModel = {
        fieldId: field.id,
        sequence: field.sequence,
        fieldType: field.fieldType,
        boundaries: [boundary],
        resolvedJointCount: 0,
        requiredJointCount: 1,
        geometryReady: false,
      }
      return [field.id, readModel] as const
    }

    const boundaries = edges.map((edge) => resolveBoundary({
      field,
      edge,
      support: supportForEdge({ frame, frameFaceMm, field, dividers, edge }),
      system,
      resolution,
    }))
    const resolvedJointCount = boundaries.filter((item) => item.status === 'resolved').length
    const readModel: ProfileJointFieldReadModel = {
      fieldId: field.id,
      sequence: field.sequence,
      fieldType: field.fieldType,
      boundaries,
      resolvedJointCount,
      requiredJointCount: boundaries.length,
      geometryReady: resolvedJointCount === boundaries.length,
    }
    return [field.id, readModel] as const
  })

  const fieldReadModels = Object.fromEntries(fieldEntries)
  const allBoundaries = Object.values(fieldReadModels).flatMap((field) => field.boundaries)
  const requiredJointCount = allBoundaries.length
  const resolvedJointCount = allBoundaries.filter((item) => item.status === 'resolved').length
  const recognizedPairCount = allBoundaries.filter((item) => item.evidenceRule !== null).length
  const assemblyEvidenceRequiredCount = allBoundaries.filter(
    (item) => item.status === 'assembly-evidence-required',
  ).length
  const reviewedOverlapCount = allBoundaries.filter((item) => item.sashOverlapMm !== null).length

  return {
    version: PROFILE_JOINT_GEOMETRY_VERSION,
    systemId: system.id,
    fields: fieldReadModels,
    resolvedJointCount,
    requiredJointCount,
    recognizedPairCount,
    assemblyEvidenceRequiredCount,
    reviewedOverlapCount,
    geometryReady: requiredJointCount === 0 || resolvedJointCount === requiredJointCount,
    topologyAuthoritative: true,
    mutatesConstructionGeometry: false,
    machineReady: false,
  }
}
