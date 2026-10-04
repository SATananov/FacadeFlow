import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = readFileSync('src/components/ConstructorShell.css', 'utf8')
const { clampCadViewOffset, cadWorldToScreen } =
  createRuntimeLoader()('src/components/constructorCoordinates')

const sourceFunction = (name) => {
  const start = shell.indexOf(`const ${name} =`)
  assert.notEqual(start, -1, `source function ${name} exists`)
  const end = shell.indexOf('\n  const ', start + 1)
  return shell.slice(start, end === -1 ? undefined : end)
}

const viewport = { width: 800, height: 500 }
const bounds = { x: 0, y: 0, width: 5230, height: 3070 }
const scale = 0.14
const fullyOffscreenRight = clampCadViewOffset({ xPx: 50000, yPx: 50000 }, bounds, viewport.width, viewport.height, scale)
const rightPanLeft = cadWorldToScreen({ xMm: 0, yMm: 0 }, { origin: fullyOffscreenRight, pxPerMm: scale })
const rightPanEnd = cadWorldToScreen({ xMm: bounds.width, yMm: bounds.height }, { origin: fullyOffscreenRight, pxPerMm: scale })
assert.ok(Math.min(viewport.width, rightPanEnd.xPx) - Math.max(0, rightPanLeft.xPx) >= 71,
  'rightward pan clamp leaves a useful sketch portion visible horizontally')
assert.ok(Math.min(viewport.height, rightPanEnd.yPx) - Math.max(0, rightPanLeft.yPx) >= 71,
  'downward pan clamp leaves a useful sketch portion visible vertically')

const fullyOffscreenLeft = clampCadViewOffset({ xPx: -50000, yPx: -50000 }, bounds, viewport.width, viewport.height, scale)
const leftTop = cadWorldToScreen({ xMm: 0, yMm: 0 }, { origin: fullyOffscreenLeft, pxPerMm: scale })
const leftPanEnd = cadWorldToScreen({ xMm: bounds.width, yMm: bounds.height }, { origin: fullyOffscreenLeft, pxPerMm: scale })
assert.ok(Math.min(viewport.width, leftPanEnd.xPx) - Math.max(0, leftTop.xPx) >= 71
  && Math.min(viewport.height, leftPanEnd.yPx) - Math.max(0, leftTop.yPx) >= 71,
  'opposite pan clamp preserves visible drawing at the other viewport edges')

const geometrySnapshot = JSON.stringify({ frame: { widthMm: 5230, heightMm: 3070 }, regionBounds: bounds })
const beforeScreen = cadWorldToScreen({ xMm: 5230, yMm: 3070 }, { origin: { xPx: 120, yPx: 80 }, pxPerMm: scale })
const afterScreen = cadWorldToScreen({ xMm: 5230, yMm: 3070 }, { origin: fullyOffscreenRight, pxPerMm: scale })
assert.notDeepEqual(afterScreen, beforeScreen, 'pan changes rendered screen position')
assert.equal(JSON.stringify({ frame: { widthMm: 5230, heightMm: 3070 }, regionBounds: bounds }), geometrySnapshot,
  'pan leaves frame and combined-region geometry unchanged')

assert.match(shell, /className="constructor-drawing-viewport" data-drawing-viewport="clipped"/)
assert.ok(shell.indexOf('className="constructor-drawing-viewport"') < shell.indexOf('className={frameClassName}'),
  'ordinary frame drawing is inside the clipped viewport wrapper')
assert.match(css, /\.constructor-canvas\s*\{[^}]*overflow:\s*hidden/s)
assert.match(css, /\.constructor-drawing-viewport\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*overflow:\s*hidden;[^}]*contain:\s*paint/s)
assert.match(shell, /setViewOffset\(clampCadViewOffset\(/, 'pan offset is bounded against sketch and viewport bounds')
assert.match(shell, /const panBounds = viewBounds && !isCompositeView[\s\S]*displayedFrame\?\.xMm \?\? viewBounds\.x[\s\S]*displayedFrame\?\.yMm \?\? viewBounds\.y[\s\S]*: viewBounds/,
  'ordinary and combined sketches use the same pan clamp')
assert.match(shell, /CompositeStructuralSketch projection=\{compositeProjection\} scale=\{pxPerMm\} offset=\{viewOffset\}/,
  'composite drawing uses the same clipped child layer and view offset')
assert.match(shell, /backgroundPosition: '0px 0px'/, 'workspace grid remains fixed')
assert.match(shell, /constructor-ruler constructor-ruler-top/)
assert.match(shell, /constructor-ruler constructor-ruler-left/)

const fit = sourceFunction('fitViewToFrame')
assert.match(fit, /setViewOffset\(/)
assert.doesNotMatch(fit, /setFramePlacementOffsetMm|broadcastFrame|broadcastConstruction/,
  'Auto Fit changes drawing view only')
const panMove = sourceFunction('handleCanvasPointerMove')
assert.doesNotMatch(panMove.slice(0, panMove.indexOf("if (dragState.kind === 'create')")),
  /broadcastFrame|broadcastConstruction|setCombinedRegionGeometry/,
  'pan path returns before model mutation handlers')

console.log('CLIPPED DRAWING VIEWPORT + BOUNDED SKETCH PAN 07: PASS')
console.log('DRAWING: clipped to central canvas; pan clamped view-only; rulers/grid fixed')
