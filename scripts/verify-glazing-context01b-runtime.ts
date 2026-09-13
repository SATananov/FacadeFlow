import { kmgPrelude60 } from '../src/data/profileSystems/prelude60'
import {
  createModuleProfileResolution,
  getFieldHumanGlazingThicknessMm,
  reconcileModuleProfileResolution,
  setFieldGlazingBeadAssignment,
  setFieldHumanGlazingThicknessAssignment,
  setFrameProfileAssignment,
} from '../src/domain/profileResolution'
import { resolveHumanGlazingContext } from '../src/domain/glazingContext'

const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message) }
const equal = (actual: unknown, expected: unknown, message = 'equality'): void => {
  assert(Object.is(actual, expected), `${message}: expected ${String(expected)}, got ${String(actual)}`)
}
const deepEqual = (actual: unknown, expected: unknown, message = 'deep equality'): void => {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

const fixedField = { id: 'field-1', fieldType: 'fixed' as const }
const secondField = { id: 'field-2', fieldType: 'fixed' as const }

let resolution = createModuleProfileResolution(kmgPrelude60.id)
resolution = setFrameProfileAssignment(resolution, kmgPrelude60, '482.30')

// Thickness is explicit human state and does not auto-select a bead.
resolution = setFieldHumanGlazingThicknessAssignment(resolution, kmgPrelude60, fixedField, 24)
equal(getFieldHumanGlazingThicknessMm(resolution, fixedField.id), 24)
equal(resolution.fieldGlazingThicknesses[fixedField.id]?.source, 'human')
equal(resolution.fieldGlazingBeads[fixedField.id], undefined)

deepEqual(
  resolveHumanGlazingContext(kmgPrelude60, getFieldHumanGlazingThicknessMm(resolution, fixedField.id)).candidates.map((candidate) => candidate.beadCode),
  ['482.15', '482.01'],
  '24 mm UI candidates',
)

// Human selection only after the base-profile context exists.
resolution = setFieldGlazingBeadAssignment(resolution, kmgPrelude60, fixedField, 24, '482.15')
equal(resolution.fieldGlazingBeads[fixedField.id]?.profileCode, '482.15')

// Changing thickness fails closed and clears a stale bead selection.
resolution = setFieldHumanGlazingThicknessAssignment(resolution, kmgPrelude60, fixedField, 32)
equal(getFieldHumanGlazingThicknessMm(resolution, fixedField.id), 32)
equal(resolution.fieldGlazingBeads[fixedField.id], undefined)
const context32 = resolveHumanGlazingContext(kmgPrelude60, 32)
deepEqual(context32.candidates.map((candidate) => candidate.beadCode), ['482.22'], '32 mm UI candidate')
equal(context32.selectedCandidate, null, 'single candidate remains unselected')
equal(context32.automaticBeadSelectionAllowed, false)

resolution = setFieldGlazingBeadAssignment(resolution, kmgPrelude60, fixedField, 32, '482.22')
equal(resolution.fieldGlazingBeads[fixedField.id]?.profileCode, '482.22')

// FIELD contexts are independent.
resolution = setFieldHumanGlazingThicknessAssignment(resolution, kmgPrelude60, secondField, 24)
equal(getFieldHumanGlazingThicknessMm(resolution, fixedField.id), 32)
equal(getFieldHumanGlazingThicknessMm(resolution, secondField.id), 24)

// Reconcile removes contexts for deleted FIELDs while preserving the live FIELD.
resolution = reconcileModuleProfileResolution(
  resolution,
  kmgPrelude60,
  'window',
  [],
  [fixedField],
  null,
)
equal(getFieldHumanGlazingThicknessMm(resolution, fixedField.id), 32)
equal(getFieldHumanGlazingThicknessMm(resolution, secondField.id), null)
equal(resolution.fieldGlazingBeads[fixedField.id]?.profileCode, '482.22')

// Clearing thickness also clears its bead assignment; no geometry object exists here to mutate.
resolution = setFieldHumanGlazingThicknessAssignment(resolution, kmgPrelude60, fixedField, null)
equal(getFieldHumanGlazingThicknessMm(resolution, fixedField.id), null)
equal(resolution.fieldGlazingBeads[fixedField.id], undefined)

console.log('=== GLAZING CONTEXT 01B RUNTIME PASS ===')
console.log('HUMAN GLAZING THICKNESS: PERSISTED PER FIELD')
console.log('24 mm CANDIDATES: 482.15 + 482.01')
console.log('32 mm CANDIDATE: 482.22 / STILL NO AUTO-SELECT')
console.log('THICKNESS CHANGE: STALE BEAD FAIL-CLOSED')
console.log('FIELD CONTEXTS: INDEPENDENT')
console.log('BASE-PROFILE COMPATIBILITY: UNCONFIRMED')
console.log('GLAZING INSET: UNKNOWN')
console.log('GLASS CUT: UNKNOWN')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
