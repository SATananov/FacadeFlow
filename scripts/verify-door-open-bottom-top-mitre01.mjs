import assert from 'node:assert/strict'
import path from 'node:path'
import { readSource, nodes, code, cssRules, uniqueCssValue, ts } from './constructor-source-inspection.mjs'

const root = process.argv[2] ?? process.cwd()
const shell = readSource(path.join(root, 'src/components/ConstructorShell.tsx'))
const rules = cssRules(path.join(root, 'src/components/ConstructorShell.css'))
const visual = nodes(shell, (node) => ts.isJsxElement(node)
  && node.openingElement.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute)
    && attribute.name.getText() === 'className' && attribute.initializer
    && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === 'constructor-frame-visual'))
assert.equal(visual.length, 1)
for (const [corner, rotation] of [['tl', '45deg'], ['tr', '-45deg'], ['bl', '-45deg'], ['br', '45deg']]) {
  const mitres = nodes(visual[0], (node) => ts.isJsxSelfClosingElement(node)
    && node.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute)
      && attribute.name.getText() === 'className' && attribute.initializer
      && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === 'constructor-frame-mitre mitre-' + corner))
  assert.equal(mitres.length, 1, 'One mitre per corner: ' + corner)
  const parent = mitres[0].parent
  if (corner.startsWith('b')) {
    assert.ok(ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)
    assert.equal(code(parent.left), "frameEdges?.bottom === 'frame'")
    assert.equal(parent.right, mitres[0])
  } else {
    assert.equal(parent, visual[0], 'Top mitre must be unconditional within the frame visual')
  }
  const selector = '.constructor-parametric-frame .constructor-frame-mitre.mitre-' + corner
  assert.equal(uniqueCssValue(rules, selector, 'transform'), 'rotate(' + rotation + ')')
  assert.equal(uniqueCssValue(rules, selector, corner.endsWith('l') ? 'left' : 'right'), '0')
  assert.equal(uniqueCssValue(rules, selector, corner.startsWith('t') ? 'top' : 'bottom'), '0')
}
assert.equal(uniqueCssValue(rules, '.constructor-parametric-frame .constructor-frame-mitre', 'height'), '2px')
assert.equal(uniqueCssValue(rules, '.constructor-parametric-frame .constructor-frame-mitre', 'z-index'), '12')
assert.equal(uniqueCssValue(rules, '.constructor-parametric-frame .constructor-frame-mitre', 'background'), 'rgba(18, 34, 40, .98)')
assert.match(uniqueCssValue(rules, '.constructor-parametric-frame .constructor-frame-mitre', 'box-shadow'), /rgba\(255, 255, 255, \.92\)/)
console.log('MITRE SOURCE CONTRACT: two unconditional top joints; bottom joints require full frame; mitres use visible contrast strokes.')
