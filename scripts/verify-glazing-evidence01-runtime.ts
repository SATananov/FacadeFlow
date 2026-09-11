import { kmgPrelude60 } from '../src/data/profileSystems/prelude60'
import { kmgPrestige70 } from '../src/data/profileSystems/prestige70'
import {
  PRELUDE60_GLAZING_BEAD_EVIDENCE,
  getPrelude60GlazingBeadEvidenceByCode,
} from '../src/data/profileSystems/glazingEvidence'
import { resolveGlazingEvidenceContext } from '../src/domain/glazingEvidence'

const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message) }
const equal = (actual: unknown, expected: unknown, message = 'equality') => assert(Object.is(actual, expected), `${message}: expected ${String(expected)}, got ${String(actual)}`)
const deepEqual = (actual: unknown, expected: unknown, message = 'deep equality') => assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)

deepEqual(
  PRELUDE60_GLAZING_BEAD_EVIDENCE.map((item) => [item.beadCode, item.nominalGlazingThicknessMm]),
  [
    ['482.14', 4],
    ['549.10', 14],
    ['482.15', 24],
    ['482.01', 24],
    ['482.22', 32],
  ],
  'PRELUDE bead evidence',
)

for (const record of PRELUDE60_GLAZING_BEAD_EVIDENCE) {
  equal(record.systemId, 'kmg-prelude-60')
  equal(record.evidence.page, 2)
  equal(record.evidence.section, 'Glass beads')
  equal(record.baseProfileCompatibility, 'UNCONFIRMED')
  equal(record.automaticSelectionAllowed, false)
  equal(record.glazingInsetMm, null)
  equal(record.glassCutAuthority, 'NONE')
  equal(record.machineReady, false)
}

const prelude24 = resolveGlazingEvidenceContext(kmgPrelude60, 24)
equal(prelude24.status, 'CATALOGUE_CANDIDATES')
deepEqual(prelude24.candidates.map((item) => item.beadCode), ['482.15', '482.01'], '24 mm candidates')
assert(prelude24.candidates.every((item) => item.compatibilityStatus === 'UNCONFIRMED'), 'candidate compatibility remains unconfirmed')
assert(prelude24.candidates.every((item) => item.automaticSelectionAllowed === false), 'automatic selection remains disabled')
assert(prelude24.candidates.every((item) => item.glazingInsetMm === null), 'glazing inset remains unknown')

const prelude32 = resolveGlazingEvidenceContext(kmgPrelude60, 32)
equal(prelude32.status, 'CATALOGUE_CANDIDATES')
deepEqual(prelude32.candidates.map((item) => item.beadCode), ['482.22'], '32 mm candidate')

const prelude44 = resolveGlazingEvidenceContext(kmgPrelude60, 44)
equal(prelude44.status, 'NO_CATALOGUE_CANDIDATE')
equal(prelude44.candidates.length, 0)

const missing = resolveGlazingEvidenceContext(kmgPrelude60, null)
equal(missing.status, 'GLAZING_THICKNESS_MISSING')
equal(missing.automaticSelectionAllowed, false)

// Same physical bead codes are reused by PRESTIGE with different nominal
// glazing labels. PRELUDE evidence must never leak across the system boundary.
equal(getPrelude60GlazingBeadEvidenceByCode('482.15')?.nominalGlazingThicknessMm, 24)
equal(kmgPrestige70.glassBeads.find((item) => item.code === '482.15')?.statedGlassMm, 34)
const prestige24 = resolveGlazingEvidenceContext(kmgPrestige70, 24)
equal(prestige24.status, 'UNSUPPORTED_SYSTEM')
equal(prestige24.candidates.length, 0)

// Runtime resolver never mutates the catalog entry.
const before = JSON.stringify(kmgPrelude60)
resolveGlazingEvidenceContext(kmgPrelude60, 24)
equal(JSON.stringify(kmgPrelude60), before)

console.log('=== GLAZING EVIDENCE 01 RUNTIME PASS ===')
console.log('PRELUDE 60 PAGE 2 BEADS: 4 / 14 / 24 / 24 / 32 mm')
console.log('24 mm CANDIDATES: 482.15 + 482.01')
console.log('32 mm CANDIDATE: 482.22')
console.log('CROSS-SYSTEM CODE REUSE: FAIL-CLOSED')
console.log('BASE-PROFILE COMPATIBILITY: UNCONFIRMED')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('GLAZING INSET: UNKNOWN')
console.log('GLASS CUT: UNKNOWN')
console.log('CONSTRUCTION GEOMETRY MUTATION: NO')
console.log('MACHINE READY: NO')
