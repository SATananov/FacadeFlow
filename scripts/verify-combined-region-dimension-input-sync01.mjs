import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')
const composition = compositionApi.createCombinedRegionComposition('window-left')
let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[0].id, 'widthMm', 700)
geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[0].id, 'heightMm', 1200)
geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[1].id, 'widthMm', 548)
geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, composition.regions[1].id, 'heightMm', 1130)
assert.deepEqual(geometryApi.resolveCombinedRegionGeometry(composition, geometry).regions[1].bounds, { xMm: 700, yMm: 0, widthMm: 548, heightMm: 1130 }, 'authoritative selected door bounds are 548 × 1130')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const syncEffect = shell.match(/useEffect\(\(\) => \{\s*if \(combinedRegionDimensionEdit\) return([\s\S]*?)\n  \}, \[selectedCombinedRegionId[\s\S]*?\]\)/)?.[0]
assert.ok(syncEffect, 'draft synchronization effect exists and defers only while editing')
assert.match(syncEffect, /find\(\(item\) => item\.id === selectedCombinedRegionId\)[\s\S]*?find\(\(item\) => item\.fieldId === selectedFieldId\)/, 'sync resolves the selected region by region ID or selected field ID')
assert.match(syncEffect, /combinedRegionGeometryForView\?\.regions\.find\(\(item\) => item\.regionId === region\?\.id\)/, 'sync reads the authoritative effective geometry bounds')
assert.match(syncEffect, /setCombinedRegionWidthDraft\(bounds\?\.widthMm == null \? '' : String\(bounds\.widthMm\)\)[\s\S]*?setCombinedRegionHeightDraft\(bounds\?\.heightMm == null \? '' : String\(bounds\.heightMm\)\)/, 'both draft values update on selection/geometry changes')

const selectedPane = shell.match(/const renderSelectedCombinedRegionDimensions = \(\) => \{([\s\S]*?)\n  const renderSelectedPropertiesPane/)?.[1]
assert.ok(selectedPane, 'selected-region Dimensions pane exists')
assert.match(selectedPane, /const regionBounds = combinedRegionGeometryForView\?\.regions\.find\(\(region\) => region\.regionId === selectedCombinedRegion\.id\)\?\.bounds/, 'selected input reads its own authoritative region bounds directly')
assert.match(selectedPane, /value=\{editingWidth \? combinedRegionWidthDraft : regionBounds\?\.widthMm == null \? '' : String\(regionBounds\.widthMm\)\}/, 'width is never blank when valid bounds exist outside active typing')
assert.match(selectedPane, /value=\{editingHeight \? combinedRegionHeightDraft : regionBounds\?\.heightMm == null \? '' : String\(regionBounds\.heightMm\)\}/, 'height is never blank when valid bounds exist outside active typing')
assert.match(selectedPane, /setCombinedRegionWidthDraft\(regionBounds\?\.widthMm == null \? '' : String\(regionBounds\.widthMm\)\)[\s\S]*?setCombinedRegionHeightDraft\(regionBounds\?\.heightMm == null \? '' : String\(regionBounds\.heightMm\)\)/, 'focus initializes edit drafts from current selected-region bounds')
assert.match(shell, /const commitCombinedRegionDimensionFor = \([\s\S]*?setCombinedRegionGeometryPreview\(cloneCombinedRegionGeometry\(next\)\)[\s\S]*?onCombinedRegionGeometryChange\?\./, 'numeric commit updates view immediately and publishes the same authoritative geometry')
assert.match(shell, /setCombinedRegionWidthDraft\(nextBounds\?\.widthMm == null \? '' : String\(nextBounds\.widthMm\)\)[\s\S]*?setCombinedRegionHeightDraft\(nextBounds\?\.heightMm == null \? '' : String\(nextBounds\.heightMm\)\)/, 'drag preview synchronizes both input drafts')
assert.match(shell, /setCombinedRegionGeometryPreview\(cloneCombinedRegionGeometry\(restored\.combinedRegionGeometry\)\)[\s\S]*?onCombinedRegionGeometryChange\?\./, 'Undo/Redo restore immediately supplies the restored geometry to the view')
assert.match(shell, /setCombinedRegionGeometryPreview\(null\)\s*\}, \[activeModuleId, moduleSummary\.productType, moduleSummary\.combinedLayout, moduleSummary\.combinedRegionGeometry\]\)/, 'module/load prop changes discard stale preview and fall back to persisted geometry')
assert.match(shell, /if \(selectedCombinedRegion && \(frame \|\| combinedRegionMode\)\) return renderSelectedCombinedRegionDimensions\(\)/, 'region inputs remain scoped to combined modules; ordinary modules use their existing pane')

console.log('COMBINED REGION DIMENSION INPUT SYNC 01: PASS')
console.log('AUTHORITATIVE BOUNDS: 548 × 1130 are read directly for the selected door region')
console.log('SYNC: selection, numeric commit, pointer preview, history restore, and reloaded props all feed inspector values')
console.log('INCOMPLETE: only genuinely absent dimensions render blank; ordinary module path unchanged')
