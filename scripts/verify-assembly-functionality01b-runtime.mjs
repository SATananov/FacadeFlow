import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const systemData = load('src/data/profileSystems')
const product = load('src/domain/systemDrivenProductModel')
const visualization = load('src/domain/systemJointVisualization')
const system = systemData.getProfileSystemById('kmg-prelude-60')

assert(system, 'PRELUDE 60 catalogue fixture missing')

function baseConstruction() {
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1400, heightMm: 1200 })
  construction = topology.setConstructionFieldType(construction, 'field-1', 'operable')
  return construction
}

function basicResolution(construction, frameCode = '482.30', sashCode = '482.05') {
  const field = topology.resolveConstructionTopology(construction).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, frameCode)
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, sashCode)
  return resolution
}

function build(construction, resolution, productType = 'window') {
  return product.buildSystemDrivenModuleReadModel({
    moduleId: 'runtime-module',
    moduleSequence: 1,
    productType,
    system,
    construction,
    resolution,
  })
}

{
  const construction = baseConstruction()
  const model = build(construction, basicResolution(construction))
  assert.equal(model.expectedBoundaryCount, 4)
  assert.equal(model.resolvedBoundaryCount, 4)
  assert.equal(model.technicalReadyBoundaryCount, 4)
  assert.equal(model.blockedBoundaryCount, 0)
  assert.equal(model.boundaryCoverageComplete, true)
  assert.deepEqual(model.boundaryCoverage.map((entry) => entry.edge), ['left', 'right', 'top', 'bottom'])
  assert.ok(model.boundaryCoverage.every((entry) => entry.status === 'resolved'))

  const correctionByEdge = Object.fromEntries(model.joints.map((joint) => [joint.edge, joint.systemRule?.sashEdgeCorrectionMm]))
  assert.deepEqual(correctionByEdge, { left: 8.5, right: 8.5, top: 8, bottom: 8 })
  const rotationByEdge = Object.fromEntries(model.joints.map((joint) => [joint.edge, visualization.buildSystemJointVisualization(joint).orientationRotationDeg]))
  assert.deepEqual(rotationByEdge, { left: 0, right: 180, top: 90, bottom: -90 })
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, 'Vertical split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  for (const field of resolved.fields) construction = topology.setConstructionFieldType(construction, field.id, 'operable')
  resolved = topology.resolveConstructionTopology(construction)

  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  for (const field of resolved.fields) {
    resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
  }

  const model = build(construction, resolution)
  assert.equal(model.expectedBoundaryCount, 8)
  assert.equal(model.resolvedBoundaryCount, 8)
  assert.equal(model.technicalReadyBoundaryCount, 8)
  assert.equal(model.blockedBoundaryCount, 0)
  assert.equal(model.boundaryCoverage.filter((entry) => entry.supportKind === 'divider').length, 2)
  assert.equal(model.boundaryCoverage.filter((entry) => entry.supportKind === 'frame').length, 6)
  for (const field of resolved.fields) {
    assert.deepEqual(
      model.boundaryCoverage.filter((entry) => entry.fieldId === field.id).map((entry) => entry.edge),
      ['left', 'right', 'top', 'bottom'],
    )
  }
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitField(construction, 'field-1', 'vertical', 700)
  assert(construction, 'Mixed-field split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  construction = topology.setConstructionFieldType(construction, resolved.fields[0].id, 'operable')
  construction = topology.setConstructionFieldType(construction, resolved.fields[1].id, 'fixed')
  resolved = topology.resolveConstructionTopology(construction)

  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setDividerProfileAssignment(resolution, system, resolved.dividers[0].id, '482.21')
  resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', resolved.fields[0], '482.05')
  const model = build(construction, resolution)
  assert.equal(model.expectedBoundaryCount, 4, 'Fixed FIELD must not create sash boundaries')
  assert.ok(model.boundaryCoverage.every((entry) => entry.fieldId === resolved.fields[0].id))
}

{
  const construction = baseConstruction()
  const model = build(construction, basicResolution(construction, '482.20', '482.18'))
  assert.equal(model.expectedBoundaryCount, 4)
  assert.equal(model.resolvedBoundaryCount, 4)
  assert.equal(model.technicalReadyBoundaryCount, 0)
  assert.equal(model.blockedBoundaryCount, 4)
  assert.ok(model.boundaryCoverage.every((entry) => entry.status === 'missing-technical-section'))
  assert.ok(model.boundaryCoverage.every((entry) => entry.noteBg.includes('не създава заместителна геометрия')))
}

{
  const construction = baseConstruction()
  const resolution = basicResolution(construction)
  const model = build(construction, resolution, 'door')
  assert.equal(model.expectedBoundaryCount, 4)
  assert.equal(model.technicalReadyBoundaryCount, 0)
  assert.ok(model.boundaryCoverage.every((entry) => entry.status === 'missing-system-rule'))
}

{
  let construction = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1600, heightMm: 1200 })
  construction = topology.splitFieldAngled(construction, 'field-1', 700)
  assert(construction, 'Angled split fixture failed')
  let resolved = topology.resolveConstructionTopology(construction)
  for (const field of resolved.fields) construction = topology.setConstructionFieldType(construction, field.id, 'operable')
  resolved = topology.resolveConstructionTopology(construction)
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  for (const field of resolved.fields) resolution = profiles.setFieldSashProfileAssignment(resolution, system, 'window', field, '482.05')
  const model = build(construction, resolution)
  assert.equal(model.expectedBoundaryCount, 8)
  assert.equal(model.resolvedBoundaryCount, 0)
  assert.equal(model.technicalReadyBoundaryCount, 0)
  assert.equal(model.blockedBoundaryCount, 8)
  assert.ok(model.boundaryCoverage.every((entry) => entry.status === 'support-unresolved'))
  assert.equal(model.joints.length, 0, 'Unsupported polygon boundaries must not fabricate joints')
}

console.log('=== ASSEMBLY FUNCTIONALITY 01B RUNTIME PASS ===')
console.log('OPERABLE FIELD FOUR-SIDE COVERAGE: LEFT / RIGHT / TOP / BOTTOM PASS')
console.log('MULTI-FIELD FRAME + DIVIDER COVERAGE: PASS')
console.log('FIXED FIELD FALSE SASH BOUNDARIES: NO')
console.log('LEFT/RIGHT CORRECTION: 8.5 mm; TOP/BOTTOM CORRECTION: 8 mm')
console.log('MISSING TECHNICAL SECTION: EXPLICIT BLOCK / NO SUBSTITUTE GEOMETRY')
console.log('MISSING SYSTEM RULE: EXPLICIT BLOCK')
console.log('UNSUPPORTED ANGLED/POLYGON SUPPORT: EXPLICIT BLOCK / NO SILENT SKIP')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
