import type { CatalogEvidence } from './types'
import type { ProfileJointKind } from './jointSemantics'

export type JointEvidenceReviewStatus = 'missing' | 'candidate' | 'reviewed'
export type JointSourceMappingStatus = 'unmapped' | 'visual-reference-only' | 'exact-profile-pair'

export type JointPointMm = Readonly<{
  xMm: number
  yMm: number
}>

export type JointContactSegmentMm = Readonly<{
  id: string
  supportStartMm: JointPointMm
  supportEndMm: JointPointMm
  sashStartMm: JointPointMm
  sashEndMm: JointPointMm
  noteBg?: string
}>

export type JointPlacementTransformMm = Readonly<{
  xMm: number
  yMm: number
  rotationDeg: number
}>

export type JointAssemblyEvidenceRecord = Readonly<{
  id: string
  systemId: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  sashProfileCode: string
  reviewStatus: JointEvidenceReviewStatus
  sourceMappingStatus: JointSourceMappingStatus
  assemblySources: readonly CatalogEvidence[]
  visualReferenceLabel: string | null
  contactSegmentsMm: readonly JointContactSegmentMm[]
  placementTransformMm: JointPlacementTransformMm | null
  sectionOrientation: 'vertical' | 'horizontal' | null
  reviewedBy: string | null
  reviewedAtIso: string | null
  noteBg: string
}>

/**
 * JOINT EVIDENCE MODEL 01
 *
 * This registry is the only place where an exact assembly relationship may be
 * promoted from UNKNOWN to REVIEWED. A visual reference, arithmetic relation,
 * raster fit, or component catalogue page is not enough to unlock geometry.
 *
 * To unlock a joint, the record must contain:
 * - an exact source mapped to the exact profile pair;
 * - at least one reviewed contact segment in local mm coordinates;
 * - a reviewed X/Y/rotation transform in mm/deg;
 * - human review metadata.
 */
export const jointAssemblyEvidenceRecords: readonly JointAssemblyEvidenceRecord[] = [
  {
    id: 'kmg-prelude60-frame48230-sash48205-01',
    systemId: 'kmg-prelude-60',
    jointKind: 'frame-sash',
    supportProfileCode: '482.30',
    sashProfileCode: '482.05',
    reviewStatus: 'missing',
    sourceMappingStatus: 'visual-reference-only',
    assemblySources: [],
    visualReferenceLabel: 'KMG window-node visual reference currently shown in Assembly Review',
    contactSegmentsMm: [],
    placementTransformMm: null,
    sectionOrientation: 'vertical',
    reviewedBy: null,
    reviewedAtIso: null,
    noteBg: 'Има визуален KMG референтен възел, но няма доказано съпоставяне на този възел точно към 482.30 ↔ 482.05, няма проверени контактни сегменти и няма проверен X/Y/rotation transform. Възелът остава LOCKED.',
  },
]

export function getJointAssemblyEvidenceRecord(args: {
  systemId: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  sashProfileCode: string
}): JointAssemblyEvidenceRecord | undefined {
  return jointAssemblyEvidenceRecords.find((record) =>
    record.systemId === args.systemId &&
    record.jointKind === args.jointKind &&
    record.supportProfileCode === args.supportProfileCode &&
    record.sashProfileCode === args.sashProfileCode,
  )
}

export function isJointAssemblyEvidenceReviewed(record: JointAssemblyEvidenceRecord | undefined): boolean {
  if (!record) return false
  return (
    record.reviewStatus === 'reviewed' &&
    record.sourceMappingStatus === 'exact-profile-pair' &&
    record.assemblySources.length > 0 &&
    record.contactSegmentsMm.length > 0 &&
    record.placementTransformMm !== null &&
    record.reviewedBy !== null &&
    record.reviewedAtIso !== null
  )
}
