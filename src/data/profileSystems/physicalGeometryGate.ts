import type { GeometryReadinessBlocker, GeometryReadinessResult } from './geometryReadiness'
import type { SelectedGeometryReadinessContext } from './geometryReadinessContext'

/**
 * PHYSICAL GEOMETRY GATE != GENERATED GEOMETRY.
 *
 * This read-only policy answers whether direct physical evidence is sufficient
 * for one explicit participant order and context. It never assigns profiles,
 * creates joints, calculates geometry, or enables machining.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type PhysicalGeometryGateStatus = 'ALLOWED' | 'BLOCKED' | 'UNKNOWN'
export type PhysicalGeometryParticipantValidation = 'VALID' | 'INCOMPLETE' | 'MISMATCH' | 'UNKNOWN'
export type PhysicalGeometryContextValidation = 'VALID' | 'MISSING' | 'MISMATCH' | 'UNKNOWN'

export type PhysicalGeometryEvidenceCategory =
  | 'DIRECT_PROFILE_PAIR_BINDING'
  | 'CONTACT_DEFINITION'
  | 'CONTACT_DEPTH_OR_SEATING'
  | 'OVERLAP_OR_REBATE'
  | 'END_TREATMENT_OR_NOTCH'
  | 'ASSEMBLY_CROSS_SECTION'

export type PhysicalGeometryGateResult = Readonly<{
  status: PhysicalGeometryGateStatus
  reasons: readonly string[]
  requiredEvidence: readonly PhysicalGeometryEvidenceCategory[]
  missingEvidence: readonly PhysicalGeometryEvidenceCategory[]
  sourceReadinessStatus: GeometryReadinessResult['geometryEvidenceStatus'] | 'UNKNOWN'
  participantValidation: PhysicalGeometryParticipantValidation
  contextValidation: PhysicalGeometryContextValidation
  readiness: GeometryReadinessResult | null
}>

const requiredEvidence: readonly PhysicalGeometryEvidenceCategory[] = [
  'DIRECT_PROFILE_PAIR_BINDING',
  'CONTACT_DEFINITION',
  'CONTACT_DEPTH_OR_SEATING',
  'OVERLAP_OR_REBATE',
  'END_TREATMENT_OR_NOTCH',
  'ASSEMBLY_CROSS_SECTION',
]

const physicalBlockerToCategory: Readonly<Partial<Record<GeometryReadinessBlocker, PhysicalGeometryEvidenceCategory>>> = {
  DIRECT_ARTICLE_PAIR_BINDING_UNKNOWN: 'DIRECT_PROFILE_PAIR_BINDING',
  CONTACT_LINE_UNKNOWN: 'CONTACT_DEFINITION',
  CONTACT_POINT_UNKNOWN: 'CONTACT_DEFINITION',
  CONTACT_SURFACES_UNKNOWN: 'CONTACT_DEFINITION',
  CONTACT_DEPTH_UNKNOWN: 'CONTACT_DEPTH_OR_SEATING',
  OVERLAP_UNKNOWN: 'OVERLAP_OR_REBATE',
  REBATE_UNKNOWN: 'OVERLAP_OR_REBATE',
  NOTCH_CONTOUR_UNKNOWN: 'END_TREATMENT_OR_NOTCH',
  MULLION_END_TREATMENT_UNKNOWN: 'END_TREATMENT_OR_NOTCH',
  ASSEMBLY_CROSS_SECTION_UNKNOWN: 'ASSEMBLY_CROSS_SECTION',
}

function categoriesFor(readiness: GeometryReadinessResult): readonly PhysicalGeometryEvidenceCategory[] {
  return [...new Set(readiness.missingEvidence
    .map((blocker) => physicalBlockerToCategory[blocker])
    .filter((category): category is PhysicalGeometryEvidenceCategory => Boolean(category)))]
}

function result(args: Omit<PhysicalGeometryGateResult, 'requiredEvidence'>): PhysicalGeometryGateResult {
  return { ...args, requiredEvidence }
}

export function evaluatePhysicalGeometryGate(context: SelectedGeometryReadinessContext): PhysicalGeometryGateResult {
  if (context.status === 'ROLE_MISMATCH') {
    return result({
      status: 'BLOCKED',
      reasons: ['The explicit participant order does not match FRAME_TO_MULLION. Participants are not reordered.'],
      missingEvidence: ['DIRECT_PROFILE_PAIR_BINDING'],
      sourceReadinessStatus: 'UNKNOWN',
      participantValidation: 'MISMATCH',
      contextValidation: 'MISMATCH',
      readiness: null,
    })
  }
  if (context.status === 'INCOMPLETE_SELECTION') {
    return result({
      status: 'UNKNOWN',
      reasons: ['Both explicit physical-joint participants are required; no fallback pair is inferred.'],
      missingEvidence: ['DIRECT_PROFILE_PAIR_BINDING'],
      sourceReadinessStatus: 'UNKNOWN',
      participantValidation: 'INCOMPLETE',
      contextValidation: 'UNKNOWN',
      readiness: null,
    })
  }
  if (context.status === 'PROFILE_ID_UNKNOWN') {
    return result({
      status: 'UNKNOWN',
      reasons: ['An explicit profile ID is missing; profile selection is not performed by this gate.'],
      missingEvidence: ['DIRECT_PROFILE_PAIR_BINDING'],
      sourceReadinessStatus: 'UNKNOWN',
      participantValidation: 'UNKNOWN',
      contextValidation: 'VALID',
      readiness: null,
    })
  }
  if (context.status === 'CONTEXT_UNAVAILABLE') {
    return result({
      status: 'UNKNOWN',
      reasons: ['The relationship context or orientation is not explicitly available.'],
      missingEvidence: ['DIRECT_PROFILE_PAIR_BINDING'],
      sourceReadinessStatus: 'UNKNOWN',
      participantValidation: 'VALID',
      contextValidation: 'MISSING',
      readiness: null,
    })
  }

  const readiness = context.evaluation
  if (!readiness) {
    return result({
      status: 'UNKNOWN',
      reasons: ['No readiness evaluation is available for the explicit context.'],
      missingEvidence: ['DIRECT_PROFILE_PAIR_BINDING'],
      sourceReadinessStatus: 'UNKNOWN',
      participantValidation: 'UNKNOWN',
      contextValidation: 'UNKNOWN',
      readiness: null,
    })
  }

  const missingEvidence = categoriesFor(readiness)
  if (readiness.physicalGeometryStatus !== 'ALLOWED' || missingEvidence.length > 0 || readiness.geometryEvidenceStatus !== 'CAD_VERIFIED') {
    return result({
      status: 'BLOCKED',
      reasons: [
        'Direct physical contact and assembly evidence is not sufficient for this exact pair/context.',
        'Catalogue sections, relationship evidence, schematic permission, and envelope dimensions do not unlock physical geometry.',
      ],
      missingEvidence: missingEvidence.length > 0 ? missingEvidence : [...requiredEvidence],
      sourceReadinessStatus: readiness.geometryEvidenceStatus,
      participantValidation: 'VALID',
      contextValidation: 'VALID',
      readiness,
    })
  }

  return result({
    status: 'ALLOWED',
    reasons: ['Direct physical evidence is represented as CAD_VERIFIED and no required physical evidence category remains missing.'],
    missingEvidence: [],
    sourceReadinessStatus: readiness.geometryEvidenceStatus,
    participantValidation: 'VALID',
    contextValidation: 'VALID',
    readiness,
  })
}
