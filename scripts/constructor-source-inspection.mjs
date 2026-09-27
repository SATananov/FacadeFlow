import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const printer = ts.createPrinter({ removeComments: true })
export function readSource(path) {
  const source = ts.createSourceFile(String(path), fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  assert.equal(source.parseDiagnostics.length, 0, `Source must parse: ${path}`)
  return source
}
export function nodes(root, predicate) {
  const result = []
  const visit = (node) => {
    if (predicate(node)) result.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return result
}
export function code(node, source = node.getSourceFile()) {
  return printer.printNode(ts.EmitHint.Unspecified, node, source)
}
export function functionNode(source, name) {
  const matches = nodes(source, (node) =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name)
    || (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name
      && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))))
  assert.equal(matches.length, 1, `Expected one function: ${name}`)
  return ts.isVariableDeclaration(matches[0]) ? matches[0].initializer : matches[0]
}
export function callNames(root) {
  return nodes(root, ts.isCallExpression).map((node) => node.expression.getText())
}
export function jsxHandlerNodes(source, event) {
  return nodes(source, (node) => ts.isJsxAttribute(node) && node.name.getText() === event)
    .map((node) => node.initializer)
    .filter((node) => node && ts.isJsxExpression(node) && node.expression)
    .map((node) => node.expression)
}
export function requireJsxHandler(source, event, handler) {
  const matches = jsxHandlerNodes(source, event).filter((node) =>
    (ts.isIdentifier(node) && node.text === handler) || callNames(node).includes(handler))
  assert.ok(matches.length, `Missing live JSX ${event} binding: ${handler}`)
  return matches
}
export function dragBranch(source, kind) {
  const matches = nodes(functionNode(source, 'handleCanvasPointerMove'), (node) =>
    ts.isIfStatement(node) && ts.isBinaryExpression(node.expression)
    && node.expression.left.getText() === 'dragState.kind'
    && ts.isStringLiteral(node.expression.right) && node.expression.right.text === kind)
  assert.equal(matches.length, 1, `Expected one drag branch: ${kind}`)
  return matches[0].thenStatement
}
export function cssRules(path) {
  const css = fs.readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((match) => {
    const declarations = [...match[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)]
      .map(([, property, value]) => ({ property, value: value.trim() }))
    return match[1].trim().split(',').map((selector) => ({ selector: selector.trim(), declarations }))
  })
}
/** Reject duplicates rather than accepting an old, overridden CSS token. */
export function uniqueCssValue(rules, selector, property) {
  const values = rules.filter((rule) => rule.selector === selector)
    .flatMap((rule) => rule.declarations.filter((declaration) => declaration.property === property))
  assert.equal(values.length, 1, `${selector}: expected one ${property} declaration`)
  return values[0].value
}
export { ts }

let constructorSource
export function hasJsxClass(source, className) {
  return nodes(source, (node) => ts.isJsxAttribute(node) && node.name.getText() === 'className')
    .some((node) => code(node).includes(className))
}
/** Shared replacements for obsolete UI/version markers in historical contracts. */
export function assertConstructorFeature(feature) {
  const source = constructorSource ??= readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
  const requireClass = (name) => assert.ok(hasJsxClass(source, name), 'Missing JSX class: ' + name)
  const requireCalls = (name, calls) => {
    const actual = callNames(functionNode(source, name))
    for (const call of calls) assert.ok(actual.includes(call), name + ' must call ' + call)
  }
  switch (feature) {
    case 'controls':
      for (const name of ['setGridVisible', 'setSnapEnabled', 'setProfileViewEnabled']) requireJsxHandler(source, 'onClick', name)
      requireClass('constructor-canvas')
      break
    case 'frame':
      assert.equal(requireJsxHandler(source, 'onPointerDown', 'startEdgeResize').length, 4)
      assert.ok(nodes(source, (node) => ts.isVariableDeclaration(node) && node.name.getText() === 'frameClassName'
        && node.initializer && code(node.initializer).includes('constructor-parametric-frame')).length)
      break
    case 'topology':
      assert.ok(callNames(source).includes('resolveConstructionTopology'))
      requireCalls('addDivider', ['findFieldAtPoint', 'splitField', 'commitConstruction'])
      requireJsxHandler(source, 'onPointerDown', 'addDivider')
      requireClass('constructor-field-surface')
      break
    case 'polygons':
      requireCalls('addAngledDivider', ['findFieldAtPoint', 'splitFieldAngled'])
      requireJsxHandler(source, 'onPointerDown', 'startAngledEndpointDrag')
      assert.ok(nodes(source, (node) => ts.isPropertyAssignment(node) && node.name.getText() === 'clipPath'
        && callNames(node).includes('field.polygon.map')).length)
      break
    case 'opening':
      requireClass('constructor-operable-visual')
      requireClass('constructor-opening-handle')
      requireJsxHandler(source, 'onClick', 'applySelectedFieldOpeningMode')
      break
    case 'field-details':
      requireClass('constructor-field-number-badge')
      requireClass('constructor-field-details-panel')
      requireClass('constructor-field-detail-card')
      break
    case 'glazing':
      requireCalls('applySelectedFieldGlazingBead', ['setFieldGlazingBeadAssignment', 'publishProfileResolution'])
      requireJsxHandler(source, 'onChange', 'applySelectedFieldGlazingBead')
      requireClass('constructor-glazing-candidates')
      requireClass('constructor-glazing-bead-control')
      break
    case 'hardware':
      assert.ok(callNames(source).includes('renderSelectedFieldHardwareRequirements'))
      assert.ok(callNames(source).includes('buildFieldHardwareRequirements'))
      break
    default:
      assert.fail('Unknown constructor source feature: ' + feature)
  }
}
