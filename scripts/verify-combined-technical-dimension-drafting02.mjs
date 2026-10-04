import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
const loader = createRuntimeLoader()
const compositionApi = loader('src/domain/combinedModuleComposition')
const geometryApi = loader('src/domain/combinedRegionGeometry')
const layoutApi = loader('src/components/combinedDimensionLayout')

function resolveLayout(layout, dimensions) {
  const composition = compositionApi.createCombinedRegionComposition(layout)
  let geometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
  for (let index = 0; index < composition.regions.length; index++) {
    const region = composition.regions[index]
    const [widthMm, heightMm] = dimensions[index]
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'widthMm', widthMm)
    geometry = geometryApi.setCombinedRegionDimensions(composition, geometry, region.id, 'heightMm', heightMm)
  }
  return geometryApi.resolveCombinedRegionGeometry(composition, geometry)
}

// These are illustrative verifier inputs, not defaults or catalogue facts.
const leftResolved = resolveLayout('window-left', [[1950, 730], [840, 1830]])
const left = layoutApi.layoutCombinedTechnicalDimensions('window-left', leftResolved)
assert.ok(left)
assert.equal(left.regionWidths.length, 2)
assert.equal(new Set(left.regionWidths.map((chain) => chain.yMm)).size, 1, 'individual widths share one inner baseline')
assert.ok(left.regionWidths.every((chain) => chain.yMm > leftResolved.extent.heightMm),
  'partial-width baseline sits below the product/profile bottom edge')
assert.ok(left.totalWidth.yMm > left.regionWidths[0].yMm, 'overall width has its own lower baseline')
assert.equal(left.totalWidth.yMm - left.regionWidths[0].yMm, 160, 'overall chain has increased deterministic separation from inner chain')
assert.deepEqual(left.regionWidthExtensions, [
  { xMm: 0, startMm: 730 },
  { xMm: 1950, startMm: 730 },
  { xMm: 2790, startMm: 1830 },
], 'one extension stroke is derived per outer/shared width endpoint')
assert.equal(left.totalWidth.startEdgeBottomMm, 730, 'left total extension starts at the actual short-window edge')
assert.equal(left.totalWidth.endEdgeBottomMm, 1830, 'right total extension starts at the door bottom edge')
assert.deepEqual(left.regionHeights.map(({ side }) => side), ['left', 'right'])
assert.equal(left.regionHeights[0].xMm, -72, 'window height dimension clears the outer-left contour')
assert.equal(left.regionHeights[1].xMm, 2790 + 72, 'door height dimension clears the outer-right contour')
assert.deepEqual(left.regionHeights.map(({ endMm }) => endMm), [730, 1830])
assert.equal(left.totalHeight, null, 'a region height equal to overall height is not duplicated')
assert.equal(left.extensionOverrunMm, 2, 'extension lines use a short drawing-space overrun')

const rightResolved = resolveLayout('window-right', [[840, 1830], [1950, 730]])
const right = layoutApi.layoutCombinedTechnicalDimensions('window-right', rightResolved)
assert.ok(right)
assert.deepEqual(right.regionHeights.map(({ side }) => side), ['left', 'right'], 'door-left/window-right mirrors semantic dimension sides')
assert.equal(right.regionHeights[0].xMm, -72, 'mirrored door height clears the outer-left contour')
assert.equal(right.regionHeights[1].xMm, 2790 + 72, 'mirrored window height clears the outer-right contour')
assert.equal(right.totalWidth.startEdgeBottomMm, 1830)
assert.equal(right.totalWidth.endEdgeBottomMm, 730, 'mirrored endpoint starts at the short-window edge')
assert.deepEqual(right.regionWidthExtensions.map(({ xMm, startMm }) => ({ xMm, startMm })), [
  { xMm: 0, startMm: 1830 },
  { xMm: 840, startMm: 730 },
  { xMm: 2790, startMm: 730 },
], 'mirrored shared endpoint has one light extension stroke')

const bothResolved = resolveLayout('window-both', [[900, 720], [840, 1830], [760, 810]])
const both = layoutApi.layoutCombinedTechnicalDimensions('window-both', bothResolved)
assert.ok(both)
assert.equal(both.regionWidths.length, 3, 'WINDOW_BOTH has three individual widths')
assert.equal(new Set(both.regionWidths.map((chain) => chain.yMm)).size, 1)
assert.ok(both.totalWidth.yMm > both.regionWidths[0].yMm)
assert.equal(both.totalWidth.yMm - both.regionWidths[0].yMm, 160)
assert.equal(both.regionWidthExtensions.length, 4, 'three regions use four unique width witness lines')
assert.deepEqual(both.regionHeights.map(({ xMm }) => xMm), [-72, 2500 + 72, 2500 + 144],
  'three-region height dimensions use deterministic outward slots')
assert.equal(both.totalHeight, null)

const layoutSource = readFileSync('src/components/combinedDimensionLayout.ts', 'utf8')
assert.match(layoutSource, /COMBINED_OVERALL_CHAIN_SEPARATION_MM\s*=\s*160/)
assert.match(layoutSource, /COMBINED_VERTICAL_DIMENSION_OFFSET_MM\s*=\s*72/)
assert.match(layoutSource, /COMBINED_DIMENSION_EXTENSION_OVERRUN_MM\s*=\s*2/)
assert.match(layoutSource, /regionWidthExtensions/)
assert.match(layoutSource, /Math\.min\(regionBottomMm, nextBottomMm\)/,
  'shared witness line starts at the actual shared-contact endpoint')

const labelRules = css.match(/\.constructor-combined-horizontal-chain span,[\s\S]*?\n}/)?.[0]
assert.ok(labelRules, 'combined dimension text styling exists')
assert.doesNotMatch(labelRules, /border\s*:|border-radius|box-shadow/)
assert.match(labelRules, /background:\s*#fff/, 'plain rectangular line-clearance mask remains')
assert.match(labelRules, /z-index:\s*2/, 'label mask paints over and interrupts its own dimension baseline')
assert.match(css, /\.constructor-combined-horizontal-chain span\s*\{[^}]*top:\s*-8px/s,
  'horizontal rectangular mask overlaps the line at the text clearance edge')
assert.match(css, /\.constructor-combined-dimension-extension\.is-vertical\s*\{\s*width:\s*1px;/)
assert.match(css, /\.constructor-combined-dimension-extension\.is-horizontal\s*\{\s*height:\s*1px;/)
assert.match(css, /\.constructor-combined-vertical-chain\s*\{\s*width:\s*1px;\s*border-left:\s*1px solid currentColor;/,
  'vertical dimension baseline has a single unambiguous x coordinate')
assert.match(css, /\.constructor-combined-vertical-chain span\s*\{[^}]*left:\s*0;[^}]*transform:\s*translate\(-50%,\s*-50%\) rotate\(90deg\);/s,
  'vertical value is centered on and masks its own baseline')
assert.doesNotMatch(css, /\.constructor-combined-(?:horizontal|vertical)-chain\.is-overall-chain\s+span/,
  'inner and overall dimension labels share the same text-mask treatment')
assert.match(shell, /constructor-combined-horizontal-chain is-region-chain/)
assert.match(shell, /constructor-combined-horizontal-chain is-overall-chain/)
assert.match(shell, /width: `\$\{\(chain\.endMm - chain\.startMm\) \* pxPerMm\}px`/,
  'partial-width label is centered inside its measured span')
assert.match(shell, /width: `\$\{\(combinedTechnicalDimensionLayout\.totalWidth\.endMm - combinedTechnicalDimensionLayout\.totalWidth\.startMm\) \* pxPerMm\}px`/,
  'overall-width label is centered inside the full measured span')
assert.match(css, /\.constructor-combined-horizontal-chain\s*\{[^}]*text-align:\s*center;/s,
  'all horizontal dimension labels center on their measured baselines')
assert.match(shell, /regionWidthExtensions\.map/,
  'width witness lines are rendered once per unique outer/shared endpoint')
assert.match(shell, /regionWidths\[0\]\.yMm \+ combinedTechnicalDimensionLayout\.extensionOverrunMm/,
  'outer-chain witness lines continue the inner-chain endpoints without duplicate overlap')
assert.match(shell, /totalWidth\.yMm - combinedTechnicalDimensionLayout\.regionWidths\[0\]\.yMm/,
  'continued witness lines stop shortly after the overall baseline')
assert.match(shell, /combinedTechnicalDimensionLayout\.totalHeight &&/)
assert.match(shell, /constructor-combined-vertical-chain is-region-chain/)
const dimensionRenderStart = shell.indexOf('className="constructor-combined-dimension-chains"')
const dimensionRenderEnd = shell.indexOf('frameClearDimensions.widthMm !== null && dragState?.kind !== \'create\' && !combinedGeometryComplete', dimensionRenderStart)
assert.ok(dimensionRenderStart >= 0 && dimensionRenderEnd > dimensionRenderStart)
assert.doesNotMatch(shell.slice(dimensionRenderStart, dimensionRenderEnd), /setCombinedRegionDimensions\(/,
  'combined dimension rendering does not mutate region geometry')

console.log('COMBINED TECHNICAL DIMENSION FINAL POLISH 04: PASS')
console.log('WIDTH CHAINS: shared inner baseline, 160 mm separation to overall baseline')
console.log('HEIGHT CHAINS: increased outer clearance, mirrored placement, WINDOW_BOTH outward slots')
console.log('EXTENSIONS: unique actual outer/shared endpoints, short overrun, no stacked shared-edge duplicates')
console.log('LABELS: one consistent plain drafting mask; no badge chrome')
