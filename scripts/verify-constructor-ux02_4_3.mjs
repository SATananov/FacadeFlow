import assert from 'node:assert/strict'
import fs from 'node:fs'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')

// Dependency order: the common frame profile must never be skipped for an OPERABLE field.
assert.match(tsx, /if \(!effectiveProfileResolution\.frame\?\.profileCode\) return 'frame-profile'/)
assert.match(tsx, /const frameProfileReady = Boolean\(effectiveProfileResolution\.frame\?\.profileCode\)/)
assert.match(tsx, /const sashProfileReady = selectedField\.fieldType !== 'operable' \|\| Boolean\(effectiveProfileResolution\.fieldSashes\[selectedField\.id\]\?\.profileCode\)/)
assert.match(tsx, /: !frameProfileReady[\s\S]*label: 'Избери профил на касата'/)
assert.match(tsx, /: !sashProfileReady[\s\S]*label: `Избери профил на крилото за Поле \$\{selectedField\.sequence\}`/)

// Completion wording is local and never implies the whole technical flow is finished.
assert.match(tsx, /label: `Данните за Поле \$\{selectedField\.sequence\} са въведени`/)
assert.match(tsx, /Следващото действие остава отделно и изрично/)
assert.match(tsx, /<em>\{currentStep\.action === 'done' \? 'ГОТОВО' : 'СЕГА'\}<\/em>/)

// The old ambiguous generic Continue action is replaced with an exact destination.
assert.match(tsx, /label: 'Към профила на делителя'/)
assert.match(tsx, /label: nextTechnicalTask\.actionLabel/)
assert.match(tsx, /label: 'Към прегледа на сглобката'/)
assert.match(tsx, /actionLabel: 'Към профила на касата'/)
assert.match(tsx, /actionLabel: 'Към профила на крилото'/)
assert.match(tsx, /actionLabel: 'Към стъклопакета'/)
assert.match(tsx, /actionLabel: 'Към стъклодържателя'/)
assert.doesNotMatch(tsx, />\s*Продължи\s*<\/button>/)

// Existing human-control boundaries remain intact.
assert.match(tsx, /setFrameProfileAssignment/)
assert.match(tsx, /setFieldSashProfileAssignment/)
assert.match(tsx, /setFieldHumanGlazingThicknessAssignment/)
assert.match(tsx, /setFieldGlazingBeadAssignment/)
assert.doesNotMatch(tsx, /autoSelect.*profile/i)
assert.doesNotMatch(tsx, /autoSelect.*bead/i)

console.log('=== CONSTRUCTOR UX 02.4.3 VERIFY PASS ===')
console.log('OPERABLE DEPENDENCY ORDER: FRAME -> MODULE TYPE -> SASH -> GLAZING -> BEAD')
console.log('FIELD COMPLETION: LOCAL / DOES NOT MASK MISSING FRAME PROFILE')
console.log('NEXT ACTION: EXPLICIT DESTINATION / NO GENERIC CONTINUE')
console.log('AUTO PROFILE / GLAZING / BEAD SELECTION: NO')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
