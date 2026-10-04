import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
const { buildCadRulerTicks, cadWorldToScreen, screenToCadWorld } =
  createRuntimeLoader()('src/components/constructorCoordinates')

const moduleWidthMm = 5230
const moduleHeightMm = 3070
const zoom = 0.14
const fixedWorkspace = { origin: { xPx: 0, yPx: 0 }, pxPerMm: zoom }
const xTicksBefore = buildCadRulerTicks('x', 1120, fixedWorkspace)
const xTicksAfter = buildCadRulerTicks('x', 1120, fixedWorkspace)
const yTicksBefore = buildCadRulerTicks('y', 620, fixedWorkspace)
const yTicksAfter = buildCadRulerTicks('y', 620, fixedWorkspace)

assert.equal(xTicksBefore[0].valueMm, 0, 'fixed workspace X origin remains zero')
assert.equal(yTicksBefore[0].valueMm, 0, 'fixed workspace Y origin remains zero')
assert.ok(xTicksBefore.some(({ valueMm }) => valueMm === 5000))
assert.ok(yTicksBefore.some(({ valueMm }) => valueMm === 3000))
assert.deepEqual(xTicksAfter.map(({ valueMm }) => valueMm), xTicksBefore.map(({ valueMm }) => valueMm))
assert.deepEqual(yTicksAfter.map(({ valueMm }) => valueMm), yTicksBefore.map(({ valueMm }) => valueMm))

const cameraBefore = { origin: { xPx: 240, yPx: 90 }, pxPerMm: zoom }
const cameraAfter = { origin: { xPx: -160, yPx: -210 }, pxPerMm: zoom }
const rightEdgeScreen = cadWorldToScreen({ xMm: moduleWidthMm, yMm: 0 }, cameraAfter)
const bottomEdgeScreen = cadWorldToScreen({ xMm: 0, yMm: moduleHeightMm }, cameraAfter)
assert.equal(screenToCadWorld(rightEdgeScreen, cameraAfter).xMm, 5230)
assert.equal(screenToCadWorld(bottomEdgeScreen, cameraAfter).yMm, 3070)
assert.notDeepEqual(rightEdgeScreen, cadWorldToScreen({ xMm: moduleWidthMm, yMm: 0 }, cameraBefore))

const fitStart = shell.indexOf('const fitViewToFrame =')
const fitEnd = shell.indexOf('\n  const changeViewZoom', fitStart)
const fitSource = shell.slice(fitStart, fitEnd)
assert.match(fitSource, /setViewOffset\(/)
assert.doesNotMatch(fitSource, /setFramePlacementOffsetMm/,
  'fit changes camera state without changing the module local origin')
assert.match(shell, /const workspaceViewport: CadViewport = \{ origin: \{ xPx: 0, yPx: 0 \}, pxPerMm \}/)
assert.match(shell, /buildCadRulerTicks\('x', canvasSize\.widthPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /buildCadRulerTicks\('y', canvasSize\.heightPx, workspaceViewport, MAJOR_GRID_STEP_MM\)/)
assert.match(shell, /backgroundPosition: '0px 0px'/)
assert.match(shell, /setViewOffset\(\{[\s\S]*startPx\.xPx - targetFrame\.x \* fittedScale/)
assert.match(css, /\.constructor-ruler-top\s*\{[^}]*top:\s*0;[^}]*left:\s*var\(--constructor-cad-left\);[^}]*right:\s*0;/s)
assert.match(css, /\.constructor-ruler-left\s*\{[^}]*top:\s*var\(--constructor-cad-top\);[^}]*left:\s*0;/s)
assert.match(css, /\.constructor-workarea\s*\{[^}]*overflow:\s*hidden/s)
assert.match(shell, /className="constructor-ruler constructor-ruler-top" aria-hidden="true" ref=\{horizontalRulerRef\}/)
assert.match(shell, /className="constructor-ruler constructor-ruler-left" aria-hidden="true" ref=\{verticalRulerRef\}/)
assert.match(shell, /origin: viewOffset, pxPerMm/)

console.log('FIXED CAD WORKSPACE RULER / GRID: PASS')
console.log('PAN: drawing view only; ruler rails and workspace grid remain fixed')
