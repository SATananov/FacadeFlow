import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const projectModel = load('src/domain/project/projectModel')
const projectOps = load('src/domain/project/projectOperations')
const revisions = load('src/domain/project/revisionOperations')
const serialization = load('src/domain/project/projectSerialization')
const canonical = load('src/domain/assurance/canonical')
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')

const system = systemData.getProfileSystemById('kmg-prelude-60')
assert(system, 'PRELUDE 60 catalogue fixture missing')
let counter = 0
const idFactory = () => `recovery-01b1-${++counter}`
const actor = { id: 'reviewer-recovery', label: 'Recovery Reviewer', identityBasis: 'local-self-asserted' }

let snapshot = projectModel.createProjectSnapshot(idFactory)
const moduleId = idFactory()
let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
const field = topology.resolveConstructionTopology(construction).fields[0]
let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, field, 24, '482.15')

snapshot = projectOps.editProject(snapshot, (next) => {
  projectOps.replaceFreeModules(next, [{ id: moduleId, sequence: 1, profileSystemId: system.id, productType: 'window', profileResolution: structuredClone(resolution) }])
  next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: structuredClone(construction.frame), topology: structuredClone(construction) }
})
snapshot = revisions.recordProjectRevision(snapshot, actor, '2026-09-17T12:00:00.000Z', idFactory)
snapshot = structuredClone(snapshot)

const additivePredicates = new Set(['official-sectional-bead-base-pairing', 'official-sectional-bead-placement'])
const additiveEvidenceIds = new Set(Object.values(snapshot.assurance.evidenceById)
  .filter((e) => additivePredicates.has(e.statement.predicate)).map((e) => e.id))
assert.equal(additiveEvidenceIds.size, 2, 'fixture must start with two additive review candidates')
const additiveSourceIds = new Set()
for (const id of additiveEvidenceIds) for (const sourceId of snapshot.assurance.evidenceById[id].sourceReferenceIds) additiveSourceIds.add(sourceId)

for (const [key, id] of Object.entries(snapshot.assurance.currentEvidenceByStatementKey)) {
  if (additiveEvidenceIds.has(id)) delete snapshot.assurance.currentEvidenceByStatementKey[key]
}
for (const revision of Object.values(snapshot.revisions.revisionsById)) {
  for (const [key, id] of Object.entries(revision.content.evidenceByStatementKey)) {
    if (additiveEvidenceIds.has(id)) delete revision.content.evidenceByStatementKey[key]
  }
  revision.contentDigest = canonical.fingerprint(revision.content)
}
for (const id of additiveEvidenceIds) delete snapshot.assurance.evidenceById[id]
for (const id of additiveSourceIds) delete snapshot.assurance.sourcesById[id]

const legacyJson = JSON.stringify(snapshot)
const recovered = serialization.deserializeProject(legacyJson)
const recoveredAdditive = Object.values(recovered.assurance.currentEvidenceByStatementKey)
  .map((id) => recovered.assurance.evidenceById[id])
  .filter((e) => e && additivePredicates.has(e.statement.predicate))
assert.equal(recoveredAdditive.length, 2, 'current draft must deterministically backfill the two review candidates')
const historical = Object.values(recovered.revisions.revisionsById)[0]
const historicalAdditive = Object.values(historical.content.evidenceByStatementKey)
  .map((id) => recovered.assurance.evidenceById[id])
  .filter((e) => e && additivePredicates.has(e.statement.predicate))
assert.equal(historicalAdditive.length, 0, 'historical revision must remain byte-semantically unextended')
assert.doesNotThrow(() => serialization.serializeProject(recovered), 'recovered project must be serializable')

// Safety check: a missing non-additive technical binding must still fail closed.
const corrupt = structuredClone(recovered)
const requiredKey = Object.keys(corrupt.assurance.currentEvidenceByStatementKey).find((key) => {
  const id = corrupt.assurance.currentEvidenceByStatementKey[key]
  const e = corrupt.assurance.evidenceById[id]
  return e?.statement.scope.kind === 'module' && !additivePredicates.has(e.statement.predicate)
})
assert(requiredKey, 'fixture must have a required non-additive module binding')
delete corrupt.assurance.currentEvidenceByStatementKey[requiredKey]
assert.throws(() => serialization.deserializeProject(JSON.stringify(corrupt)), /missing input\/unknown evidence binding/)

console.log('=== EVIDENCE REVIEW 01B.1 RECOVERY RUNTIME PASS ===')
console.log('PRE-01B PF02 PROJECT: OPENABLE AFTER ADDITIVE CURRENT-DRAFT BACKFILL')
console.log('HISTORICAL REVISIONS: NOT REWRITTEN')
console.log('OFFICIAL SECTIONAL CANDIDATES: SOURCE-BOUND / NOT PROMOTED')
console.log('MISSING NON-ADDITIVE BINDING: STILL FAIL-CLOSED')
console.log('NO DATA DELETION / NO RULE PROMOTION / MACHINE READY: NO')
