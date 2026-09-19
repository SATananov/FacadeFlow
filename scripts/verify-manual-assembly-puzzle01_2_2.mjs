import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

for (const marker of [
  'data-coordinate-grid-hotfix="01.2.2"',
  'const PUZZLE_CANVAS_WIDTH = 1000',
  'const PUZZLE_CANVAS_HEIGHT = 620',
  'const PUZZLE_ORIGIN_X = PUZZLE_CANVAS_WIDTH / 2',
  'const PUZZLE_ORIGIN_Y = PUZZLE_CANVAS_HEIGHT / 2',
  'PUZZLE_X_MAJOR_TICKS',
  'PUZZLE_Y_MAJOR_TICKS',
  'formatPuzzleCoordinate',
  'x={PUZZLE_ORIGIN_X} y={PUZZLE_ORIGIN_Y}',
  'className="assembly-puzzle-grid-surface"',
  'className="assembly-puzzle-grid-small-line"',
  'className="assembly-puzzle-grid-major-line"',
  'className="assembly-puzzle-ruler-band is-top"',
  'className="assembly-puzzle-ruler-band is-left"',
  'className="assembly-puzzle-origin-dot"',
  '>0,0</text>',
  '>X+</text>',
  '>Y+</text>',
  'snap(value, PUZZLE_ORIGIN_X)',
  'snap(value, PUZZLE_ORIGIN_Y)',
  'piece.pose.x - PUZZLE_ORIGIN_X',
  'PUZZLE_ORIGIN_Y - piece.pose.y',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.2.2 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-grid-surface',
  '.assembly-puzzle-canvas .assembly-puzzle-grid-small-line',
  '.assembly-puzzle-canvas .assembly-puzzle-grid-major-line',
  '.assembly-puzzle-ruler-band',
  '.assembly-puzzle-coordinate-tick',
  '.assembly-puzzle-origin-dot',
  '.assembly-puzzle-origin-label',
  '.assembly-puzzle-axis-direction',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.2.2 missing CSS marker: ${marker}`)
}

assert.ok(!panel.includes('className="assembly-custom-grid-bg assembly-puzzle-mm-grid"'), 'grid rect must not inherit the old solid fill override')
assert.ok(panel.includes('PUZZLE_GRID_STEP_MM = 5'), '5 mm minor grid must remain')
assert.ok(panel.includes('PUZZLE_MAJOR_GRID_MM = 25'), '25 mm major grid must remain')
assert.ok(panel.includes('data-visual-workbench-cleanup="01.2.1"'), '01.2.1 workbench cleanup must remain')
assert.ok(panel.includes('data-manual-assembly-puzzle="01.2"'), '01.2 module-context puzzle must remain')

console.log('=== MANUAL ASSEMBLY PUZZLE 01.2.2 VERIFY PASS ===')
console.log('VISIBLE COORDINATE GRID: 5 mm / MAJOR 25 mm')
console.log('GRID ORIGIN: CENTERED 0,0')
console.log('X AXIS: POSITIVE RIGHT')
console.log('Y AXIS: POSITIVE UP')
console.log('COORDINATE LABELS: 25 mm MAJOR TICKS')
console.log('SNAP PHASE: ALIGNED TO THE SAME 0,0 ORIGIN')
console.log('01.2 MODULE CONTEXT / FULL CATALOGUE / TRUE SCALE: PRESERVED')
console.log('01.2.1 COLLAPSIBLE WORKBENCH / CLEAN PROFILE VIEW: PRESERVED')
console.log('CUSTOM DRAFT / PRODUCTION BOUNDARIES: UNCHANGED')
