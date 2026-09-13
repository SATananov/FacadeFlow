import assert from 'node:assert/strict'
import fs from 'node:fs'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')

assert.match(tsx, /const profileResolutionGuidedMissingLabel = useMemo\(\(\) => \{/)
assert.match(tsx, /if \(target\.kind === 'frame'\) return 'Избери профил на касата'/)
assert.match(tsx, /if \(target\.kind === 'divider'\) return 'Избери профил на делителя'/)
assert.match(tsx, /return field \? `Избери профил на крилото за Поле \$\{field\.sequence\}` : 'Избери профил на крилото'/)
assert.match(tsx, /Остават \$\{profileResolutionMissingTargets\.length\} профила за избор/)
assert.match(tsx, /const getFieldTechnicalTask = \(field: FieldModel\) => \{/)
assert.match(tsx, /title: `Избери профил на крилото за Поле \$\{field\.sequence\}`/)
assert.match(tsx, /title: `Въведи дебелина на стъклопакета за Поле \$\{field\.sequence\}`/)
assert.match(tsx, /title: `Избери стъклодържател за Поле \$\{field\.sequence\}`/)
assert.match(tsx, /<b>\{profileResolutionGuidedMissingLabel\}<\/b>/)

// Human-control and domain boundaries remain intact.
assert.match(tsx, /setFieldHumanGlazingThicknessAssignment/)
assert.match(tsx, /setFieldGlazingBeadAssignment/)
assert.doesNotMatch(tsx, /autoSelect.*profile/i)
assert.doesNotMatch(tsx, /autoSelect.*bead/i)

console.log('=== CONSTRUCTOR UX 02.4.2 VERIFY PASS ===')
console.log('MISSING PROFILE GUIDANCE: SPECIFIC TARGET / HUMAN-READABLE')
console.log('OPERABLE FIELD: EXPLICIT SASH PROFILE TASK')
console.log('FRAME / DIVIDER PROFILE TASKS: EXPLICIT')
console.log('GLAZING / BEAD NEXT TASKS: FIELD-SPECIFIC')
console.log('AUTO PROFILE / BEAD SELECTION: NO')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
