import type { ProfileSystemCatalogEntry } from '../data/profileSystems/types'
import {
  resolveGlazingEvidenceContext,
  type GlazingEvidenceCandidate,
} from './glazingEvidence'

export const GLAZING_CONTEXT_VERSION = 'glazing-context-01a' as const

export type HumanGlazingContextStatus =
  | 'GLAZING_THICKNESS_MISSING'
  | 'INVALID_GLAZING_THICKNESS'
  | 'UNSUPPORTED_SYSTEM'
  | 'NO_CATALOGUE_CANDIDATE'
  | 'CATALOGUE_INTEGRITY_MISMATCH'
  | 'CANDIDATES_READY_FOR_HUMAN_SELECTION'
  | 'HUMAN_BEAD_SELECTION_VALID'
  | 'HUMAN_BEAD_SELECTION_INVALID'

export type HumanGlazingContextResolution = {
  version: typeof GLAZING_CONTEXT_VERSION
  status: HumanGlazingContextStatus
  systemId: string
  glazingThicknessMm: number | null
  candidates: readonly GlazingEvidenceCandidate[]
  selectedBeadCode: string | null
  selectedCandidate: GlazingEvidenceCandidate | null
  selectionAuthority: 'NONE' | 'HUMAN_ONLY'
  baseProfileCompatibility: 'UNCONFIRMED'
  automaticBeadSelectionAllowed: false
  exactGlazingInsetKnown: false
  glassCutKnown: false
  mutatesConstructionGeometry: false
  machineReady: false
}

function makeResult(
  systemId: string,
  glazingThicknessMm: number | null,
  status: HumanGlazingContextStatus,
  candidates: readonly GlazingEvidenceCandidate[] = [],
  selectedBeadCode: string | null = null,
  selectedCandidate: GlazingEvidenceCandidate | null = null,
): HumanGlazingContextResolution {
  return {
    version: GLAZING_CONTEXT_VERSION,
    status,
    systemId,
    glazingThicknessMm,
    candidates,
    selectedBeadCode,
    selectedCandidate,
    selectionAuthority: selectedCandidate ? 'HUMAN_ONLY' : 'NONE',
    baseProfileCompatibility: 'UNCONFIRMED',
    automaticBeadSelectionAllowed: false,
    exactGlazingInsetKnown: false,
    glassCutKnown: false,
    mutatesConstructionGeometry: false,
    machineReady: false,
  }
}

/**
 * Human glazing-context resolver.
 *
 * This stage intentionally owns no persistent UI/module state. It converts an
 * explicitly human-entered glazing thickness plus an optional explicitly
 * human-selected bead code into a fail-closed read model for later UI wiring.
 *
 * A valid bead selection means only that the selected code is one of the
 * catalogue-labelled candidates for the selected system and nominal glazing
 * thickness. It DOES NOT prove bead-to-frame/sash compatibility, glazing
 * inset, glass cut, rebate geometry, or machine readiness.
 */
export function resolveHumanGlazingContext(
  system: ProfileSystemCatalogEntry,
  glazingThicknessMm: number | null | undefined,
  selectedBeadCode?: string | null,
): HumanGlazingContextResolution {
  const normalizedThickness = glazingThicknessMm ?? null
  const normalizedSelectedCode = selectedBeadCode?.trim() || null

  if (normalizedThickness !== null && (!Number.isFinite(normalizedThickness) || normalizedThickness <= 0)) {
    return makeResult(system.id, normalizedThickness, 'INVALID_GLAZING_THICKNESS')
  }

  const evidence = resolveGlazingEvidenceContext(system, normalizedThickness)

  if (evidence.status === 'GLAZING_THICKNESS_MISSING') {
    return makeResult(system.id, null, 'GLAZING_THICKNESS_MISSING')
  }
  if (evidence.status === 'UNSUPPORTED_SYSTEM') {
    return makeResult(system.id, normalizedThickness, 'UNSUPPORTED_SYSTEM')
  }
  if (evidence.status === 'NO_CATALOGUE_CANDIDATE') {
    return makeResult(system.id, normalizedThickness, 'NO_CATALOGUE_CANDIDATE')
  }
  if (evidence.status === 'CATALOGUE_INTEGRITY_MISMATCH') {
    return makeResult(system.id, normalizedThickness, 'CATALOGUE_INTEGRITY_MISMATCH')
  }

  if (!normalizedSelectedCode) {
    return makeResult(
      system.id,
      normalizedThickness,
      'CANDIDATES_READY_FOR_HUMAN_SELECTION',
      evidence.candidates,
    )
  }

  const selectedCandidate = evidence.candidates.find((candidate) => candidate.beadCode === normalizedSelectedCode) ?? null
  if (!selectedCandidate) {
    return makeResult(
      system.id,
      normalizedThickness,
      'HUMAN_BEAD_SELECTION_INVALID',
      evidence.candidates,
      normalizedSelectedCode,
    )
  }

  return makeResult(
    system.id,
    normalizedThickness,
    'HUMAN_BEAD_SELECTION_VALID',
    evidence.candidates,
    normalizedSelectedCode,
    selectedCandidate,
  )
}
