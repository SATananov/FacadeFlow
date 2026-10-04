import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')
const projectModel = load('src/domain/project/projectModel')
const projectOperations = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')

function makeLayout(layout, widths = [700, 1100, 600], heights = [1200, 2100, 900]) {
  const composition = compositionApi.createIncompleteCombinedComposition(layout)
  composition.regions = composition.regions.map((region, index) => ({ ...region, fieldId: `field-${layout}-${index + 1}` }))
  composition.zeroDividers = composition.regions.slice(0, -1).map((region, index) => ({
    id: `relation-${layout}-${index + 1}`,
    boundaryId: `legacy-boundary-${layout}-${index + 1}`,
    leftRegionId: region.id,
    rightRegionId: composition.regions[index + 1].id,
    kind: 'ZERO_DIVIDER',
  }))
  let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
  for (let index = 0; index < composition.regions.length; index += 1) {
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[index].id, 'widthMm', widths[index])
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[index].id, 'heightMm', heights[index])
  }
  return { composition, geometry }
}

const roleExpectations = {
  'window-left': ['WINDOW_REGION', 'DOOR_REGION'],
  'window-right': ['DOOR_REGION', 'WINDOW_REGION'],
  'window-both': ['WINDOW_REGION', 'DOOR_REGION', 'WINDOW_REGION'],
}
for (const [layout, roles] of Object.entries(roleExpectations)) {
  const { composition, geometry } = makeLayout(layout)
  const resolved = geometryApi.resolveCombinedRegionGeometry(composition, geometry)
  assert.equal(resolved.status, 'complete')
  assert.deepEqual(composition.regions.map((region) => region.role), roles)
  assert.equal(resolved.regions.length, roles.length)
  assert.ok(resolved.regions.every(({ bounds }) => bounds.yMm === 0), 'approved top alignment')
  assert.equal(resolved.zeroDividers.length, roles.length - 1)
  assert.ok(resolved.zeroDividers.every((line, index) => line.start.xMm === resolved.regions[index].bounds.xMm + resolved.regions[index].bounds.widthMm
    && line.start.xMm === resolved.regions[index + 1].bounds.xMm
    && line.end.yMm - line.start.yMm === Math.min(resolved.regions[index].bounds.heightMm, resolved.regions[index + 1].bounds.heightMm)))
  assert.ok(resolved.zeroDividers.every((line) => !Object.hasOwn(line, 'thicknessMm')))
  assert.equal(geometry.regions.length, roles.length, 'void is not materialized as an extra field')
  assert.ok(resolved.outline.some((segment) => segment.start.xMm === segment.end.xMm && segment.start.yMm !== segment.end.yMm), 'outline is resolved from region rectangle edges')
}

const left = makeLayout('window-left')
const leftResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, left.geometry)
assert.equal(leftResolved.extent.widthMm, 1800)
assert.equal(leftResolved.extent.heightMm, 2100)
assert.equal(leftResolved.zeroDividers[0].end.yMm, 1200, 'shared edge terminates at the shorter window bottom')
assert.ok(leftResolved.outline.some((segment) => segment.start.xMm === 700 && segment.end.xMm === 700 && Math.min(segment.start.yMm, segment.end.yMm) === 1200 && Math.max(segment.start.yMm, segment.end.yMm) === 2100), 'step contour follows the exterior edge below the window')
assert.equal(geometryApi.findCombinedRegionAtPoint(left.composition, left.geometry, { xMm: 350, yMm: 1500 }), null, 'area below short window is exterior void')
assert.equal(geometryApi.findCombinedRegionAtPoint(left.composition, left.geometry, { xMm: 900, yMm: 1500 })?.fieldId, 'field-window-left-2')
assert.equal(geometryApi.findCombinedZeroDividerAtPoint(left.composition, left.geometry, { xMm: 700, yMm: 700 }, 0)?.relationId, 'relation-window-left-1')

const widerWindow = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, left.composition.regions[0].id, 'widthMm', 800)
const widerWindowResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, widerWindow)
assert.equal(widerWindowResolved.regions[1].bounds.xMm, 800, 'following door translates with the boundary')
assert.equal(widerWindowResolved.regions[1].bounds.widthMm, 1100, 'door width stays unchanged')
assert.equal(widerWindowResolved.extent.widthMm, 1900)
const placedOriginGeometry = structuredClone(left.geometry)
placedOriginGeometry.regions.forEach((region) => { region.bounds.xMm = (region.bounds.xMm ?? 0) + 120 })
const originEdit = geometryApi.setCombinedRegionDimensions(left.composition, placedOriginGeometry, left.composition.regions[0].id, 'widthMm', 800)
assert.equal(geometryApi.resolveCombinedRegionGeometry(left.composition, originEdit).regions[0].bounds.xMm, 120, 'individual edit preserves module-local origin')
const widerDoor = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, left.composition.regions[1].id, 'widthMm', 1250)
const widerDoorResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, widerDoor)
assert.equal(widerDoorResolved.regions[0].bounds.widthMm, 700, 'window width stays unchanged')
assert.equal(widerDoorResolved.regions[1].bounds.widthMm, 1250)
const shorterWindow = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, left.composition.regions[0].id, 'heightMm', 900)
const shorterWindowResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, shorterWindow)
assert.equal(shorterWindowResolved.regions[1].bounds.heightMm, 2100)
assert.equal(shorterWindowResolved.zeroDividers[0].end.yMm, 900)

const both = makeLayout('window-both')
const bothEdit = geometryApi.setCombinedRegionDimensions(both.composition, both.geometry, both.composition.regions[1].id, 'widthMm', 1300)
const bothEdited = geometryApi.resolveCombinedRegionGeometry(both.composition, bothEdit)
assert.equal(bothEdited.regions[0].bounds.widthMm, 700)
assert.equal(bothEdited.regions[1].bounds.widthMm, 1300)
assert.equal(bothEdited.regions[2].bounds.xMm, 2000)
assert.equal(bothEdited.regions[2].bounds.widthMm, 600)

const proportionalWidth = geometryApi.proportionallyResizeCombinedRegions(left.composition, left.geometry, { widthMm: 3600 })
const proportionalWidthResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, proportionalWidth)
assert.equal(proportionalWidthResolved.regions[0].bounds.widthMm, 1400)
assert.equal(proportionalWidthResolved.regions[1].bounds.widthMm, 2200)
const proportionalHeight = geometryApi.proportionallyResizeCombinedRegions(left.composition, left.geometry, { heightMm: 4200 })
assert.equal(geometryApi.resolveCombinedRegionGeometry(left.composition, proportionalHeight).regions[0].bounds.heightMm, 2400)
const proportionalBoth = geometryApi.proportionallyResizeCombinedRegions(left.composition, left.geometry, { widthMm: 3600, heightMm: 4200 })
const proportionalBothResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, proportionalBoth)
assert.equal(proportionalBothResolved.regions[1].bounds.widthMm, 2200)
assert.equal(proportionalBothResolved.regions[1].bounds.heightMm, 4200)

const incomplete = geometryApi.createIncompleteCombinedRegionGeometry(left.composition)
assert.equal(geometryApi.resolveCombinedRegionGeometry(left.composition, incomplete).status, 'incomplete')
const invalid = structuredClone(left.geometry)
invalid.regions[1].bounds.xMm += 1
assert.equal(geometryApi.resolveCombinedRegionGeometry(left.composition, invalid).status, 'invalid', 'broken adjacency fails closed')

let ids = 0
let snapshot = projectModel.createProjectSnapshot(() => `combined-region-project-${++ids}`)
const moduleId = 'combined-region-round-trip'
snapshot = projectOperations.editProject(snapshot, (next) => {
  projectOperations.replaceFreeModules(next, [{
    id: moduleId, sequence: 1, profileSystemId: '', productType: 'combined-door-window', combinedLayout: 'window-left',
    combinedComposition: left.composition, combinedRegionGeometry: left.geometry, profileResolution: null,
  }])
})
const roundTrip = codec.deserializeProject(codec.serializeProject(snapshot))
assert.deepEqual(roundTrip.modulesById[moduleId].definition.kind === 'free'
  ? roundTrip.modulesById[moduleId].definition.combinedRegionGeometry : null, left.geometry)

let legacySnapshot = projectModel.createProjectSnapshot(() => `legacy-phase-b-${++ids}`)
const legacyModuleId = 'legacy-phase-b-module'
const construction = load('src/domain/construction')
const legacyTopology = construction.splitFieldSemantic(construction.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 900 }), 'field-1', 400)
legacySnapshot = projectOperations.editProject(legacySnapshot, (next) => {
  projectOperations.replaceFreeModules(next, [{ id: legacyModuleId, sequence: 1, profileSystemId: '', productType: 'combined-door-window', combinedLayout: 'window-left', combinedComposition: left.composition, profileResolution: null }])
  next.constructionDraftsByModuleId[legacyModuleId] = { version: 'constructor-01d', frame: legacyTopology.frame, topology: legacyTopology }
})
const oldRoundTrip = codec.deserializeProject(codec.serializeProject(legacySnapshot))
assert.equal(oldRoundTrip.modulesById[legacyModuleId].definition.kind === 'free'
  ? oldRoundTrip.modulesById[legacyModuleId].definition.combinedRegionGeometry ?? null : null, null, 'Phase B offsets do not generate region bounds')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
assert.match(shell, /combinedRegionGeometry: cloneCombinedRegionGeometry\(combinedRegionGeometryRef\.current\)/, 'history captures region geometry')
assert.match(shell, /combinedRegionGeometryRef\.current = cloneCombinedRegionGeometry\(restored\.combinedRegionGeometry\)/, 'history restores region geometry')
assert.match(shell, /className="constructor-combined-outline"/, 'combined-only outline is rendered')
assert.match(shell, /findCombinedRegionAtPoint\(/, 'combined field pointer path hit-tests explicit bounds')
assert.match(shell, /!combinedGeometryOwnsView && semanticBoundaries\.map/, 'legacy split markers are inert after geometry authority changes')

console.log('COMBINED REGION GEOMETRY 01: PASS')
console.log('LAYOUTS: WINDOW_LEFT / WINDOW_RIGHT / WINDOW_BOTH roles and derived boundaries verified')
console.log('RESIZE: individual region translation and proportional module width/height verified')
console.log('STEPPED OUTLINE: shorter window exterior void remains field-free')
console.log('PERSISTENCE: round-trip and legacy Phase B no-inference verified')
console.log('UNDO/REDO: geometry capture/restore wiring verified')
