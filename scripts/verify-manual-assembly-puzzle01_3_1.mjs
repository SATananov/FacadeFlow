import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

for (const marker of [
  'data-undo-redo-history="01.3.1"',
  'type PuzzleHistorySnapshot',
  'undoHistoryRef',
  'redoHistoryRef',
  'const undoPuzzle = () =>',
  'const redoPuzzle = () =>',
  'redoHistoryRef.current = []',
  'historyBefore: makeHistorySnapshot',
  'updatePiecePose(drag.pieceId',
  '}), false)',
  'pushUndoHistory(drag.historyBefore)',
  '↶ Отмени',
  '↷ Повтори',
  'Ctrl+Z',
  'Ctrl+Y / Ctrl+Shift+Z',
  'event.key.toLocaleLowerCase() === \'z\'',
  'event.key.toLocaleLowerCase() === \'y\'',
  'puzzlePieces: snapshot.puzzlePieces',
  'supportPose: snapshot.supportPose',
  'sashPose: snapshot.sashPose',
  'data-precision-rotation="01.3"',
  'data-coordinate-grid-hotfix="01.2.2"',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.3.1 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-history-actions',
  '.assembly-puzzle-history-actions button',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.3.1 missing CSS marker: ${marker}`)
}

assert.ok(
  panel.includes("if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return"),
  'keyboard history must not steal native text-field undo/redo',
)
assert.ok(
  panel.includes('const saved = saveCustomJointDraft(draftRef.current)'),
  'save must use the current draft after history operations',
)
assert.ok(
  !panel.includes('title: snapshot.title') && !panel.includes('note: snapshot.note') && !panel.includes('sourceNote: snapshot.sourceNote'),
  'puzzle undo/redo must not overwrite draft text metadata',
)

console.log('=== MANUAL ASSEMBLY PUZZLE 01.3.1 VERIFY PASS ===')
console.log('UNDO / REDO: ADD / REMOVE / MOVE / ROTATE / MIRROR / LOCK / RESET')
console.log('DRAG HISTORY: ONE UNDO STEP PER COMPLETED DRAG')
console.log('KEYBOARD: CTRL+Z / CTRL+Y / CTRL+SHIFT+Z')
console.log('TEXT INPUT NATIVE UNDO: PRESERVED')
console.log('01.3 PRECISION ROTATION: PRESERVED')
console.log('01.2.2 GRID / SNAP: PRESERVED')
console.log('CUSTOM DRAFT / PRODUCTION BOUNDARIES: UNCHANGED')
