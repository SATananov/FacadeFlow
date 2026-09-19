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
  /** Joint overlap is UNKNOWN until a real assembly rule or section proves it. */
  sashOverlapMm: number | null
  /** Exact profile placement relative to the support reference line. */
  sashInsetMm: number | null
  /** Exact glazing placement within the sash. */
  glazingInsetMm: number | null
  noteBg: string
}

/**
 * CATALOG TRUTH RESET 01 — PRELUDE 60.
 *
 * The official KMG PRELUDE 60 catalogue proves raw component callouts only:
 * - frame 482.30: 60 / 64 / 42 mm
 * - sash 482.05: 60 / 78 / 56 mm
 * - sash 482.18: 60 / 78 / 56 mm
 * - mullion 482.21: 60 / 84 / 40 mm
 * - glass bead 482.15: 16.5 / 28.5 / 22 mm and stated glass 24 mm
 *
 * It does NOT define 22 mm as frame-sash or mullion-sash overlap.
 * Arithmetic differences between component callouts are not assembly evidence.
 * Therefore all PRELUDE 60 sash overlap / inset / glazing inset values remain UNKNOWN.
 */
export const PRELUDE_60_CATALOG_TRUTH_RESET_01 = {
  frame48230CalloutsMm: [60, 64, 42] as const,
  sash48205CalloutsMm: [60, 78, 56] as const,
  sash48218CalloutsMm: [60, 78, 56] as const,
  mullion48221CalloutsMm: [60, 84, 40] as const,
  glassBead48215CalloutsMm: [16.5, 28.5, 22] as const,
  glassBead48215StatedGlassMm: 24,
  frameSashOverlapMm: null,
  mullionSashOverlapMm: null,
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
    supportRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01.frame48230CalloutsMm,
    sashRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01.sash48205CalloutsMm,
    componentEvidence: [
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.30 frame' },
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.05 sash' },
    ],
    assemblyEvidence: { documentTitle: 'Altest PRELUDE 60 · актуален системен каталог', page: 23, section: 'Sectional drawings · 482.30 + 482.05 + 482.15 · 24 mm' },
    assemblyEvidenceStatus: 'sectional-drawing-uninterpreted',
    sashOverlapMm: null,
    sashInsetMm: null,
    glazingInsetMm: null,
    noteBg: 'Каса 482.30 + крило 482.05: актуалната секционна скица на стр. 23 потвърждава самата двойка и 24 mm остъкляване с 482.15. Точни производствени overlap / inset / glass cut стойности не се създават.',
  },
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'mullion-sash',
    supportProfileCode: '482.21',
    supportRole: 'mullion',
    sashProfileCode: '482.18',
    sashRole: 'sash',
    supportRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01.mullion48221CalloutsMm,
    sashRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01.sash48218CalloutsMm,
    componentEvidence: [
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.21 mullion' },
      { documentTitle: 'KMG PVC Profiles Systems', page: 2, section: 'Main profiles · 482.18 sash' },
    ],
    assemblyEvidence: { documentTitle: 'Altest PRELUDE 60 · актуален системен каталог', page: 25, section: 'Sectional drawings · 482.21 + 482.18 + 482.15 · 24 mm' },
    assemblyEvidenceStatus: 'sectional-drawing-uninterpreted',
    sashOverlapMm: null,
    sashInsetMm: null,
    glazingInsetMm: null,
    noteBg: 'Делител 482.21 + крило 482.18: актуалната секционна скица на стр. 25 потвърждава тази двойка, 24 mm остъкляване и 482.15. 482.21 + 482.05 не се приема за каталожно потвърдена двойка. Точни производствени overlap / inset / glass cut стойности остават неизвестни.',
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
