import assert from 'node:assert/strict'
import path from 'node:path'
import { readSource, nodes, functionNode, cssRules, uniqueCssValue, ts } from './constructor-source-inspection.mjs'

const root = process.argv[2] ?? process.cwd()
const shell = readSource(path.join(root, 'src/components/ConstructorShell.tsx'))
const rules = cssRules(path.join(root, 'src/components/ConstructorShell.css'))
const expected = new Map([
  ['select', 'Селекция'], ['pan', 'Панорама'], ['frame', 'Каса / рамка'],
  ['vertical-divider', 'Вертикален делител'], ['horizontal-divider', 'Хоризонтален делител'],
  ['angled-divider', 'Ъглов делител'], ['fixed-field', 'Фиксирано поле'],
  ['operable-field', 'Отваряемо поле'], ['door', 'Врата'],
])
const iconFunction = functionNode(shell, 'renderConstructorToolIcon')
for (const [id, label] of expected) {
  const bindings = nodes(shell, (node) => ts.isCallExpression(node)
    && node.expression.getText() === 'renderConstructorToolIcon'
    && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === id)
  assert.equal(bindings.length, 1, 'Expected one icon binding: ' + id)
  let button = bindings[0].parent
  while (button && !(ts.isJsxElement(button) && button.openingElement.tagName.getText() === 'button')) button = button.parent
  assert.ok(button, 'Icon must be rendered inside a tool button: ' + id)
  assert.ok(nodes(button, ts.isJsxText).some((node) => node.text.trim() === label), 'Button label mismatch: ' + id)
  const cases = nodes(iconFunction, (node) => ts.isCaseClause(node) && ts.isStringLiteral(node.expression) && node.expression.text === id)
  assert.equal(cases.length, 1, 'Missing SVG case: ' + id)
  assert.ok(nodes(cases[0], (node) => ts.isJsxOpeningElement(node) && node.tagName.getText() === 'svg').length)
}
assert.equal(uniqueCssValue(rules, '.constructor-tool-glyph svg', 'stroke'), 'currentColor')
console.log('TOOL ICONS: all nine SVG cases are bound to their Bulgarian tool buttons. Rendering not exercised.')
