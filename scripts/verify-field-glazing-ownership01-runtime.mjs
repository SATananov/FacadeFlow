import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const profile = load('src/domain/profileResolution')
const data = load('src/data/profileSystems')
const construction = load('src/domain/construction')
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')

const system = data.getProfileSystemById('kmg-prelude-60')
assert.ok(system)
const fixed = { id: 'field-1', fieldType: 'fixed' }
const operable = { id: 'field-2', fieldType: 'operable' }
let passed = 0
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`) }

function baseResolution() {
  let value = profile.createModuleProfileResolution(system.id)
  value = profile.setFrameProfileAssignment(value, system, '482.30')
  value = profile.setFieldSashProfileAssignment(value, system, 'window', operable, '482.05')
  return value
}

test('offer default establishes effective FIELD specification and thickness without copying a FIELD override', () => {
  const value = baseResolution()
  const effective = profile.getEffectiveFieldGlazingSpecification(value, 'b-b-24', fixed.id)
  assert.deepEqual(effective, { glazingId: 'b-b-24', thicknessMm: 24, source: 'offer-default' })
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', fixed.id), 24)
  assert.deepEqual(value.fieldGlazingSpecifications, {})
})

test('module override supersedes offer default for every FIELD without mutating topology', () => {
  const value = profile.setModuleGlazingSpecificationAssignment(
    baseResolution(), system, 'b-b-24', [fixed, operable], 'b-b-32',
  )
  assert.equal(profile.getEffectiveFieldGlazingSpecification(value, 'b-b-24', fixed.id).source, 'module-override')
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', fixed.id), 32)
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', operable.id), 32)
})

test('FIELD override supersedes module override and remains isolated to that FIELD', () => {
  let value = profile.setModuleGlazingSpecificationAssignment(
    baseResolution(), system, 'b-b-24', [fixed, operable], 'b-b-32',
  )
  value = profile.setFieldGlazingSpecificationAssignment(value, system, 'b-b-24', fixed, 'k-b-4s-44')
  assert.deepEqual(profile.getEffectiveFieldGlazingSpecification(value, 'b-b-24', fixed.id), {
    glazingId: 'k-b-4s-44', thicknessMm: 44, source: 'field-override',
  })
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', operable.id), 32)
})

test('explicit FIELD thickness is a technical override above inherited specification thickness', () => {
  let value = baseResolution()
  value = profile.setFieldHumanGlazingThicknessAssignment(value, system, fixed, 32, 'b-b-24')
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', fixed.id), 32)
  value = profile.setFieldHumanGlazingThicknessAssignment(value, system, fixed, null, 'b-b-24')
  assert.equal(profile.getEffectiveFieldGlazingThicknessMm(value, 'b-b-24', fixed.id), 24)
})

test('bead uses effective inherited thickness and is invalidated when FIELD specification becomes incompatible', () => {
  let value = baseResolution()
  value = profile.setFieldGlazingBeadAssignment(value, system, fixed, null, '482.15', 'b-b-24')
  assert.equal(value.fieldGlazingBeads[fixed.id]?.profileCode, '482.15')
  value = profile.setFieldGlazingSpecificationAssignment(value, system, 'b-b-24', fixed, 'k-b-4s-44')
  assert.equal(value.fieldGlazingBeads[fixed.id], undefined)
})

test('module specification change invalidates only FIELDs whose effective thickness changes', () => {
  let value = baseResolution()
  value = profile.setFieldGlazingSpecificationAssignment(value, system, 'b-b-24', fixed, 'b-4s-24')
  value = profile.setFieldGlazingBeadAssignment(value, system, fixed, null, '482.15', 'b-b-24')
  value = profile.setFieldGlazingBeadAssignment(value, system, operable, null, '482.15', 'b-b-24')
  assert.equal(value.fieldGlazingBeads[fixed.id]?.profileCode, '482.15')
  assert.equal(value.fieldGlazingBeads[operable.id]?.profileCode, '482.15')
  value = profile.setModuleGlazingSpecificationAssignment(value, system, 'b-b-24', [fixed, operable], 'b-b-32')
  assert.equal(value.fieldGlazingBeads[fixed.id]?.profileCode, '482.15')
  assert.equal(value.fieldGlazingBeads[operable.id], undefined)
})

test('reconciliation prunes dangling FIELD glazing ownership and preserves valid scoped overrides', () => {
  let value = baseResolution()
  value = profile.setFieldGlazingSpecificationAssignment(value, system, 'b-b-24', fixed, 'b-b-32')
  value.fieldGlazingSpecifications['field-gone'] = { glazingId: 'b-b-24', source: 'human' }
  value.fieldGlazingThicknesses['field-gone'] = { thicknessMm: 24, source: 'human' }
  const reconciled = profile.reconcileModuleProfileResolution(
    value, system, 'window', [], [fixed, operable], null, 'b-b-24',
  )
  assert.equal(reconciled.fieldGlazingSpecifications['field-gone'], undefined)
  assert.equal(reconciled.fieldGlazingThicknesses['field-gone'], undefined)
  assert.equal(reconciled.fieldGlazingSpecifications[fixed.id]?.glazingId, 'b-b-32')
})

test('legacy resolution without ownership fields normalizes fail-safe and inherits offer default', () => {
  const legacy = baseResolution()
  delete legacy.moduleGlazingSpecification
  delete legacy.fieldGlazingSpecifications
  const effective = profile.getEffectiveFieldGlazingSpecification(legacy, 'b-b-24', fixed.id)
  assert.equal(effective.source, 'offer-default')
  assert.equal(effective.thicknessMm, 24)
})

test('project serialization round trip preserves module and FIELD glazing ownership', () => {
  let counter = 0
  const idFactory = () => `glazing-owner-${++counter}`
  let snapshot = model.createProjectSnapshot(idFactory)
  let topology = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1200, heightMm: 1200 })
  topology = construction.setConstructionFieldType(topology, 'field-1', 'fixed')
  const field = construction.resolveConstructionTopology(topology).fields[0]
  let resolution = profile.setFrameProfileAssignment(null, system, '482.30')
  resolution = profile.setModuleGlazingSpecificationAssignment(resolution, system, null, [field], 'b-b-32')
  resolution = profile.setFieldGlazingSpecificationAssignment(resolution, system, null, field, 'b-4s-24')
  const moduleId = idFactory()
  snapshot = ops.editProject(snapshot, (next) => {
    ops.replaceFreeModules(next, [{ id: moduleId, sequence: 1, profileSystemId: system.id, productType: 'window', profileResolution: resolution }])
    next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: topology.frame, topology }
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = moduleId
    next.workspace.screen = 'free-constructor'
  })
  const restored = codec.deserializeProject(codec.serializeProject(snapshot))
  const stored = restored.profileResolutionsByModuleId[moduleId]
  assert.equal(stored.moduleGlazingSpecification.glazingId, 'b-b-32')
  assert.equal(stored.fieldGlazingSpecifications[field.id].glazingId, 'b-4s-24')
})

console.log(`FACADEFLOW 0.1.8D FIELD GLAZING OWNERSHIP 01 RUNTIME PASS: ${passed} cases`)
console.log('GLAZING PRECEDENCE: FIELD OVERRIDE > MODULE OVERRIDE > OFFER DEFAULT')
console.log('EFFECTIVE THICKNESS: EXPLICIT FIELD THICKNESS > EFFECTIVE GLAZING SPECIFICATION')
console.log('BEAD INVALIDATION: EFFECTIVE THICKNESS AWARE')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
