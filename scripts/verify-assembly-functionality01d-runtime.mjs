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
  assert.equal(model.expectedBoundaryCount, 4)
  assert.equal(model.technicalReadyBoundaryCount, 4)
  assert.equal(model.jointGlazingLinkCount, 4)
  assert.equal(model.jointGlazingLinkedCount, 4)
  assert.equal(model.jointGlazingBlockedCount, 0)
  assert.equal(model.jointGlazingUnconfirmedCount, 4)
  assert.equal(model.jointGlazingLinks.length, model.joints.length)
  assert.ok(model.jointGlazingLinks.every((link) => link.fieldId === field.id))
  assert.ok(model.jointGlazingLinks.every((link) => link.glazingThicknessMm === 24))
  assert.ok(model.jointGlazingLinks.every((link) => link.glazingBeadProfileCode === '482.15'))
  assert.ok(model.jointGlazingLinks.every((link) => link.baseProfileCode === '482.05'))
  assert.ok(model.jointGlazingLinks.every((link) => link.jointSashProfileCode === '482.05'))
  assert.ok(model.jointGlazingLinks.every((link) => link.baseProfileMatchesJoint === true))
  assert.ok(model.jointGlazingLinks.every((link) => link.linkStatus === 'linked-unconfirmed'))
  assert.ok(model.jointGlazingLinks.every((link) => link.compatibilityCode === 'GLAZING_BEAD_BASE_PROFILE_RULE_MISSING'))
  assert.ok(model.jointGlazingLinks.every((link) => link.exactGlazingInsetKnown === false))
  assert.ok(model.jointGlazingLinks.every((link) => link.exactGlazingSeatKnown === false))
  assert.ok(model.jointGlazingLinks.every((link) => link.exactGlassCutDimensionsKnown === false))
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')

  const model = build(construction, resolution)
  assert.equal(model.technicalReadyBoundaryCount, 4, 'Profile-joint technical review remains independent of glazing input readiness')
  assert.equal(model.jointGlazingLinkCount, 4)
  assert.equal(model.jointGlazingLinkedCount, 0)
  assert.equal(model.jointGlazingBlockedCount, 4)
  assert.ok(model.jointGlazingLinks.every((link) => link.linkStatus === 'missing-input'))
  assert.ok(model.jointGlazingLinks.every((link) => link.baseProfileMatchesJoint === true))
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, '01D split fixture failed')
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
  assert.equal(model.expectedBoundaryCount, 8)
  assert.equal(model.jointGlazingLinkCount, 8)
  assert.equal(model.jointGlazingLinkedCount, 8)
  assert.equal(model.jointGlazingBlockedCount, 0)
  for (const field of resolved.fields) {
    const links = model.jointGlazingLinks.filter((link) => link.fieldId === field.id)
    assert.equal(links.length, 4)
    assert.deepEqual(links.map((link) => link.edge), ['left', 'right', 'top', 'bottom'])
    assert.ok(links.every((link) => link.fieldGlazingContextId === `field-glazing:${field.id}`))
  }
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'fixed')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 24)
  const model = build(construction, resolution)
  assert.equal(model.glazingFieldCount, 1, 'FIXED FIELD remains visible in 01C glazing context')
  assert.equal(model.expectedBoundaryCount, 0, 'FIXED FIELD must not fabricate sash joints')
  assert.equal(model.jointGlazingLinkCount, 0, '01D only links actual joint occurrences')
}

console.log('=== ASSEMBLY FUNCTIONALITY 01D RUNTIME PASS ===')
console.log('OPERABLE FIELD: 4 JOINT OCCURRENCES -> 4 FIELD GLAZING LINKS PASS')
console.log('MULTI-FIELD: 8 BOUNDARIES -> 8 FIELD-IDENTITY LINKS PASS')
console.log('BASE PROFILE == JOINT SASH: ENFORCED')
console.log('MISSING GLAZING INPUT: LINK BLOCKED, PROFILE JOINT PRESERVED')
console.log('FIXED FIELD: 01C CONTEXT PRESERVED / NO FALSE JOINT LINKS')
console.log('BEAD COMPATIBILITY UNCONFIRMED: NOT PROMOTED')
console.log('INSET / SEAT / BEAD PLACEMENT / GLASS CUT: UNKNOWN')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
