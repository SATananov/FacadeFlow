import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')
const projectModel = load('src/domain/project/projectModel')
const projectOperations = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')

for (const layout of ['window-left', 'window-right', 'window-both']) {
  const composition = compositionApi.createCombinedRegionComposition(layout)
  assert.ok(composition.regions.every((region) => region.fieldId === null), 'new layout has no fabricated Constructor field mapping')
  assert.equal(composition.zeroDividers.length, composition.regions.length - 1, 'layout owns semantic adjacency only')
  const geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
  assert.ok(geometry, 'incomplete geometry can be created before any semantic split')
  assert.equal(geometryApi.resolveCombinedRegionGeometry(composition, geometry).status, 'incomplete')

  let entered = geometry
  const widths = layout === 'window-both' ? [700, 1100, 600] : [700, 1100]
  const heights = layout === 'window-both' ? [1200, 2100, 1000] : [1200, 2100]
  composition.regions.forEach((region, index) => {
    entered = geometryApi.setCombinedRegionDimensions(composition, entered, region.id, 'widthMm', widths[index])
    entered = geometryApi.setCombinedRegionDimensions(composition, entered, region.id, 'heightMm', heights[index])
  })
  const resolved = geometryApi.resolveCombinedRegionGeometry(composition, entered)
  assert.equal(resolved.status, 'complete', 'explicit region dimensions resolve without Constructor split fields')
  assert.equal(resolved.zeroDividers.length, composition.regions.length - 1, 'ZERO_DIVIDER follows derived shared edges')
  assert.ok(resolved.regions.every((region) => region.fieldId === null), 'no dummy field IDs are introduced')
  if (layout === 'window-left') {
    assert.equal(resolved.zeroDividers[0].end.yMm, 1200)
    assert.equal(geometryApi.findCombinedRegionAtPoint(composition, entered, { xMm: 350, yMm: 1500 }), null, 'short-window exterior remains void')
  }
}

const composition = compositionApi.createCombinedRegionComposition('window-left')
let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
for (const [region, width, height] of [[composition.regions[0], 700, 1200], [composition.regions[1], 1100, 2100]]) {
  geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'widthMm', width)
  geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'heightMm', height)
}
let id = 0
let snapshot = projectModel.createProjectSnapshot(() => `phase-c-no-split-${++id}`)
snapshot = projectOperations.editProject(snapshot, (next) => projectOperations.replaceFreeModules(next, [{
  id: 'phase-c-no-split-module', sequence: 1, profileSystemId: '', productType: 'combined-door-window',
  combinedLayout: 'window-left', combinedComposition: composition, combinedRegionGeometry: geometry, profileResolution: null,
}]))
const restored = codec.deserializeProject(codec.serializeProject(snapshot))
assert.deepEqual(restored.modulesById['phase-c-no-split-module'].definition.combinedRegionGeometry, geometry, 'unmapped explicit geometry round-trips')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
assert.match(shell, /createCombinedRegionComposition\(layout\)/, 'layout selection starts Phase C semantic composition')
assert.match(shell, /createIncompleteCombinedRegionGeometry\(composition\)/, 'layout selection initializes unset dimensions without topology mutation')
assert.doesNotMatch(shell, /<b>Постави нулева граница<\/b>/, 'manual ZERO_DIVIDER toolbar action is absent')
assert.match(shell, /if \(moduleSummary\.productType === 'combined-door-window'\)\s*\{\s*setSemanticBoundaryFeedback\([\s\S]{0,160}return false/, 'legacy click handler fails closed in combined mode')
assert.match(shell, /regionEntries\.length > 0/, 'region dimension entry is available before field mapping')
assert.match(shell, /combinedGeometryResolution\.status === 'incomplete' \? topologyFields : \[\]/, 'existing construction remains visible while dimensions are incomplete')
assert.match(shell, /combinedGeometryResolution\.zeroDividers\.map/, 'render derives semantic marker from shared edges')
assert.match(shell, /constructor-combined-region-surface/, 'unmapped semantic regions have a dedicated drawing surface')
assert.match(shell, /disabled=\{!frame \|\| combinedRegionMode\}/, 'ordinary split controls do not alter Phase C combined geometry')

console.log('COMBINED PHASE C ZERO_DIVIDER TOOL CONFLICT 01: PASS')
console.log('NEW LAYOUT: region dimensions accepted with null field mappings and no manual split')
console.log('ZERO_DIVIDER: derived from adjacent explicit bounds; short-window exterior remains empty')
console.log('PERSISTENCE: unmapped Phase C geometry round-trips; legacy Phase B data is not migrated')
console.log('TOOL: hidden from combined workflow; stale click path fails closed')
