import type { GeometryFactStatus, GeometryFactType } from './geometryFacts'
import type { ProfileResolutionEvidenceRole } from './profileResolutionEvidence'

/**
 * EVIDENCE PROMOTION IS REVIEW ELIGIBILITY, NOT PRODUCTION APPROVAL.
 *
 * This read-only workflow evaluates proposed, directly sourced facts. It never
 * writes evidence, changes a gate, assigns profiles, creates joints, or enables
 * machining. APPROVED is intentionally unreachable here.
 */
export type EvidencePromotionStatus =
  | 'NOT_ELIGIBLE'
  | 'INCOMPLETE'
  | 'CONFLICTED'
  | 'ELIGIBLE_FOR_REVIEW'
  | 'APPROVED'

export type EvidencePromotionSourceClassification =
  | 'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE'
  | 'PRIMARY_MANUFACTURER_CAD_EVIDENCE'
  | 'FABRICATION_EVIDENCE'
  | 'DIRECT_MANUFACTURER_TECHNICAL_EVIDENCE'
  | 'SUPPORTING_CATALOGUE_EVIDENCE'
  | 'DATABASE_RELATIONSHIP_EVIDENCE'
  | 'SCHEMATIC_PRESENTATION'

export type EvidencePromotionSource = Readonly<{
  sourceFile: string | null
  sourceUrl: string | null
  sourcePageOrReference: string | number | null
  sourceSha256: string | null
  sourceOrganization: string
  classification: EvidencePromotionSourceClassification
  sourceNote: string
}>

export type EvidencePromotionParticipantRole = ProfileResolutionEvidenceRole | 'bead' | 'glass'

export type EvidencePromotionParticipant = Readonly<{
  profileId: string | null
  role: EvidencePromotionParticipantRole
  systemId: string | null
}>

export type EvidencePromotionFact = Readonly<{
  factType: GeometryFactType
  status: GeometryFactStatus
  value: string | number | boolean | Readonly<Record<string, unknown>> | null
  sources: readonly EvidencePromotionSource[]
  evidenceBasis?: 'DIRECT_PHYSICAL_INTERFACE' | 'DIMENSION_ONLY' | 'RELATIONSHIP_ONLY' | 'SCHEMATIC_ONLY'
  partialNote?: string
}>

export type EvidencePromotionBinding = Readonly<{
  status: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN' | 'CONFLICTED'
  sources: readonly EvidencePromotionSource[]
  note: string
}>

export type EvidencePromotionValidation = Readonly<{
  status: 'VALID' | 'INCOMPLETE' | 'MISMATCH' | 'UNKNOWN'
  reasons: readonly string[]
}>

export type EvidencePromotionResult = Readonly<{
  promotionStatus: EvidencePromotionStatus
  satisfiedRequirements: readonly string[]
  missingRequirements: readonly string[]
  conflicts: readonly string[]
  provenanceValidation: EvidencePromotionValidation
  pairValidation: EvidencePromotionValidation
  contextValidation: EvidencePromotionValidation
  physicalGeometryEligible: boolean
  machineGeometryEligible: boolean
  approvalAvailable: false
}>

const acceptedDirectClasses: readonly EvidencePromotionSourceClassification[] = [
  'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE',
  'PRIMARY_MANUFACTURER_CAD_EVIDENCE',
  'FABRICATION_EVIDENCE',
  'DIRECT_MANUFACTURER_TECHNICAL_EVIDENCE',
]

const expectedRoles: Readonly<Record<string, readonly [EvidencePromotionParticipantRole, EvidencePromotionParticipantRole]>> = {
  FRAME_TO_MULLION: ['frame', 'mullion'],
  FRAME_TO_SASH: ['frame', 'sash'],
  MULLION_TO_SASH: ['mullion', 'sash'],
  SASH_TO_BEAD: ['sash', 'bead'],
  SASH_TO_GLASS: ['sash', 'glass'],
  BEAD_TO_GLASS: ['bead', 'glass'],
}

const requiredFactsByContext: Readonly<Record<string, readonly GeometryFactType[]>> = {
  FRAME_TO_MULLION: ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'NOTCH_CONTOUR', 'ASSEMBLY_CROSS_SECTION'],
  FRAME_TO_SASH: ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION'],
  MULLION_TO_SASH: ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION'],
  SASH_TO_BEAD: ['CONTACT_SURFACES', 'SEATING_RELATIONSHIP', 'REBATE', 'ASSEMBLY_CROSS_SECTION'],
  SASH_TO_GLASS: ['CONTACT_SURFACES', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION'],
  BEAD_TO_GLASS: ['CONTACT_SURFACES', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION'],
}

function hasSourceLocation(source: EvidencePromotionSource): boolean {
  return Boolean(source.sourceFile || source.sourceUrl)
    && source.sourcePageOrReference !== null
    && source.sourceOrganization.trim().length > 0
    && source.sourceNote.trim().length > 0
}

function directSource(source: EvidencePromotionSource): boolean {
  return acceptedDirectClasses.includes(source.classification) && hasSourceLocation(source)
}

function validation(status: EvidencePromotionValidation['status'], ...reasons: string[]): EvidencePromotionValidation {
  return { status, reasons }
}

export function evaluateEvidencePromotionCandidate(args: {
  systemId: string
  participantA: EvidencePromotionParticipant
  participantB: EvidencePromotionParticipant
  relationshipContext: string
  proposedFacts: readonly EvidencePromotionFact[]
  proposedSources: readonly EvidencePromotionSource[]
  pairBinding: EvidencePromotionBinding
}): EvidencePromotionResult {
  const expected = expectedRoles[args.relationshipContext]
  const requirements = requiredFactsByContext[args.relationshipContext] ?? ['CONTACT_SURFACES', 'ASSEMBLY_CROSS_SECTION']
  const pairReasons: string[] = []
  const contextReasons: string[] = []

  if (!args.participantA.profileId || !args.participantB.profileId || !args.participantA.systemId || !args.participantB.systemId) {
    pairReasons.push('Both exact participant profile IDs and system IDs are required.')
  }
  if (args.participantA.systemId !== args.systemId || args.participantB.systemId !== args.systemId) {
    pairReasons.push('Both participants must bind to the requested system.')
  }
  if (args.participantA.systemId !== args.participantB.systemId) {
    pairReasons.push('Participant systems do not match; participants are not reordered or substituted.')
  }
  if (expected && (args.participantA.role !== expected[0] || args.participantB.role !== expected[1])) {
    pairReasons.push(`Explicit order must be ${expected[0]} → ${expected[1]}; participants are not auto-reordered.`)
  }
  if (!expected) contextReasons.push(`No promotion requirement profile exists for relationship context ${args.relationshipContext}.`)
  if (args.participantA.profileId === args.participantB.profileId) pairReasons.push('Participant profiles must be distinct exact identities.')

  const pairValid = pairReasons.length === 0 && args.pairBinding.status === 'VERIFIED'
  if (args.pairBinding.status !== 'VERIFIED') {
    pairReasons.push(`Exact pair binding is ${args.pairBinding.status}; direct exact-pair evidence is required.`)
  }
  const contextValid = Boolean(expected) && args.relationshipContext.trim().length > 0
  if (!contextValid) contextReasons.push('Relationship context is not explicitly supported.')

  const sourcePool = [...args.proposedSources]
  const factByType = new Map<GeometryFactType, EvidencePromotionFact>()
  for (const fact of args.proposedFacts) factByType.set(fact.factType, fact)
  const satisfied: string[] = []
  const missing: string[] = []
  const conflicts: string[] = []
  const provenanceReasons: string[] = []

  for (const factType of requirements) {
    const fact = factByType.get(factType)
    if (!fact) {
      missing.push(`${factType}: missing proposed fact`)
      continue
    }
    if (fact.status === 'CONFLICTED') {
      conflicts.push(`${factType}: conflicting sources must be resolved explicitly.`)
      continue
    }
    if (fact.status !== 'VERIFIED') {
      missing.push(`${factType}: ${fact.status} does not satisfy a required promotion fact.`)
      continue
    }
    if (fact.evidenceBasis && fact.evidenceBasis !== 'DIRECT_PHYSICAL_INTERFACE') {
      missing.push(`${factType}: ${fact.evidenceBasis} cannot satisfy a physical promotion fact.`)
      continue
    }
    const sources = [...fact.sources, ...sourcePool]
    const directSources = sources.filter(directSource)
    if (directSources.length === 0) {
      missing.push(`${factType}: VERIFIED fact has no accepted direct provenance.`)
      provenanceReasons.push(`${factType} requires an accepted direct source with location and source note.`)
      continue
    }
    satisfied.push(factType)
  }

  const bindingSourcesValid = args.pairBinding.status === 'VERIFIED' && args.pairBinding.sources.some(directSource)
  if (!bindingSourcesValid) {
    provenanceReasons.push('VERIFIED exact pair binding requires accepted direct provenance.')
  }
  const proposedSourcesValid = args.proposedSources.every((source) => hasSourceLocation(source))
  if (!proposedSourcesValid) provenanceReasons.push('Every proposed source must include a file or URL, page/reference, and source note.')
  const provenanceValid = provenanceReasons.length === 0

  if (conflicts.length > 0) {
    return {
      promotionStatus: 'CONFLICTED',
      satisfiedRequirements: satisfied,
      missingRequirements: missing,
      conflicts,
      provenanceValidation: validation(provenanceValid ? 'VALID' : 'INCOMPLETE', ...provenanceReasons),
      pairValidation: validation(pairValid ? 'VALID' : 'MISMATCH', ...pairReasons),
      contextValidation: validation(contextValid ? 'VALID' : 'UNKNOWN', ...contextReasons),
      physicalGeometryEligible: false,
      machineGeometryEligible: false,
      approvalAvailable: false,
    }
  }

  const structurallyValid = pairValid && contextValid
  const complete = structurallyValid && provenanceValid && missing.length === 0
  return {
    promotionStatus: complete ? 'ELIGIBLE_FOR_REVIEW' : structurallyValid ? 'INCOMPLETE' : 'NOT_ELIGIBLE',
    satisfiedRequirements: satisfied,
    missingRequirements: missing,
    conflicts,
    provenanceValidation: validation(provenanceValid ? 'VALID' : 'INCOMPLETE', ...provenanceReasons),
    pairValidation: validation(pairValid ? 'VALID' : pairReasons.length > 0 ? 'MISMATCH' : 'UNKNOWN', ...pairReasons),
    contextValidation: validation(contextValid ? 'VALID' : 'UNKNOWN', ...contextReasons),
    physicalGeometryEligible: complete,
    machineGeometryEligible: false,
    approvalAvailable: false,
  }
}
