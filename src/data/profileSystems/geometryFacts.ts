import { evaluateJointRelationshipEvidence, type JointRelationshipContext, type JointRelationshipEvidenceOrientation } from './jointRelationshipEvidence'
import type { GeometryReadinessParticipant } from './geometryReadinessContext'

/**
 * PHYSICAL GEOMETRY FACTS != GENERATED GEOMETRY.
 *
 * This module stores explicit physical-joint facts only when their evidence
 * status and provenance support them. It never derives facts from dimensions,
 * operation tokens, schematic presentation, or visual similarity.
 * UNKNOWN FACTS MUST REMAIN UNKNOWN.
 */
export type GeometryFactType =
  | 'CONTACT_SURFACES'
  | 'CONTACT_DEPTH'
  | 'OVERLAP'
  | 'REBATE'
  | 'SEATING_RELATIONSHIP'
  | 'NOTCH_CONTOUR'
  | 'END_TREATMENT'
  | 'CUT_ANGLE'
  | 'CUT_LENGTH'
  | 'CONNECTOR_PLACEMENT'
  | 'ASSEMBLY_CROSS_SECTION'
  | 'MACHINING_GEOMETRY'
  | 'MACHINING_COORDINATES'
  | 'TOOLPATH'
  | 'WELD_OR_ALLOWANCE'

export type GeometryFactStatus = 'VERIFIED' | 'PARTIAL' | 'UNKNOWN' | 'CONFLICTED'

export type GeometryFactSourceType =
  | 'CATALOGUE'
  | 'CAD'
  | 'TECHNICAL_DRAWING'
  | 'DATABASE'
  | 'NONE'

export type GeometryFactEvidenceClass =
  | 'PRIMARY_GEOMETRY_EVIDENCE'
  | 'SUPPORTING_PROFILE_EVIDENCE'
  | 'DATABASE_RELATIONSHIP_EVIDENCE'
  | 'INSUFFICIENT_FOR_GEOMETRY'
  | 'UNKNOWN'

export type GeometryFactValue = string | number | boolean | Readonly<Record<string, unknown>>

export type GeometryFactSource = Readonly<{
  sourceType: GeometryFactSourceType
  sourceReference: string | null
  sourceFile: string | null
  sourcePage: number | null
  sourceSha256: string | null
  sourceNote: string
}>

export type GeometryFact = Readonly<{
  factType: GeometryFactType
  status: GeometryFactStatus
  value: GeometryFactValue | null
  sourceType: GeometryFactSourceType
  sourceReference: string | null
  sourceFile: string | null
  sourcePage: number | null
  sourceSha256: string | null
  sourceNote: string
  evidenceClass: GeometryFactEvidenceClass
  sources: readonly GeometryFactSource[]
}>

export type GeometryFactSetStatus = 'EVALUATED' | 'UNKNOWN' | 'ROLE_MISMATCH' | 'CONTEXT_UNAVAILABLE'

export type GeometryFactSet = Readonly<{
  systemId: string
  participantA: GeometryReadinessParticipant | null
  participantB: GeometryReadinessParticipant | null
  relationshipContext: JointRelationshipContext | null
  orientation: JointRelationshipEvidenceOrientation | null
  status: GeometryFactSetStatus
  relationshipEvidenceStatus: 'DATABASE_RULE_EVIDENCE' | 'UNKNOWN'
  relationshipEvidenceNote: string
  connectorAssociations: readonly string[]
  facts: readonly GeometryFact[]
  notes: readonly string[]
}>

export const geometryFactTypes: readonly GeometryFactType[] = [
  'CONTACT_SURFACES',
  'CONTACT_DEPTH',
  'OVERLAP',
  'REBATE',
  'SEATING_RELATIONSHIP',
  'NOTCH_CONTOUR',
  'END_TREATMENT',
  'CUT_ANGLE',
  'CUT_LENGTH',
  'CONNECTOR_PLACEMENT',
  'ASSEMBLY_CROSS_SECTION',
  'MACHINING_GEOMETRY',
  'MACHINING_COORDINATES',
  'TOOLPATH',
  'WELD_OR_ALLOWANCE',
]

function unknownFact(factType: GeometryFactType, sourceNote: string): GeometryFact {
  return {
    factType,
    status: 'UNKNOWN',
    value: null,
    sourceType: 'NONE',
    sourceReference: null,
    sourceFile: null,
    sourcePage: null,
    sourceSha256: null,
    sourceNote,
    evidenceClass: 'INSUFFICIENT_FOR_GEOMETRY',
    sources: [],
  }
}

function unknownFacts(sourceNote: string): readonly GeometryFact[] {
  return geometryFactTypes.map((factType) => unknownFact(factType, sourceNote))
}

export function createGeometryFact(args: {
  factType: GeometryFactType
  status: GeometryFactStatus
  value: GeometryFactValue | null
  evidenceClass: GeometryFactEvidenceClass
  sources: readonly GeometryFactSource[]
}): GeometryFact {
  if (args.status === 'UNKNOWN' && args.value !== null) {
    throw new Error('UNKNOWN geometry facts cannot carry a value.')
  }
  if ((args.status === 'VERIFIED' || args.status === 'PARTIAL') && (args.sources.length === 0 || args.sources.some((source) => !source.sourceReference && !source.sourceFile))) {
    throw new Error(`${args.status} geometry facts require direct provenance.`)
  }
  if (args.status === 'PARTIAL' && args.sources.some((source) => source.sourceNote.trim().length === 0)) {
    throw new Error('PARTIAL geometry facts must state what is partial in their source note.')
  }
  if (args.status === 'CONFLICTED' && args.sources.length < 2) {
    throw new Error('CONFLICTED geometry facts must preserve at least two source references.')
  }

  const primary = args.sources[0] ?? {
    sourceType: 'NONE' as const,
    sourceReference: null,
    sourceFile: null,
    sourcePage: null,
    sourceSha256: null,
    sourceNote: 'No direct source is attached.',
  }
  return {
    factType: args.factType,
    status: args.status,
    value: args.value,
    sourceType: primary.sourceType,
    sourceReference: primary.sourceReference,
    sourceFile: primary.sourceFile,
    sourcePage: primary.sourcePage,
    sourceSha256: primary.sourceSha256,
    sourceNote: primary.sourceNote,
    evidenceClass: args.evidenceClass,
    sources: args.sources,
  }
}

export function getGeometryFacts(args: {
  systemId: string
  participantA: GeometryReadinessParticipant | null
  participantB: GeometryReadinessParticipant | null
  relationshipContext: JointRelationshipContext | null
  orientation: JointRelationshipEvidenceOrientation | null
}): GeometryFactSet {
  const base = {
    systemId: args.systemId,
    participantA: args.participantA,
    participantB: args.participantB,
    relationshipContext: args.relationshipContext,
    orientation: args.orientation,
  }
  const unknownSet = (status: GeometryFactSetStatus, note: string): GeometryFactSet => ({
    ...base,
    status,
    relationshipEvidenceStatus: 'UNKNOWN',
    relationshipEvidenceNote: 'Relationship evidence was not evaluated as physical fact evidence.',
    connectorAssociations: [],
    facts: unknownFacts(note),
    notes: [note, 'No participant is reordered and no missing profile or relationship is inferred.'],
  })

  if (!args.participantA || !args.participantB) {
    return unknownSet('UNKNOWN', 'Both explicit participants are required; physical facts remain UNKNOWN.')
  }
  if (args.participantA.role !== 'frame' || args.participantB.role !== 'mullion') {
    return unknownSet('ROLE_MISMATCH', 'The explicit participant order is not Frame → Mullion; participants are not reordered.')
  }
  if (!args.relationshipContext || !args.orientation || !args.participantA.profileId || !args.participantB.profileId) {
    return unknownSet('CONTEXT_UNAVAILABLE', 'The explicit profile IDs, relationship context, or orientation are incomplete; physical facts remain UNKNOWN.')
  }
  if (args.participantA.systemId !== args.systemId || args.participantB.systemId !== args.systemId || args.participantA.systemId !== args.participantB.systemId) {
    return unknownSet('CONTEXT_UNAVAILABLE', 'Participant system identity does not match the requested context; physical facts remain UNKNOWN.')
  }

  const relationship = evaluateJointRelationshipEvidence({
    systemId: args.systemId,
    profileAId: args.participantA.profileId,
    profileBId: args.participantB.profileId,
    profileARole: args.participantA.role,
    profileBRole: args.participantB.role,
    relationshipContext: args.relationshipContext,
    orientation: args.orientation,
  })
  const isKmgConnectorAssociation = args.systemId === 'kmg-prelude-60' && args.participantB.profileId === '482.21'
  return {
    ...base,
    status: 'EVALUATED',
    relationshipEvidenceStatus: relationship.evidenceStatus,
    relationshipEvidenceNote: relationship.reasons.join(' '),
    connectorAssociations: isKmgConnectorAssociation ? ['KM242: SUPPORTING_CATALOGUE_EVIDENCE_ONLY'] : [],
    facts: unknownFacts(
      'No direct physical assembly source proves this fact. Relationship tokens remain relationship evidence only; dimensions and schematic presentation are not fallbacks.',
    ),
    notes: [
      'This fact set intentionally excludes isolated profile-section facts.',
      'KM242 association with 482.21 does not establish connector placement, depth, fixing coordinates, or machining geometry.',
    ],
  }
}

export const evaluateGeometryFacts = getGeometryFacts
