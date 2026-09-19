import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// PREDEPLOY_019_04C_VERIFIER_COMPAT runtime: execute the actual TS domains and prove
// that 04C pairing truth stays fail-closed for unresolved or unsupported boundaries.
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

function fixture(model = createConstructionModel(frame), sashProfileCode = '482.05') {
  for (const field of resolveConstructionTopology(model).fields) model = setConstructionFieldType(model, field.id, 'operable')
  const topology = resolveConstructionTopology(model)
  const resolution = createModuleProfileResolution(system.id)
  resolution.frame = assignment('482.30')
  for (const divider of topology.dividers) resolution.dividers[divider.id] = assignment('482.21')
  for (const field of topology.fields) resolution.fieldSashes[field.id] = assignment(sashProfileCode)
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
  assert.equal(joints.machineReady, false)
  assert.equal(result.machineReady, false)
  const dimensions = buildModuleDimensionalChain(args)
  for (const field of dimensions.fields) {
    assert.equal(field.glassCutWidth.valueMm, null)
    assert.equal(field.glassCutHeight.valueMm, null)
  }
  return { joints, result }
}
let passed = 0
function test(name, run) {
  run()
  passed += 1
  console.log(`PASS ${name}`)
}
function threeFields(axis, sashProfileCode = '482.05') {
  let model = splitField(createConstructionModel(frame), 'field-1', axis, 450)
  model = splitField(model, 'field-3', axis, 450)
  return fixture(model, sashProfileCode)
}

function assertUnresolvedPlacement(field) {
  assert.equal(field.placementReady, false)
  assert.equal(field.status, 'missing-reviewed-overlap')
  assert.equal(field.outerBoundsMm, null)
  assert.equal(field.innerProfileBoundsMm, null)
  assert.equal(field.glazingInsetMm, null)
  assert.equal(field.machineReady, false)
}

function assertFrameBoundaryUninterpreted(boundary) {
  assert.equal(boundary.supportKind, 'frame')
  assert.equal(boundary.status, 'assembly-evidence-required')
  assert.equal(boundary.sashOverlapMm, null)
  assert.equal(boundary.sashInsetMm, null)
  assert.equal(boundary.glazingInsetMm, null)
  assert.ok(boundary.evidenceRule)
  assert.equal(boundary.evidenceRule.assemblyEvidenceStatus, 'sectional-drawing-uninterpreted')
}

function assert48205DividerBoundaryBlocked(boundary) {
  assert.equal(boundary.supportKind, 'divider')
  assert.equal(boundary.supportProfileCode, '482.21')
  assert.equal(boundary.sashProfileCode, '482.05')
  assert.equal(boundary.status, 'unsupported-pair')
  assert.equal(boundary.evidenceRule, null)
  assert.equal(boundary.sashOverlapMm, null)
}

test('single operable 482.05 field: frame pair is recognized but sectional geometry remains uninterpreted', () => {
  const input = fixture()
  const { joints, result } = geometry(input)
  assert.equal(joints.recognizedPairCount, 4)
  assert.equal(joints.reviewedOverlapCount, 0)
  assert.equal(joints.resolvedJointCount, 0)
  assert.equal(joints.geometryReady, false)
  assert.equal(joints.fields['field-1'].boundaries.length, 4)
  for (const boundary of joints.fields['field-1'].boundaries) assertFrameBoundaryUninterpreted(boundary)
  assert.equal(result.requiredPlacementCount, 1)
  assert.equal(result.reviewedPlacementCount, 0)
  assertUnresolvedPlacement(result.fields['field-1'])
})

for (const axis of ['vertical', 'horizontal']) {
  test(`three ${axis} 482.05 fields: frame boundaries stay uninterpreted and divider boundaries are blocked`, () => {
    const input = threeFields(axis)
    const { joints, result } = geometry(input)
    assert.equal(result.requiredPlacementCount, 3)
    assert.equal(result.reviewedPlacementCount, 0)
    let sawFrame = false
    let sawDivider = false
    for (const field of input.fields) {
      for (const boundary of joints.fields[field.id].boundaries) {
        if (boundary.supportKind === 'frame') {
          sawFrame = true
          assertFrameBoundaryUninterpreted(boundary)
        } else if (boundary.supportKind === 'divider') {
          sawDivider = true
          assert48205DividerBoundaryBlocked(boundary)
        }
      }
      assertUnresolvedPlacement(result.fields[field.id])
    }
    assert.equal(sawFrame, true)
    assert.equal(sawDivider, true)
  })
}

for (const fieldType of ['fixed', null]) {
  test(`${fieldType ?? 'UNSET'} field requires no sash placement`, () => {
    const input = fixture()
    input.fields[0].fieldType = fieldType
    const { result } = geometry(input)
    assert.equal(result.requiredPlacementCount, 0)
    assert.equal(result.fields['field-1'].status, 'not-required')
    assert.equal(result.fields['field-1'].outerBoundsMm, null)
  })
}

test('missing sash assignment fails closed', () => {
  const input = fixture()
  input.resolution.fieldSashes = {}
  const { joints, result } = geometry(input)
  assert.ok(joints.fields['field-1'].boundaries.every((boundary) => boundary.status === 'missing-profile-assignment'))
  assert.equal(result.reviewedPlacementCount, 0)
  assert.equal(result.fields['field-1'].placementReady, false)
})

test('unsupported sash/support pair fails closed', () => {
  const input = fixture()
  input.resolution.fieldSashes['field-1'] = assignment('482.30')
  const { joints, result } = geometry(input)
  assert.ok(joints.fields['field-1'].boundaries.every((boundary) => boundary.status === 'unsupported-pair'))
  assert.equal(result.reviewedPlacementCount, 0)
  assert.equal(result.fields['field-1'].placementReady, false)
})

test('catalogue mullion pair 482.21 + 482.18 is recognized on divider edges but still cannot unlock placement', () => {
  const input = threeFields('vertical', '482.18')
  const { joints, result } = geometry(input)
  let recognizedDivider = 0
  for (const field of input.fields) {
    for (const boundary of joints.fields[field.id].boundaries) {
      if (boundary.supportKind === 'divider') {
        assert.equal(boundary.supportProfileCode, '482.21')
        assert.equal(boundary.sashProfileCode, '482.18')
        assert.equal(boundary.status, 'assembly-evidence-required')
        assert.ok(boundary.evidenceRule)
        assert.equal(boundary.evidenceRule.assemblyEvidenceStatus, 'sectional-drawing-uninterpreted')
        assert.equal(boundary.sashOverlapMm, null)
        recognizedDivider += 1
      } else if (boundary.supportKind === 'frame') {
        // 482.30 + 482.18 is not a catalogue-confirmed pair in 04C.
        assert.equal(boundary.status, 'unsupported-pair')
        assert.equal(boundary.evidenceRule, null)
      }
    }
    assertUnresolvedPlacement(result.fields[field.id])
  }
  assert.ok(recognizedDivider > 0)
  assert.equal(result.reviewedPlacementCount, 0)
})

test('polygon field remains unsupported', () => {
  const input = fixture()
  input.fields[0].polygon = [{ xMm: 60, yMm: 60 }, { xMm: 1740, yMm: 60 }, { xMm: 60, yMm: 1540 }]
  const { joints, result } = geometry(input)
  assert.equal(joints.fields['field-1'].boundaries[0].status, 'unsupported-topology')
  assert.equal(result.fields['field-1'].status, 'unsupported-topology')
  assert.equal(result.reviewedPlacementCount, 0)
})

test('missing divider assignment blocks adjacent fields without inventing overlap', () => {
  const input = threeFields('vertical')
  delete input.resolution.dividers['divider-1']
  const { joints, result } = geometry(input)
  assert.ok(joints.fields[input.fields[0].id].boundaries.some((boundary) => boundary.status === 'missing-profile-assignment'))
  assert.ok(joints.fields[input.fields[1].id].boundaries.some((boundary) => boundary.status === 'missing-profile-assignment'))
  assert.equal(result.reviewedPlacementCount, 0)
})

for (const axis of ['vertical', 'horizontal']) {
  test(`${axis} ambiguous support fails closed`, () => {
    const input = threeFields(axis)
    input.dividers.push({ ...input.dividers[0], id: 'duplicate' })
    input.resolution.dividers.duplicate = assignment('482.21')
    const { joints, result } = geometry(input)
    assert.ok(Object.values(joints.fields).some((field) => field.boundaries.some((boundary) => boundary.status === 'unresolved-adjacency')))
    assert.equal(result.reviewedPlacementCount, 0)
  })
}

console.log(`PROFILE-AWARE SASH GEOMETRY 01 RUNTIME PASS: ${passed} cases`)
console.log('04C FRAME PAIR 482.30 + 482.05: UNINTERPRETED SECTION / FAIL-CLOSED')
console.log('04C MULLION PAIR 482.21 + 482.18: UNINTERPRETED SECTION / FAIL-CLOSED')
console.log('OLD 482.21 + 482.05 MULLION PAIR: UNSUPPORTED')
console.log('REVIEWED SASH PLACEMENT: NOT UNLOCKED')
console.log('MACHINE READY: NO')
