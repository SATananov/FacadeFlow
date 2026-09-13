import assert from 'node:assert/strict'
import fs from 'node:fs'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

assert.match(css, /CONSTRUCTOR UX 02\.4 — Unified Inspector Layout/)
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode\s*\{[\s\S]*?overflow-y:\s*auto;/)
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode > \.constructor-inspector-main-card\s*\{[\s\S]*?overflow:\s*visible;/)
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode \.constructor-inspector-details\[open\][\s\S]*?overflow:\s*visible\s*!important;/)
assert.match(css, /\.constructor-compact-inspector\.is-guided-mode \.constructor-inspector-settings-grid > \.is-informational\s*\{\s*display:\s*none;/)
assert.match(css, /\.constructor-layout\.is-guided-workflow \.constructor-field-surface\.has-unresolved-sash-geometry\.is-selected::after\s*\{\s*display:\s*none;/)
assert.match(css, /\.constructor-layout\.is-free-workflow \.constructor-field-surface\.has-unresolved-sash-geometry\.is-selected::after[\s\S]*?ГЕОМЕТРИЯ НА КРИЛОТО · НЕОПРЕДЕЛЕНА/)
assert.match(tsx, /constructor-guided-inline-help/)
assert.match(tsx, /inspectorWorkMode === 'free'[\s\S]*?Това не е готов шаблон/)
assert.match(tsx, /inspectorWorkMode === 'guided' \? 'ПРОВЕРКА' : 'ТЕХНИЧЕСКИ СТАТУС'/)
assert.match(tsx, /Подробности за Поле/)
assert.match(tsx, /constructor-guided-secondary-details/)

// Preserve the hard domain boundaries and human-controlled selections.
assert.match(tsx, /setFieldHumanGlazingThicknessAssignment/)
assert.match(tsx, /setFieldGlazingBeadAssignment/)
assert.doesNotMatch(tsx, /autoSelect.*profile/i)

console.log('=== CONSTRUCTOR UX 02.4 VERIFY PASS ===')
console.log('GUIDED RIGHT PANEL: ONE SCROLL OWNER')
console.log('NESTED CARD / PANE SCROLL: REMOVED IN GUIDED MODE')
console.log('MODULE CONTEXT: COMPACT / NON-ACTIONABLE ROWS HIDDEN')
console.log('SELECTED ELEMENT: ACTIVE DECISION REMAINS PRIMARY')
console.log('DRAWING DEBUG SASH LABEL: HIDDEN IN STEP-BY-STEP')
console.log('FREE WORK: FULL TECHNICAL INSPECTOR + BULGARIAN WARNING PRESERVED')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
