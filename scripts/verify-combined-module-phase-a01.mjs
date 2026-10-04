import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const modules = load('src/domain/offerModules')
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const revisions = load('src/domain/project/revisionOperations')
const profileResolution = load('src/domain/profileResolution')
const constructionRules = load('src/data/profileSystems/systemConstructionRules')
const composite = load('src/domain/compositeModuleStructure')

const productTypes = modules.MODULE_PRODUCT_TYPE_PRESETS.map((entry) => entry.id)
assert.deepEqual(productTypes, ['window', 'terrace-door', 'door', 'combined-door-window'])
assert.deepEqual(modules.COMBINED_MODULE_LAYOUT_PRESETS.map((entry) => entry.id), ['window-left', 'window-right', 'window-both'])

let counter = 0
const id = () => `combined-phase-a-${++counter}`
const actor = { id: 'phase-a-operator', label: 'Phase A verifier', identityBasis: 'local-self-asserted' }
const layouts = ['window-left', 'window-right', 'window-both']

function combinedSnapshot(layout) {
  let snapshot = model.createProjectSnapshot(id)
  const moduleId = id()
  snapshot = ops.editProject(snapshot, (next) => {
    ops.replaceFreeModules(next, [{
      id: moduleId, sequence: 1, profileSystemId: '', productType: 'combined-door-window', combinedLayout: layout, profileResolution: null,
    }])
    next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = moduleId
  })
  return { snapshot, moduleId }
}

for (const layout of layouts) {
  const { snapshot, moduleId } = combinedSnapshot(layout)
  const beforeTopology = snapshot.constructionDraftsByModuleId[moduleId]
  const encoded = codec.serializeProject(snapshot)
  const restored = codec.deserializeProject(encoded)
  const definition = restored.modulesById[moduleId].definition
  assert.equal(definition.kind, 'free')
  assert.equal(definition.productType, 'combined-door-window')
  assert.equal(definition.combinedLayout, layout)
  assert.deepEqual(restored.constructionDraftsByModuleId[moduleId], beforeTopology)
}

const legacy = model.createProjectSnapshot(id)
const legacyFreeId = id()
const defaults = load('src/domain/offerModuleDefaults').buildOfferModuleDefaults(model.getEditingOffer(legacy).settingsDraft)
const offerDraft = modules.createOfferModule(defaults, 1, id())
const legacyPrepared = ops.editProject(legacy, (next) => {
  ops.replaceFreeModules(next, [{ id: legacyFreeId, sequence: 1, profileSystemId: '', productType: 'window', profileResolution: null }])
  ops.replaceOfferModules(next, [offerDraft])
})
Object.assign(legacy, legacyPrepared)
delete legacy.modulesById[legacyFreeId].definition.combinedLayout
delete legacy.modulesById[offerDraft.id].definition.draft.combinedLayout
const legacyRestored = codec.deserializeProject(codec.serializeProject(legacy))
assert.equal(model.getFreeModules(legacyRestored)[0].combinedLayout, null)
assert.equal(model.getOfferModules(legacyRestored)[0].combinedLayout, null)

const invalid = combinedSnapshot('window-left').snapshot
invalid.modulesById[Object.keys(invalid.modulesById)[0]].definition.combinedLayout = 'unknown-layout'
assert.throws(() => codec.serializeProject(invalid), /invalid enum/)
const nonCombined = combinedSnapshot('window-left').snapshot
const nonCombinedId = Object.keys(nonCombined.modulesById)[0]
nonCombined.modulesById[nonCombinedId].definition.productType = 'window'
assert.throws(() => codec.serializeProject(nonCombined), /combined layout requires combined module type/)

const cleared = combinedSnapshot('window-left').snapshot
const clearedId = Object.keys(cleared.modulesById)[0]
ops.replaceFreeModules(cleared, [{ id: clearedId, sequence: 1, profileSystemId: '', productType: 'door', combinedLayout: 'window-left', profileResolution: null }])
assert.equal(cleared.modulesById[clearedId].definition.combinedLayout, null)

const historySource = combinedSnapshot('window-left').snapshot
const historyModuleId = Object.keys(historySource.modulesById)[0]
const historyChanged = ops.editProject(historySource, (next) => {
  ops.replaceFreeModules(next, [{ id: historyModuleId, sequence: 1, profileSystemId: '', productType: 'combined-door-window', combinedLayout: 'window-both', profileResolution: null }])
})
const recorded = revisions.recordProjectRevision(historyChanged, actor, '2026-10-04T12:00:00.000Z', id)
const revision = recorded.revisions.revisionsById[recorded.revisions.headRevisionId]
assert.equal(revision.content.modulesById[historyModuleId].definition.combinedLayout, 'window-both')
assert.equal(historySource.modulesById[historyModuleId].definition.combinedLayout, 'window-left')

const construction = load('src/domain/construction')
const topology = construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 1200 })
assert.equal(profileResolution.getFieldSashRole('combined-door-window', 'operable'), null)
assert.equal(constructionRules.getSystemSashConstructionRule({ systemId: 'kmg-prelude-60', productType: 'combined-door-window', frameProfileCode: '482.30', sashProfileCode: '482.05' }), null)
assert.throws(() => composite.validateCompositeModuleStructure({
  schemaVersion: 2, systemId: 'kmg-prelude-60', connections: [], frameParts: [{
    id: 'combined', function: 'combined-door-window', widthMm: 1000, heightMm: 1200, frameProfileCode: null,
    frameSides: { top: true, right: true, bottom: true, left: true }, fieldIds: [], placement: { order: 1, verticalAlignment: 'TOP' },
  }],
}), /invalid function/)
assert.deepEqual(topology.root, { kind: 'field', field: { id: 'field-1', fieldType: null, openingMode: null, openingHanding: null } })

const app = readFileSync('src/App.tsx', 'utf8')
const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const offerModulesSource = readFileSync('src/domain/offerModules.ts', 'utf8')
assert.match(app, /combinedLayout: null/)
assert.match(shell, /Врата \+ прозорец/)
assert.match(offerModulesSource, /Прозорец отляво/)
assert.match(offerModulesSource, /Прозорец отдясно/)
assert.match(offerModulesSource, /Прозорци от двете страни/)
assert.match(shell, /Няма потвърдени системни варианти за този тип модул/)
assert.match(shell, /combinedLayout: combinedLayoutRef\.current/)
assert.match(shell, /moduleSetupMissingItems/)

console.log('COMBINED MODULE PHASE A: PASS — semantic type, layout persistence, legacy loading, project history and fail-closed boundaries')
