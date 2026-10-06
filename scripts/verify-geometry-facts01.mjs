import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const facts = load('src/data/profileSystems/geometryFacts.ts')

const kmgArgs = {
  systemId: 'kmg-prelude-60',
  participantA: { role: 'frame', profileId: '482.20', systemId: 'kmg-prelude-60', selectionId: 'frame' },
  participantB: { role: 'mullion', profileId: '482.21', systemId: 'kmg-prelude-60', selectionId: 'divider-1' },
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}
const kmg = facts.getGeometryFacts(kmgArgs)
assert.equal(kmg.status, 'EVALUATED')
assert.equal(kmg.facts.length, 15)
assert.ok(kmg.facts.every((fact) => fact.status === 'UNKNOWN' && fact.value === null))
assert.ok(kmg.facts.every((fact) => fact.sources.length === 0))
assert.deepEqual(kmg.connectorAssociations, ['KM242: SUPPORTING_CATALOGUE_EVIDENCE_ONLY'])
assert.equal(kmg.relationshipEvidenceStatus, 'DATABASE_RULE_EVIDENCE')
assert.match(kmg.relationshipEvidenceNote, /not physical joint geometry/i)
assert.ok(kmg.notes.some((note) => /isolated profile-section facts/i.test(note)))

for (const token of ['SglobkaDelitel', 'BeamHorizontalKMG4k', 'BeamVerticalKMG4k', 'POS[]', 'MM1', 'MM4']) {
  assert.ok(kmg.facts.every((fact) => fact.value === null && !fact.sourceNote.includes(token)), `relationship token promoted: ${token}`)
}

const reversed = facts.getGeometryFacts({
  ...kmgArgs,
  participantA: kmgArgs.participantB,
  participantB: kmgArgs.participantA,
})
assert.equal(reversed.status, 'ROLE_MISMATCH')
assert.ok(reversed.facts.every((fact) => fact.status === 'UNKNOWN'))

const nonKmg = facts.getGeometryFacts({
  ...kmgArgs,
  systemId: 'vivaplast',
  participantA: { ...kmgArgs.participantA, profileId: '5522', systemId: 'vivaplast' },
  participantB: { ...kmgArgs.participantB, profileId: '5523', systemId: 'vivaplast' },
})
assert.equal(nonKmg.status, 'EVALUATED')
assert.ok(nonKmg.facts.every((fact) => fact.status === 'UNKNOWN'))
assert.deepEqual(nonKmg.connectorAssociations, [])

const incomplete = facts.getGeometryFacts({ ...kmgArgs, participantB: null })
assert.equal(incomplete.status, 'UNKNOWN')
assert.ok(incomplete.facts.every((fact) => fact.value === null))

const conflictSourceA = { sourceType: 'TECHNICAL_DRAWING', sourceReference: 'source-a', sourceFile: 'a.pdf', sourcePage: 1, sourceSha256: 'a', sourceNote: 'Source A value.' }
const conflictSourceB = { sourceType: 'CAD', sourceReference: 'source-b', sourceFile: 'b.dxf', sourcePage: null, sourceSha256: 'b', sourceNote: 'Source B value.' }
const conflicted = facts.createGeometryFact({
  factType: 'OVERLAP',
  status: 'CONFLICTED',
  value: null,
  evidenceClass: 'PRIMARY_GEOMETRY_EVIDENCE',
  sources: [conflictSourceA, conflictSourceB],
})
assert.equal(conflicted.status, 'CONFLICTED')
assert.equal(conflicted.sources.length, 2)
assert.throws(() => facts.createGeometryFact({ factType: 'CONTACT_DEPTH', status: 'VERIFIED', value: 5, evidenceClass: 'PRIMARY_GEOMETRY_EVIDENCE', sources: [] }), /direct provenance/i)
assert.throws(() => facts.createGeometryFact({ factType: 'CONTACT_DEPTH', status: 'UNKNOWN', value: 5, evidenceClass: 'INSUFFICIENT_FOR_GEOMETRY', sources: [] }), /UNKNOWN geometry facts/i)

const before = JSON.stringify(kmgArgs)
facts.getGeometryFacts(kmgArgs)
assert.equal(JSON.stringify(kmgArgs), before)

console.log('GEOMETRY FACT MODEL 01 VERIFY PASS')
console.log('KMG FACT SET: 15 PHYSICAL FACTS UNKNOWN')
console.log('RELATIONSHIP TOKENS / KM242 PLACEMENT / DIMENSION FALLBACK: NOT PROMOTED')
console.log('REVERSED PARTICIPANTS: EXPLICIT ROLE_MISMATCH')
console.log('NON-KMG: UNKNOWN FACT SET')
console.log('CONFLICT SUPPORT / PROVENANCE GUARDS / MUTATION: PASS')
