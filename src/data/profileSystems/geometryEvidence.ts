import { getProfileKnowledgeEvidence } from './profileKnowledge'

/**
 * GEOMETRY EVIDENCE != GENERATED GEOMETRY.
 * DATABASE RELATIONSHIP EVIDENCE != PHYSICAL JOINT GEOMETRY.
 * UNKNOWN IS A VALID RESULT. AUTOMATIC GEOMETRY = NO.
 *
 * This model stores traceable evidence only. It never produces coordinates,
 * contours, cuts, toolpaths, or mutations of the product model.
 */
export type GeometryEvidenceStatus =
  | 'CATALOGUE_VERIFIED'
  | 'CAD_VERIFIED'
  | 'DATABASE_RELATIONSHIP_ONLY'
  | 'ASSUMED'
  | 'UNKNOWN'

export type GeometryEvidenceSourceType =
  | 'CATALOGUE'
  | 'CAD'
  | 'TECHNICAL_DRAWING'
  | 'DATABASE'

export type GeometryEvidenceFact = Readonly<{
  status: GeometryEvidenceStatus
  value: string | null
  sourceType: GeometryEvidenceSourceType
  sourceReference: string
  sourceFile: string | null
  sourcePage: number | null
  sourceSha256: string | null
  sourceNote: string
}>

export type GeometryEvidenceRecord = Readonly<{
  systemId: string
  profileAId: string
  profileBId: string
  profileARole: 'frame'
  profileBRole: 'mullion'
  relationshipContext: 'FRAME_TO_MULLION'
  orientation: 'horizontal' | 'vertical'
  evidenceStatus: 'DATABASE_RELATIONSHIP_ONLY'
  profileASectionEvidence: GeometryEvidenceFact
  profileBSectionEvidence: GeometryEvidenceFact
  contactLineEvidence: GeometryEvidenceFact
  contactPointEvidence: GeometryEvidenceFact
  overlapEvidence: GeometryEvidenceFact
  rebateEvidence: GeometryEvidenceFact
  notchContourEvidence: GeometryEvidenceFact
  cutAngleEvidence: GeometryEvidenceFact
  cutLengthEvidence: GeometryEvidenceFact
  assemblyCrossSectionEvidence: GeometryEvidenceFact
  sourceType: 'DATABASE'
  sourceReference: string
  sourcePage: null
  notes: readonly string[]
  unknowns: readonly string[]
}>

const profileSectionSource = 'src/data/profileSystems/prelude60.ts'
const relationshipSource = 'src/data/profileSystems/knowledge/derivedProfileKnowledge.ts'
const tokenSource = '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv'
const recoveredPreludePdf = 'PVC Prelude_bg.pdf'
const recoveredPreludePdfSha256 = '1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F'

function catalogueSectionFact(profileId: string, role: string, callouts: string): GeometryEvidenceFact {
  return {
    status: 'CATALOGUE_VERIFIED',
    value: `Catalogue component cross-section reference for ${profileId} (${role}); raw callouts ${callouts} mm are preserved without geometric reinterpretation.`,
    sourceType: 'CATALOGUE',
    sourceReference: profileSectionSource,
    sourceFile: recoveredPreludePdf,
    sourcePage: 2,
    sourceSha256: recoveredPreludePdfSha256,
    sourceNote: 'Isolated profile-section evidence only. The catalogue identifies the component profile and raw printed callouts; it does not prove the assembled joint geometry.',
  }
}

function unknownGeometryFact(sourceNote: string): GeometryEvidenceFact {
  return {
    status: 'UNKNOWN',
    value: null,
    sourceType: 'DATABASE',
    sourceReference: tokenSource,
    sourceFile: null,
    sourcePage: null,
    sourceSha256: null,
    sourceNote,
  }
}

const unknowns = [
  'Exact physical contact line and contact point are UNKNOWN.',
  'Overlap, rebate, notch contour, cut angle, and cut length are UNKNOWN.',
  'Machining allowance, cutter geometry, toolpath, machine coordinates, and weld allowance are UNKNOWN.',
] as const

const records: readonly GeometryEvidenceRecord[] = [
  {
    systemId: 'kmg-prelude-60',
    profileAId: '482.20',
    profileBId: '482.21',
    profileARole: 'frame',
    profileBRole: 'mullion',
    relationshipContext: 'FRAME_TO_MULLION',
    orientation: 'horizontal',
    evidenceStatus: 'DATABASE_RELATIONSHIP_ONLY',
    profileASectionEvidence: catalogueSectionFact('482.20', 'Frame', '60 / 68 / 46'),
    profileBSectionEvidence: catalogueSectionFact('482.21', 'Mullion', '60 / 84 / 40'),
    contactLineEvidence: unknownGeometryFact('The KMG operation/token rows identify a relationship context only; they do not encode a physical contact line.'),
    contactPointEvidence: unknownGeometryFact('The KMG operation/token rows do not provide a physical contact point.'),
    overlapEvidence: unknownGeometryFact('No direct KMG source in this record proves physical overlap.'),
    rebateEvidence: unknownGeometryFact('No direct KMG source in this record proves a rebate or inset.'),
    notchContourEvidence: unknownGeometryFact('SglobkaDelitel and relation tokens are not a notch contour.'),
    cutAngleEvidence: unknownGeometryFact('Operation code 19 does not prove a physical cut angle.'),
    cutLengthEvidence: unknownGeometryFact('POS[] does not prove a physical cut length.'),
    assemblyCrossSectionEvidence: unknownGeometryFact('No exact 482.20 ↔ 482.21 assembled cross-section is present.'),
    sourceType: 'DATABASE',
    sourceReference: relationshipSource,
    sourcePage: null,
    notes: [
      'BeamHorizontalKMG4k is preserved as database relationship evidence only.',
      'L_Fr/R_Fr, operation 19, SglobkaDelitel, POS[], and MM1/MM4 remain opaque source tokens.',
      'The current evidence is not direct article-pair binding for 482.20 ↔ 482.21.',
    ],
    unknowns,
  },
  {
    systemId: 'kmg-prelude-60',
    profileAId: '482.20',
    profileBId: '482.21',
    profileARole: 'frame',
    profileBRole: 'mullion',
    relationshipContext: 'FRAME_TO_MULLION',
    orientation: 'vertical',
    evidenceStatus: 'DATABASE_RELATIONSHIP_ONLY',
    profileASectionEvidence: catalogueSectionFact('482.20', 'Frame', '60 / 68 / 46'),
    profileBSectionEvidence: catalogueSectionFact('482.21', 'Mullion', '60 / 84 / 40'),
    contactLineEvidence: unknownGeometryFact('The KMG operation/token rows identify a relationship context only; they do not encode a physical contact line.'),
    contactPointEvidence: unknownGeometryFact('The KMG operation/token rows do not provide a physical contact point.'),
    overlapEvidence: unknownGeometryFact('No direct KMG source in this record proves physical overlap.'),
    rebateEvidence: unknownGeometryFact('No direct KMG source in this record proves a rebate or inset.'),
    notchContourEvidence: unknownGeometryFact('SglobkaDelitel and relation tokens are not a notch contour.'),
    cutAngleEvidence: unknownGeometryFact('Operation code 19 does not prove a physical cut angle.'),
    cutLengthEvidence: unknownGeometryFact('POS[] does not prove a physical cut length.'),
    assemblyCrossSectionEvidence: unknownGeometryFact('No exact 482.20 ↔ 482.21 assembled cross-section is present.'),
    sourceType: 'DATABASE',
    sourceReference: relationshipSource,
    sourcePage: null,
    notes: [
      'BeamVerticalKMG4k is preserved as database relationship evidence only.',
      'U_Fr/D_Fr, operation 19, SglobkaDelitel, POS[], and MM1/MM1 remain opaque source tokens.',
      'The current evidence is not direct article-pair binding for 482.20 ↔ 482.21.',
    ],
    unknowns,
  },
]

export function getGeometryEvidence(args: {
  systemId: string
  profileAId: string
  profileBId: string
  profileARole: 'frame'
  profileBRole: 'mullion'
  relationshipContext: 'FRAME_TO_MULLION'
  orientation: 'horizontal' | 'vertical'
}): GeometryEvidenceRecord | undefined {
  const profileA = getProfileKnowledgeEvidence(args.systemId, args.profileAId)
  const profileB = getProfileKnowledgeEvidence(args.systemId, args.profileBId)
  if (!profileA || !profileB || profileA.roleEn.toLowerCase() !== args.profileARole || profileB.roleEn.toLowerCase() !== args.profileBRole) {
    return undefined
  }
  return records.find((record) =>
    record.systemId === args.systemId &&
    record.profileAId === args.profileAId &&
    record.profileBId === args.profileBId &&
    record.profileARole === args.profileARole &&
    record.profileBRole === args.profileBRole &&
    record.relationshipContext === args.relationshipContext &&
    record.orientation === args.orientation,
  )
}

export function getAllGeometryEvidenceRecords(): readonly GeometryEvidenceRecord[] {
  return records
}
