import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')

function makeComplete(layout) {
  const composition = compositionApi.createCombinedRegionComposition(layout)
  let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
  const dimensions = layout === 'window-both'
    ? [[700, 1200], [1100, 2100], [600, 1000]]
    : layout === 'window-right' ? [[1100, 2100], [700, 1200]] : [[700, 1200], [1100, 2100]]
  composition.regions.forEach((region, index) => {
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'widthMm', dimensions[index][0])
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'heightMm', dimensions[index][1])
  })
  return { composition, geometry }
}

for (const layout of ['window-left', 'window-right', 'window-both']) {
  const { composition, geometry } = makeComplete(layout)
  for (const region of composition.regions) {
    const original = geometry.regions.find((entry) => entry.regionId === region.id).bounds
    const widthEdit = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'widthMm', original.widthMm + 130)
    const heightEdit = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'heightMm', original.heightMm + 170)
    assert.equal(widthEdit.regions.find((entry) => entry.regionId === region.id).bounds.widthMm, original.widthMm + 130, `${layout}/${region.role}: numeric and drag width share the region geometry operation`)
    assert.equal(heightEdit.regions.find((entry) => entry.regionId === region.id).bounds.heightMm, original.heightMm + 170, `${layout}/${region.role}: numeric and drag height share the region geometry operation`)
    assert.ok(heightEdit.regions.every((entry) => entry.bounds.yMm === 0), 'top alignment remains anchored')
    const next = geometryApi.resolveCombinedRegionGeometry(composition, widthEdit)
    assert.equal(next.status, 'complete')
    assert.ok(next.zeroDividers.every((line, index) => line.start.xMm === next.regions[index].bounds.xMm + next.regions[index].bounds.widthMm
      && line.start.xMm === next.regions[index + 1].bounds.xMm), 'ZERO_DIVIDER remains derived from shared edges')
  }
}

const left = makeComplete('window-left')
const original = geometryApi.resolveCombinedRegionGeometry(left.composition, left.geometry)
const windowRegion = left.composition.regions[0]
const doorRegion = left.composition.regions[1]
const resizedWindow = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, windowRegion.id, 'widthMm', 900)
const resizedWindowResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, resizedWindow)
assert.equal(resizedWindowResolved.regions[0].bounds.widthMm, 900)
assert.equal(resizedWindowResolved.regions[1].bounds.xMm, 900, 'downstream door translates with window width')
assert.equal(resizedWindowResolved.regions[1].bounds.widthMm, original.regions[1].bounds.widthMm, 'downstream door width is preserved')
assert.equal(resizedWindowResolved.zeroDividers[0].start.xMm, 900, 'derived boundary follows the resized window')
const resizedShortWindow = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, windowRegion.id, 'heightMm', 850)
const shortWindowResolved = geometryApi.resolveCombinedRegionGeometry(left.composition, resizedShortWindow)
assert.equal(shortWindowResolved.zeroDividers[0].end.yMm, 850, 'shared contact segment follows shorter window')
assert.equal(geometryApi.findCombinedRegionAtPoint(left.composition, resizedShortWindow, { xMm: 300, yMm: 900 }), null, 'shorter window exposes exterior void, not a field')
const resizedDoor = geometryApi.setCombinedRegionDimensions(left.composition, left.geometry, doorRegion.id, 'widthMm', 1400)
assert.equal(geometryApi.resolveCombinedRegionGeometry(left.composition, resizedDoor).regions[0].bounds.widthMm, 700, 'door resize preserves window width')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
assert.match(shell, /combinedRegionGeometryPreview \?\? moduleSummary\.combinedRegionGeometry/, 'preview is a temporary view of the authoritative geometry')
assert.match(shell, /setCombinedRegionDimensions\(composition, dragState\.originalGeometry, dragState\.regionId, dragState\.dimension, nextValue\)/, 'pointer previews use the same domain resize operation as numeric inputs')
assert.match(shell, /const next = setCombinedRegionDimensions\(composition, combinedRegionGeometryRef\.current, region\.id, dimension, value\)/, 'numeric edit commits use the same domain resize operation')
assert.match(shell, /className="constructor-combined-region-resize-handle is-width-handle"[\s\S]*?startCombinedRegionResize\(region, 'widthMm', event\)/, 'selected region has a direct width handle')
assert.match(shell, /className="constructor-combined-region-resize-handle is-height-handle"[\s\S]*?startCombinedRegionResize\(region, 'heightMm', event\)/, 'selected region has a direct bottom-height handle')
assert.match(shell, /activeTool === 'select' && selectedCombinedRegionId && combinedGeometryResolution\.regions/, 'resize handles are limited to the selected region in select mode')
assert.match(shell, /const nextValue = snapMm\(coordinate - dragState\.grabOffsetMm - origin\)/, 'pointer resize follows existing snap toggle and numeric precision path')
assert.match(shell, /setCombinedRegionWidthDraft\(nextBounds\?\.widthMm == null \? '' : String\(nextBounds\.widthMm\)\)[\s\S]*?setCombinedRegionHeightDraft\(nextBounds\?\.heightMm == null \? '' : String\(nextBounds\.heightMm\)\)/, 'dimension inputs track live drag preview values')
const releaseBranch = shell.match(/else if \(dragState\.kind === 'combined-region-resize'\) \{([\s\S]*?)\n    \} else if \(/)?.[1]
assert.ok(releaseBranch, 'combined-region drag has a pointer-release commit branch')
assert.equal((releaseBranch.match(/pushUndoEntry\(/g) ?? []).length, 1, 'one drag release creates at most one Undo entry')
assert.equal((releaseBranch.match(/onCombinedRegionGeometryChange\?\./g) ?? []).length, 1, 'drag commits authoritative geometry once on release')
assert.match(releaseBranch, /combinedRegionGeometry: cloneCombinedRegionGeometry\(dragState\.originalGeometry\)/, 'Undo snapshot retains exact pre-drag geometry')
assert.match(shell, /combinedRegionGeometryResolution\.zeroDividers\.map|combinedGeometryResolution\.zeroDividers\.map/, 'drawing derives ZERO_DIVIDER from preview-resolved geometry')
assert.match(css, /\.constructor-combined-region-resize-handle\s*\{[^}]*z-index:\s*10/s, 'resize handles remain above derived boundary hit lines')
assert.doesNotMatch(shell, /kind: 'combined-region-resize'[\s\S]{0,240}offsetMm:/, 'drag state does not introduce independent persisted geometry offsets')

console.log('COMBINED REGION BIDIRECTIONAL DIMENSIONS 01: PASS')
console.log('NUMERIC / POINTER: same combinedRegionGeometry resize operation for every region and axis')
console.log('SYNC: drag preview drives drawing and inspector; release commits one geometry/history action')
console.log('SAFETY: downstream widths preserved, top alignment retained, ZERO_DIVIDER derived, exterior void remains empty')
