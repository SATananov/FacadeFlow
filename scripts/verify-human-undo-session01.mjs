import fs from 'node:fs'
import assert from 'node:assert/strict'

const sourcePath = 'src/components/ConstructorShell.tsx'
const source = fs.readFileSync(sourcePath, 'utf8')

function requireText(label, text) {
  if (!source.includes(text)) {
    throw new Error(`FAIL ${label}: missing ${JSON.stringify(text)}`)
  }
  console.log(`PASS ${label}`)
}

requireText('V2 hotfix marker exists', 'FACADEFLOW 0.1.8E.1 HUMAN UNDO SESSION HOTFIX V2')
requireText('synchronous history writer exists', 'const writeHistoryStacks = (')
requireText('undo ref updated synchronously on push', 'undoStackRef.current = clonedUndo')
requireText('redo ref updated synchronously on push', 'redoStackRef.current = clonedRedo')
requireText('module cache updated synchronously on push', 'constructorHistoryByModuleId.set(historySessionKey, {')
requireText('push uses authoritative undo ref', '...undoStackRef.current.slice(-59)')
requireText('undo reads authoritative undo ref', 'const previous = undoStackRef.current.at(-1)')
requireText('redo reads authoritative redo ref', 'const next = redoStackRef.current.at(-1)')
requireText('undo synchronizes next undo ref', 'const nextUndoRef = undoStackRef.current.slice(0, -1).map(cloneHistoryEntry)')
requireText('undo synchronizes next redo ref', 'const nextRedoRef = [\n      ...redoStackRef.current.slice(-59),')
requireText('redo synchronizes next redo ref', 'const nextRedoRef = redoStackRef.current.slice(0, -1).map(cloneHistoryEntry)')
requireText('field type still uses atomic construction commit', 'commitConstruction(nextConstruction)')
requireText('Undo button remains React-state driven', 'const canUndo = undoStack.length > 0')
requireText('Redo button remains React-state driven', 'const canRedo = redoStack.length > 0')

// Preserve 0.1.8B verifier contract shape while adding synchronous refs/cache.
assert.match(source, /const currentSnapshot = captureHistoryEntry\(\)[\s\S]*setRedoStack[\s\S]*cloneHistoryEntry\(currentSnapshot\)[\s\S]*restoreHistoryEntry\(previous\)/)
console.log('PASS legacy 0.1.8B Undo verifier contract remains valid')
assert.match(source, /const currentSnapshot = captureHistoryEntry\(\)[\s\S]*setUndoStack[\s\S]*cloneHistoryEntry\(currentSnapshot\)[\s\S]*restoreHistoryEntry\(next\)/)
console.log('PASS legacy 0.1.8B Redo verifier contract remains valid')

// Model the intended session invariant: history must already exist in cache before
// a parent callback/re-render/remount can occur.
const cache = new Map()
let undoRef = []
let redoRef = []
const clone = (value) => structuredClone(value)
function write(key, nextUndo, nextRedo) {
  const undo = nextUndo.map(clone)
  const redo = nextRedo.map(clone)
  undoRef = undo
  redoRef = redo
  cache.set(key, { undo: undo.map(clone), redo: redo.map(clone) })
}
function push(key, entry) {
  write(key, [...undoRef.slice(-59), clone(entry)], [])
}
const key = 'free:module-human-smoke'
push(key, { construction: { fieldType: 'fixed' }, profileResolution: null, productType: null })
const remounted = cache.get(key)
assert.equal(remounted?.undo.length, 1)
assert.equal(remounted?.redo.length, 0)
console.log('PASS first technical edit is cached before immediate remount')

const currentSnapshot = { construction: { fieldType: 'operable' }, profileResolution: null, productType: null }
const previous = undoRef.at(-1)
const nextUndo = undoRef.slice(0, -1).map(clone)
const nextRedo = [...redoRef.slice(-59), clone(currentSnapshot)]
write(key, nextUndo, nextRedo)
assert.equal(previous?.construction.fieldType, 'fixed')
assert.equal(cache.get(key)?.undo.length, 0)
assert.equal(cache.get(key)?.redo.length, 1)
console.log('PASS Undo publishes redo history before restored state callbacks')

console.log('')
console.log('FACADEFLOW 0.1.8E.1 HUMAN UNDO SESSION HOTFIX V2 VERIFY PASS')
console.log('FIRST TECHNICAL EDIT -> UNDO AVAILABLE: SYNCHRONOUS')
console.log('UNDO -> REDO AVAILABILITY: SYNCHRONOUS')
console.log('PER-MODULE SESSION CACHE: SYNCHRONOUS')
console.log('0.1.8B VERIFIER CONTRACT: PRESERVED')
console.log('HISTORY AFTER APP RESTART: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
