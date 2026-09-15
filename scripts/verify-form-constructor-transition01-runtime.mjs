import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const construction = load('src/domain/construction')
const transition = load('src/domain/formConstructorTransition')
const modulesDomain = load('src/domain/offerModules')
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const defaults = load('src/domain/offerModuleDefaults')

let passed = 0
let counter = 0
const idFactory = () => `transition-test-${++counter}`
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`) }

function canonicalDescriptions() {
  return [
    {
      sequence: 1,
      constructionFieldId: null,
      fieldType: 'operable', fieldTypeSource: 'preset',
      openingMode: 'tilt-turn', openingModeSource: 'preset',
      openingHanding: 'left', openingHandingSource: 'preset',
    },
    {
      sequence: 2,
      constructionFieldId: null,
      fieldType: 'fixed', fieldTypeSource: 'preset',
      openingMode: null, openingModeSource: 'unset',
      openingHanding: null, openingHandingSource: 'unset',
    },
  ]
}

function describedOfferModule() {
  const settings = {
    profileSystemId: 'kmg-prelude-60', colorId: '', foilModeId: '', glazingId: '',
    hardwareStandardId: '', hardwareManufacturerId: 'unspecified',
  }
  const module = modulesDomain.createOfferModule(defaults.buildOfferModuleDefaults(settings), 1, idFactory())
  module.productType = 'window'; module.productTypeSource = 'preset'
  module.widthMm = 1600; module.widthSource = 'manual'
  module.heightMm = 1400; module.heightSource = 'manual'
  module.fieldCount = 2; module.fieldCountSource = 'preset'
  module.fields = modulesDomain.resizeOfferModuleFields([], 2)
  Object.assign(module.fields[0], {
    fieldType: 'operable', fieldTypeSource: 'preset',
    openingMode: 'tilt-turn', openingModeSource: 'preset',
    openingHanding: 'left', openingHandingSource: 'preset',
  })
  Object.assign(module.fields[1], { fieldType: 'fixed', fieldTypeSource: 'preset' })
  return module
}

function projectFixture() {
  let snapshot = model.createProjectSnapshot(idFactory)
  const module = describedOfferModule()
  snapshot = ops.editProject(snapshot, (next) => {
    const offer = model.getEditingOffer(next)
    const { inheritanceMode: _inheritanceMode, ...offerSettings } = module.inheritedDefaults
    Object.assign(offer.settingsDraft, offerSettings)
    ops.replaceOfferModules(next, [module])
    next.workspace.activeModuleIdByOffer[offer.id] = module.id
    offer.setupStage = 'modules'
  })
  return { snapshot, moduleId: module.id }
}

test('count mismatch preserves topology geometry and does not force form semantics into one FIELD', () => {
  const base = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  const transferred = transition.transferFormFieldDescriptionsToConstruction(base, canonicalDescriptions())
  assert.deepEqual(transferred, base)
  assert.equal(construction.resolveConstructionTopology(transferred).fields[0].fieldType, null)
})

test('matching human-created FIELD count transfers canonical descriptions by sequence without changing geometry', () => {
  const base = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  const split = construction.splitField(base, 'field-1', 'vertical', 700)
  assert.ok(split)
  const before = construction.resolveConstructionTopology(split)
  const transferred = transition.transferFormFieldDescriptionsToConstruction(split, canonicalDescriptions())
  const after = construction.resolveConstructionTopology(transferred)
  assert.deepEqual(after.dividers, before.dividers)
  assert.deepEqual(transferred.frame, split.frame)
  assert.equal(after.fields[0].fieldType, 'operable')
  assert.equal(after.fields[0].openingMode, 'tilt-turn')
  assert.equal(after.fields[0].openingHanding, 'left')
  assert.equal(after.fields[1].fieldType, 'fixed')
})

test('manual/custom descriptions never fabricate canonical Constructor semantics', () => {
  const base = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 900, heightMm: 900 })
  const descriptions = [{
    sequence: 1, constructionFieldId: null,
    fieldType: null, fieldTypeSource: 'manual',
    openingMode: null, openingModeSource: 'unset',
    openingHanding: null, openingHandingSource: 'unset',
  }]
  const transferred = transition.transferFormFieldDescriptionsToConstruction(base, descriptions)
  assert.deepEqual(transferred, base)
  assert.equal(construction.resolveConstructionTopology(transferred).fields[0].fieldType, null)
})

test('first topology write retains semantic-only form payload while FIELD count is unresolved', () => {
  const { snapshot, moduleId } = projectFixture()
  const topology = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  const transitioned = ops.editProject(snapshot, (next) => {
    next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: topology.frame, topology }
  })
  const raw = transitioned.modulesById[moduleId].definition.draft
  assert.equal(raw.widthMm, null); assert.equal(raw.heightMm, null); assert.equal(raw.fieldCount, null)
  assert.equal(raw.fields.length, 2)
  assert.equal(raw.fields[0].widthMm, null); assert.equal(raw.fields[0].widthSource, 'unset')
  assert.equal(raw.fields[0].fieldType, 'operable'); assert.equal(raw.fields[0].fieldTypeSource, 'preset')
  assert.equal(raw.fields[0].openingMode, 'tilt-turn'); assert.equal(raw.fields[0].openingHanding, 'left')
  assert.equal(raw.fields[1].fieldType, 'fixed')
  codec.validateProjectSnapshot(transitioned)
  assert.deepEqual(codec.deserializeProject(codec.serializeProject(transitioned)), transitioned)
})

test('matching transferred topology consumes preset transition payload and becomes canonical', () => {
  const { snapshot, moduleId } = projectFixture()
  let topology = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  topology = construction.splitField(topology, 'field-1', 'vertical', 700)
  assert.ok(topology)
  topology = transition.transferFormFieldDescriptionsToConstruction(topology, canonicalDescriptions())
  const transitioned = ops.editProject(snapshot, (next) => {
    next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: topology.frame, topology }
  })
  const raw = transitioned.modulesById[moduleId].definition.draft
  assert.deepEqual(raw.fields, [])
  const view = model.getOfferModules(transitioned)[0]
  assert.equal(view.fields.length, 2)
  assert.equal(view.fields[0].fieldTypeSource, 'constructor')
  assert.equal(view.fields[0].fieldType, 'operable')
  assert.equal(view.fields[0].openingMode, 'tilt-turn')
  assert.equal(view.fields[0].openingHanding, 'left')
  assert.equal(view.fields[1].fieldType, 'fixed')
  codec.validateProjectSnapshot(transitioned)
})

test('manual transition payload survives matching topology instead of being silently dropped', () => {
  const { snapshot, moduleId } = projectFixture()
  const modified = ops.editProject(snapshot, (next) => {
    const raw = next.modulesById[moduleId].definition.draft
    raw.fields[0].fieldType = null
    raw.fields[0].fieldTypeSource = 'manual'
    raw.fields[0].customFieldTypeLabel = 'специално поле'
    raw.fields[0].openingMode = null; raw.fields[0].openingModeSource = 'unset'; raw.fields[0].openingHanding = null; raw.fields[0].openingHandingSource = 'unset'
  })
  let topology = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  topology = construction.splitField(topology, 'field-1', 'vertical', 700)
  const transitioned = ops.editProject(modified, (next) => {
    next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: topology.frame, topology }
  })
  const pending = transitioned.modulesById[moduleId].definition.draft.fields
  assert.equal(pending.length, 2)
  assert.equal(pending[0].constructionFieldId, construction.resolveConstructionTopology(topology).fields[0].id)
  assert.equal(pending[0].fieldTypeSource, 'manual')
  assert.equal(pending[0].customFieldTypeLabel, 'специално поле')
  codec.validateProjectSnapshot(transitioned)
})

test('validator rejects geometry or constructor semantics inside transition payload', () => {
  const { snapshot, moduleId } = projectFixture()
  const topology = construction.createConstructionModel({ xMm: 10, yMm: 20, widthMm: 1600, heightMm: 1400 })
  const transitioned = ops.editProject(snapshot, (next) => {
    next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame: topology.frame, topology }
  })
  const corruptGeometry = structuredClone(transitioned)
  corruptGeometry.modulesById[moduleId].definition.draft.fields[0].widthMm = 500
  assert.throws(() => codec.validateProjectSnapshot(corruptGeometry))
  const corruptSource = structuredClone(transitioned)
  corruptSource.modulesById[moduleId].definition.draft.fields[0].fieldTypeSource = 'constructor'
  assert.throws(() => codec.validateProjectSnapshot(corruptSource))
})

console.log(`FACADEFLOW 0.1.8C FORM -> CONSTRUCTOR TRANSITION RUNTIME PASS: ${passed} cases`)
console.log('FORM FIELD SEMANTICS: PRESERVED UNTIL CANONICAL TRANSFER')
console.log('MATCHING FIELD COUNT: PRESET SEMANTICS TRANSFER BY ID/SEQUENCE')
console.log('MANUAL/CUSTOM SEMANTICS: RETAINED FOR HUMAN RESOLUTION')
console.log('AUTOMATIC DIVIDER GEOMETRY: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
