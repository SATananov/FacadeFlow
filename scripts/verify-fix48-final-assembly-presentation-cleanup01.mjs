import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/FIX48_FINAL_ASSEMBLY_PRESENTATION_CLEANUP_01.md', import.meta.url), 'utf8')

assert(panel.includes('const correctionTopLaneY = 4'), 'FIX48 top annotation lane missing')
assert(panel.includes('correctionMid.x - correctionLabelWidth / 2'), 'System correction label must be centered on its reference lane')
assert(panel.includes('const correctionLeaderTarget = {'), 'System correction leader target missing')
assert(panel.includes('y: correctionLabel.y + correctionLabelHeight'), 'System correction leader must terminate at the label edge')
assert(panel.includes('r="0.9" className="assembly-auto-reference-anchor"'), 'System correction anchors must use reduced FIX48 markers')
assert(panel.includes('points={`${correctionMid.x},${correctionMid.y} ${correctionLeaderKnee.x},${correctionLeaderKnee.y} ${correctionLeaderTarget.x},${correctionLeaderTarget.y}`}'), 'System correction routed leader changed unexpectedly')

assert(css.includes('fill: rgba(255, 255, 255, .06);'), 'Profile helper bounds must use the reduced FIX48 fill')
assert(css.includes('stroke-width: .18;'), 'Profile helper bounds must use the reduced FIX48 line weight')
assert(css.includes('stroke-dasharray: .95 1.85;'), 'FIX47 profile-helper dash contract must remain preserved')
assert(css.includes('opacity: .42;'), 'FIX47 profile-helper opacity contract must remain preserved')
assert(css.includes('stroke-dasharray: 1.25 2.7;'), 'System rule axis FIX48 dash pattern missing')
assert(css.includes('opacity: .36;'), 'System rule axis must be visually reduced')
assert(css.includes('.assembly-auto-reference-dimension .assembly-auto-reference-anchor'), 'Reduced correction-anchor styling missing')
assert(css.includes('stroke-width: .75;'), 'System correction reference/leader must use reduced FIX48 line weight')
assert(css.includes('stroke-dasharray: 1.8 2.2;'), 'System correction leader FIX48 dash pattern missing')

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
assert(acceptance.includes('PRESENTATION CLEANUP = VISUAL ONLY'), 'Visual-only FIX48 boundary missing')
assert(acceptance.includes('SYSTEM CORRECTION ENDPOINTS = UNCHANGED'), 'System-correction endpoint boundary missing')
assert(acceptance.includes('ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY'), 'Annotation-only safety boundary missing')
assert(acceptance.includes('UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED'), 'Unknown-overlap safety boundary missing')
assert(acceptance.includes('AUTOMATIC GEOMETRY = NO'), 'Automatic-geometry safety boundary missing')
assert(acceptance.includes('RULES VALIDATED = NO'), 'Rules-validation safety boundary missing')
assert(acceptance.includes('MACHINE READY = NO'), 'Machine-readiness safety boundary missing')

console.log('=== FIX48 FINAL ASSEMBLY PRESENTATION CLEANUP VERIFY PASS ===')
console.log('8.5 SYSTEM CORRECTION LABEL: TOP ANNOTATION LANE')
console.log('8.5 SYSTEM CORRECTION ENDPOINTS / VALUE: UNCHANGED')
console.log('SYSTEM RULE AXIS: QUIETER REVIEW REFERENCE')
console.log('CORRECTION ANCHORS: REDUCED VISUAL WEIGHT')
console.log('PROFILE HELPER BOUNDS: FURTHER REDUCED')
console.log('FIX47 CONTOUR IDENTITY + OUTER DIMENSIONS: PRESERVED')
console.log('FIX45.2 SEMANTIC MAPPING: PRESERVED')
console.log('482.21 CATALOGUE ENVELOPE: 60 x 84')
console.log('482.05 CATALOGUE ENVELOPE: 60 x 56')
console.log('PRESENTATION CLEANUP: VISUAL ONLY')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
