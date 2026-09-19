import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const prelude = await readFile(new URL('../src/data/profileSystems/prelude60.ts', import.meta.url), 'utf8')
const sections = await readFile(new URL('../src/data/profileSystems/technicalSections.ts', import.meta.url), 'utf8')
const working = await readFile(new URL('../src/data/profileSystems/operatorWorkingDimensions.ts', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/data/profileSystems/dimensionalSemantics.ts', import.meta.url), 'utf8')
const joints = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const glazing = await readFile(new URL('../src/data/profileSystems/assemblyGlazingSeatTemplates.ts', import.meta.url), 'utf8')
const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const visualization = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')

// Current PRELUDE 60 catalogue truth for the working sash.
assert.match(prelude, /code: '482\.05'[\s\S]*calloutsMm: \[60, 78, 56\]/)
assert.match(prelude, /code: '482\.18'[\s\S]*calloutsMm: \[60, 78, 56\]/)
assert.match(sections, /profileCode: '482\.05'[\s\S]*catalogueDepthMm: 60[\s\S]*catalogueFaceMm: 78/)
assert.match(working, /profileCode: '482\.05'[\s\S]*sectionHeightMm: 78[\s\S]*visibleWidthMm: 56[\s\S]*internalZoneTotalMm: 22/)
assert.match(semantics, /profileCode: '482\.05'[\s\S]*visibleFace:[\s\S]*valueMm: 56/)
assert.match(joints, /sash48205CalloutsMm: \[60, 78, 56\]/)
assert.match(visualization, /'482\.05': \{ profileCode: '482\.05', depthMm: 60, faceMm: 78 \}/)

// 482.15 remains the reviewed 24 mm bead and is shown in installed, mirrored orientation.
assert.match(prelude, /code: '482\.15'[\s\S]*statedGlassMm: 24[\s\S]*calloutsMm: \[16\.5, 28\.5, 22\]/)
assert.match(glazing, /ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-04a'/)
assert.match(glazing, /sashProfileCode: '482\.05'[\s\S]*glazingBeadProfileCode: '482\.15'[\s\S]*glazingThicknessMm: 24/)
assert.match(glazing, /beadLocalRotationDeg: -90[\s\S]*beadMirrorX: true/)
assert.match(panel, /const beadMirrorX = glazingSeatTemplate\?\.beadMirrorX \?\? false/)
assert.match(panel, /transform=\{beadMirrorX \? 'scale\(-1 1\)' : undefined\}/)

// Safety: the corrected catalogue dimensions do not become production geometry.
assert.match(working, /MUST NOT be promoted to a joint overlap automatically/)
assert.match(joints, /sashOverlapMm: null/)
assert.match(joints, /glazingInsetMm: null/)
assert.match(glazing, /not an automatic joint overlap|не производствен glass cut|не е производствен/i)

console.log('=== ASSEMBLY MODEL 04A VERIFY PASS ===')
console.log('PRELUDE 60 / 482.05: 60 x 78 mm CATALOGUE ENVELOPE')
console.log('482.05 VISIBLE WIDTH: 56 mm')
console.log('482.05 PROFILE-SIDE DIFFERENCE: 78 - 56 = 22 mm')
console.log('482.15: 24 mm GLASS BEAD / INSTALLED MIRRORED ORIENTATION')
console.log('482.21: 60 x 84 mm / VISIBLE 40 mm PRESERVED')
console.log('GLASS CUT / EXACT MACHINE SEAT / MACHINING: NOT CREATED')
console.log('TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
