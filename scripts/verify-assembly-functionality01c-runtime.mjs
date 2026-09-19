import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')
const system = systemData.getProfileSystemById('kmg-prelude-60')

assert(system, 'PRELUDE 60 catalogue fixture missing')

function build(construction, resolution, offerDefaultGlazingId = null) {
  return product.buildSystemDrivenModuleReadModel({
    moduleId: 'runtime-module',
    moduleSequence: 1,
    productType: 'window',
    system,
    construction,
    resolution,
    offerDefaultGlazingId,
  })
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 760)
  assert(construction, '01C split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  const left = resolved.fields[0]
  const right = resolved.fields[1]
  construction = topology.setConstructionFieldType(construction, left.id, 'operable')
  construction = topology.setConstructionFieldType(construction, right.id, 'fixed')
  resolved = topology.resolveConstructionTopology(construction)
  const operable = resolved.fields.find((field) => field.id === left.id)
  const fixed = resolved.fields.find((field) => field.id === right.id)
  assert(operable && fixed, '01C fields missing after semantics assignment')

  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', operable, '482.05')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, operable, 24)
  resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, operable, 24, '482.15')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, fixed, 24)

  const model = build(construction, resolution)
  assert.equal(model.glazingFieldCount, 2)
  assert.equal(model.glazingInputCompleteCount, 1)
  assert.equal(model.glazingMissingInputCount, 1)
  assert.equal(model.glazingInvalidInputCount, 0)
  assert.equal(model.glazingUnconfirmedCompatibilityCount, 1)

  const operableContext = model.fieldGlazingContexts.find((entry) => entry.fieldId === operable.id)
  assert(operableContext, 'OPERABLE glazing context missing')
  assert.equal(operableContext.glazingThicknessMm, 24)
  assert.equal(operableContext.glazingThicknessSource, 'human-field')
  assert.equal(operableContext.baseProfileCode, '482.05')
  assert.equal(operableContext.baseProfileRole, 'sash')
  assert.equal(operableContext.glazingBeadProfileCode, '482.15')
  assert.equal(operableContext.inputStatus, 'complete')
  assert.equal(operableContext.compatibilityStatus, 'unconfirmed')
  assert.equal(operableContext.compatibilityCode, 'GLAZING_BEAD_BASE_PROFILE_RULE_MISSING')
  assert.equal(operableContext.exactGlazingInsetKnown, false)

  const fixedContext = model.fieldGlazingContexts.find((entry) => entry.fieldId === fixed.id)
  assert(fixedContext, 'FIXED glazing context missing')
  assert.equal(fixedContext.baseProfileCode, '482.30')
  assert.equal(fixedContext.baseProfileRole, 'frame')
  assert.equal(fixedContext.glazingBeadProfileCode, null)
  assert.equal(fixedContext.inputStatus, 'missing')
  assert.equal(fixedContext.compatibilityCode, 'GLAZING_BEAD_NOT_ASSIGNED')

  assert.equal(model.expectedBoundaryCount, 4, 'FIXED glazing context must not create sash boundaries')
  assert.equal(model.technicalReadyBoundaryCount, 4, '01B boundary coverage must remain intact')
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
  const model = build(construction, resolution)
  assert.equal(model.glazingFieldCount, 1)
  assert.equal(model.glazingInputCompleteCount, 0)
  assert.equal(model.glazingMissingInputCount, 1)
  const context = model.fieldGlazingContexts[0]
  assert.equal(context.glazingThicknessMm, null)
  assert.equal(context.glazingThicknessSource, 'unset')
  assert.equal(context.inputStatus, 'missing')
  assert.equal(context.compatibilityCode, 'GLAZING_THICKNESS_MISSING')
  assert.equal(context.exactGlazingInsetKnown, false)
}

{
  const construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1000 })
  const resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  const model = build(construction, resolution)
  assert.equal(model.glazingFieldCount, 0, 'UNSET FIELD must not create glazing context target')
  assert.equal(model.fieldGlazingContexts.length, 0)
}

console.log('=== ASSEMBLY FUNCTIONALITY 01C RUNTIME PASS ===')
console.log('OPERABLE FIELD: SASH BASE + GLAZING + BEAD CONTEXT PASS')
console.log('FIXED FIELD: FRAME BASE CONTEXT PASS')
console.log('MISSING BEAD / THICKNESS: EXPLICIT')
console.log('MATCHING BEAD WITHOUT REVIEWED BASE RULE: UNCONFIRMED / NOT PROMOTED')
console.log('01B BOUNDARY COVERAGE: PRESERVED')
console.log('EXACT GLAZING INSET / SEAT / CUT DIMENSIONS: UNKNOWN')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
