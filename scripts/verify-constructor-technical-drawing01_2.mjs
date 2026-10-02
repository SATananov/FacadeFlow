import assert from 'node:assert/strict'
import { cssRules, uniqueCssValue, readSource, code, assertConstructorFeature } from './constructor-source-inspection.mjs'

const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
const shell = readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
assertConstructorFeature('opening')
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-tilt', 'stroke-dasharray'), '2.4 2.2')
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual.mode-tilt .opening-tilt', 'stroke-dasharray'), '2.4 2.2')
assert.equal(uniqueCssValue(rules, '.constructor-opening-handle circle', 'display'), 'none')
for (const mode of ['side-hinged', 'tilt-turn', 'tilt', 'top-hung', 'side-hinged-top-hung']) assert.ok(code(shell).includes("field.openingMode === '" + mode + "'"))
for (const handing of ['left', 'right']) assert.ok(code(shell).includes("field.openingHanding === '" + handing + "'"))
console.log('TD01.2: opening source/CSS contracts passed; rendering not exercised.')
