import type { CatalogEvidence, ProfileRole } from './types'

export type ProfileJointKind = 'frame-sash' | 'mullion-sash'
export type ProfileJointEvidenceStatus =
  | 'component-cross-sections-only'
  | 'sectional-drawing-uninterpreted'
  | 'catalogue-overlap-reviewed'
  | 'human-confirmed-assembly'

export type ProfileJointEvidenceRule = {
  systemId: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  supportRole: Extract<ProfileRole, 'frame' | 'mullion'>
  sashProfileCode: string
  sashRole: Extract<ProfileRole, 'sash' | 'door-sash'>
  supportRawCalloutsMm: readonly number[]
  sashRawCalloutsMm: readonly number[]
  componentEvidence: readonly CatalogEvidence[]
  assemblyEvidence?: CatalogEvidence
  assemblyEvidenceStatus: ProfileJointEvidenceStatus
  /** Reviewed front-elevation overlap may be known before the full joint inset is known. */
  sashOverlapMm: number | null
  /** Exact profile placement relative to the support reference line. */
  sashInsetMm: number | null
  /** Exact glazing placement within the sash. */
  glazingInsetMm: number | null
  noteBg: string
}

/**
 * PROFILE-AWARE JOINT GEOMETRY 01A — PRELUDE 60 reviewed overlap evidence.
 *
 * The current KMG /series 60mm/ catalogue and the already reviewed PRELUDE
 * visible-face semantics agree on the same 22 mm side zone:
 *
 * - frame 482.30: 64 - 42 = 22 mm
 * - sash 482.05: 78 - 56 = 22 mm
 * - mullion 482.21: (84 - 40) / 2 = 22 mm per side
 *
 * This is accepted here only as the front-elevation sash/support overlap.
 * It does NOT establish the exact sash reference-line inset, glazing inset,
 * cut deduction, tolerance, reinforcement, hardware, or machine geometry.
 */
export const PRELUDE_60_REVIEWED_SASH_OVERLAP = {
  frameOverallFaceMm: 64,
  frameVisibleFaceMm: 42,
  frameCoveredZoneMm: 22,
  sashOverallFaceMm: 78,
  sashVisibleFaceMm: 56,
  sashOverlapZoneMm: 22,
  mullionOverallFaceMm: 84,
  mullionVisibleCenterMm: 40,
  mullionSideZoneMm: 22,
  overlapMm: 22,
  evidenceStatus: 'catalogue-overlap-reviewed' as const,
  productionGeometryApproved: false as const,
  machineReady: false as const,
}

export const profileJointEvidenceRules: readonly ProfileJointEvidenceRule[] = [
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'frame-sash',
    supportProfileCode: '482.30',
    supportRole: 'frame',
    sashProfileCode: '482.05',
    sashRole: 'sash',
    supportRawCalloutsMm: [60, 64, 42],
    sashRawCalloutsMm: [60, 78, 56],
    componentEvidence: [
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.30 frame' },
      { documentTitle: 'KMG /series 60mm/', page: 1, section: 'Main profiles · 482.05 sash · 78 / 56 reviewed face semantics' },
    ],
    assemblyEvidence: {
      documentTitle: 'PRELUDE 60 reviewed face semantics',
      page: 2,
      section: '482.30 frame 64/42 + 482.05 sash 78/56 -> common 22 mm overlap zone',
      note: '22 mm is accepted for front-elevation overlap only. Exact sash inset and glazing inset remain unresolved.',
    },
    assemblyEvidenceStatus: 'catalogue-overlap-reviewed',
    sashOverlapMm: PRELUDE_60_REVIEWED_SASH_OVERLAP.overlapMm,
    sashInsetMm: null,
    glazingInsetMm: null,
    noteBg: 'Каса 482.30 + крило 482.05: застъпването 22 mm е потвърдено от съвпадащи каталогови лицеви зони; точните inset и glazing inset още не са потвърдени.',
  },
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'mullion-sash',
    supportProfileCode: '482.21',
    supportRole: 'mullion',
    sashProfileCode: '482.05',
    sashRole: 'sash',
    supportRawCalloutsMm: [60, 84, 40],
    sashRawCalloutsMm: [60, 78, 56],
    componentEvidence: [
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.21 mullion' },
      { documentTitle: 'KMG /series 60mm/', page: 1, section: 'Main profiles · 482.05 sash · 78 / 56 reviewed face semantics' },
    ],
    assemblyEvidence: {
      documentTitle: 'PRELUDE 60 reviewed face semantics',
      page: 2,
      section: '482.21 mullion 84/40 -> 22 mm side zone + 482.05 sash 78/56 -> 22 mm overlap zone',
      note: 'Each mullion side contributes one reviewed 22 mm sash overlap zone. Exact sash inset and glazing inset remain unresolved.',
    },
    assemblyEvidenceStatus: 'catalogue-overlap-reviewed',
    sashOverlapMm: PRELUDE_60_REVIEWED_SASH_OVERLAP.overlapMm,
    sashInsetMm: null,
    glazingInsetMm: null,
    noteBg: 'Делител 482.21 + крило 482.05: застъпването 22 mm на страна е потвърдено от каталоговите лицеви зони; точните inset и glazing inset още не са потвърдени.',
  },
]

export function getProfileJointEvidenceRule(args: {
  systemId: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  sashProfileCode: string
}): ProfileJointEvidenceRule | undefined {
  return profileJointEvidenceRules.find((rule) =>
    rule.systemId === args.systemId &&
    rule.jointKind === args.jointKind &&
    rule.supportProfileCode === args.supportProfileCode &&
    rule.sashProfileCode === args.sashProfileCode,
  )
}
