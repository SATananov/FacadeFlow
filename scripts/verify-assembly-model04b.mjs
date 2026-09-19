import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const mate = await readFile(new URL('../src/data/profileSystems/assemblyJointPresentationTemplates.ts', import.meta.url), 'utf8')
const glazing = await readFile(new URL('../src/data/profileSystems/assemblyGlazingSeatTemplates.ts', import.meta.url), 'utf8')
const visualization = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')
const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const joints = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')

// Reviewed current PRELUDE 60 sectional presentation:
// frame 64 + sash 78 - total assembled face 112 = 30 mm presentation overlap.
assert.equal(64 + 78 - 112, 30)
assert.equal(84 + 78 - 30, 132)
assert.equal(84 + 48 + 48, 180)
assert.equal(60 + 15.5, 75.5)

assert.match(mate, /ASSEMBLY_JOINT_PRESENTATION_VERSION = 'assembly-joint-presentation-04b'/)
assert.match(mate, /jointKind: 'frame-sash'[\s\S]*supportProfileCode: '482\.30'[\s\S]*sashProfileCode: '482\.05'[\s\S]*depthOffsetPresentationMm: 15\.5[\s\S]*faceOverlapPresentationMm: 30/)
assert.match(mate, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.05'[\s\S]*depthOffsetPresentationMm: 15\.5[\s\S]*faceOverlapPresentationMm: 30/)
assert.match(mate, /operator presentation|операторската скица/i)
assert.match(mate, /NOT written|не производствено правило/i)

// 04B must align system depth first, not chain two 60 mm envelopes serially.
assert.match(visualization, /getAssemblyJointPresentationTemplate/)
assert.match(visualization, /canonicalSashXmm = presentationTemplate[\s\S]*presentationTemplate\.depthOffsetPresentationMm/)
assert.match(visualization, /canonicalSashYmm = presentationTemplate[\s\S]*support\.faceMm - presentationTemplate\.faceOverlapPresentationMm/)
assert.match(visualization, /canonicalWidthMm = presentationTemplate[\s\S]*Math\.max\([\s\S]*support\.depthMm/)
assert.match(visualization, /presentationMateStatus: presentationTemplate \? 'reviewed-sectional' : 'legacy-reference'/)

// Glazing thickness must run across X/system depth; pane continuation runs along Y/face.
assert.match(glazing, /ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-04b'/)
assert.match(glazing, /glassDepthCenterFromSashStartMm: 30/)
assert.match(glazing, /glassFaceStartFromSashTopMm: 41\.5/)
assert.match(glazing, /glassPresentationRunMm: 52/)
assert.match(glazing, /beadCenterDepthFromSashStartMm: 44[\s\S]*beadCenterFaceFromSashTopMm: 41\.5[\s\S]*beadLocalRotationDeg: 90[\s\S]*beadMirrorX: true/)
assert.match(panel, /glazingLocalBaseCenter\.x - glazingHalfThicknessMm/)
assert.match(panel, /glazingLocalBaseCenter\.x \+ glazingHalfThicknessMm/)
assert.match(panel, /glazingLocalFarCenter\.y/)
assert.match(panel, /24 mm е по оста на системната дълбочина/)
assert.match(panel, /секционна дълбочина \{visualization\.canonicalWidthMm\} mm · отместване \{visualization\.presentationDepthOffsetMm\} mm/)

// Safety remains closed: operator presentation must not unlock production values.
assert.match(joints, /sashOverlapMm: null/)
assert.match(joints, /sashInsetMm: null/)
assert.match(joints, /glazingInsetMm: null/)
assert.match(panel, /не създава производствено застъпване, glass cut, seat\/inset или машинна корекция/)

console.log('=== ASSEMBLY MODEL 04B VERIFY PASS ===')
console.log('PRELUDE 60 ASSEMBLED DEPTH: 75.5 mm (60 + 15.5)')
console.log('482.30 + 482.05 PRESENTATION FACE: 112 mm (64 + 78 - 30)')
console.log('482.21 SECTION EVIDENCE: 180 mm = 84 + 48 + 48; ONE SIDE PRESENTATION = 132 mm')
console.log('24 mm GLAZING: THICKNESS ACROSS SYSTEM DEPTH AXIS')
console.log('482.15: ANCHORED TO LOCAL GLAZING SIDE OF 482.05')
console.log('PRODUCTION OVERLAP / SEAT / INSET / GLASS CUT: NOT CREATED')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
