import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const promotion = load('src/data/profileSystems/evidencePromotion.ts')

const source = (classification = 'PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE') => ({
  sourceFile: 'synthetic-manufacturer-assembly.pdf',
  sourceUrl: null,
  sourcePageOrReference: 12,
  sourceSha256: 'synthetic-not-production',
  sourceOrganization: 'Synthetic Manufacturer Fixture',
  classification,
  sourceNote: 'Synthetic direct assembly evidence fixture; not production evidence.',
})

const currentParticipants = {
  systemId: 'kmg-prelude-60',
  participantA: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' },
  participantB: { profileId: '482.18', role: 'sash', systemId: 'kmg-prelude-60' },
  relationshipContext: 'MULLION_TO_SASH',
}
const currentSource = {
  sourceFile: 'PVC Prelude_bg.pdf',
  sourceUrl: null,
  sourcePageOrReference: 25,
  sourceSha256: '1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F',
  sourceOrganization: 'Manufacturer catalogue',
  classification: 'SUPPORTING_CATALOGUE_EVIDENCE',
  sourceNote: 'Catalogue sectional context only; exact physical interface remains unresolved.',
}

const incomplete = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: [
    { factType: 'ASSEMBLY_CROSS_SECTION', status: 'PARTIAL', value: 'sectional context', sources: [currentSource], partialNote: 'Interface interpretation remains partial.' },
  ],
  proposedSources: [currentSource],
  pairBinding: { status: 'VERIFIED', sources: [currentSource], note: 'Catalogue pair context only.' },
})
assert.equal(incomplete.promotionStatus, 'INCOMPLETE')
assert.equal(incomplete.physicalGeometryEligible, false)

for (const candidate of [
  { participantA: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.18', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'MULLION_TO_SASH' },
  { participantA: { profileId: '482.30', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_SASH' },
  { participantA: { profileId: '482.05', role: 'sash', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.15', role: 'bead', systemId: 'kmg-prelude-60' }, relationshipContext: 'SASH_TO_BEAD' },
  { participantA: { profileId: '482.20', role: 'frame', systemId: 'kmg-prelude-60' }, participantB: { profileId: '482.21', role: 'mullion', systemId: 'kmg-prelude-60' }, relationshipContext: 'FRAME_TO_MULLION' },
]) {
  const current = promotion.evaluateEvidencePromotionCandidate({
    ...candidate,
    systemId: 'kmg-prelude-60',
    proposedFacts: [],
    proposedSources: [],
    pairBinding: { status: 'UNKNOWN', sources: [], note: 'Current repository evidence does not provide promotion input.' },
  })
  assert.notEqual(current.promotionStatus, 'ELIGIBLE_FOR_REVIEW', `current candidate promoted: ${candidate.relationshipContext}`)
  assert.equal(current.physicalGeometryEligible, false)
}

const unknown = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: [],
  proposedSources: [],
  pairBinding: { status: 'UNKNOWN', sources: [], note: 'No direct pair source.' },
})
assert.ok(['NOT_ELIGIBLE', 'INCOMPLETE'].includes(unknown.promotionStatus))
assert.ok(unknown.missingRequirements.length > 0)

const conflicted = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: [{ factType: 'CONTACT_SURFACES', status: 'CONFLICTED', value: null, sources: [source(), { ...source(), sourceFile: 'second-source.pdf' }] }],
  proposedSources: [source()],
  pairBinding: { status: 'VERIFIED', sources: [source()], note: 'Synthetic exact pair binding.' },
})
assert.equal(conflicted.promotionStatus, 'CONFLICTED')
assert.ok(conflicted.conflicts.some((item) => item.includes('CONTACT_SURFACES')))

const requiredFacts = ['CONTACT_SURFACES', 'CONTACT_DEPTH', 'OVERLAP', 'REBATE', 'SEATING_RELATIONSHIP', 'ASSEMBLY_CROSS_SECTION']
const syntheticSources = requiredFacts.map((factType) => ({
  factType,
  status: 'VERIFIED',
  value: { synthetic: true, factType },
  sources: [source()],
}))
const synthetic = promotion.evaluateEvidencePromotionCandidate({
  systemId: 'synthetic-system',
  participantA: { profileId: 'A-FRAME', role: 'frame', systemId: 'synthetic-system' },
  participantB: { profileId: 'B-SASH', role: 'sash', systemId: 'synthetic-system' },
  relationshipContext: 'FRAME_TO_SASH',
  proposedFacts: syntheticSources,
  proposedSources: syntheticSources.flatMap((fact) => fact.sources),
  pairBinding: { status: 'VERIFIED', sources: [source()], note: 'Synthetic exact pair binding.' },
})
assert.equal(synthetic.promotionStatus, 'ELIGIBLE_FOR_REVIEW')
assert.equal(synthetic.physicalGeometryEligible, true)
assert.equal(synthetic.machineGeometryEligible, false)
assert.equal(synthetic.approvalAvailable, false)

const reversed = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  participantA: currentParticipants.participantB,
  participantB: currentParticipants.participantA,
  proposedFacts: syntheticSources,
  proposedSources: syntheticSources.flatMap((fact) => fact.sources),
  pairBinding: { status: 'VERIFIED', sources: [source()], note: 'Synthetic binding cannot repair reversed order.' },
})
assert.equal(reversed.promotionStatus, 'NOT_ELIGIBLE')
assert.equal(reversed.pairValidation.status, 'MISMATCH')

const catalogueOnly = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: 'catalogue-only', sources: [currentSource] })),
  proposedSources: [currentSource],
  pairBinding: { status: 'VERIFIED', sources: [currentSource], note: 'Catalogue-only binding.' },
})
assert.notEqual(catalogueOnly.promotionStatus, 'ELIGIBLE_FOR_REVIEW')

const databaseOnly = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: 'database-token-only', sources: [{ ...currentSource, classification: 'DATABASE_RELATIONSHIP_EVIDENCE' }] })),
  proposedSources: [{ ...currentSource, classification: 'DATABASE_RELATIONSHIP_EVIDENCE' }],
  pairBinding: { status: 'VERIFIED', sources: [{ ...currentSource, classification: 'DATABASE_RELATIONSHIP_EVIDENCE' }], note: 'Database relationship token only.' },
})
assert.notEqual(databaseOnly.promotionStatus, 'ELIGIBLE_FOR_REVIEW')

const schematicOnly = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: 'schematic-only', sources: [{ ...currentSource, classification: 'SCHEMATIC_PRESENTATION' }] })),
  proposedSources: [{ ...currentSource, classification: 'SCHEMATIC_PRESENTATION' }],
  pairBinding: { status: 'VERIFIED', sources: [{ ...currentSource, classification: 'SCHEMATIC_PRESENTATION' }], note: 'Schematic relationship only.' },
})
assert.notEqual(schematicOnly.promotionStatus, 'ELIGIBLE_FOR_REVIEW')

const dimensionOnly = promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: requiredFacts.map((factType) => ({ factType, status: 'VERIFIED', value: { profileW: 60, profileZ: 78 }, evidenceBasis: 'DIMENSION_ONLY', sources: [source()] })),
  proposedSources: [source()],
  pairBinding: { status: 'VERIFIED', sources: [source()], note: 'Synthetic pair binding does not make dimensions physical interface evidence.' },
})
assert.notEqual(dimensionOnly.promotionStatus, 'ELIGIBLE_FOR_REVIEW')

const before = JSON.stringify({ incomplete, unknown, conflicted, synthetic, reversed, catalogueOnly })
promotion.evaluateEvidencePromotionCandidate({
  ...currentParticipants,
  proposedFacts: [],
  proposedSources: [],
  pairBinding: { status: 'UNKNOWN', sources: [], note: 'Mutation check.' },
})
assert.equal(JSON.stringify({ incomplete, unknown, conflicted, synthetic, reversed, catalogueOnly }), before)

console.log('EVIDENCE PROMOTION WORKFLOW 01 VERIFY PASS')
console.log('CURRENT CANDIDATES: NOT_ELIGIBLE / INCOMPLETE')
console.log('UNKNOWN / PARTIAL: BLOCKED')
console.log('CONFLICTED: EXPLICIT CONFLICT')
console.log('SYNTHETIC COMPLETE DIRECT EVIDENCE: ELIGIBLE_FOR_REVIEW')
console.log('APPROVED: UNREACHABLE')
console.log('PHYSICAL / MACHINE SEPARATION: PASS')
console.log('MUTATION: NONE')
