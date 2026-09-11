import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Execute the actual TS domain and TSX render expressions in memory. No emitted
// files, browser state, new dependencies or changes to ConstructionModel.
const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const cache = new Map()
function evaluate(source, filename, scope = {}, localRequire = require) {
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', ...Object.keys(scope), outputText)(
    localRequire, module, module.exports, ...Object.values(scope),
  )
  return module.exports
}
function load(filename) {
  let path = resolve(root, filename)
  if (!path.endsWith('.ts')) path = existsSync(`${path}.ts`) ? `${path}.ts` : join(path, 'index.ts')
  if (cache.has(path)) return cache.get(path)
  const exports = evaluate(readFileSync(path, 'utf8'), path, {}, (specifier) =>
    specifier.startsWith('.') ? load(resolve(dirname(path), specifier)) : require(specifier))
  cache.set(path, exports)
  return exports
}

const construction = load('src/domain/construction')
const { createModuleProfileResolution } = load('src/domain/profileResolution')
const { kmgPrelude60: system } = load('src/data/profileSystems')
const { buildProfileJointGeometryReadModel } = load('src/domain/profileJointGeometry')
const { buildProfileAwareSashGeometryReadModel } = load('src/domain/profileAwareSashGeometry')
const { buildModuleDimensionalChain } = load('src/domain/profileDimensionalSemantics')
const { createConstructionModel, resolveConstructionTopology, splitField, setConstructionFieldType } = construction
const frame = { xMm: 0, yMm: 0, widthMm: 1800, heightMm: 1600 }
const assignment = (profileCode) => ({ profileCode, source: 'human' })
function fixture(model = createConstructionModel(frame)) {
  for (const field of resolveConstructionTopology(model).fields) model = setConstructionFieldType(model, field.id, 'operable')
  const topology = resolveConstructionTopology(model)
  const resolution = createModuleProfileResolution(system.id)
  resolution.frame = assignment('482.30')
  for (const divider of topology.dividers) resolution.dividers[divider.id] = assignment('482.21')
  for (const field of topology.fields) resolution.fieldSashes[field.id] = assignment('482.05')
  return { model, ...topology, resolution }
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function geometry(input) {
  const before = JSON.stringify(input)
  freeze(input)
  const args = { frame: input.model.frame, frameFaceMm: 60, fields: input.fields, dividers: input.dividers, system, resolution: input.resolution }
  const joints = buildProfileJointGeometryReadModel(args)
  const result = buildProfileAwareSashGeometryReadModel({ ...args, joints })
  assert.equal(JSON.stringify(input), before, 'construction, fields, dividers and assignments must not mutate')
  assert.equal(result.machineReady, false)
  const dimensions = buildModuleDimensionalChain(args)
  for (const field of dimensions.fields) {
    assert.equal(field.glassCutWidth.valueMm, null)
    assert.equal(field.glassCutHeight.valueMm, null)
  }
  for (const field of Object.values(result.fields)) {
    assert.equal(field.glazingInsetMm, null)
    assert.equal(field.machineReady, false)
    if (!field.placementReady) continue
    assert.equal(field.sashVisibleFaceMm, 56)
    assert.deepEqual(field.overlapByEdgeMm, { left: 22, right: 22, top: 22, bottom: 22 })
    const outer = field.outerBoundsMm
    assert.deepEqual(field.innerProfileBoundsMm, {
      xMm: outer.xMm + 56, yMm: outer.yMm + 56,
      widthMm: outer.widthMm - 112, heightMm: outer.heightMm - 112,
    })
  }
  return { joints, result }
}
let passed = 0
function test(name, run) {
  run()
  passed += 1
  console.log(`PASS ${name}`)
}
function threeFields(axis) {
  let model = splitField(createConstructionModel(frame), 'field-1', axis, 450)
  model = splitField(model, 'field-3', axis, 450)
  return fixture(model)
}

test('frame/frame: reviewed bounds and exact 56 mm inner contour; immutable inputs', () => {
  const { result } = geometry(fixture())
  assert.equal(result.reviewedPlacementCount, 1)
  assert.deepEqual(result.fields['field-1'].outerBoundsMm, { xMm: 42, yMm: 42, widthMm: 1716, heightMm: 1516 })
})
for (const axis of ['vertical', 'horizontal']) {
  test(`three ${axis} fields: frame/mullion, mullion/mullion, mullion/frame`, () => {
    const input = threeFields(axis)
    const { result } = geometry(input)
    assert.equal(result.reviewedPlacementCount, 3)
    const bounds = input.fields.map((field) => result.fields[field.id].outerBoundsMm)
    assert.deepEqual(bounds, axis === 'vertical' ? [
      { xMm: 42, yMm: 42, widthMm: 468, heightMm: 1516 },
      { xMm: 550, yMm: 42, widthMm: 450, heightMm: 1516 },
      { xMm: 1040, yMm: 42, widthMm: 718, heightMm: 1516 },
    ] : [
      { xMm: 42, yMm: 42, widthMm: 1716, heightMm: 468 },
      { xMm: 42, yMm: 550, widthMm: 1716, heightMm: 450 },
      { xMm: 42, yMm: 1040, widthMm: 1716, heightMm: 518 },
    ])
  })
}
for (const fieldType of ['fixed', null]) {
  test(`${fieldType ?? 'UNSET'} field has no sash placement`, () => {
    const input = fixture()
    input.fields[0].fieldType = fieldType
    const { result } = geometry(input)
    assert.equal(result.requiredPlacementCount, 0)
    assert.equal(result.fields['field-1'].status, 'not-required')
    assert.equal(result.fields['field-1'].outerBoundsMm, null)
  })
}
for (const scenario of ['missing sash', 'missing frame', 'wrong sash role', 'unsupported support pair', 'polygon']) {
  test(`${scenario}: fail closed`, () => {
    const input = fixture()
    if (scenario === 'missing sash') input.resolution.fieldSashes = {}
    if (scenario === 'missing frame') input.resolution.frame = null
    if (scenario === 'wrong sash role') input.resolution.fieldSashes['field-1'] = assignment('482.30')
    if (scenario === 'unsupported support pair') input.resolution.frame = assignment('482.21')
    if (scenario === 'polygon') input.fields[0].polygon = [{ xMm: 60, yMm: 60 }, { xMm: 1740, yMm: 60 }, { xMm: 60, yMm: 1540 }]
    const { result } = geometry(input)
    assert.equal(result.reviewedPlacementCount, 0)
    assert.equal(result.fields['field-1'].outerBoundsMm, null)
    if (scenario === 'polygon') assert.equal(result.fields['field-1'].status, 'unsupported-topology')
  })
}
test('missing divider assignment blocks only adjacent fields', () => {
  const input = threeFields('vertical')
  delete input.resolution.dividers['divider-1']
  const { result } = geometry(input)
  assert.deepEqual(input.fields.map((field) => result.fields[field.id].placementReady), [false, false, true])
})
for (const axis of ['vertical', 'horizontal']) {
  test(`local ${axis} dividers at same coordinate: no evidence borrowed from other span`, () => {
    const parentAxis = axis === 'vertical' ? 'horizontal' : 'vertical'
    let model = splitField(createConstructionModel(frame), 'field-1', parentAxis, 650)
    model = splitField(model, 'field-2', axis, 650)
    model = splitField(model, 'field-3', axis, 650)
    const input = fixture(model)
    delete input.resolution.dividers['divider-3']
    const { joints, result } = geometry(input)
    const edges = axis === 'vertical' ? ['right', 'left'] : ['bottom', 'top']
    for (const [index, id] of ['field-6', 'field-7'].entries()) {
      const boundary = joints.fields[id].boundaries.find((item) => item.edge === edges[index])
      assert.equal(boundary.supportId, 'divider-3')
      assert.equal(boundary.status, 'missing-profile-assignment')
      assert.equal(result.fields[id].placementReady, false)
    }
    assert.equal(result.fields['field-4'].placementReady, true)
    assert.equal(result.fields['field-5'].placementReady, true)
  })
  test(`${axis} ambiguity: two covering candidates fail closed on both sides`, () => {
    const input = threeFields(axis)
    input.dividers.push({ ...input.dividers[0], id: 'duplicate' })
    input.resolution.dividers.duplicate = assignment('482.21')
    const { joints, result } = geometry(input)
    for (const field of input.fields.slice(0, 2)) {
      assert.equal(result.fields[field.id].placementReady, false)
      assert.ok(joints.fields[field.id].boundaries.some((boundary) => boundary.status === 'unresolved-adjacency'))
    }
  })
  for (const shortfall of [0.04, 0.06]) {
    test(`${axis} span endpoints use EPSILON_MM: ${shortfall} mm shortfall`, () => {
      const input = threeFields(axis)
      input.dividers[0].startMm += shortfall
      input.dividers[0].endMm -= shortfall
      const { result } = geometry(input)
      assert.equal(result.fields[input.fields[0].id].placementReady, shortfall < 0.05)
    })
  }
}

// Execute the real fields.map callbacks from ConstructorShell, rather than a
// duplicate of the mapping formulas. Event handlers are created but not invoked.
const shellPath = join(root, 'src/components/ConstructorShell.tsx')
const shellSource = ts.createSourceFile(shellPath, readFileSync(shellPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
function renderCallback(marker) {
  const matches = []
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(shellSource) === 'fields.map') {
      const callback = node.arguments[0]
      if (callback.getText(shellSource).includes(marker)) matches.push(callback.getText(shellSource))
    }
    ts.forEachChild(node, visit)
  }
  visit(shellSource)
  assert.equal(matches.length, 1, `one actual renderer for ${marker}`)
  return (field, scope) => evaluate(`export const render = ${matches[0]}`, 'render.tsx', scope).render(field)
}
const renderField = renderCallback('constructor-field-surface')
const renderSash = renderCallback('key={`reviewed-sash-')
function findElement(element, predicate) {
  if (!element || typeof element !== 'object') return undefined
  if (predicate(element)) return element
  for (const child of [element.props?.children].flat(Infinity)) {
    const found = findElement(child, predicate)
    if (found) return found
  }
  return undefined
}
for (const scale of [0.14, 0.28, 0.56]) {
  test(`actual JSX aligns symbol and inner contour with domain at ${scale} px/mm`, () => {
    const input = threeFields('vertical')
    const { result } = geometry(input)
    for (const field of input.fields) {
      const scope = { profileViewActive: true, profileAwareSashGeometry: result, profileAwareGeometry: null, selectedFieldId: field.id, pxPerMm: scale }
      const rendered = renderField(field, scope)
      assert.match(rendered.props.className, /has-reviewed-sash-placement/)
      assert.doesNotMatch(rendered.props.className, /has-unresolved-sash-geometry/)
      const { outerBoundsMm: outer, innerProfileBoundsMm: inner } = result.fields[field.id]
      const svg = findElement(rendered, (node) => node.type === 'svg')
      assert.deepEqual(svg.props.style, { inset: 'auto', left: `${(inner.xMm - field.bounds.xMm) * scale}px`, top: `${(inner.yMm - field.bounds.yMm) * scale}px`, width: `${inner.widthMm * scale}px`, height: `${inner.heightMm * scale}px` })
      const sash = renderSash(field, scope)
      const contour = findElement(sash, (node) => node.props?.className === 'constructor-reviewed-sash-inner-face')
      assert.deepEqual(contour.props.style, { left: `${(inner.xMm - outer.xMm) * scale}px`, top: `${(inner.yMm - outer.yMm) * scale}px`, width: `${inner.widthMm * scale}px`, height: `${inner.heightMm * scale}px` })
      assert.equal(sash.props.style.left, `${outer.xMm * scale}px`)
      assert.equal(sash.props.style.top, `${outer.yMm * scale}px`)
    }
  })
}
for (const profileViewActive of [false, true]) {
  test(`${profileViewActive ? 'unresolved ON' : 'Profile View OFF'} retains schematic SVG positioning`, () => {
    const input = fixture()
    if (profileViewActive) input.resolution.fieldSashes = {}
    const { result } = geometry(input)
    const rendered = renderField(input.fields[0], { profileViewActive, profileAwareSashGeometry: result, profileAwareGeometry: null, selectedFieldId: null, pxPerMm: 0.28 })
    assert.equal(findElement(rendered, (node) => node.type === 'svg').props.style, undefined)
    assert.doesNotMatch(rendered.props.className, /has-reviewed-sash-placement/)
  })
}
test('CSS strokes do not alter reviewed containing blocks; schematic 11px remains', () => {
  const css = readFileSync(join(root, 'src/components/ConstructorShell.css'), 'utf8')
  for (const name of ['constructor-reviewed-sash-placement', 'constructor-reviewed-sash-inner-face']) {
    const block = css.match(new RegExp(`\\.${name} \\{([^}]+)\\}`))[1]
    assert.doesNotMatch(block, /(?:^|[;\n])\s*(?:border(?:-width)?|padding|inset)\s*:/)
    assert.match(block, /outline:/)
  }
  assert.match(css, /\.constructor-operable-visual \{\s*inset: 11px;/)
})
console.log(`PROFILE-AWARE SASH GEOMETRY 01.1 RUNTIME PASS: ${passed} cases`)
