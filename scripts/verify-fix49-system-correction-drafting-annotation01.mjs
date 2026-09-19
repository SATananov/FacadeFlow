import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/FIX49_SYSTEM_CORRECTION_DRAFTING_ANNOTATION_01.md', import.meta.url), 'utf8')

assert(panel.includes('const correctionAnnotationRightX = Math.max(38, correctionMid.x - 4)'), 'FIX49 correction annotation horizontal lane missing')
assert(panel.includes('Math.min(supportBox.y, sashBox.y) - 13'), 'FIX49 correction annotation must derive its free lane from the participating profiles')
assert(panel.includes('const correctionLeaderLaneY = correctionAnnotationY + 2.5'), 'FIX49 correction leader lane missing')
assert(panel.includes('x: correctionMid.x,'), 'FIX49 correction leader must rise on the system-reference axis')
assert(panel.includes('className="assembly-auto-reference-leader is-fix49"'), 'FIX49 dedicated correction leader missing')
assert(panel.includes('textAnchor="end"'), 'FIX49 correction text must terminate before the system axis')
assert(panel.includes('className="assembly-auto-reference-value is-fix49"'), 'FIX49 correction value text missing')
assert(panel.includes('className="assembly-auto-reference-label is-fix49"'), 'FIX49 correction descriptor missing')
assert(!panel.includes('className="assembly-auto-reference-label-box"'), 'FIX49 must not render a UI-style correction label box over the technical section')

assert(panel.includes('<line x1={correctionStart.x} y1={correctionStart.y} x2={correctionEnd.x} y2={correctionEnd.y} />'), 'System correction reference endpoints changed unexpectedly')
assert(panel.includes('r="0.9" className="assembly-auto-reference-anchor"'), 'FIX48 reduced correction endpoint markers must remain')
assert(panel.includes('{visualization.correctionMm} mm</text>'), 'System correction value must still come from the system rule model')

assert(css.includes('stroke-dasharray: .95 1.85;'), 'FIX47 helper-bound dash contract changed unexpectedly')
assert(css.includes('opacity: .42;'), 'FIX47 helper-bound opacity contract changed unexpectedly')
assert(css.includes('stroke-dasharray: 1.25 2.7;'), 'FIX48 quiet system-axis dash contract changed unexpectedly')
assert(css.includes('opacity: .36;'), 'FIX48 quiet system-axis opacity changed unexpectedly')
assert(css.includes('.assembly-auto-reference-dimension .assembly-auto-reference-leader.is-fix49'), 'FIX49 leader styling missing')
assert(css.includes('stroke-width: .68;'), 'FIX49 leader must stay visually light')
assert(css.includes('stroke-dasharray: none;'), 'FIX49 leader must use a clean drafting line')
assert(css.includes('.assembly-auto-reference-value.is-fix49'), 'FIX49 value styling missing')
assert(css.includes('.assembly-auto-reference-label.is-fix49'), 'FIX49 descriptor styling missing')

assert(panel.includes('anchor = nearestContourAnchor(contourAnchors'), 'FIX47 reviewed contour identity anchors must remain')
assert(panel.includes('supportVerticalDimensionX'), 'FIX47 support outer dimension lane must remain')
assert(panel.includes('sashVerticalDimensionX'), 'FIX47 sash outer dimension lane must remain')
assert(panel.includes("profileIdentityCallout(supportBox, joint.supportProfileCode"), 'Support semantic identity mapping changed unexpectedly')
assert(panel.includes("profileIdentityCallout(sashBox, joint.sashProfileCode, 'КРИЛО'"), 'Sash semantic identity mapping changed unexpectedly')

assert(
  semantics.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"),
  '482.21 catalogue envelope changed unexpectedly',
)
assert(
  semantics.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"),
  '482.05 catalogue envelope changed unexpectedly',
)
assert(acceptance.includes('SYSTEM CORRECTION ANNOTATION = VISUAL ONLY'), 'FIX49 visual-only annotation boundary missing')
assert(acceptance.includes('SYSTEM CORRECTION VALUE / ENDPOINTS = UNCHANGED'), 'System correction value/endpoint boundary missing')
assert(acceptance.includes('ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY'), 'Annotation-only safety boundary missing')
assert(acceptance.includes('UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED'), 'Unknown-overlap safety boundary missing')
assert(acceptance.includes('AUTOMATIC GEOMETRY = NO'), 'Automatic-geometry safety boundary missing')
assert(acceptance.includes('RULES VALIDATED = NO'), 'Rules-validation safety boundary missing')
assert(acceptance.includes('MACHINE READY = NO'), 'Machine-readiness safety boundary missing')

console.log('=== FIX49 SYSTEM CORRECTION DRAFTING ANNOTATION VERIFY PASS ===')
console.log('8.5 SYSTEM CORRECTION: VISIBLE TEXT-ONLY DRAFTING ANNOTATION')
console.log('LEADER: SYSTEM AXIS -> FREE UPPER LANE')
console.log('UI LABEL BOX OVER SECTION: NO')
console.log('8.5 VALUE / REFERENCE ENDPOINTS: UNCHANGED')
console.log('FIX48 QUIET AXIS / MARKERS: PRESERVED')
console.log('FIX47 CONTOUR IDENTITY + OUTER DIMENSIONS: PRESERVED')
console.log('FIX45.2 SEMANTIC MAPPING: PRESERVED')
console.log('482.21 CATALOGUE ENVELOPE: 60 x 84')
console.log('482.05 CATALOGUE ENVELOPE: 60 x 56')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
