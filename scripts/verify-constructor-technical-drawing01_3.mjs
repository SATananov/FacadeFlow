import assert from 'node:assert/strict'
import { cssRules, uniqueCssValue, readSource, nodes, ts } from './constructor-source-inspection.mjs'

const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
const shell = readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
const width = '.constructor-frame-dimension-width'
const chainedWidth = '.constructor-parametric-frame.has-bay-dimensions .constructor-frame-dimension-width'
const bay = '.constructor-bay-dimension-band'
const height = '.constructor-frame-dimension-height'
const pixels = (selector, property) => {
  const value = uniqueCssValue(rules, selector, property)
  assert.match(value, /^-?\d+px$/, 'Position must have one explicit, non-important pixel value')
  return Number.parseInt(value, 10)
}
assert.ok(pixels(width, 'bottom') < 0)
assert.ok(pixels(chainedWidth, 'bottom') < pixels(bay, 'bottom') - 24, 'Overall width must stay outside the intermediate chain')
assert.ok(pixels(height, 'right') < 0, 'Overall height belongs on the right')
for (const rule of rules) {
  if (rule.selector.includes('constructor-frame-dimension-width')) {
    for (const declaration of rule.declarations.filter((item) => item.property === 'bottom')) {
      assert.ok([width, chainedWidth].includes(rule.selector), 'Unexpected width-position override')
      assert.doesNotMatch(declaration.value, /!important/)
    }
  }
}
const renderedExpressions = nodes(shell, (node) => ts.isJsxExpression(node) && node.expression)
  .map((node) => node.expression.getText())
for (const expression of ['Math.round(bay.widthMm)', 'Math.round(displayedFrame.widthMm)', 'Math.round(displayedFrame.heightMm)']) {
  assert.ok(renderedExpressions.includes(expression), 'Missing dimension value in JSX: ' + expression)
}
console.log('DIMENSION SOURCE CONTRACT: chain separation and canonical JSX values passed; layout not rendered.')
