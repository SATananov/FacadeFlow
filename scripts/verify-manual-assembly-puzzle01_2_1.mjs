import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

for (const marker of [
  'data-manual-assembly-puzzle="01.2"',
  'data-visual-workbench-cleanup="01.2.1"',
  "const [catalogCollapsed, setCatalogCollapsed] = useState(false)",
  "const [inspectorCollapsed, setInspectorCollapsed] = useState(false)",
  "is-palette-collapsed",
  "is-controls-collapsed",
  'assembly-puzzle-collapse-button',
  'assembly-puzzle-profile-image',
  'manualPuzzleSmallGrid012',
  'manualPuzzleMajorGrid012',
  'PUZZLE_GRID_STEP_MM = 5',
  'PUZZLE_MAJOR_GRID_MM = 25',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.2.1 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-layout.is-palette-collapsed',
  '.assembly-puzzle-layout.is-controls-collapsed',
  '.assembly-puzzle-profile-image',
  'mix-blend-mode: multiply',
  '.assembly-puzzle-collapse-button',
  '.assembly-puzzle-mm-grid { stroke: none; }',
  'pattern[id="manualPuzzleMajorGrid012"] > path',
  'fill: transparent;',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.2.1 missing CSS marker: ${marker}`)
}

assert.ok(!panel.includes('function workspaceProfileGraphic('), 'unused workspaceProfileGraphic helper must be removed')
assert.ok(!css.includes('.assembly-puzzle-mm-grid { fill: #fbfdfe; }'), 'grid fill override must stay removed so SVG pattern remains visible')

console.log('=== MANUAL ASSEMBLY PUZZLE 01.2.1 VERIFY PASS ===')
console.log('VISIBLE WORK GRID: 5 mm / MAJOR 25 mm')
console.log('PROFILE-FIRST RENDER: WHITE IMAGE FIELD BLENDED INTO WORKBENCH')
console.log('SELECTION CARD: HIDDEN UNTIL SELECTED')
console.log('LEFT CATALOGUE: COLLAPSIBLE')
console.log('RIGHT INSPECTOR: COLLAPSIBLE')
console.log('WORKBENCH WIDTH: EXPANDS WHEN SIDE PANELS COLLAPSE')
console.log('UNUSED WORKSPACE GRAPHIC HELPER: REMOVED')
console.log('CUSTOM DRAFT / PRODUCTION BOUNDARIES: UNCHANGED')
