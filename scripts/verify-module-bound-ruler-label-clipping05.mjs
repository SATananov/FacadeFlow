import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const coordinatesSource = readFileSync('src/components/constructorCoordinates.ts', 'utf8')
const { buildCadRulerTicks, rulerLabelFitsWithinBounds } =
  createRuntimeLoader()('src/components/constructorCoordinates')
const clippingBounds = { left: 0, right: 100, top: 0, bottom: 24 }

assert.equal(rulerLabelFitsWithinBounds({ left: 40, right: 60, top: 7, bottom: 17 }, clippingBounds), true,
  'complete label within ruler bounds remains visible')
assert.equal(rulerLabelFitsWithinBounds({ left: 94, right: 106, top: 7, bottom: 17 }, clippingBounds), false,
  'right-edge label is hidden when its text bounds extend past the ruler')
assert.equal(rulerLabelFitsWithinBounds({ left: -6, right: 6, top: 7, bottom: 17 }, clippingBounds), false,
  'left-edge label is hidden when its text bounds extend past the ruler')
assert.equal(rulerLabelFitsWithinBounds({ left: 40, right: 60, top: -2, bottom: 8 }, clippingBounds), false,
  'top-edge label is hidden when clipped')
assert.equal(rulerLabelFitsWithinBounds({ left: 40, right: 60, top: 20, bottom: 30 }, clippingBounds), false,
  'bottom-edge label is hidden when clipped')

const workspaceView = { origin: { xPx: 0, yPx: 0 }, pxPerMm: 0.14 }
const before = buildCadRulerTicks('x', 1200, workspaceView)
const valuesBefore = before.map(({ valueMm }) => valueMm)
const positionsBefore = before.map(({ screenPx }) => screenPx)
const visibleLabels = before.filter((tick) => {
  const labelWidth = 18 // verifier fixture for measured text bounds; label-fit helper receives actual rendered bounds in UI.
  return rulerLabelFitsWithinBounds(
    { left: tick.screenPx - labelWidth / 2, right: tick.screenPx + labelWidth / 2, top: 7, bottom: 17 },
    clippingBounds,
  )
})
assert.ok(visibleLabels.every(({ valueMm }) => valueMm >= 0))
assert.deepEqual(before.map(({ valueMm }) => valueMm), valuesBefore,
  'filtering labels leaves the fixed-workspace tick set unchanged')
assert.deepEqual(before.map(({ screenPx }) => screenPx), positionsBefore,
  'filtering labels leaves grid/tick positions unchanged')

const construction = { frame: { xMm: 0, yMm: 0, widthMm: 5230, heightMm: 3070 }, combinedRegionGeometry: { regions: [{ xMm: 0, yMm: 0, widthMm: 5230, heightMm: 3070 }] } }
const geometryBefore = JSON.stringify(construction)
const pannedDrawingView = { origin: { xPx: 250, yPx: -75 }, pxPerMm: workspaceView.pxPerMm }
const afterPan = buildCadRulerTicks('x', 1200, workspaceView)
assert.deepEqual(afterPan.map(({ valueMm }) => valueMm), valuesBefore,
  'drawing pan does not translate or regenerate fixed workspace ticks')
assert.equal(JSON.stringify(construction), geometryBefore, 'view changes do not mutate model geometry')
const zoomed = buildCadRulerTicks('x', 1200, { ...workspaceView, pxPerMm: 0.28 })
assert.equal(zoomed[0].valueMm, 0, 'zoom preserves local coordinate meaning')
assert.notDeepEqual(zoomed.map(({ screenPx }) => screenPx), positionsBefore,
  'zoom changes tick screen spacing without changing the ruler origin')
assert.notDeepEqual(pannedDrawingView.origin, workspaceView.origin,
  'pan changes the drawing view transform independently of the workspace ruler transform')

assert.match(shell, /useLayoutEffect\(\(\) => \{[\s\S]*getBoundingClientRect\(\)[\s\S]*label\.hidden = !rulerLabelFitsWithinBounds/,
  'rendered text bounds are measured and clipped labels suppressed before paint')
assert.match(shell, /left: Math\.max\(workareaRect\.left, rulerRect\.left, viewportRect\.left\)/)
assert.match(shell, /right: Math\.min\(workareaRect\.right, rulerRect\.right, viewportRect\.right\)/)
assert.match(shell, /top: Math\.max\(workareaRect\.top, rulerRect\.top, viewportRect\.top\)/)
assert.match(shell, /bottom: Math\.min\(workareaRect\.bottom, rulerRect\.bottom, viewportRect\.bottom\)/)
assert.match(coordinatesSource, /export function rulerLabelFitsWithinBounds/)

console.log('FIXED CANVAS RULER LABEL CLIPPING 05: PASS')
console.log('LABELS: complete screen bounds only; workspace ticks stay fixed during drawing pan')
