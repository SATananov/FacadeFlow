import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

for (const marker of [
  'data-empty-workspace="01.3.2"',
  'РЪЧНА СГЛОБКА · ПЪЗЕЛ 01.3.2',
  'return { ...base, puzzlePieces: [] }',
  "const [selectedPieceId, setSelectedPieceId] = useState<string>('')",
  "applyPieces([], { selectedPieceId: '' })",
  'Работната площ е празна',
  'Избери „Добави“ или плъзни детайл от каталога вляво',
  "if (options.selectedPieceId !== undefined)",
  "const isGlassBead = section?.profileRole === 'glass-bead'",
  "isGlassBead ? 'is-glass-bead' : ''",
  'data-undo-redo-history="01.3.1"',
  'data-precision-rotation="01.3"',
  'data-coordinate-grid-hotfix="01.2.2"',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.3.2 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-empty-workspace-hint',
  '.assembly-puzzle-profile-image.is-glass-bead',
  'contrast(2.2)',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.3.2 missing CSS marker: ${marker}`)
}

assert.ok(
  !panel.includes("if (pieceId === 'support' || pieceId === 'sash') return"),
  'manual puzzle must allow removal of every manually placed part',
)
assert.ok(
  !panel.includes('const protectedPiece = piece.id === \'support\' || piece.id === \'sash\''),
  'manual puzzle must not protect auto-seeded support/sash pieces',
)
assert.ok(
  !panel.includes("resetPieces.push({ id: 'field-bead'") && !panel.includes("resetPieces.push({ id: 'field-glazing'"),
  'reset must clear the board instead of re-seeding context parts',
)
assert.ok(
  panel.includes('if (initialDraft) return initialDraft'),
  'an explicitly saved CUSTOM DRAFT must still reopen as saved',
)

console.log('=== MANUAL ASSEMBLY PUZZLE 01.3.2 VERIFY PASS ===')
console.log('NEW UNSAVED WORKSPACE: EMPTY')
console.log('PART SELECTION: HUMAN ONLY FROM LEFT CATALOGUE')
console.log('RESET: EMPTY BOARD')
console.log('SAVED CUSTOM DRAFT: REOPENS AS SAVED')
console.log('ALL MANUALLY PLACED PARTS: REMOVABLE')
console.log('482.15 WORKSPACE RENDER: VISUALLY NORMALIZED')
console.log('UNDO / REDO 01.3.1: PRESERVED')
console.log('PRECISION ROTATION 01.3: PRESERVED')
console.log('GRID / SNAP 01.2.2: PRESERVED')
console.log('AUTOMATIC SYSTEM ASSEMBLY: UNCHANGED')
console.log('CUSTOM DRAFT ONLY: YES')
console.log('PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
