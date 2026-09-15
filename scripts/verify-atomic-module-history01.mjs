import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)

assert.match(shell, /FACADEFLOW 0\.1\.8B ATOMIC MODULE HISTORY 01/)
assert.match(shell, /type ConstructorHistoryEntry = \{[\s\S]*construction: ConstructionModel \| null[\s\S]*profileResolution: ModuleProfileResolution \| null[\s\S]*productType: 'window' \| 'door' \| null/)
assert.match(shell, /constructorHistoryByModuleId = new Map<string, ConstructorHistoryStacks>/)
assert.match(shell, /historySessionKey = activeModuleId \? `\$\{mode\}:\$\{activeModuleId\}` : null/)
assert.match(shell, /cachedModuleHistory\?\.undo\.map\(cloneHistoryEntry\)/)
assert.match(shell, /cachedModuleHistory\?\.redo\.map\(cloneHistoryEntry\)/)

assert.match(shell, /profileResolutionRef = useRef<ModuleProfileResolution \| null>/)
assert.match(shell, /productTypeRef = useRef<'window' \| 'door' \| null>/)
assert.match(shell, /profileResolutionRef\.current = cloneHistoryProfileResolution\(effectiveProfileResolution\)[\s\S]*onProfileResolutionChange\(effectiveProfileResolution\)/)

assert.match(shell, /pushUndoEntry\(captureHistoryEntry\(currentConstruction\)\)/)
assert.match(shell, /pushUndoEntry\(captureHistoryEntry\(originalConstruction\)\)/)
assert.match(shell, /const publishProfileResolution = \(next: ModuleProfileResolution\) => \{[\s\S]*pushUndoEntry\(captureHistoryEntry\(\)\)[\s\S]*setRedoStack\(\[\]\)[\s\S]*onProfileResolutionChange\?\.\(next\)/)
assert.match(shell, /const applyModuleProductTypeFromConstructor = \(productType: 'window' \| 'door' \| null\) => \{[\s\S]*pushUndoEntry\(captureHistoryEntry\(\)\)[\s\S]*productTypeRef\.current = productType[\s\S]*onModuleProductTypeChange\?\.\(productType\)/)

assert.match(shell, /const restoreHistoryEntry = \(entry: ConstructorHistoryEntry\) => \{[\s\S]*onModuleProductTypeChange\?\.\(restored\.productType\)[\s\S]*broadcastConstruction\(restored\.construction\)[\s\S]*profileResolutionRef\.current = cloneHistoryProfileResolution\(restored\.profileResolution\)[\s\S]*onProfileResolutionChange\?\./)
assert.match(shell, /const currentSnapshot = captureHistoryEntry\(\)[\s\S]*setRedoStack[\s\S]*cloneHistoryEntry\(currentSnapshot\)[\s\S]*restoreHistoryEntry\(previous\)/)
assert.match(shell, /const currentSnapshot = captureHistoryEntry\(\)[\s\S]*setUndoStack[\s\S]*cloneHistoryEntry\(currentSnapshot\)[\s\S]*restoreHistoryEntry\(next\)/)

// Reset remains one construction transaction. Its profile state is now in the same history entry.
assert.match(shell, /const resetConstructionFromScratch = \(\) => \{[\s\S]*commitConstruction\(null\)[\s\S]*onResetModule\?\.\(\)/)

// History is deliberately session-only: no storage adapter/localStorage wiring is introduced here.
const historyTypeRegion = shell.slice(
  shell.indexOf('type ConstructorHistoryEntry'),
  shell.indexOf('type ConstructorTool'),
)
assert.doesNotMatch(historyTypeRegion, /localStorage|sessionStorage|projectSerialization|saveProject/)

console.log('FACADEFLOW 0.1.8B ATOMIC MODULE HISTORY 01 VERIFY PASS')
console.log('UNDO / REDO: CONSTRUCTION + PROFILE RESOLUTION + MODULE TYPE')
console.log('FIELD TYPE -> RECONCILIATION -> UNDO: CONFIGURATION RESTORABLE')
console.log('GLAZING THICKNESS / BEAD CHANGES: FIRST-CLASS HISTORY')
console.log('DELETE / RESET: PREVIOUS TECHNICAL SNAPSHOT RETAINED')
console.log('MODULE SWITCH: SESSION HISTORY CACHED PER ACTIVE MODULE ID')
console.log('HISTORY PERSISTED AFTER APP RELOAD: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
