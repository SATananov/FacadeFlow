import { kmgPrelude60 } from '../src/data/profileSystems/prelude60'
import { kmgPrestige70 } from '../src/data/profileSystems/prestige70'
import { resolveHumanGlazingContext } from '../src/domain/glazingContext'

const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message) }
const equal = (actual: unknown, expected: unknown, message = 'equality'): void => {
  assert(Object.is(actual, expected), `${message}: expected ${String(expected)}, got ${String(actual)}`)
}
const deepEqual = (actual: unknown, expected: unknown, message = 'deep equality'): void => {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

const missing = resolveHumanGlazingContext(kmgPrelude60, null)
equal(missing.status, 'GLAZING_THICKNESS_MISSING')
equal(missing.selectedCandidate, null)
equal(missing.automaticBeadSelectionAllowed, false)

const invalidZero = resolveHumanGlazingContext(kmgPrelude60, 0)
equal(invalidZero.status, 'INVALID_GLAZING_THICKNESS')
const invalidNaN = resolveHumanGlazingContext(kmgPrelude60, Number.NaN)
equal(invalidNaN.status, 'INVALID_GLAZING_THICKNESS')

const context24 = resolveHumanGlazingContext(kmgPrelude60, 24)
equal(context24.status, 'CANDIDATES_READY_FOR_HUMAN_SELECTION')
deepEqual(context24.candidates.map((candidate) => candidate.beadCode), ['482.15', '482.01'], '24 mm candidates')
equal(context24.selectedCandidate, null)
equal(context24.selectionAuthority, 'NONE')

const context32 = resolveHumanGlazingContext(kmgPrelude60, 32)
equal(context32.status, 'CANDIDATES_READY_FOR_HUMAN_SELECTION')
deepEqual(context32.candidates.map((candidate) => candidate.beadCode), ['482.22'], '32 mm candidate')
// Even a single catalogue candidate must never be selected automatically.
equal(context32.selectedBeadCode, null)
equal(context32.selectedCandidate, null)
equal(context32.automaticBeadSelectionAllowed, false)

const selected2415 = resolveHumanGlazingContext(kmgPrelude60, 24, '482.15')
equal(selected2415.status, 'HUMAN_BEAD_SELECTION_VALID')
equal(selected2415.selectedCandidate?.beadCode, '482.15')
equal(selected2415.selectionAuthority, 'HUMAN_ONLY')

const selected2401 = resolveHumanGlazingContext(kmgPrelude60, 24, '482.01')
equal(selected2401.status, 'HUMAN_BEAD_SELECTION_VALID')
equal(selected2401.selectedCandidate?.beadCode, '482.01')

const selected14 = resolveHumanGlazingContext(kmgPrelude60, 14, '549.10')
equal(selected14.status, 'HUMAN_BEAD_SELECTION_VALID')
equal(selected14.selectedCandidate?.beadCode, '549.10')

const selected32 = resolveHumanGlazingContext(kmgPrelude60, 32, '482.22')
equal(selected32.status, 'HUMAN_BEAD_SELECTION_VALID')

const wrongForThickness = resolveHumanGlazingContext(kmgPrelude60, 24, '482.22')
equal(wrongForThickness.status, 'HUMAN_BEAD_SELECTION_INVALID')
equal(wrongForThickness.selectedCandidate, null)
equal(wrongForThickness.selectionAuthority, 'NONE')

// A previously valid selection must fail closed after thickness changes.
const staleAfterThicknessChange = resolveHumanGlazingContext(kmgPrelude60, 32, '482.15')
equal(staleAfterThicknessChange.status, 'HUMAN_BEAD_SELECTION_INVALID')

const noCandidate = resolveHumanGlazingContext(kmgPrelude60, 44)
equal(noCandidate.status, 'NO_CATALOGUE_CANDIDATE')
equal(noCandidate.candidates.length, 0)

// PRELUDE evidence never leaks into a system that reuses the same bead codes.
const prestige = resolveHumanGlazingContext(kmgPrestige70, 24, '482.15')
equal(prestige.status, 'UNSUPPORTED_SYSTEM')
equal(prestige.candidates.length, 0)
equal(prestige.selectedCandidate, null)

for (const resolution of [context24, context32, selected2415, selected2401, selected14, selected32]) {
  equal(resolution.baseProfileCompatibility, 'UNCONFIRMED')
  equal(resolution.exactGlazingInsetKnown, false)
  equal(resolution.glassCutKnown, false)
  equal(resolution.mutatesConstructionGeometry, false)
  equal(resolution.machineReady, false)
}

const before = JSON.stringify(kmgPrelude60)
resolveHumanGlazingContext(kmgPrelude60, 24, '482.15')
equal(JSON.stringify(kmgPrelude60), before, 'catalogue is not mutated')

console.log('=== GLAZING CONTEXT 01A RUNTIME PASS ===')
console.log('HUMAN GLAZING THICKNESS: EXPLICIT INPUT ONLY')
console.log('24 mm CANDIDATES: 482.15 + 482.01')
console.log('SINGLE 32 mm CANDIDATE: STILL NOT AUTO-SELECTED')
console.log('BEAD SELECTION AUTHORITY: HUMAN ONLY')
console.log('STALE / WRONG-THICKNESS SELECTION: FAIL-CLOSED')
console.log('CROSS-SYSTEM CODE REUSE: FAIL-CLOSED')
console.log('BASE-PROFILE COMPATIBILITY: UNCONFIRMED')
console.log('GLAZING INSET: UNKNOWN')
console.log('GLASS CUT: UNKNOWN')
console.log('CONSTRUCTION GEOMETRY MUTATION: NO')
console.log('MACHINE READY: NO')
