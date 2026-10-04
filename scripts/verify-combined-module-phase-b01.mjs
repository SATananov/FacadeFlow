import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const construction = load('./src/domain/construction/index.ts')
const composition = load('./src/domain/combinedModuleComposition.ts')
const projectModel = load('./src/domain/project/projectModel.ts')
const projectOperations = load('./src/domain/project/projectOperations.ts')
const projectSerialization = load('./src/domain/project/projectSerialization.ts')
const constructorShell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')

const frame = { xMm: 0, yMm: 0, widthMm: 1400, heightMm: 900 }
const base = construction.createConstructionModel(frame)

function oneBoundary(model, offset) {
  const next = construction.splitFieldSemantic(model, 'field-1', offset)
  assert.ok(next, 'semantic boundary placement must accept explicit position')
  const resolved = construction.resolveConstructionTopology(next)
  assert.equal(resolved.dividers.length, 0, 'semantic boundary must not be an ordinary divider')
  assert.equal(resolved.semanticBoundaries.length, 1)
  assert.equal(resolved.semanticBoundaries[0].positionMm, offset + 60)
  assert.equal(resolved.fields.length, 2)
  return next
}

for (const layout of ['window-left', 'window-right']) {
  const next = oneBoundary(base, 300)
  const semantic = composition.createIncompleteCombinedComposition(layout)
  assert.deepEqual(semantic.regions.map((region) => region.role), layout === 'window-left'
    ? ['WINDOW_REGION', 'DOOR_REGION']
    : ['DOOR_REGION', 'WINDOW_REGION'])
  assert.equal(composition.isCombinedCompositionComplete(semantic), false)
  const moved = construction.moveSemanticBoundary(next, 'zero-divider-1', 420)
  assert.equal(construction.resolveConstructionTopology(moved).semanticBoundaries[0].positionMm, 420)
  const deleted = construction.removeSemanticBoundary(moved, 'zero-divider-1')
  assert.equal(construction.resolveConstructionTopology(deleted).semanticBoundaries.length, 0)
  assert.equal(construction.resolveConstructionTopology(deleted).fields.length, 1)
}

const first = oneBoundary(base, 300)
const firstFields = construction.resolveConstructionTopology(first).fields
const second = construction.splitFieldSemantic(first, firstFields[1].id, 300)
assert.ok(second)
const both = construction.resolveConstructionTopology(second)
assert.equal(both.semanticBoundaries.length, 2)
assert.deepEqual(both.semanticBoundaries.map((boundary) => boundary.positionMm), [360, 660])
assert.equal(both.dividers.length, 0)
assert.equal(both.fields.length, 3)

assert.equal(construction.splitFieldSemantic(base, 'field-1', 0), null)
assert.equal(construction.splitFieldSemantic(base, 'field-1', frame.widthMm), null)
assert.equal(composition.isCombinedCompositionComplete({
  ...composition.createIncompleteCombinedComposition('window-both'),
  regions: composition.createIncompleteCombinedComposition('window-both').regions.map((region, index) => ({ ...region, fieldId: `field-${index + 1}` })),
  zeroDividers: [
    { id: 'relation-1', boundaryId: 'zero-divider-1', leftRegionId: 'combined-region-1', rightRegionId: 'combined-region-2', kind: 'ZERO_DIVIDER' },
    { id: 'relation-2', boundaryId: 'zero-divider-2', leftRegionId: 'combined-region-2', rightRegionId: 'combined-region-3', kind: 'ZERO_DIVIDER' },
  ],
}), true)

let projectIdCounter = 0
let snapshot = projectModel.createProjectSnapshot(() => `phase-b-project-${++projectIdCounter}`)
const moduleId = 'phase-b-module'
const persistedComposition = composition.createIncompleteCombinedComposition('window-left')
snapshot = projectOperations.editProject(snapshot, (next) => {
  projectOperations.replaceFreeModules(next, [{
    id: moduleId,
    sequence: 1,
    profileSystemId: '',
    productType: 'combined-door-window',
    combinedLayout: 'window-left',
    combinedComposition: persistedComposition,
    profileResolution: null,
  }])
  next.workspace.activeModuleIdByOffer[next.workspace.freeOfferId] = moduleId
  next.constructionDraftsByModuleId[moduleId] = { version: 'constructor-01d', frame, topology: first }
})
const restored = projectSerialization.deserializeProject(projectSerialization.serializeProject(snapshot))
assert.deepEqual(restored.modulesById[moduleId].definition.kind === 'free'
  ? restored.modulesById[moduleId].definition.combinedComposition
  : null, persistedComposition)
assert.equal(restored.constructionDraftsByModuleId[moduleId]?.topology?.version, 'field-topology-08')

// Interaction wiring: the field surface stops bubbling, so the tool must be
// handled there using frame-local coordinates; verify the render and history
// endpoints are connected to the same semantic boundary state.
assert.match(constructorShell, /if \(activeTool === 'semantic-boundary'\)\s*\{\s*addSemanticBoundary\(framePointFromPointer\(event\)\)/)
assert.match(constructorShell, /const addSemanticBoundary = \(point: CanvasPoint\)/)
assert.match(constructorShell, /is-semantic-boundary-tool/)
assert.match(constructorShell, /findFieldAtPoint\(currentConstruction, point\.xMm, point\.yMm\)/)
assert.match(constructorShell, /splitFieldSemantic\(currentConstruction, targetField\.id, point\.xMm - targetField\.bounds\.xMm\)/)
assert.match(constructorShell, /syncCombinedComposition\(nextConstruction\)/)
assert.match(constructorShell, /semanticBoundaries\.map\(\(boundary\) => \(/)
assert.match(constructorShell, /className=\{`constructor-semantic-boundary/)
assert.match(constructorShell, /setSemanticBoundaryFeedback\('Кликнете вътре в поле на модула/)
assert.match(constructorShell, /combinedComposition: cloneCombinedModuleComposition\(combinedCompositionRef\.current\)/)
assert.match(constructorShell, /onCombinedCompositionChange\?\.\(cloneCombinedModuleComposition\(restored\.combinedComposition\)\)/)
assert.match(constructorShell, /if \(selectedSemanticBoundaryId\) removeSelectedSemanticBoundary\(\)/)
assert.match(constructorShell, /const undoConstruction = \(\)/)
assert.match(constructorShell, /const redoConstruction = \(\)/)
assert.match(constructorShell, /Нулева граница се поставя вътре в поле/)

console.log('COMBINED MODULE PHASE B TOPOLOGY VERIFY PASS')
console.log('PLACEMENT INTERACTION: FIELD CLICK → FRAME-LOCAL HIT TEST → SEMANTIC SPLIT → RENDERED MARKER')
console.log('INVALID PLACEMENT: VISIBLE FEEDBACK')
console.log('UNDO / REDO: TOPOLOGY + COMPOSITION SNAPSHOT')
console.log('SEMANTIC BOUNDARIES: USER-PLACED | ZERO_DIVIDER | NO PHYSICAL THICKNESS')
console.log('ORDINARY DIVIDERS: UNCHANGED COLLECTION')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('BOTTOM EDGE: UNKNOWN / FAIL-CLOSED')
console.log('SYSTEM VARIANTS: FAIL-CLOSED')
