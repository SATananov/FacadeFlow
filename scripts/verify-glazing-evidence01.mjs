import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const data = await readFile(new URL('../src/data/profileSystems/glazingEvidence.ts', import.meta.url), 'utf8')
const domain = await readFile(new URL('../src/domain/glazingEvidence.ts', import.meta.url), 'utf8')
const prelude = await readFile(new URL('../src/data/profileSystems/prelude60.ts', import.meta.url), 'utf8')
const prestige = await readFile(new URL('../src/data/profileSystems/prestige70.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/GLAZING_EVIDENCE_01_PRELUDE60_BEAD_CONTEXT_FOUNDATION_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

for (const [code, mm] of [['482.14', 4], ['549.10', 14], ['482.15', 24], ['482.01', 24], ['482.22', 32]]) {
  assert.match(prelude, new RegExp(`code: '${code.replace('.', '\\.')}'[\\s\\S]{0,220}statedGlassMm: ${mm}`))
}
assert.match(prestige, /code: '482\.15'[\s\S]{0,220}statedGlassMm: 34/)
assert.match(prestige, /code: '482\.22'[\s\S]{0,220}statedGlassMm: 42/)

assert.match(data, /PRELUDE60_GLAZING_EVIDENCE_VERSION = 'prelude60-glazing-evidence-01'/)
assert.match(data, /systemId: PRELUDE60_GLAZING_SYSTEM_ID/)
assert.match(data, /baseProfileCompatibility: 'UNCONFIRMED'/)
assert.match(data, /automaticSelectionAllowed: false/)
assert.match(data, /glazingInsetMm: null/)
assert.match(data, /glassCutAuthority: 'NONE'/)
assert.match(data, /machineReady: false/)
assert.match(data, /page: 2/)
assert.match(data, /section: 'Glass beads'/)

assert.match(domain, /system\.id !== PRELUDE60_GLAZING_SYSTEM_ID/)
assert.match(domain, /CATALOGUE_INTEGRITY_MISMATCH/)
assert.match(domain, /compatibilityStatus: 'UNCONFIRMED'/)
assert.match(domain, /automaticSelectionAllowed: false/)
assert.match(domain, /exactGlazingInsetKnown: false/)
assert.match(domain, /glassCutKnown: false/)
assert.match(domain, /mutatesConstructionGeometry: false/)
assert.match(domain, /machineReady: false/)

assert.match(acceptance, /482\.14.*4 mm/)
assert.match(acceptance, /549\.10.*14 mm/)
assert.match(acceptance, /482\.15.*24 mm/)
assert.match(acceptance, /482\.01.*24 mm/)
assert.match(acceptance, /482\.22.*32 mm/)
assert.match(acceptance, /PRESTIGE 70.*different nominal glazing labels/)
assert.match(acceptance, /GLAZING INSET: \*\*UNKNOWN\*\*/)
assert.match(acceptance, /GLASS CUT: \*\*UNKNOWN\*\*/)
assert.match(acceptance, /MACHINE READY: \*\*NO\*\*/)

assert.match(packageJson.scripts['test:contract'], /verify-glazing-evidence01\.mjs/)
assert.match(packageJson.scripts['test:contract'], /test:glazing-evidence01-runtime/)
assert.equal(packageJson.scripts['test:glazing-evidence01'], 'node scripts/verify-glazing-evidence01.mjs')

console.log('=== GLAZING EVIDENCE 01 CONTRACT PASS ===')
console.log('PRELUDE 60 BEAD THICKNESS CONTEXT: CATALOGUE EVIDENCE-BOUND')
console.log('CROSS-SYSTEM CODE REUSE: SYSTEM-GATED')
console.log('BASE-PROFILE COMPATIBILITY: UNCONFIRMED')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('GLAZING INSET / GLASS CUT: UNKNOWN')
console.log('CONSTRUCTION TOPOLOGY / GEOMETRY: UNCHANGED')
console.log('MACHINE READY: NO')
