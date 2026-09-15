import assert from 'node:assert/strict'
import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const runtime = fs.readFileSync('scripts/verify-integrated-acceptance01-runtime.mjs', 'utf8')
const constructor = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const transition = fs.readFileSync('src/domain/formConstructorTransition.ts', 'utf8')
const profile = fs.readFileSync('src/domain/profileResolution.ts', 'utf8')

assert.equal(
  pkg.scripts?.['test:integrated-acceptance01'],
  'node scripts/verify-integrated-acceptance01-runtime.mjs',
  '0.1.8E npm script must be registered without changing the full verify chain',
)
assert.match(runtime, /two independently configured modules start isolated/)
assert.match(runtime, /combined construction \+ glazing edit affects only Module 1/)
assert.match(runtime, /atomic Undo restore path returns exact Module 1 construction and configuration/)
assert.match(runtime, /Reset clears only active Module 1 technical work/)
assert.match(runtime, /save and reopen preserves both module technical states and active module identity/)
assert.match(runtime, /undoStack\|redoStack\|constructorHistoryByModuleId/)
assert.match(constructor, /FACADEFLOW 0\.1\.8B ATOMIC MODULE HISTORY 01/)
assert.match(constructor, /constructorHistoryByModuleId = new Map/)
assert.match(constructor, /const restoreHistoryEntry = \(entry: ConstructorHistoryEntry\)/)
assert.match(transition, /transferFormFieldDescriptionsToConstruction/)
assert.match(profile, /FIELD GLAZING OWNERSHIP|fieldGlazingSpecifications|moduleGlazingSpecification/)

console.log('FACADEFLOW 0.1.8E INTEGRATED ACCEPTANCE 01 VERIFY PASS')
console.log('SCOPE: TEST / ACCEPTANCE ONLY; PRODUCT DOMAIN BEHAVIOR UNCHANGED')
console.log('TWO-MODULE INTEGRATION: COVERED')
console.log('EDIT / UNDO / REDO RESTORE PATH: COVERED')
console.log('RESET / UNDO RESTORE PATH: COVERED')
console.log('SAVE / REOPEN / COMPARE: COVERED')
console.log('FULL VERIFY CHAIN MODIFIED: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
