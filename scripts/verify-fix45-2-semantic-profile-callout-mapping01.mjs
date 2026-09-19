import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')

assert(
  panel.includes("if (profileCode === '482.21') return { src: mullion48221AssemblyImage"),
  '482.21 must resolve to the mullion assembly asset',
)
assert(
  panel.includes("if (profileCode === '482.05') return { src: sash48205AssemblyImage"),
  '482.05 must resolve to the sash assembly asset',
)

assert(
  panel.includes("supportGraphic.src,\n                visualization.canonicalSupportXmm"),
  'Support graphic must render at the canonical support box',
)
assert(
  panel.includes("sashGraphic.src,\n                visualization.canonicalSashXmm"),
  'Sash graphic must render at the canonical sash box',
)

assert(
  panel.includes("profileIdentityCallout(supportBox, joint.supportProfileCode"),
  'Support identity callout must use supportBox',
)
assert(
  panel.includes("profileIdentityCallout(sashBox, joint.sashProfileCode, 'КРИЛО'"),
  'Sash identity callout must use sashBox',
)

assert(
  semantics.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"),
  '482.21 catalogue envelope changed unexpectedly',
)
assert(
  semantics.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"),
  '482.05 catalogue envelope changed unexpectedly',
)

console.log('=== FIX45.2 SEMANTIC PROFILE CALLOUT MAPPING VERIFY PASS ===')
console.log('482.21 -> MULLION ASSET -> SUPPORT BOX: LOCKED')
console.log('482.05 -> SASH ASSET -> SASH BOX: LOCKED')
console.log('ORIENTATION MAY MOVE LEFT/RIGHT: SEMANTIC IDENTITY DOES NOT CHANGE')
console.log('482.21 CATALOGUE ENVELOPE: 60 x 84')
console.log('482.05 CATALOGUE ENVELOPE: 60 x 56')
console.log('CATALOGUE DIMENSIONS / COORDINATES: UNCHANGED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
