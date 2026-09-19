import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/FIX47_TECHNICAL_READING_CLEARANCE_01.md', import.meta.url), 'utf8')

assert(panel.includes('const profileContourAnchorCandidates = ('), 'FIX47 contour-anchor resolver missing')
assert(panel.includes("profileCode === '482.21'"), '482.21 contour anchor set missing')
assert(panel.includes("profileCode === '482.05'"), '482.05 contour anchor set missing')
assert(panel.includes('anchor = nearestContourAnchor(contourAnchors'), 'Identity leaders must resolve to reviewed raster contour anchors')
assert(panel.includes("profileIdentityCallout(supportBox, joint.supportProfileCode"), 'Support semantic identity mapping changed unexpectedly')
assert(panel.includes("profileIdentityCallout(sashBox, joint.sashProfileCode, 'КРИЛО'"), 'Sash semantic identity mapping changed unexpectedly')

assert(panel.includes('const profileSeparationIsHorizontal ='), 'Outer dimension-lane resolver missing')
assert(panel.includes("supportCenter.x <= sashCenter.x ? 'left' : 'right'"), 'Support vertical dimension must choose the outside lane')
assert(panel.includes("sashCenter.x <= supportCenter.x ? 'left' : 'right'"), 'Sash vertical dimension must choose the outside lane')
assert(panel.includes('supportVerticalDimensionX'), 'Support external dimension coordinate missing')
assert(panel.includes('sashVerticalDimensionX'), 'Sash external dimension coordinate missing')

assert(panel.includes('className="assembly-auto-reference-label-box"'), 'System correction must have an isolated label box')
assert(panel.includes('<polyline'), 'System correction must use a routed leader')
assert(css.includes('.assembly-auto-reference-label-box'), 'System correction label-box styling missing')
assert(css.includes('stroke-dasharray: .95 1.85;'), 'Profile helper boxes must use the quieter FIX47 dash pattern')
assert(css.includes('opacity: .42;'), 'Profile helper boxes must be visually reduced')

assert(
  semantics.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"),
  '482.21 catalogue envelope changed unexpectedly',
)
assert(
  semantics.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"),
  '482.05 catalogue envelope changed unexpectedly',
)
assert(acceptance.includes('ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY'), 'Annotation-only safety boundary missing')
assert(acceptance.includes('UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED'), 'Unknown-overlap safety boundary missing')
assert(acceptance.includes('AUTOMATIC GEOMETRY = NO'), 'Automatic-geometry safety boundary missing')
assert(acceptance.includes('RULES VALIDATED = NO'), 'Rules-validation safety boundary missing')
assert(acceptance.includes('MACHINE READY = NO'), 'Machine-readiness safety boundary missing')

console.log('=== FIX47 TECHNICAL READING CLEARANCE VERIFY PASS ===')
console.log('PROFILE IDENTITY: REVIEWED RASTER CONTOUR ANCHOR')
console.log('84 / 56 DIMENSIONS: OUTER PROFILE LANES')
console.log('8.5 SYSTEM CORRECTION: ROUTED + BOXED LABEL')
console.log('PROFILE HELPER BOUNDS: QUIETER')
console.log('FIX45.2 SEMANTIC MAPPING: PRESERVED')
console.log('482.21 CATALOGUE ENVELOPE: 60 x 84')
console.log('482.05 CATALOGUE ENVELOPE: 60 x 56')
console.log('ANNOTATION ANCHORS: VISUAL ONLY / NOT PRODUCTION GEOMETRY')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
