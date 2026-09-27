import assert from 'node:assert/strict'
import { cssRules, uniqueCssValue } from './constructor-source-inspection.mjs'

const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
for (const edge of ['top', 'bottom', 'left', 'right']) {
  const selector = `.constructor-parametric-frame.has-selected-${edge} .edge-${edge}::after`
  const horizontal = edge === 'top' || edge === 'bottom'
  assert.equal(uniqueCssValue(rules, selector, horizontal ? 'height' : 'width'), '2px')
  assert.equal(uniqueCssValue(rules, selector, horizontal ? 'top' : 'left'), '7px')
  assert.equal(uniqueCssValue(rules, selector, 'pointer-events'), 'none')
}
console.log('TD01.3.1: thin edge indicator CSS contracts passed; pointer interaction not exercised.')
