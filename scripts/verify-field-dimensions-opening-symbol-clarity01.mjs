import assert from 'node:assert/strict'
import fs from 'node:fs'
import { runInNewContext } from 'node:vm'
import { readSource, nodes, code, callNames, hasJsxClass, cssRules, uniqueCssValue, ts } from './constructor-source-inspection.mjs'

const shell = readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
const layoutPath = new URL('../src/components/fieldDimensionLabel.ts', import.meta.url)
const layout = readSource(layoutPath)
const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
const variable = (source, name) => {
  const matches = nodes(source, (node) => ts.isVariableDeclaration(node) && node.name.getText() === name)
  assert.equal(matches.length, 1, name)
  return matches[0].initializer
}
const text = variable(shell, 'fieldDimensionText')
assert.ok(ts.isTemplateExpression(text))
assert.deepEqual(text.templateSpans.map((span) => code(span.expression)), [
  'Math.round(field.bounds.widthMm)', 'Math.round(field.bounds.heightMm)',
])
assert.equal(text.templateSpans[0].literal.text, ' × ')
assert.equal(text.templateSpans[1].literal.text, ' mm')
assert.ok(hasJsxClass(shell, 'constructor-field-dimension-label'))
assert.ok(nodes(shell, (node) => ts.isJsxExpression(node) && node.expression?.getText() === 'fieldDimensionText').length)
assert.match(code(variable(shell, 'dimensionLabelPlacement')), /selectedField\?\.id === field\.id\s*\?/)
assert.match(code(variable(shell, 'dimensionLabelPlacement')), /placeFieldDimensionLabel\(fieldDimensionText, fieldWidthPx, fieldHeightPx/)
assert.match(code(variable(shell, 'dimensionLabelPlacement')), /obstacles:/)
assert.doesNotMatch(code(text), /920\s*[×x]\s*650/)
for (const source of [shell, layout]) assert.doesNotMatch(code(source), /482\.(30|21|05|15)/, 'Profile facts belong in the existing domain/catalogue')

for (const name of ['buildProfileAwareGeometryReadModel', 'buildProfileJointGeometryReadModel', 'buildProfileAwareSashGeometryReadModel', 'resolveHumanGlazingContext']) {
  assert.ok(callNames(shell).includes(name), 'Existing system-aware reader must remain: ' + name)
}
assert.match(code(variable(shell, 'innerProfileBoundsMm')), /sashPlacement\?\.placementReady/)
assert.ok(hasJsxClass(shell, 'constructor-reviewed-sash-placement'))
assert.match(code(shell), /sashGeometry\.sashVisibleFaceMm \* pxPerMm/)
assert.match(code(shell), /profileViewActive && reviewedFrameFacePx !== null \? reviewedFrameFacePx : frameFacePx/)
for (const mode of ['side-hinged', 'tilt', 'tilt-turn', 'top-hung', 'side-hinged-top-hung']) assert.ok(code(shell).includes("field.openingMode === '" + mode + "'"))
for (const handing of ['left', 'right']) assert.ok(code(shell).includes("field.openingHanding === '" + handing + "'"))
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-primary', 'stroke-width'), '1')
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-tilt', 'stroke-dasharray'), '2.4 2.2')
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual.mode-tilt .opening-tilt', 'stroke-dasharray'), '2.4 2.2')
assert.equal(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-top-hung', 'stroke-dasharray'), '4 2')
assert.equal(uniqueCssValue(rules, '.constructor-operable-sash-priority', 'z-index'), '8')
assert.equal(uniqueCssValue(rules, '.constructor-operable-sash-priority', 'pointer-events'), 'none')
assert.equal(uniqueCssValue(rules, '.constructor-operable-sash-priority::before', 'border'), '1.25px solid rgba(38, 53, 58, .98)')
assert.ok(code(shell).indexOf('className="constructor-divider is-local') < code(shell).indexOf('constructor-operable-sash-priority'),
  'Operable sash priority overlay must render above the divider layer')
assert.match(code(shell), /field\.fieldType === 'operable'\)\s*\.map\(\(field\) => \(\s*<span[\s\S]*?constructor-operable-sash-priority/)
assert.match(code(shell), /forceExternal: Boolean\(field\.polygon \|\| field\.openingMode === 'top-hung' \|\| field\.openingMode === 'side-hinged-top-hung'\)/)
assert.equal(uniqueCssValue(rules, '.constructor-field-dimension-label', 'pointer-events'), 'none')
assert.equal(uniqueCssValue(rules, '.constructor-field-dimension-label.is-external', 'background'), '#fff')
const labels = nodes(shell, (node) => ts.isJsxElement(node)
  && node.openingElement.tagName.getText() === 'span'
  && node.openingElement.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute)
    && attribute.name.getText() === 'className' && code(attribute).includes('constructor-field-dimension-label')))
assert.equal(labels.length, 1)
for (let parent = labels[0].parent; parent; parent = parent.parent) {
  assert.ok(!(ts.isJsxElement(parent) && parent.openingElement.tagName.getText() === 'button'),
    'Dimension callout must not be clipped by the field button overflow/clipPath')
}
assert.match(code(labels[0]), /field\.bounds\.xMm \* pxPerMm \+ dimensionLabelPlacement\.left/)
assert.match(code(labels[0]), /field\.bounds\.yMm \* pxPerMm \+ dimensionLabelPlacement\.top/)
assert.ok(Number(uniqueCssValue(rules, '.constructor-field-dimension-label', 'z-index')) > 8,
  'Callout must remain above field and reviewed profile layers')

// Exercise annotation layout against the actual SVG segments, for both handings
// and all modes together. No application, browser or domain geometry is executed.
const output = ts.transpileModule(fs.readFileSync(layoutPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(output, { exports }, { timeout: 1000 })
const { placeFieldDimensionLabel: place, SCHEMATIC_OPENING_INSET_PX: inset } = exports
const openingSvg = nodes(shell, (node) => ts.isJsxElement(node)
  && node.openingElement.tagName.getText() === 'svg' && hasJsxClass(node, 'constructor-operable-visual'))
assert.equal(openingSvg.length, 1)
const viewBoxAttribute = openingSvg[0].openingElement.attributes.properties
  .find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === 'viewBox')
const [minX, minY, viewWidth, viewHeight] = viewBoxAttribute.initializer.text.split(' ').map(Number)
const lineData = (node) => Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute)
  .filter((attribute) => ['x1', 'y1', 'x2', 'y2'].includes(attribute.name.getText()))
  .map((attribute) => [attribute.name.getText(), Number(attribute.initializer.text)]))
const segments = nodes(openingSvg[0], (node) => ts.isJsxSelfClosingElement(node) && node.tagName.getText() === 'line')
  .map((node) => ({
    ...Object.fromEntries(Object.entries(lineData(node)).map(([key, value]) =>
      [key, key.startsWith('x') ? (value - minX) / viewWidth : (value - minY) / viewHeight])),
    className: code(node).match(/className="([^"]+)"/)?.[1],
    mode: code(node).match(/data-opening-mode="([^"]+)"/)?.[1],
  }))
assert.ok(segments.length >= 4)
assert.ok(segments.every((segment) => Object.entries(segment).every(([key, value]) => key === 'className' || key === 'mode' || (value >= 0 && value <= 1))),
  'Schematic symbol strokes must stay inside the profile/glazing boundary')
assert.ok(segments.some((segment) => Object.values(segment).includes(0))
  && segments.some((segment) => Object.values(segment).includes(1)),
  'Opening strokes must reach the inner sash/infill limits')
const combined = nodes(openingSvg[0], (node) => ts.isJsxExpression(node) && node.expression
  && ts.isBinaryExpression(node.expression) && code(node.expression.left).includes("field.openingMode === 'tilt-turn'"))
  .filter((node) => nodes(node, (child) => ts.isJsxSelfClosingElement(child) && child.tagName.getText() === 'line').length === 4)
assert.equal(combined.length, 2, 'Both combined-mode handings must remain available')
const combinedByHanding = new Map()
for (const symbol of combined) {
  const lines = nodes(symbol, (node) => ts.isJsxSelfClosingElement(node) && node.tagName.getText() === 'line')
  const primary = lines.filter((node) => code(node).includes('opening-primary')).map(lineData)
  const secondary = lines.filter((node) => code(node).includes('opening-tilt')).map(lineData)
  assert.equal(primary.length, 2); assert.equal(secondary.length, 2)
  const expression = code(symbol)
  const handing = expression.includes("field.openingHanding === 'left'") ? 'left' : 'right'
  combinedByHanding.set(handing, { primary, secondary })
  const tiltDiagonals = secondary.filter((line) => line.y1 === 100 && line.y2 === 0)
  assert.equal(tiltDiagonals.length, 2)
  assert.deepEqual(tiltDiagonals.map((line) => line.x1).sort((a, b) => a - b), [0, 100])
  assert.ok(tiltDiagonals.every((line) => line.x2 === 50),
    'Combined tilt cue must span from both bottom corners toward top center')
}
assert.deepEqual([...combinedByHanding.keys()].sort(), ['left', 'right'])
assert.deepEqual(combinedByHanding.get('left').primary, [
  { x1: 0, y1: 0, x2: 100, y2: 50 },
  { x1: 0, y1: 100, x2: 100, y2: 50 },
])
assert.deepEqual(combinedByHanding.get('right').primary, [
  { x1: 100, y1: 0, x2: 0, y2: 50 },
  { x1: 100, y1: 100, x2: 0, y2: 50 },
])
assert.ok(Number(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-tilt', 'stroke-width'))
  < Number(uniqueCssValue(rules, '.constructor-field-surface.is-operable .constructor-operable-visual .opening-primary', 'stroke-width')))
const intersects = (box, segment) => {
  let low = 0, high = 1
  for (const [axis, start, size] of [['x', box.left, box.width], ['y', box.top, box.height]]) {
    const first = segment[axis + '1'], delta = segment[axis + '2'] - first
    if (delta === 0) { if (first < start || first > start + size) return false }
    else {
      const a = (start - first) / delta, b = (start + size - first) / delta
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b))
      if (low > high) return false
    }
  }
  return true
}
let insideCases = 0, fallbackCases = 0
for (const width of [45, 130, 260, 540, 950]) for (const height of [30, 90, 185, 360, 800]) {
  for (const warning of [false, true]) for (const reviewed of [false, true]) {
    const area = reviewed
      ? { left: 28, top: 23, width: width - 70, height: height - 61 }
      : { left: inset, top: inset, width: width - 2 * inset, height: height - 2 * inset }
    const label = place('1234 × 567 mm', width, height, area, warning)
    assert.ok(label, 'Every selected rectangular field must receive visible placement')
    assert.ok(label.width > 0 && label.height > 0)
    if (label.external) {
      fallbackCases++
      assert.ok(label.top > height, 'Default fallback must sit immediately below the field')
    } else {
      insideCases++
      assert.ok(label.left >= 0 && label.left + label.width <= width)
      assert.ok(label.top >= height / 2 + 16)
      assert.ok(label.top + label.height <= height - (warning ? 32 : 6))
    }
    for (const segment of segments) {
      if (segment.className === 'opening-top-hung' || segment.mode === 'side-hinged-top-hung') continue
      const scaled = Object.fromEntries(Object.entries(segment).map(([key, value]) => [key,
        key.startsWith('x') ? area.left + value * area.width : area.top + value * area.height]))
      assert.ok(!intersects(label, scaled), 'Dimension annotation overlaps an existing opening line')
    }
  }
}
assert.ok(insideCases > 0 && fallbackCases > 0)
for (const width of [45, 130, 260, 540, 950]) for (const height of [30, 90, 185, 360, 800]) {
  const external = place('1234 × 567 mm', width, height, { left: inset, top: inset, width: width - 2 * inset, height: height - 2 * inset }, false, { forceExternal: true })
  assert.ok(external?.external, 'Top-hung symbol convergence near the lower center moves the annotation outside the field')
}
assert.ok(place('735 × 480', 250, 180, null, false), 'Normal fixed field must display its label')
assert.equal(place('735 × 480', 60, 30, null, false).external, true)
assert.equal(place('735 × 480', NaN, 180, null, false), null)
// Small operable field with the existing warning must use the callout, not disappear.
const small = place('920 × 650', 920 * .14, 650 * .14,
  { left: inset, top: inset, width: 920 * .14 - 2 * inset, height: 650 * .14 - 2 * inset }, true)
assert.ok(small?.external)
const nearBottom = { left: -20, top: -40, width: 500, height: 75 }
const beside = place('735 × 480', 60, 30, null, false, { viewport: nearBottom })
assert.ok(beside?.external && beside.left > 60, 'Use the right side when below is outside the canvas')
for (const viewport of [nearBottom, { left: -200, top: -40, width: 265, height: 75 },
  { left: 0, top: 0, width: 110, height: 50 }]) {
  const label = place('735 × 480', 60, 30, null, false, { viewport })
  assert.ok(label, 'Canvas edge must not hide selected dimensions')
  assert.ok(label.left >= viewport.left && label.top >= viewport.top)
  assert.ok(label.left + label.width <= viewport.left + viewport.width)
  assert.ok(label.top + label.height <= viewport.top + viewport.height)
}

// Bottom-row field: reserve the actual external width/height dimension lanes.
// The callout must stay visible without covering either chain or the field.
const viewport = { left: -180, top: -80, width: 640, height: 340 }
const lanes = [
  { left: -50, top: 110, width: 350, height: 80 },
  { left: 290, top: -50, width: 82, height: 240 },
]
const overlaps = (a, b) => a.left < b.left + b.width && a.left + a.width > b.left
  && a.top < b.top + b.height && a.top + a.height > b.top
for (const width of [60, 130, 260]) {
  const label = place('920 × 650 mm', width, 100, null, true, { viewport, obstacles: lanes, forceExternal: true })
  assert.ok(label?.external)
  assert.ok(!lanes.some((lane) => overlaps(label, lane)), 'Callout must not cover the overall/bay dimension chains')
  assert.ok(!overlaps(label, { left: 0, top: 0, width, height: 100 }), 'Fallback must not cover the selected field')
  assert.ok(label.left >= viewport.left && label.top >= viewport.top)
  assert.ok(label.left + label.width <= viewport.left + viewport.width && label.top + label.height <= viewport.top + viewport.height)
}

for (const [file, name] of [['facadeModel.ts', 'MODEL_LIBRARY_SAFETY'], ['compositeModuleStructure.ts', 'COMPOSITE_MODULE_STRUCTURE_SAFETY']]) {
  const source = readSource(new URL('../src/domain/' + file, import.meta.url))
  const safety = variable(source, name)
  for (const flag of ['automaticGeometry', 'rulesValidated', 'machineReady']) {
    const properties = nodes(safety, (node) => ts.isPropertyAssignment(node) && node.name.getText() === flag)
    assert.equal(properties.length, 1)
    assert.equal(properties[0].initializer.kind, ts.SyntaxKind.FalseKeyword)
  }
}
console.log(`FIELD DIMENSIONS + OPENING SYMBOL CLARITY 01: PASS (${insideCases} inside / ${fallbackCases} fallback / 0 hidden valid-field cases)`)
console.log('System-aware readers retained. AUTOMATIC GEOMETRY: NO; RULES VALIDATED: NO; MACHINE READY: NO.')
console.log('Browser visual acceptance: NOT VERIFIED.')
