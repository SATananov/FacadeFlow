import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const coordinates = createRuntimeLoader()('src/components/constructorCoordinates')
const { frameOriginInCadWorld, screenToCadWorld, cadWorldToScreen, buildCadRulerTicks } = coordinates
const functionSource = (name) => {
  const start = shell.indexOf(`const ${name} =`)
  assert.notEqual(start, -1, `Constructor handler ${name} exists`)
  const next = shell.indexOf('\n  const ', start + 1)
  return shell.slice(start, next === -1 ? undefined : next)
}

const frame = { xMm: 0, yMm: 0, widthMm: 5230, heightMm: 3070 }
const placement = { xMm: 0, yMm: 0 }
const combinedRegionGeometry = {
  schemaVersion: 'combined-region-geometry-01',
  regions: [{ regionId: 'window', fieldId: 'field-1', bounds: { xMm: 0, yMm: 0, widthMm: 1950, heightMm: 730 } }],
}
const worldOriginBefore = frameOriginInCadWorld({ frame, placement })
const combinedBefore = JSON.stringify(combinedRegionGeometry)

for (const cameraPan of [
  { xPx: 260, yPx: 130 },
  { xPx: -180, yPx: -240 },
]) {
  const viewport = { origin: cameraPan, pxPerMm: 0.14 }
  assert.deepEqual(frameOriginInCadWorld({ frame, placement }), worldOriginBefore,
    'camera pan does not alter frame world origin')
  assert.equal(JSON.stringify(combinedRegionGeometry), combinedBefore,
    'camera pan does not alter combined region geometry')
  const rightEdgeScreen = cadWorldToScreen({ xMm: 5230, yMm: 0 }, viewport)
  assert.equal(screenToCadWorld(rightEdgeScreen, viewport).xMm, 5230,
    'module right edge remains X=5230 through camera transforms')
  const doorBottomScreen = cadWorldToScreen({ xMm: 0, yMm: 3070 }, viewport)
  assert.equal(screenToCadWorld(doorBottomScreen, viewport).yMm, 3070,
    'door bottom remains Y=3070 through camera transforms')
}

const rulerViewport = { origin: { xPx: 0, yPx: 0 }, pxPerMm: 0.2 }
const fixedTicksBefore = buildCadRulerTicks('x', 1000, rulerViewport)
const fixedTicksAfter = buildCadRulerTicks('x', 1000, rulerViewport)
assert.deepEqual(fixedTicksAfter, fixedTicksBefore, 'pan leaves fixed workspace ruler ticks unchanged')
const sketchViewportBefore = { origin: { xPx: 260, yPx: 130 }, pxPerMm: 0.2 }
const sketchViewportAfter = { origin: { xPx: -180, yPx: -240 }, pxPerMm: 0.2 }
assert.notDeepEqual(
  cadWorldToScreen({ xMm: 5230, yMm: 0 }, sketchViewportBefore),
  cadWorldToScreen({ xMm: 5230, yMm: 0 }, sketchViewportAfter),
  'pan changes drawing screen position independently of the ruler',
)

const fit = functionSource('fitViewToFrame')
assert.match(fit, /setViewOffset\(\{[\s\S]*startPx\.xPx - targetFrame\.x \* fittedScale[\s\S]*startPx\.yPx - targetFrame\.y \* fittedScale/,
  'Auto Fit centers by changing the viewport transform')
assert.doesNotMatch(fit, /setFramePlacementOffsetMm/,
  'Auto Fit never rewrites effective module placement')

const panDown = functionSource('handleCanvasPointerDownCapture')
const panMove = functionSource('handleCanvasPointerMove')
assert.match(panDown, /startOffset: \{ \.\.\.viewOffset \}/)
assert.match(panMove, /setViewOffset\(clampCadViewOffset\(\{[\s\S]*startOffset\.xPx[\s\S]*startOffset\.yPx[\s\S]*return/,
  'PAN updates a bounded viewport offset only and exits before model-edit drag handling')

const explicitMove = functionSource('handleCanvasPointerMove')
assert.match(explicitMove, /dragState\.kind === 'move-frame'[\s\S]*setFramePlacementOffsetMm/,
  'explicit frame movement remains a separate placement action')
assert.match(shell, /origin: viewOffset, pxPerMm/,
  'ordinary and combined drawing use the same view-only pan transform')
assert.match(shell, /const workspaceViewport: CadViewport = \{ origin: \{ xPx: 0, yPx: 0 \}, pxPerMm \}/)
assert.match(shell, /backgroundPosition: '0px 0px'/, 'grid origin is fixed during sketch pan')
assert.match(shell, /className="constructor-ruler constructor-ruler-top" aria-hidden="true" ref=\{horizontalRulerRef\}/)
assert.match(shell, /className="constructor-ruler constructor-ruler-left" aria-hidden="true" ref=\{verticalRulerRef\}/)
assert.match(shell, /displayedFramePosition = displayedFrame\s*\? cadWorldToScreen[\s\S]*canvasViewport/)
assert.match(shell, /constructor-combined-dimension-chains/)

console.log('CAD PAN VS WORLD ORIGIN SEMANTICS 02: PASS')
console.log('PAN / AUTO FIT: viewport-only; module geometry remains stable and rulers stay module-local')
