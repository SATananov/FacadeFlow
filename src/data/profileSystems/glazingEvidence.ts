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
