import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const compositionApi = load('src/domain/combinedModuleComposition')
const geometryApi = load('src/domain/combinedRegionGeometry')
const composition = compositionApi.createCombinedRegionComposition('window-left')
const doorRegion = composition.regions[1]
const initialGeometry = geometryApi.createIncompleteCombinedRegionGeometry(composition)
const adoptedDoor = geometryApi.assignCombinedRegionFromFieldBounds(
  composition, initialGeometry, doorRegion.id, 'field-door', { widthMm: 548, heightMm: 1130 },
)
assert.ok(adoptedDoor, 'explicit assignment adopts a selected field')
assert.equal(adoptedDoor.composition.regions[1].fieldId, 'field-door')
assert.deepEqual(adoptedDoor.geometry.regions[1].bounds, { xMm: null, yMm: 0, widthMm: 548, heightMm: 1130 }, 'door region receives the exact existing field dimensions')
assert.equal(adoptedDoor.geometry.regions[0].bounds.widthMm, null, 'other region dimensions remain genuinely incomplete')

const adoptedWindow = geometryApi.assignCombinedRegionFromFieldBounds(
  adoptedDoor.composition, adoptedDoor.geometry, composition.regions[0].id, 'field-window', { widthMm: 1372, heightMm: 1130 },
)
assert.ok(adoptedWindow)
assert.deepEqual(adoptedWindow.geometry.regions[0].bounds, { xMm: 0, yMm: 0, widthMm: 1372, heightMm: 1130 }, 'window dimensions are independently adopted without defaults')
assert.equal(geometryApi.assignCombinedRegionFromFieldBounds(
  adoptedWindow.composition, adoptedWindow.geometry, doorRegion.id, 'field-window', { widthMm: 548, heightMm: 1130 },
), null, 'one construction field cannot be assigned to two functional regions')
assert.equal(geometryApi.assignCombinedRegionFromFieldBounds(
  adoptedWindow.composition, adoptedWindow.geometry, doorRegion.id, 'replacement-field', { widthMm: 548, heightMm: 1130 },
), null, 'assignment cannot silently replace another region field mapping')
assert.equal(geometryApi.assignCombinedRegionFromFieldBounds(
  composition, initialGeometry, doorRegion.id, 'field-zero', { widthMm: 0, heightMm: 1130 },
), null, 'invalid source dimensions fail closed')

const shell = readFileSync('src/components/ConstructorShell.tsx', 'utf8')
assert.match(shell, /assignSelectedFieldToCombinedRegion\(selectedCombinedRegion\.id\)[\s\S]*?Използвай текущите размери на Поле/, 'selected incomplete region offers an explicit user-triggered field-bounds adoption action')
const handler = shell.match(/const assignSelectedFieldToCombinedRegion = \(regionId: string\) => \{([\s\S]*?)\n  \}/)?.[1]
assert.ok(handler)
assert.match(handler, /field\.bounds\.widthMm[\s\S]*?field\.bounds\.heightMm/, 'adoption reads the selected field resolved dimensions')
assert.match(handler, /pushUndoEntry\(captureHistoryEntry\(\)\)[\s\S]*?combinedCompositionRef\.current = assigned\.composition[\s\S]*?combinedRegionGeometryRef\.current = assigned\.geometry[\s\S]*?onCombinedCompositionChange\?[\s\S]*?onCombinedRegionGeometryChange\?\./, 'role/bounds adoption updates composition and geometry in one existing history action')
assert.match(shell, /combinedRegionGeometryForView\?\.regions\.find\(\(region\) => region\.regionId === selectedCombinedRegion\.id\)\?\.bounds/, 'inspector dimensions read the adopted authoritative region bounds')
assert.doesNotMatch(shell, /assignCombinedRegionFromFieldBounds\([^\n]*load|useEffect\([^\n]*assignSelectedFieldToCombinedRegion/, 'no load-time geometry adoption was added')

console.log('COMBINED REGION FIELD BOUNDS ADOPTION 01: PASS')
console.log('EXPLICIT ADOPTION: selected field dimensions seed only the chosen functional region')
console.log('SAFETY: no guessed values, duplicate mappings, geometry mutation, or load-time migration')
console.log('HISTORY: composition mapping and adopted bounds share one existing Constructor history snapshot')
