import type { CatalogEvidence } from './types'

export const PRELUDE60_GLAZING_EVIDENCE_VERSION = 'prelude60-glazing-evidence-01' as const
export const PRELUDE60_GLAZING_SYSTEM_ID = 'kmg-prelude-60' as const

export type Prelude60GlazingBeadEvidence = {
  version: typeof PRELUDE60_GLAZING_EVIDENCE_VERSION
  systemId: typeof PRELUDE60_GLAZING_SYSTEM_ID
  beadCode: string
  nominalGlazingThicknessMm: number
  authority: 'CATALOGUE_STATED_GLAZING_THICKNESS_ONLY'
  baseProfileCompatibility: 'UNCONFIRMED'
  automaticSelectionAllowed: false
  glazingInsetMm: null
  glassCutAuthority: 'NONE'
  machineReady: false
  evidence: CatalogEvidence
}

const catalogueEvidence = (beadCode: string, nominalGlazingThicknessMm: number): Prelude60GlazingBeadEvidence => ({
  version: PRELUDE60_GLAZING_EVIDENCE_VERSION,
  systemId: PRELUDE60_GLAZING_SYSTEM_ID,
  beadCode,
  nominalGlazingThicknessMm,
  authority: 'CATALOGUE_STATED_GLAZING_THICKNESS_ONLY',
  baseProfileCompatibility: 'UNCONFIRMED',
  automaticSelectionAllowed: false,
  glazingInsetMm: null,
  glassCutAuthority: 'NONE',
  machineReady: false,
  evidence: {
    documentTitle: 'KMG PVC Profiles Systems',
    page: 2,
    section: 'Glass beads',
    note: 'PRELUDE 60 catalogue label only; does not prove bead-to-frame/sash compatibility or glazing geometry.',
  },
})

/**
 * Human-reviewed catalogue transcription for PRELUDE 60 page 2.
 * These records mean only: within PRELUDE 60, the catalogue labels this
 * glazing-bead code for the stated nominal glazing thickness.
 * They DO NOT prove base-profile compatibility, glazing inset, glass cut,
 * rebate/falz geometry, automatic selection, or machine readiness.
 */
export const PRELUDE60_GLAZING_BEAD_EVIDENCE: readonly Prelude60GlazingBeadEvidence[] = [
  catalogueEvidence('482.14', 4),
  catalogueEvidence('549.10', 14),
  catalogueEvidence('482.15', 24),
  catalogueEvidence('482.01', 24),
  catalogueEvidence('482.22', 32),
]

export function getPrelude60GlazingBeadEvidenceByThickness(
  glazingThicknessMm: number | null | undefined,
): readonly Prelude60GlazingBeadEvidence[] {
  if (glazingThicknessMm === null || glazingThicknessMm === undefined) return []
  return PRELUDE60_GLAZING_BEAD_EVIDENCE.filter(
    (record) => Math.abs(record.nominalGlazingThicknessMm - glazingThicknessMm) < 0.01,
  )
}

export function getPrelude60GlazingBeadEvidenceByCode(
  beadCode: string,
): Prelude60GlazingBeadEvidence | undefined {
  return PRELUDE60_GLAZING_BEAD_EVIDENCE.find((record) => record.beadCode === beadCode)
}

export const PRELUDE60_SECTIONAL_EVIDENCE_ACQUISITION_VERSION = 'evidence-acquisition-01a' as const

export type Prelude60SectionalEvidenceCandidateKind =
  | 'bead-base-compatibility'
  | 'placement-evidence'

export type Prelude60SectionalEvidenceCandidate = Readonly<{
  id: string
  version: typeof PRELUDE60_SECTIONAL_EVIDENCE_ACQUISITION_VERSION
  systemId: typeof PRELUDE60_GLAZING_SYSTEM_ID
  kind: Prelude60SectionalEvidenceCandidateKind
  baseProfileCode: string
  beadCode: string
  nominalGlazingThicknessMm: number
  sourcePublisher: 'ALTEST'
  sourceUrl: string
  sourceOpenUrl: string
  sourcePage: number
  sourcePdfViewerPage: number
  sourceSection: string
  sourceLabelBg: string
  sourceLocatorBg: string
  sourceVerifiedLocatorBg: string
  candidateSummaryBg: string
  reviewed: false
  rulePromotionAllowed: false
  automaticGeometryAllowed: false
  machineReady: false
}>

const officialPrelude60SectionSource = {
  sourcePublisher: 'ALTEST' as const,
  sourceUrl: 'https://altestgroup.com/pdf/system/40/bg.pdf',
  sourceOpenUrl: 'https://altestgroup.com/pdf/system/40/bg.pdf#page=24',
  sourcePage: 23,
  sourcePdfViewerPage: 24,
  sourceSection: 'sectional drawings · scale 1:1',
  sourceLabelBg: 'ALTEST · официален технически PDF · /series 60mm/ · отпечатана стр. 23',
  sourceLocatorBg: '482.30 · 482.05 · 482.15 · 24 mm',
  sourceVerifiedLocatorBg: 'Отпечатана стр. 23 · PDF viewer 24/106 · sectional drawings · секции 1–2',
}

/**
 * EVIDENCE ACQUISITION 01A
 *
 * Public, source-bound reference candidates discovered in ALTEST's official
 * technical PDF. The verified source location is printed page 23, which
 * opens as PDF viewer page 24/106. It is explicitly labelled
 * "sectional drawings" / "scale 1:1"; sections 1–2 name 482.30, 482.05 and
 * 482.15 in the same dimensioned 24 mm glazing context.
 *
 * IMPORTANT locator rule: sourceUrl/sourcePage/sourceSection/sourceLocatorBg
 * remain the evidence-binding identity captured by EA01A. sourceOpenUrl,
 * sourcePdfViewerPage and sourceVerifiedLocatorBg are display/navigation
 * metadata only so existing R1 human confirmations remain bound to the same
 * evidence record.
 *
 * IMPORTANT: these are candidates for human review only. Their existence does
 * NOT promote a reviewed compatibility/placement rule and does not unlock
 * automatic glazing geometry or machine output.
 */
export const PRELUDE60_SECTIONAL_EVIDENCE_CANDIDATES: readonly Prelude60SectionalEvidenceCandidate[] = [
  {
    id: 'altest-prelude60-p23-48205-48215-bead-base-candidate-01',
    version: PRELUDE60_SECTIONAL_EVIDENCE_ACQUISITION_VERSION,
    systemId: PRELUDE60_GLAZING_SYSTEM_ID,
    kind: 'bead-base-compatibility',
    baseProfileCode: '482.05',
    beadCode: '482.15',
    nominalGlazingThicknessMm: 24,
    ...officialPrelude60SectionSource,
    candidateSummaryBg: 'Официалната ALTEST техническа скица на отпечатана стр. 23 (PDF viewer 24/106, секции 1–2) показва 482.30 + 482.05 + 482.15 в една размерена секция за 24 mm glazing. Това е силен source-bound кандидат за 482.15 ↔ 482.05, но остава за human review.',
    reviewed: false,
    rulePromotionAllowed: false,
    automaticGeometryAllowed: false,
    machineReady: false,
  },
  {
    id: 'altest-prelude60-p23-48205-48215-placement-candidate-01',
    version: PRELUDE60_SECTIONAL_EVIDENCE_ACQUISITION_VERSION,
    systemId: PRELUDE60_GLAZING_SYSTEM_ID,
    kind: 'placement-evidence',
    baseProfileCode: '482.05',
    beadCode: '482.15',
    nominalGlazingThicknessMm: 24,
    ...officialPrelude60SectionSource,
    candidateSummaryBg: 'Отпечатана стр. 23 (PDF viewer 24/106, секции 1–2) е размерена техническа скица (sectional drawing, scale 1:1) и показва относителната позиция на 482.15 спрямо 482.05 при 24 mm glazing. Позицията е само candidate evidence до отделен human review на размерната база и обхвата.',
    reviewed: false,
    rulePromotionAllowed: false,
    automaticGeometryAllowed: false,
    machineReady: false,
  },
]

export function findPrelude60SectionalEvidenceCandidate(args: {
  systemId: string
  kind: Prelude60SectionalEvidenceCandidateKind
  baseProfileCode: string | null | undefined
  beadCode: string | null | undefined
  glazingThicknessMm: number | null | undefined
}): Prelude60SectionalEvidenceCandidate | undefined {
  if (args.systemId !== PRELUDE60_GLAZING_SYSTEM_ID) return undefined
  if (!args.baseProfileCode || !args.beadCode || args.glazingThicknessMm === null || args.glazingThicknessMm === undefined) return undefined
  return PRELUDE60_SECTIONAL_EVIDENCE_CANDIDATES.find((candidate) =>
    candidate.kind === args.kind
    && candidate.baseProfileCode === args.baseProfileCode
    && candidate.beadCode === args.beadCode
    && Math.abs(candidate.nominalGlazingThicknessMm - args.glazingThicknessMm!) < 0.01,
  )
}
