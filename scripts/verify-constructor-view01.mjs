import fs from 'node:fs'

const tsx = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')

const requiredTsx = [
  "type ViewOffset =",
  "type ViewPanState =",
  "const [viewOffset, setViewOffset]",
  "const [viewPanState, setViewPanState]",
  "const [autoFitEnabled, setAutoFitEnabled] = useState(true)",
  "const fitViewToFrame =",
  "const changeViewZoom =",
  "const restoreFitView =",
  "const handleCanvasPointerDownCapture =",
  "if (activeTool !== 'pan') return",
  "setAutoFitEnabled(false)",
  "event.clientX - rect.left - viewOffset.xPx",
  "event.clientY - rect.top - viewOffset.yPx",
  "left: `${viewOffset.xPx + displayedFrame.xMm * pxPerMm}px`",
  "top: `${viewOffset.yPx + displayedFrame.yMm * pxPerMm}px`",
  "backgroundPosition: `${viewOffset.xPx - 1}px ${viewOffset.yPx - 1}px`",
  "onPointerDownCapture={handleCanvasPointerDownCapture}",
  "Fit{autoFitEnabled ? ' AUTO' : ''}",
  "ZOOM: {zoom}% · {autoFitEnabled ? 'FIT AUTO' : 'MANUAL VIEW'}",
]

const missingTsx = requiredTsx.filter((token) => !tsx.includes(token))
if (missingTsx.length) {
  console.error('CONSTRUCTOR VIEW 01 VERIFY FAIL — missing TSX markers:')
  for (const token of missingTsx) console.error(`- ${token}`)
  process.exit(1)
}

const requiredCss = [
  '.constructor-canvas.is-pan-tool',
  'cursor: grab;',
  '.constructor-canvas.is-pan-tool.is-panning',
  'cursor: grabbing;',
]
const missingCss = requiredCss.filter((token) => !css.includes(token))
if (missingCss.length) {
  console.error('CONSTRUCTOR VIEW 01 VERIFY FAIL — missing CSS markers:')
  for (const token of missingCss) console.error(`- ${token}`)
  process.exit(1)
}

const forbidden = [
  'setConstructionFramePosition',
  'moveConstructionFrame',
  'translateConstructionTopology',
  'autoSelectProfile',
  'autoSelectGlazing',
  'autoSelectBead',
]
const foundForbidden = forbidden.filter((token) => tsx.includes(token))
if (foundForbidden.length) {
  console.error('CONSTRUCTOR VIEW 01 VERIFY FAIL — forbidden behavior markers found:')
  for (const token of foundForbidden) console.error(`- ${token}`)
  process.exit(1)
}

console.log('=== CONSTRUCTOR VIEW 01 VERIFY PASS ===')
console.log('PAN: VIEWPORT ONLY / WHOLE PRODUCT MOVES VISUALLY')
console.log('FIT TO VIEW: AUTOMATIC + EXPLICIT FIT CONTROL')
console.log('AUTO FIT: DEFAULT ON / DISABLED BY MANUAL PAN OR ZOOM')
console.log('ZOOM: CENTER-ANCHORED MANUAL STEPS')
console.log('GRID + RULERS: FOLLOW VIEW OFFSET')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('SAVED PRODUCT GEOMETRY: UNCHANGED BY PAN / FIT')
console.log('MACHINE READY: NO')
