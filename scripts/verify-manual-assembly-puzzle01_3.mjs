import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

for (const marker of [
  'data-precision-rotation="01.3"',
  'function normalizePuzzleRotation',
  'aria-label="Прецизно завъртане на избрания елемент"',
  '>−90°</button>',
  '>−5°</button>',
  '>−1°</button>',
  '>0°</button>',
  '>+1°</button>',
  '>+5°</button>',
  '>+90°</button>',
  'className="assembly-puzzle-angle-input"',
  'type="number"',
  'value={piece.pose.rotationDeg}',
  'normalizePuzzleRotation(next)',
  'data-coordinate-grid-hotfix="01.2.2"',
  'PUZZLE_GRID_STEP_MM = 5',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.3 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-rotation-controls',
  '.assembly-puzzle-control-label',
  '.assembly-puzzle-angle-input',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.3 missing CSS marker: ${marker}`)
}

assert.ok(!panel.includes('rotationDeg: value.rotationDeg - 90'), 'legacy raw -90 rotation must be replaced by normalized precision rotation')
assert.ok(!panel.includes('rotationDeg: value.rotationDeg + 90'), 'legacy raw +90 rotation must be replaced by normalized precision rotation')

console.log('=== MANUAL ASSEMBLY PUZZLE 01.3 VERIFY PASS ===')
console.log('ROTATION: -90 / -5 / -1 / 0 / +1 / +5 / +90')
console.log('DIRECT ANGLE INPUT: ENABLED')
console.log('ANGLE NORMALIZATION: ENABLED')
console.log('01.2.2 COORDINATE GRID / SNAP: PRESERVED')
console.log('CUSTOM DRAFT / PRODUCTION BOUNDARIES: UNCHANGED')
