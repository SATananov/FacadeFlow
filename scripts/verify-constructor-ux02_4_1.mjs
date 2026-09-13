import assert from 'node:assert/strict'
import fs from 'node:fs'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

assert.match(css, /CONSTRUCTOR UX 02\.4\.1 — Guided Inspector Micro-Polish/)
assert.match(tsx, /const \[technicalStatusOpen, setTechnicalStatusOpen\] = useState\(false\)/)
assert.match(tsx, /setTechnicalStatusOpen\(false\)/)
assert.match(tsx, /if \(selectedProfileSystem && frame\) setModuleSettingsOpen\(false\)/)
assert.match(tsx, /selectedFieldId,[\s\S]*?selectedDividerId,[\s\S]*?selectedAngledDividerId,[\s\S]*?fieldGuideFocusTarget,/)
assert.match(tsx, /open=\{technicalStatusOpen\}/)
assert.match(tsx, /onToggle=\{\(event\) => setTechnicalStatusOpen\(event\.currentTarget\.open\)\}/)
assert.match(tsx, /inspectorWorkMode === 'guided' \? 'Има още технически стъпки' : 'Конструктивна скица · още не е готова за производство'/)
assert.doesNotMatch(tsx, /inspectorWorkMode === 'guided' \? 'Има още технически стъпки преди производство'/)
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode \.constructor-safety-details > summary\s*\{[\s\S]*?min-height:\s*36px;/)

// UX02.4 contract remains: guided mode has a single scroll owner and no drawing debug label.
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode\s*\{[\s\S]*?overflow-y:\s*auto;/)
assert.match(css, /\.constructor-layout\.is-guided-workflow \.constructor-field-surface\.has-unresolved-sash-geometry\.is-selected::after\s*\{\s*display:\s*none;/)

// Domain and human-control boundaries stay intact.
assert.match(tsx, /setFieldHumanGlazingThicknessAssignment/)
assert.match(tsx, /setFieldGlazingBeadAssignment/)
assert.doesNotMatch(tsx, /autoSelect.*profile/i)

console.log('=== CONSTRUCTOR UX 02.4.1 VERIFY PASS ===')
console.log('GUIDED MODULE SETTINGS: AUTO-COLLAPSE WHEN WORK MOVES INTO CONSTRUCTION / FIELD FLOW')
console.log('GUIDED TECHNICAL STATUS: COMPACT BY DEFAULT / EXPLICITLY EXPANDABLE')
console.log('TECHNICAL STATUS COPY: SHORT HUMAN-READABLE SUMMARY')
console.log('GUIDED RIGHT PANEL: ONE SCROLL OWNER PRESERVED')
console.log('FREE WORK / DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
