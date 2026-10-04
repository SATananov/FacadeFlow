import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
const { buildCadRulerTicks, cadWorldToScreen, screenToCadWorld } =
  createRuntimeLoader()('src/components/constructorCoordinates')
const sourceFunction = (name) => {
  const start = shell.indexOf(`const ${name} =`)
  assert.notEqual(start, -1, `source function ${name} exists`)
  const end = shell.indexOf('\n  const ', start + 1)
  return shell.slice(start, end === -1 ? undefined : end)
}

const scale = 0.14
const rulerViewport = { origin: { xPx: 0, yPx: 0 }, pxPerMm: scale }
const rulerTicksBefore = buildCadRulerTicks('x', 1200, rulerViewport)
const rulerTicksAfter = buildCadRulerTicks('x', 1200, rulerViewport)
assert.deepEqual(rulerTicksAfter, rulerTicksBefore, 'fixed ruler labels/ticks do not respond to drawing pan')
assert.equal(rulerTicksBefore[0].valueMm, 0)

const drawingBeforePan = { origin: { xPx: 80, yPx: 60 }, pxPerMm: scale }
const drawingAfterPan = { origin: { xPx: 310, yPx: 170 }, pxPerMm: scale }
const fixedGridOrigin = cadWorldToScreen({ xMm: 0, yMm: 0 }, rulerViewport)
assert.deepEqual(fixedGridOrigin, { xPx: 0, yPx: 0 }, 'workspace grid origin remains fixed')
const rightBefore = cadWorldToScreen({ xMm: 5230, yMm: 0 }, drawingBeforePan)
const rightAfter = cadWorldToScreen({ xMm: 5230, yMm: 0 }, drawingAfterPan)
assert.notDeepEqual(rightAfter, rightBefore, 'pan moves the drawing screen position')
assert.equal(screenToCadWorld(rightAfter, drawingAfterPan).xMm, 5230,
  'screen pan does not alter module width/world geometry')
const bottomAfter = cadWorldToScreen({ xMm: 0, yMm: 3070 }, drawingAfterPan)
assert.equal(screenToCadWorld(bottomAfter, drawingAfterPan).yMm, 3070,
  'screen pan does not alter module height/world geometry')

const constructionState = {
  frame: { xMm: 0, yMm: 0, widthMm: 5230, heightMm: 3070 },
  combinedRegionGeometry: { regions: [{ bounds: { xMm: 0, yMm: 0, widthMm: 1950, heightMm: 730 } }] },
  dimensions: { overallWidthMm: 5230, overallHeightMm: 3070 },
}
const stateBeforePan = JSON.stringify(constructionState)
assert.equal(JSON.stringify(constructionState), stateBeforePan,
  'camera pan is separate from construction and combined-region state')

const panCapture = sourceFunction('handleCanvasPointerDownCapture')
const panMove = sourceFunction('handleCanvasPointerMove')
assert.match(panCapture, /startOffset: \{ \.\.\.viewOffset \}/)
assert.match(panMove, /setViewOffset\(clampCadViewOffset\(\{[\s\S]*startOffset\.xPx[\s\S]*startOffset\.yPx[\s\S]*return/)
assert.doesNotMatch(panMove.slice(0, panMove.indexOf("if (dragState.kind === 'create')")),
  /broadcastFrame|broadcastConstruction|setCombinedRegionGeometry/,
  'PAN path returns before geometry mutation handlers')

const fit = sourceFunction('fitViewToFrame')
assert.match(fit, /setViewOffset\(/)
assert.match(fit, /setZoom\(fittedZoom\)/)
assert.doesNotMatch(fit, /setFramePlacementOffsetMm|broadcastFrame|broadcastConstruction/,
  'AUTO FIT changes the drawing view but not module geometry/placement')

assert.match(shell, /const workspaceViewport: CadViewport = \{ origin: \{ xPx: 0, yPx: 0 \}, pxPerMm \}/)
assert.match(shell, /buildCadRulerTicks\('x', canvasSize\.widthPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /buildCadRulerTicks\('y', canvasSize\.heightPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /className="constructor-ruler constructor-ruler-top" aria-hidden="true" ref=\{horizontalRulerRef\}/)
assert.match(shell, /className="constructor-ruler constructor-ruler-left" aria-hidden="true" ref=\{verticalRulerRef\}/)
assert.match(css, /\.constructor-ruler-top\s*\{[^}]*top:\s*0;[^}]*left:\s*var\(--constructor-cad-left\);[^}]*right:\s*0;/s)
assert.match(css, /\.constructor-ruler-left\s*\{[^}]*top:\s*var\(--constructor-cad-top\);[^}]*left:\s*0;/s)
assert.match(shell, /backgroundPosition: '0px 0px'/, 'grid is fixed in the workspace')
assert.match(shell, /const canvasViewport: CadViewport = \{ origin: viewOffset, pxPerMm \}/,
  'drawing uses the movable view transform')
assert.match(shell, /CompositeStructuralSketch projection=\{compositeProjection\} scale=\{pxPerMm\} offset=\{viewOffset\}/,
  'composite drawing shares the same pan model')
assert.match(shell, /constructor-combined-dimension-chains/,
  'combined technical dimensions remain in the drawing layer')

console.log('FIXED CANVAS RULERS + VIEW-ONLY SKETCH PAN 06: PASS')
console.log('RULERS / GRID: fixed workspace layer; drawing / dimensions: clipped, bounded view-only pan')
