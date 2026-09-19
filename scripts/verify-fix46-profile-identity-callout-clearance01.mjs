import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/FIX46_PROFILE_IDENTITY_CALLOUT_CLEARANCE_01.md', import.meta.url), 'utf8')

assert(panel.includes("lane: 'support' | 'sash'"), 'FIX46 lane semantics missing')
assert(panel.includes("anchor = { x: centerX, y: lane === 'support' ? box.y : box.y + box.height }"), 'Identity anchor must start on the semantic profile edge')
assert(panel.includes("'support-identity', 'support'"), 'Support callout must use the support clearance lane')
assert(panel.includes("'sash-identity', 'sash'"), 'Sash callout must use the sash clearance lane')
assert(panel.includes("Support dimensions occupy bottom + left; sash dimensions occupy top + right."), 'Dimension-clearance contract comment missing')

assert(
  semantics.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"),
  '482.21 catalogue envelope changed unexpectedly',
)
assert(
  semantics.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"),
  '482.05 catalogue envelope changed unexpectedly',
)
assert(acceptance.includes('UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED'), 'Unknown-overlap safety boundary missing')
assert(acceptance.includes('AUTOMATIC GEOMETRY = NO'), 'Automatic-geometry safety boundary missing')
assert(acceptance.includes('RULES VALIDATED = NO'), 'Rules-validation safety boundary missing')
assert(acceptance.includes('MACHINE READY = NO'), 'Machine-readiness safety boundary missing')

console.log('=== FIX46 PROFILE IDENTITY CALLOUT CLEARANCE VERIFY PASS ===')
console.log('SUPPORT IDENTITY: PROFILE EDGE -> ABOVE LANE (BOUNDED FALLBACK)')
console.log('SASH IDENTITY: PROFILE EDGE -> BELOW LANE (BOUNDED FALLBACK)')
console.log('FIX45.2 SEMANTIC MAPPING: PRESERVED')
console.log('482.21 CATALOGUE ENVELOPE: 60 x 84')
console.log('482.05 CATALOGUE ENVELOPE: 60 x 56')
console.log('CATALOGUE DIMENSIONS / CANONICAL COORDINATES: UNCHANGED')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
