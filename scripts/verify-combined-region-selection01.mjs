import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')
const composition = compositionApi.createCombinedRegionComposition('window-left')
let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
for (const [region, width, height] of [
  [composition.regions[0], 700, 1200],
  [composition.regions[1], 1100, 2100],
]) {
  geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'widthMm', width)
  geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'heightMm', height)
}

assert.equal(geometryApi.findCombinedRegionAtPoint(composition, geometry, { xMm: 350, yMm: 600 })?.regionId, composition.regions[0].id, 'window center resolves to WINDOW_REGION')
assert.equal(geometryApi.findCombinedRegionAtPoint(composition, geometry, { xMm: 1250, yMm: 1050 })?.regionId, composition.regions[1].id, 'door center resolves to DOOR_REGION')
assert.equal(geometryApi.findCombinedRegionAtPoint(composition, geometry, { xMm: 350, yMm: 1500 }), null, 'exterior void has no selectable region')
assert.equal(geometryApi.findCombinedZeroDividerAtPoint(composition, geometry, { xMm: 700, yMm: 600 }, 0)?.relationId, composition.zeroDividers[0].id, 'shared line resolves to ZERO_DIVIDER')
assert.equal(geometryApi.findCombinedZeroDividerAtPoint(composition, geometry, { xMm: 350, yMm: 600 }, 0), null, 'field interior is outside a zero-tolerance boundary hit')
assert.equal(geometryApi.findCombinedZeroDividerAtPoint(composition, geometry, { xMm: 690, yMm: 600 }, 10)?.relationId, composition.zeroDividers[0].id, 'near-line intentional tolerance resolves boundary')
assert.equal(geometryApi.findCombinedZeroDividerAtPoint(composition, geometry, { xMm: 680, yMm: 600 }, 10), null, 'normal field area is outside narrow tolerance')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
assert.match(shell, /className="constructor-combined-region-surface"[\s\S]*?onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}[\s\S]*?setSelectedCombinedRegionId\(region\.regionId\)[\s\S]*?setSelectedCombinedZeroDividerId\(null\)[\s\S]*?setSelectedSemanticBoundaryId\(null\)/, 'unmapped region interior selects region and clears boundary selections')
assert.match(shell, /if \(combinedGeometryComplete\) \{\s*const localPoint = framePointFromPointer\(event\)[\s\S]*?setSelectedCombinedRegionId\(hitRegion\.regionId\)[\s\S]*?setSelectedCombinedZeroDividerId\(null\)[\s\S]*?setSelectedSemanticBoundaryId\(null\)[\s\S]*?setActiveTool\('select'\)[\s\S]*?return\s*\}/, 'mapped functional field selection precedes ordinary tool actions')
assert.match(shell, /details-\$\{field\.id\}[\s\S]*?setSelectedCombinedRegionId\(moduleSummary\.combinedComposition\?\.regions\.find\(\(region\) => region\.fieldId === field\.id\)\?\.id \?\? null\)[\s\S]*?setSelectedCombinedZeroDividerId\(null\)[\s\S]*?setSelectedSemanticBoundaryId\(null\)/, 'bottom field card selects matching combined region and clears ZERO_DIVIDER')
assert.match(shell, /constructor-combined-zero-divider-hit[\s\S]*?vectorEffect="non-scaling-stroke"[\s\S]*?setSelectedCombinedZeroDividerId\(boundary\.relationId\); setSelectedCombinedRegionId\(null\); setSelectedFieldId\(null\); setSelectedSemanticBoundaryId\(null\)/, 'ZERO_DIVIDER click clears region/field and legacy boundary selections')
assert.match(css, /\.constructor-field-surface\s*\{[^}]*z-index:\s*2/s, 'ordinary full-frame field surface keeps its existing layer')
assert.match(css, /\.constructor-combined-region-surface\s*\{[^}]*z-index:\s*3/s, 'functional region surface wins over the underlying ordinary full-frame field')
assert.match(css, /constructor-combined-zero-divider-hit\s*\{[^}]*stroke-width:\s*10px/s, 'boundary target is limited to a 10 CSS-pixel screen-space stroke')
assert.match(shell, /selectedCombinedRegion \? 'combined-region' : selectedCombinedZeroDivider \? 'combined-zero-divider'/, 'inspector context gives active combined selection immediate precedence')
assert.match(shell, /if \(selectedCombinedRegion\) return renderSelectedCombinedRegionDimensions\(\)/, 'Dimensions pane exposes selected region dimensions')
assert.match(shell, /aria-label=\{`Ширина на \$\{regionDisplayName\(selectedCombinedRegion\.id\)\}`\}[\s\S]*?commitCombinedRegionDimension\('widthMm'\)[\s\S]*?aria-label=\{`Височина на \$\{regionDisplayName\(selectedCombinedRegion\.id\)\}`\}/, 'selected region has editable width and height')
assert.match(shell, /if \(!findCombinedRegionAtPoint\(moduleSummary\.combinedComposition, combinedRegionGeometryForView, point\)\) \{\s*setSelectedCombinedRegionId\(null\)[\s\S]*?setSelectedCombinedZeroDividerId\(null\)/, 'exterior void clears selection instead of fabricating a field, using preview-resolved geometry when resizing')
assert.match(shell, /if \(activeTool === 'select'\) \{\s*setSelectedFieldId\(field\.id\)/, 'ordinary non-combined field selection path remains available')
assert.match(css, /constructor-semantic-boundary::after\s*\{[^}]*width:\s*5px[^}]*height:\s*5px/s, 'legacy semantic marker label remains visually reduced to a subtle dot')

console.log('COMBINED REGION SELECTION 01: PASS')
console.log('HIT TEST: region interiors, derived boundary tolerance, and exterior void verified')
console.log('UI PATH: region surfaces/cards and mapped fields clear competing selection; inspector exposes dimensions')
console.log('VISUAL: ZERO_DIVIDER selection target is 10 CSS px; legacy boundary label remains subtle')
