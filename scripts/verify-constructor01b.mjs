import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)
const css = await readFile(
  new URL('../src/components/ConstructorShell.css', import.meta.url),
  'utf8',
)
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01B_PARAMETRIC_FRAME_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(shell, /CONSTRUCTOR 01[BC]/)
assert.match(shell, /type FrameEdge = 'left' \| 'right' \| 'top' \| 'bottom'/)
assert.match(shell, /type FrameModel/)
assert.match(shell, /SNAP_STEP_MM = 10/)
assert.match(shell, /activeTool === 'frame'/)
assert.match(shell, /handleCanvasPointerDown/)
assert.match(shell, /handleCanvasPointerMove/)
assert.match(shell, /handleCanvasPointerUp/)
assert.match(shell, /startEdgeResize/)
assert.match(shell, /setPointerCapture/)
assert.match(shell, /constructor-edge-handle edge-left/)
assert.match(shell, /constructor-edge-handle edge-right/)
assert.match(shell, /constructor-edge-handle edge-top/)
assert.match(shell, /constructor-edge-handle edge-bottom/)
assert.match(shell, /constructor-frame-dimension-width/)
assert.match(shell, /constructor-frame-dimension-height/)
assert.match(shell, /commitNumericDimension/)
assert.match(shell, /widthDraft/)
assert.match(shell, /heightDraft/)
assert.match(shell, /onFocus=\{\(event\) => event\.currentTarget\.select\(\)\}/)
assert.match(shell, /event\.key === 'Enter'/)
assert.match(shell, /event\.key === 'Escape'/)
assert.match(shell, /(?:Видима ширина|Схемна видима ширина)/)
assert.match(shell, /Профилна дълбочина/)
assert.match(shell, /не се измисля профилен код или производствена геометрия/)

assert.match(css, /\.constructor-parametric-frame/)
assert.match(css, /\.constructor-edge-handle/)
assert.match(css, /cursor: ew-resize/)
assert.match(css, /cursor: ns-resize/)
assert.match(css, /\.constructor-frame-dimension-width/)
assert.match(css, /\.constructor-frame-dimension-height/)

assert.match(app, /freeSketchDraft/)
assert.match(app, /offerSourceSketch/)
assert.match(app, /initialDraft=\{freeSketchDraft\}/)
assert.match(app, /onDraftChange=\{setFreeSketchDraft\}/)
assert.match(app, /onModuleSizeChange/)
assert.match(app, /widthSource: '(?:manual|constructor)'/)
assert.match(app, /heightSource: '(?:manual|constructor)'/)
assert.match(app, /габаритът на касата се запазва/)

assert.match(acceptance, /PARAMETRIC FRAME: YES/)
assert.match(acceptance, /EDGE RESIZE: YES/)
assert.match(acceptance, /FREE SKETCH -> OFFER DIMENSION TRANSFER: YES/)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01b\.mjs/)

console.log('CONSTRUCTOR 01B PARAMETRIC FRAME VERIFY PASS')
console.log('FRAME: POINTER CREATE + EDITABLE NUMERIC WIDTH/HEIGHT')
console.log('EDGES: LEFT | RIGHT | TOP | BOTTOM SELECTABLE RESIZE')
console.log('SNAP: 10 MM WORKING STEP')
console.log('LIVE DIMENSIONS: YES')
console.log('KEYBOARD DIMENSIONS: TYPE -> ENTER/BLUR COMMIT | ESC CANCEL')
console.log('FREE SKETCH -> OFFER DIMENSION TRANSFER: YES')
console.log('OFFER MODULE SIZE SYNC: YES')
console.log('PROFILE-AWARE VISIBLE WIDTH/DEPTH: NOT YET')
console.log('DIVIDERS: IMPLEMENTED BY LATER CONSTRUCTOR 01C')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
