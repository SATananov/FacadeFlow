import {
  PRELUDE60_GLAZING_SYSTEM_ID,
  getPrelude60GlazingBeadEvidenceByThickness,
  type Prelude60GlazingBeadEvidence,
} from '../data/profileSystems/glazingEvidence'
import type {
  GlazingBeadDefinition,
  ProfileSystemCatalogEntry,
} from '../data/profileSystems/types'

export const GLAZING_EVIDENCE_VERSION = 'glazing-evidence-01' as const

export type GlazingEvidenceCandidate = {
  systemId: string
  beadCode: string
  nominalGlazingThicknessMm: number
  catalogueBead: GlazingBeadDefinition
  evidence: Prelude60GlazingBeadEvidence['evidence']
  authority: 'CATALOGUE_STATED_GLAZING_THICKNESS_ONLY'
  compatibilityStatus: 'UNCONFIRMED'
  automaticSelectionAllowed: false
  glazingInsetMm: null
  glassCutAuthority: 'NONE'
  mutatesConstructionGeometry: false
  machineReady: false
}

export type GlazingEvidenceResolution = {
  version: typeof GLAZING_EVIDENCE_VERSION
  status:
    | 'CATALOGUE_CANDIDATES'
    | 'GLAZING_THICKNESS_MISSING'
    | 'NO_CATALOGUE_CANDIDATE'
    | 'UNSUPPORTED_SYSTEM'
    | 'CATALOGUE_INTEGRITY_MISMATCH'
  systemId: string
  glazingThicknessMm: number | null
  candidates: readonly GlazingEvidenceCandidate[]
  automaticSelectionAllowed: false
  exactGlazingInsetKnown: false
  glassCutKnown: false
  mutatesConstructionGeometry: false
  machineReady: false
}

function result(
  systemId: string,
  glazingThicknessMm: number | null,
  status: GlazingEvidenceResolution['status'],
  candidates: readonly GlazingEvidenceCandidate[] = [],
): GlazingEvidenceResolution {
  return {
    version: GLAZING_EVIDENCE_VERSION,
    status,
    systemId,
    glazingThicknessMm,
    candidates,
    automaticSelectionAllowed: false,
    exactGlazingInsetKnown: false,
    glassCutKnown: false,
    mutatesConstructionGeometry: false,
    machineReady: false,
  }
}

function catalogueEntryMatchesEvidence(
  bead: GlazingBeadDefinition,
  record: Prelude60GlazingBeadEvidence,
): boolean {
  return bead.code === record.beadCode &&
    Math.abs(bead.statedGlassMm - record.nominalGlazingThicknessMm) < 0.01 &&
    bead.evidence.documentTitle === record.evidence.documentTitle &&
    bead.evidence.page === record.evidence.page &&
    bead.evidence.section === record.evidence.section
}

/**
 * Resolves evidence-backed glazing-bead CANDIDATES only.
 * The selected system is part of the evidence key: a reused bead code in
 * PRESTIGE 70 must never inherit PRELUDE 60 thickness semantics.
 */
export function resolveGlazingEvidenceContext(
  system: ProfileSystemCatalogEntry,
  glazingThicknessMm: number | null | undefined,
): GlazingEvidenceResolution {
  const normalizedThickness = glazingThicknessMm ?? null

  if (system.id !== PRELUDE60_GLAZING_SYSTEM_ID) {
    return result(system.id, normalizedThickness, 'UNSUPPORTED_SYSTEM')
  }

  if (normalizedThickness === null) {
    return result(system.id, null, 'GLAZING_THICKNESS_MISSING')
  }

  const records = getPrelude60GlazingBeadEvidenceByThickness(normalizedThickness)
  if (records.length === 0) {
    return result(system.id, normalizedThickness, 'NO_CATALOGUE_CANDIDATE')
  }

  const candidates = records.flatMap((record) => {
    const bead = system.glassBeads.find((candidate) => candidate.code === record.beadCode)
    if (!bead || !catalogueEntryMatchesEvidence(bead, record)) return []
    return [{
      systemId: system.id,
      beadCode: record.beadCode,
      nominalGlazingThicknessMm: record.nominalGlazingThicknessMm,
      catalogueBead: bead,
      evidence: record.evidence,
      authority: record.authority,
      compatibilityStatus: 'UNCONFIRMED' as const,
      automaticSelectionAllowed: false as const,
      glazingInsetMm: null,
      glassCutAuthority: 'NONE' as const,
      mutatesConstructionGeometry: false as const,
      machineReady: false as const,
    }]
  })

  if (candidates.length !== records.length) {
    return result(system.id, normalizedThickness, 'CATALOGUE_INTEGRITY_MISMATCH')
  }

  return result(system.id, normalizedThickness, 'CATALOGUE_CANDIDATES', candidates)
}
