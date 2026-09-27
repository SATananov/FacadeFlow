import assert from 'node:assert/strict'
import { cssRules, uniqueCssValue, assertConstructorFeature } from './constructor-source-inspection.mjs'

const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
for (const selector of [
  '.constructor-workarea', '.constructor-canvas.has-grid', '.constructor-frame-visual',
  '.constructor-parametric-frame.is-selected .constructor-frame-visual',
  '.constructor-field-surface.is-fixed', '.constructor-field-surface.is-operable',
  '.constructor-divider > .constructor-divider-face', '.constructor-sash-profile-visual',
  '.constructor-operable-visual .opening-primary', '.constructor-field-number-badge',
]) assert.ok(rules.some((rule) => rule.selector === selector), 'Missing CSS rule: ' + selector)
assert.equal(uniqueCssValue(rules, '.constructor-canvas', 'background-position'), '0 0')
assert.match(uniqueCssValue(rules, '.constructor-canvas.has-grid', 'background-size'), /var\(--constructor-grid-step/)
assertConstructorFeature('frame')
assertConstructorFeature('topology')
console.log('TD01.1: current source/CSS contracts passed; visual hierarchy requires browser review.')
