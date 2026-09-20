import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const { createCompositeModuleStructure: create, validateCompositeModuleStructure: validate,
  COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION: version, COMPOSITE_MODULE_STRUCTURE_SAFETY: safety,
} = load('src/domain/compositeModuleStructure')
const { getProfileSystemById, profileSystemCatalog } = load('src/data/profileSystems/catalog')
const prelude = getProfileSystemById('kmg-prelude-60')
const frameProfiles = prelude.mainProfiles.filter((profile) => profile.role === 'frame')
assert.ok(frameProfiles.length >= 2, 'Scenario C needs two real catalogue frame profiles')
const closed = () => ({ top: true, right: true, bottom: true, left: true })
const windowPart = () => ({ id: 'part-window', function: 'window', widthMm: 1500, heightMm: 1500,
  frameProfileCode: frameProfiles[0].code, frameSides: closed(), fieldIds: ['field-1'] })
const doorPart = () => ({ id: 'part-door', function: 'door', widthMm: 700, heightMm: 2000,
  frameProfileCode: frameProfiles[1].code, frameSides: { ...closed(), bottom: false }, fieldIds: ['field-2'] })
const connection = () => ({ id: 'connection-1', fromFramePartId: 'part-window', toFramePartId: 'part-door', kind: 'ZERO_DIVIDER' })
const composite = () => ({ schemaVersion: version, systemId: prelude.id,
  frameParts: [windowPart(), doorPart()], connections: [connection()] })
const createFrom = ({ schemaVersion: _schemaVersion, ...input }) => create(input)
let passed = 0
function test(name, run) { run(); passed++; console.log(`PASS ${name}`) }
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value) }
  return value
}
function reject(name, change, message) {
  test(name, () => {
    const value = composite()
    change(value)
    const before = structuredClone(value)
    assert.throws(() => validate(value), message)
    assert.throws(() => createFrom(value), message)
    assert.deepEqual(value, before, 'Invalid data must not be silently repaired')
  })
}

test('A: single closed WINDOW, 1500 x 1500, is structurally valid', () => {
  const value = create({ systemId: prelude.id, frameParts: [windowPart()], connections: [] })
  validate(value)
  assert.deepEqual(value.frameParts[0].frameSides, closed())
})
test('B/I: entrance DOOR, 700 x 2000, explicit OPEN_BOTTOM is valid', () => {
  const value = create({ systemId: prelude.id, frameParts: [doorPart()], connections: [] })
  assert.deepEqual(value.frameParts[0].frameSides, { top: true, right: true, bottom: false, left: true })
})
test('C/J: WINDOW + DOOR, different dimensions/profiles, ZERO_DIVIDER is structurally valid', () => {
  const value = createFrom(composite())
  validate(value)
  assert.equal(value.frameParts[0].widthMm, 1500)
  assert.equal(value.frameParts[1].widthMm, 700)
  assert.equal(value.frameParts[0].heightMm, 1500)
  assert.equal(value.frameParts[1].heightMm, 2000)
  assert.notEqual(value.frameParts[0].frameProfileCode, value.frameParts[1].frameProfileCode)
  assert.equal(value.connections[0].kind, 'ZERO_DIVIDER')
  assert.equal(safety.frameToFrameCompatibility, 'HUMAN REVIEW')
})
test('H: DOOR with bottom=true remains closed; WINDOW does not force CLOSED', () => {
  const input = composite()
  input.frameParts[0].frameSides.bottom = false
  input.frameParts[1].frameSides.bottom = true
  const value = createFrom(input)
  assert.equal(value.frameParts[0].frameSides.bottom, false)
  assert.equal(value.frameParts[1].frameSides.bottom, true)
  for (const part of input.frameParts) part.function = null
  assert.deepEqual(createFrom(input).frameParts.map((p) => p.frameSides), value.frameParts.map((p) => p.frameSides))
})
test('neutral function, null profile and empty FIELD references are safe explicit states', () => {
  const part = { ...windowPart(), function: null, frameProfileCode: null, fieldIds: [] }
  assert.deepEqual(create({ systemId: prelude.id, frameParts: [part], connections: [] }).frameParts[0], part)
})
test('each side is independent human data; no inferred topology rule', () => {
  for (let mask = 0; mask < 16; mask++) {
    const frameSides = { top: Boolean(mask & 1), right: Boolean(mask & 2), bottom: Boolean(mask & 4), left: Boolean(mask & 8) }
    const part = { ...windowPart(), frameSides }
    assert.deepEqual(create({ systemId: prelude.id, frameParts: [part], connections: [] }).frameParts[0].frameSides, frameSides)
  }
})
test('system-neutral domain works with every existing catalogue system', () => {
  for (const system of profileSystemCatalog) {
    const profile = system.mainProfiles.find((p) => p.role === 'frame')
    const part = { ...windowPart(), frameProfileCode: profile?.code ?? null }
    validate(create({ systemId: system.id, frameParts: [part], connections: [] }))
  }
})

reject('D: foreign frame profile rejected', (s) => { s.frameParts[1].frameProfileCode = '549.15' }, /profile not in module system/)
reject('unknown system rejected even with unassigned profiles', (s) => {
  s.systemId = 'missing'; s.frameParts.forEach((part) => { part.frameProfileCode = null })
}, /system not found/)
reject('multiple systems in systemId rejected', (s) => { s.systemId = [prelude.id, 'kmg-prestige-70'] }, /systemId/)
reject('per-part system override rejected', (s) => { s.frameParts[1].systemId = 'kmg-prestige-70' }, /unexpected property/)
reject('unknown profile rejected', (s) => { s.frameParts[0].frameProfileCode = 'missing' }, /profile not in module system/)
for (const role of ['sash', 'door-sash', 'mullion']) {
  reject(`catalogue ${role} cannot be a frame profile`, (s) => {
    s.frameParts[0].frameProfileCode = prelude.mainProfiles.find((p) => p.role === role).code
  }, /expected catalogue frame role/)
}
reject('malformed profile rejected', (s) => { s.frameParts[0].frameProfileCode = 48230 }, /expected code or null/)
reject('E: missing connection endpoint rejected', (s) => { s.connections[0].toFramePartId = 'absent' }, /missing frame part endpoint/)
reject('F: self connection rejected', (s) => { s.connections[0].toFramePartId = s.connections[0].fromFramePartId }, /self connection/)
reject('G: duplicate part identities rejected', (s) => { s.frameParts[1].id = s.frameParts[0].id }, /duplicate frame part ID/)
reject('duplicate connection identities rejected', (s) => { s.connections.push({ ...s.connections[0] }) }, /duplicate connection ID/)
reject('equivalent forward connection rejected', (s) => { s.connections.push({ ...s.connections[0], id: 'connection-2' }) }, /duplicate equivalent connection/)
reject('equivalent reversed connection rejected', (s) => {
  s.connections.push({ ...s.connections[0], id: 'connection-2', fromFramePartId: 'part-door', toFramePartId: 'part-window' })
}, /duplicate equivalent connection/)
reject('ZERO_DIVIDER cannot become an internal mullion', (s) => { s.connections[0].kind = 'mullion' }, /unsupported connection kind/)
for (const invalid of ['', ' ', ' part-window ', null, 42, { id: 'part-window' }]) {
  for (const field of ['id', 'fromFramePartId', 'toFramePartId']) {
    reject(`malformed connection ${field}: ${JSON.stringify(invalid)}`, (s) => { s.connections[0][field] = invalid }, /invalid reference ID/)
  }
}
reject('malformed part ID rejected', (s) => { s.frameParts[0].id = '' }, /invalid reference ID/)
reject('ambiguous FIELD ownership rejected', (s) => { s.frameParts[1].fieldIds = ['field-1'] }, /ambiguous FIELD reference/)
reject('duplicate FIELD within a part rejected', (s) => { s.frameParts[0].fieldIds.push('field-1') }, /ambiguous FIELD reference/)
reject('FIELD geometry objects cannot replace IDs', (s) => { s.frameParts[0].fieldIds = [{ id: 'field-1', widthMm: 100 }] }, /invalid reference ID/)
reject('FIELD reference must be nonblank', (s) => { s.frameParts[0].fieldIds = [' '] }, /invalid reference ID/)
reject('FIELD references must be an array', (s) => { s.frameParts[0].fieldIds = 'field-1' }, /expected reference array/)
for (const field of ['widthMm', 'heightMm']) {
  for (const value of [0, -1, NaN, Infinity, -Infinity, '1500', null]) {
    reject(`${field} rejects ${String(value)}`, (s) => { s.frameParts[0][field] = value }, /finite positive dimension/)
  }
}
test('positive fractional dimensions are preserved without rounding or deductions', () => {
  const input = composite()
  input.frameParts[0].widthMm = 1500.25
  input.frameParts[0].heightMm = 1500.75
  assert.deepEqual(createFrom(input), input)
})
reject('no frame parts rejected', (s) => { s.frameParts = [] }, /at least one part/)
reject('malformed part array rejected', (s) => { s.frameParts = {} }, /at least one part/)
reject('connections must be an explicit array', (s) => { s.connections = null }, /connections: expected array/)
reject('missing frame sides rejected', (s) => { delete s.frameParts[0].frameSides }, /missing explicit property/)
for (const side of ['top', 'right', 'bottom', 'left']) {
  reject(`missing explicit side ${side} rejected`, (s) => { delete s.frameParts[0].frameSides[side] }, /missing explicit property/)
  reject(`nonboolean side ${side} rejected`, (s) => { s.frameParts[0].frameSides[side] = 1 }, /explicit boolean/)
}
reject('unknown frame function rejected', (s) => { s.frameParts[0].function = 'sliding' }, /invalid function/)
reject('unset function must be explicit null', (s) => { delete s.frameParts[0].function }, /missing explicit property/)
reject('profile absence must be explicit null', (s) => { delete s.frameParts[0].frameProfileCode }, /missing explicit property/)
test('unknown versions and malformed envelopes rejected', () => {
  for (const value of [null, [], 'bad', {}, { ...composite(), schemaVersion: 2 }]) assert.throws(() => validate(value))
})
test('connection pair encoding cannot confuse IDs containing delimiters', () => {
  const ids = ['a|b', 'c', 'a', 'b|c']
  const frameParts = ids.map((id) => ({ ...windowPart(), id, fieldIds: [] }))
  create({ systemId: prelude.id, frameParts, connections: [
    { id: 'c1', fromFramePartId: ids[0], toFramePartId: ids[1], kind: 'ZERO_DIVIDER' },
    { id: 'c2', fromFramePartId: ids[2], toFramePartId: ids[3], kind: 'ZERO_DIVIDER' },
  ] })
})
test('stable identities, detached copies, deterministic round trip and zero input/catalogue mutation', () => {
  const input = composite(), before = structuredClone(input), catalogueBefore = JSON.stringify(profileSystemCatalog)
  deepFreeze(input)
  validate(input)
  const first = createFrom(input), second = createFrom(input)
  assert.deepEqual(first, second)
  assert.deepEqual(input, before)
  assert.equal(JSON.stringify(profileSystemCatalog), catalogueBefore)
  validate(JSON.parse(JSON.stringify(first)))
  assert.notEqual(first.frameParts[0], input.frameParts[0])
  assert.notEqual(first.frameParts[0].frameSides, input.frameParts[0].frameSides)
  assert.notEqual(first.frameParts[0].fieldIds, input.frameParts[0].fieldIds)
  assert.notEqual(first.connections[0], input.connections[0])
  first.frameParts[0].frameSides.bottom = false
  first.frameParts[0].fieldIds.push('field-3')
  first.connections[0].toFramePartId = 'edited-only-in-copy'
  assert.deepEqual(input, before)
  assert.deepEqual(second, before)
})
test('K: no automatic geometry, layout, model assignment or engineering compatibility', () => {
  const input = composite(), value = createFrom(input)
  assert.deepEqual(value, input, 'Only explicit data and schema version are returned')
  assert.deepEqual(safety, {
    automaticGeometry: false, rulesValidated: false, machineReady: false,
    zeroDividerExactGeometry: 'UNKNOWN', frameToFrameCompatibility: 'HUMAN REVIEW', exactCutOverlapInset: 'UNKNOWN',
  })
  const source = readFileSync(new URL('../src/domain/compositeModuleStructure.ts', import.meta.url), 'utf8')
  const ast = ts.createSourceFile('compositeModuleStructure.ts', source, ts.ScriptTarget.Latest, true)
  const runtimeImports = ast.statements.filter(ts.isImportDeclaration).filter((node) => !node.importClause?.isTypeOnly)
  assert.deepEqual(runtimeImports.map((node) => node.moduleSpecifier.text), ['../data/profileSystems/catalog'])
})
for (const [name, change] of [
  ['saved model assignment', (s) => { s.frameParts[0].modelId = 'M001' }],
  ['copied FIELD geometry', (s) => { s.frameParts[0].fields = [{ widthMm: 100 }] }],
  ['connection deduction', (s) => { s.connections[0].cutDeductionMm = 20 }],
  ['derived module width', (s) => { s.widthMm = 2200 }],
]) reject(`${name} is outside this schema`, change, /unexpected property/)

console.log(`COMPOSITE MODULE STRUCTURE 01A PASS: ${passed} cases`)
console.log('AUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
console.log('ZERO DIVIDER EXACT GEOMETRY = UNKNOWN\nFRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW\nEXACT CUT / OVERLAP / INSET = UNKNOWN')
