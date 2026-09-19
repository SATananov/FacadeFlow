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
  return product.buildSystemDrivenModuleReadModel({ moduleId: 'runtime-module', moduleSequence: 1, productType: 'window', system, construction, resolution })
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, '01F split fixture failed')
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
  assert.equal(model.jointGlazingEvidence.length, 8)
  assert.equal(model.glazingEvidenceOpenGapCount, 3, 'eight repeated joints must collapse to three unique evidence gaps')
  assert.equal(model.glazingEvidenceGaps.filter((gap) => gap.kind === 'bead-base-compatibility').length, 1)
  assert.equal(model.glazingEvidenceGaps.filter((gap) => gap.kind === 'placement-evidence').length, 1)
  assert.equal(model.glazingEvidenceGaps.filter((gap) => gap.kind === 'glass-cut-rule').length, 1)
  assert.equal(model.glazingEvidenceGaps.filter((gap) => gap.kind === 'field-input').length, 0)
  for (const gap of model.glazingEvidenceGaps) {
    assert.equal(gap.occurrenceCount, 8)
    assert.deepEqual(gap.fieldSequences, [1, 2])
    assert.equal(gap.baseProfileCode, '482.05')
    assert.equal(gap.beadProfileCode, '482.15')
    assert.equal(gap.glazingThicknessMm, 24)
    assert.equal(gap.automaticGeometryAllowed, false)
    assert.equal(gap.machineReady, false)
  }
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'fixed')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
  const model = build(construction, resolution)
  assert.equal(model.jointGlazingEvidence.length, 0)
  assert.equal(model.glazingEvidenceOpenGapCount, 1)
  assert.equal(model.glazingEvidenceGaps[0].kind, 'field-input')
  assert.deepEqual(model.glazingEvidenceGaps[0].fieldSequences, [1])
  assert.equal(model.glazingEvidenceGaps[0].occurrenceCount, 1)
}

console.log('=== ASSEMBLY FUNCTIONALITY 01F RUNTIME PASS ===')
console.log('8 JOINT OCCURRENCES -> 3 UNIQUE EVIDENCE RULE GAPS PASS')
console.log('BEAD 482.15 + BASE 482.05: ONE COMPATIBILITY GAP / 8 AFFECTED JOINTS')
console.log('PLACEMENT: ONE GAP / 8 AFFECTED JOINTS')
console.log('GLASS CUT RULE: ONE GAP / 8 AFFECTED JOINTS')
console.log('FIXED FIELD MISSING BEAD: ONE FIELD INPUT GAP / NO FALSE JOINT GAP')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
