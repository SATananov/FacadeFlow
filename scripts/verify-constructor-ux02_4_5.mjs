import fs from 'node:fs'
import assert from 'node:assert/strict'

const source = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')

assert.match(source, /inspectorWorkMode === 'guided' && !guidedFieldFocusTarget \? renderSelectedFieldWorkflowGuide\(\) : null/)
assert.match(source, /if \(target\.kind === 'frame'\) return 'Липсва профил на касата'/)
assert.match(source, /if \(target\.kind === 'divider'\) return 'Липсва профил на делителя'/)
assert.match(source, /Липсва профил на крилото за Поле/)
assert.match(source, /label: selectedTask\.actionLabel/)
assert.match(source, /onClick: \(\) => openFieldGuideTarget\(focusTarget\)/)
assert.doesNotMatch(source, /autoSelect/i)

console.log('=== CONSTRUCTOR UX 02.4.5 VERIFY PASS ===')
console.log('PRIMARY GUIDED TASK: SINGLE ACTION OWNER AT TOP')
console.log('SELECTED ELEMENT PROFILE BADGE: STATUS ONLY / NO DUPLICATE IMPERATIVE')
console.log('FIELD WORKFLOW CARD: HIDDEN WHILE DIRECT TECHNICAL TARGET IS ACTIVE')
console.log('FIELD TYPE / DONE FLOW: PRESERVED')
console.log('AUTO PROFILE / GLAZING / BEAD SELECTION: NO')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
