import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
const coordinatesSource = readFileSync('src/components/constructorCoordinates.ts', 'utf8')
const coordinates = createRuntimeLoader()('src/components/constructorCoordinates')
const {
  buildCadRulerTicks,
  cadRulerTickStep,
  cadWorldToScreen,
  screenToCadWorld,
  visibleCadWorldRange,
} = coordinates

// Ruler/grid use the fixed workspace origin; drawing uses a separate pan transform.
const canvasWidth = 1120
const canvasHeight = 600
const fixedWorkspace50 = { origin: { xPx: 0, yPx: 0 }, pxPerMm: 0.14 }
const xRange = visibleCadWorldRange('x', canvasWidth, fixedWorkspace50)
const xTicks = buildCadRulerTicks('x', canvasWidth, fixedWorkspace50)
assert.ok(xRange.maxMm > 4000, 'visible horizontal world range can exceed 4000 mm')
assert.ok(xTicks.some(({ valueMm }) => valueMm > 4000), 'horizontal ticks extend beyond 4000 mm')
assert.ok(xTicks.some(({ valueMm }) => valueMm === 5000))
assert.ok(xTicks.some(({ valueMm }) => valueMm === 7500))
const moduleRightEdgeMm = 5230
assert.ok(moduleRightEdgeMm > 5000 && moduleRightEdgeMm < 5500,
  '5230 remains a measured position between major ticks')

const yRange = visibleCadWorldRange('y', canvasHeight, fixedWorkspace50)
const yTicks = buildCadRulerTicks('y', canvasHeight, fixedWorkspace50)
assert.ok(yRange.maxMm >= 3070, 'visible vertical world range includes 3070 mm')
assert.ok(yTicks.some(({ valueMm }) => valueMm >= 3000), 'Y ruler covers the visible module-height range')

const fixedWorkspaceAfterPan = { origin: { xPx: 0, yPx: 0 }, pxPerMm: 0.2 }
const fixedTicksBeforePan = buildCadRulerTicks('x', 1000, { origin: { xPx: 0, yPx: 0 }, pxPerMm: 0.2 })
const fixedTicksAfterPan = buildCadRulerTicks('x', 1000, fixedWorkspaceAfterPan)
assert.deepEqual(fixedTicksAfterPan, fixedTicksBeforePan, 'pan does not translate or regenerate fixed ruler ticks')
const drawingBeforePan = { origin: { xPx: 260, yPx: 130 }, pxPerMm: 0.2 }
const drawingAfterPan = { origin: { xPx: -180, yPx: -240 }, pxPerMm: 0.2 }
assert.notDeepEqual(
  cadWorldToScreen({ xMm: 5230, yMm: 0 }, drawingBeforePan),
  cadWorldToScreen({ xMm: 5230, yMm: 0 }, drawingAfterPan),
  'drawing screen position changes under the separate pan transform',
)
const moduleRightEdgeScreen = cadWorldToScreen({ xMm: 5230, yMm: 0 }, drawingBeforePan)
assert.equal(screenToCadWorld(moduleRightEdgeScreen, drawingBeforePan).xMm, 5230)
const acceptedRightEdgeMm = 5230
assert.ok(acceptedRightEdgeMm > 5000 && acceptedRightEdgeMm < 5500, 'module right edge retains local X=5230')
const acceptedDoorBottomMm = 3070
assert.ok(acceptedDoorBottomMm > 3000 && acceptedDoorBottomMm < 3500, 'door bottom retains local Y=3070')

const zoomSteps = [0.07, 0.14, 0.28].map((pxPerMm) => {
  const viewport = { origin: { xPx: 83, yPx: -57 }, pxPerMm }
  const range = visibleCadWorldRange('x', canvasWidth, { origin: { xPx: 0, yPx: 0 }, pxPerMm })
  const ticks = buildCadRulerTicks('x', canvasWidth, { origin: { xPx: 0, yPx: 0 }, pxPerMm })
  const worldTick = cadWorldToScreen({ xMm: 5000, yMm: 0 }, viewport)
  assert.equal(screenToCadWorld(worldTick, viewport).xMm, 5000,
    'zoom changes screen mapping but preserves CAD world coordinate meaning')
  return { range, step: ticks[1].valueMm - ticks[0].valueMm }
})
assert.ok(zoomSteps[0].range.maxMm > zoomSteps[1].range.maxMm)
assert.ok(zoomSteps[1].range.maxMm > zoomSteps[2].range.maxMm)
assert.equal(zoomSteps[0].step, 1000, 'zoomed-out ruler adapts to readable tick density')
assert.equal(zoomSteps[1].step, 500, '50% scale retains established 500 mm ticks')
assert.equal(zoomSteps[2].step, 500, '100% scale retains established 500 mm ticks')
assert.equal(cadRulerTickStep(0), null)

assert.match(coordinatesSource, /visibleCadWorldRange\(/)
assert.match(coordinatesSource, /buildCadRulerTicks\(/)
assert.match(shell, /const workspaceViewport: CadViewport = \{ origin: \{ xPx: 0, yPx: 0 \}, pxPerMm \}/)
assert.match(shell, /buildCadRulerTicks\('x', canvasSize\.widthPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /buildCadRulerTicks\('y', canvasSize\.heightPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /horizontalRulerTicks\.map/)
assert.match(shell, /verticalRulerTicks\.map/)

assert.match(shell, /const canvasViewport: CadViewport = \{ origin: viewOffset, pxPerMm \}/,
  'drawing uses a separate pan transform')
assert.match(shell, /xPx: \(rect\?\.left \?\? 0\) \+ viewOffset\.xPx/)
assert.match(shell, /yPx: \(rect\?\.top \?\? 0\) \+ viewOffset\.yPx/)
assert.match(shell, /backgroundPosition: '0px 0px'/,
  'grid origin remains fixed in workspace coordinates during drawing pan')
assert.match(shell, /'--constructor-major-grid-step': `\$\{MAJOR_GRID_STEP_MM \* pxPerMm\}px`/)
assert.match(css, /var\(--constructor-major-grid-step, 140px\) var\(--constructor-major-grid-step, 140px\)/)
assert.match(shell, /className="constructor-ruler constructor-ruler-top" aria-hidden="true" ref=\{horizontalRulerRef\}/)
assert.match(shell, /className="constructor-ruler constructor-ruler-left" aria-hidden="true" ref=\{verticalRulerRef\}/)
assert.match(css, /\.constructor-ruler-top\s*\{[^}]*top:\s*0;[^}]*left:\s*var\(--constructor-cad-left\);[^}]*right:\s*0;/s)
assert.match(css, /\.constructor-ruler-left\s*\{[^}]*top:\s*var\(--constructor-cad-top\);[^}]*left:\s*0;/s)

console.log('CAD VIEWPORT DYNAMIC COORDINATE RULERS 01: PASS')
console.log('RANGE: fixed workspace origin + measured viewport + adaptive ticks')
console.log('PAN / ZOOM / GRID / AUTO FIT: rulers and grid fixed; sketch uses view-only transform')
