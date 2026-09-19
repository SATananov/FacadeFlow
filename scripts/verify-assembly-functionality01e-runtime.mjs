import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')
const system = systemData.getProfileSystemById('kmg-prelude-60')

assert(system, 'PRELUDE 60 catalogue fixture missing')

function build(construction, resolution) {
  return product.buildSystemDrivenModuleReadModel({
    moduleId: 'runtime-module',
    moduleSequence: 1,
    productType: 'window',
    system,
    construction,
    resolution,
  })
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
  resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, field, 24, '482.15')

  const model = build(construction, resolution)
  assert.equal(model.jointGlazingLinkCount, 4)
  assert.equal(model.glazingEvidenceCount, 4)
  assert.equal(model.glazingEvidenceCatalogueSupportedCount, 4)
  assert.equal(model.glazingEvidenceCompatibilityReviewedCount, 0)
  assert.equal(model.glazingEvidencePlacementReviewedCount, 0)
  assert.equal(model.glazingEvidenceBlockedCount, 0)
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.evidenceTier === 'catalogue-supported'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.catalogueThicknessEvidenceStatus === 'supported'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.catalogueEvidenceSourceLabel?.includes('Glass beads')))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.beadToBaseEvidenceStatus === 'unconfirmed'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.placementEvidenceStatus === 'unknown'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.glassCutEvidenceStatus === 'unknown'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.automaticGeometryAllowed === false))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.machineReady === false))
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')

  const model = build(construction, resolution)
  assert.equal(model.glazingEvidenceCount, 4)
  assert.equal(model.glazingEvidenceBlockedCount, 4)
  assert.equal(model.glazingEvidenceCatalogueSupportedCount, 0)
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.evidenceTier === 'blocked'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.catalogueThicknessEvidenceStatus === 'not-applicable'))
  assert.ok(model.jointGlazingEvidence.every((entry) => entry.beadToBaseEvidenceStatus === 'missing'))
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, '01E split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  for (const field of resolved.fields) construction = topology.setConstructionFieldType(construction, field.id, 'operable')
  resolved = topology.resolveConstructionTopology(construction)

  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  for (const field of resolved.fields) {
    resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
    resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
    resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, field, 24, '482.15')
  }

  const model = build(construction, resolution)
  assert.equal(model.glazingEvidenceCount, 8)
  assert.equal(model.glazingEvidenceCatalogueSupportedCount, 8)
  assert.equal(model.glazingEvidenceCompatibilityReviewedCount, 0)
  assert.equal(model.glazingEvidencePlacementReviewedCount, 0)
  assert.equal(model.glazingEvidenceBlockedCount, 0)
  assert.deepEqual([...new Set(model.jointGlazingEvidence.map((entry) => entry.fieldSequence))], [1, 2])
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'fixed')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
  const model = build(construction, resolution)
  assert.equal(model.glazingFieldCount, 1)
  assert.equal(model.jointGlazingLinkCount, 0)
  assert.equal(model.glazingEvidenceCount, 0, '01E evidence is per actual joint occurrence only')
}

console.log('=== ASSEMBLY FUNCTIONALITY 01E RUNTIME PASS ===')
console.log('24 mm + 482.15: CATALOGUE-SUPPORTED FOR ALL OPERABLE JOINT OCCURRENCES')
console.log('CATALOGUE SUPPORT: DOES NOT PROMOTE BEAD-TO-BASE COMPATIBILITY')
console.log('MISSING INPUT: EVIDENCE GATE BLOCKED / PROFILE JOINT PRESERVED')
console.log('MULTI-FIELD: 8 JOINTS -> 8 SOURCE-BOUND EVIDENCE RECORDS PASS')
console.log('FIXED FIELD: FIELD CONTEXT PRESERVED / NO FALSE JOINT EVIDENCE')
console.log('PLACEMENT / INSET / SEAT / GLASS CUT: UNKNOWN')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
