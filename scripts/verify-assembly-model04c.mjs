import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (rel) => fs.readFileSync(path.resolve(rel), 'utf8')

const joints = read('src/data/profileSystems/jointSemantics.ts')
const sections = read('src/data/profileSystems/technicalSections.ts')
const dimensions = read('src/data/profileSystems/dimensionalSemantics.ts')
const working = read('src/data/profileSystems/operatorWorkingDimensions.ts')
const presentation = read('src/data/profileSystems/assemblyJointPresentationTemplates.ts')
const glazing = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')
const visualization = read('src/domain/systemJointVisualization.ts')
const systemRules = read('src/data/profileSystems/systemConstructionRules.ts')
const graphics = read('src/components/assemblyTechnicalSectionGraphics.ts')

assert.match(joints, /jointKind: 'frame-sash'[\s\S]*supportProfileCode: '482\.30'[\s\S]*sashProfileCode: '482\.05'/)
assert.match(joints, /page: 23[\s\S]*482\.30 \+ 482\.05 \+ 482\.15/)
assert.match(joints, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.18'/)
assert.match(joints, /page: 25[\s\S]*482\.21 \+ 482\.18 \+ 482\.15/)
assert.doesNotMatch(joints, /jointKind: 'mullion-sash'[\s\S]{0,240}supportProfileCode: '482\.21'[\s\S]{0,240}sashProfileCode: '482\.05'/)
assert.match(joints, /sashOverlapMm: null/)
assert.match(joints, /sashInsetMm: null/)
assert.match(joints, /glazingInsetMm: null/)
assert.match(joints, /productionGeometryApproved: false/)
assert.match(joints, /machineReady: false/)

assert.match(sections, /'prelude60-sash-48218'/)
assert.match(sections, /profileCode: '482\.18'[\s\S]*catalogueDepthMm: 60[\s\S]*catalogueFaceMm: 78/)
assert.match(dimensions, /profileCode: '482\.18'[\s\S]*valueMm: 56/)
assert.match(working, /profileCode: '482\.18'[\s\S]*sectionHeightMm: 78[\s\S]*visibleWidthMm: 56/)

assert.match(presentation, /ASSEMBLY_JOINT_PRESENTATION_VERSION = 'assembly-joint-presentation-04c'/)
assert.match(presentation, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.18'[\s\S]*depthOffsetPresentationMm: 15\.5[\s\S]*faceOverlapPresentationMm: 30/)
assert.match(presentation, /AssemblyJointPresentationConflict/)
assert.match(presentation, /supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.05'[\s\S]*catalogueSashProfileCode: '482\.18'/)
assert.match(presentation, /FacadeFlow не намества 482\.05 и не го подменя автоматично/)

assert.match(glazing, /ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-04c'/)
assert.match(glazing, /sashProfileCode: '482\.18'[\s\S]*glazingBeadProfileCode: '482\.15'[\s\S]*glazingThicknessMm: 24/)

assert.match(visualization, /SYSTEM_JOINT_VISUALIZATION_VERSION = 'system-joint-visualization-04c'/)
assert.match(visualization, /ASSEMBLY_FUNCTIONALITY_VERSION = 'assembly-model-04c'/)
assert.match(visualization, /getAssemblyJointPresentationConflict/)
assert.match(visualization, /if \(presentationConflict\)/)
assert.match(visualization, /\(!rule && !presentationTemplate\)/)
assert.match(visualization, /const correctionMm = rule[\s\S]*: null/)
assert.match(visualization, /rule\?\.source\.labelBg \?\? presentationTemplate\?\.sourceLabelBg/)

assert.match(systemRules, /jointKind === 'mullion-sash'[\s\S]*supportProfileCode === '482\.21'[\s\S]*sashProfileCode === '482\.05'[\s\S]*return null/)
assert.doesNotMatch(systemRules, /kmgPrelude60Window48218/)

assert.match(graphics, /prelude60-48218-sash-clean\.png/)
assert.match(graphics, /'prelude60-sash-48218'/)
const asset = path.resolve('src/assets/catalog/prelude60/prelude60-48218-sash-clean.png')
assert.ok(fs.existsSync(asset), '482.18 technical profile graphic is missing')
assert.ok(fs.statSync(asset).size > 1000, '482.18 technical profile graphic is unexpectedly small')

console.log('=== ASSEMBLY MODEL 04C VERIFY PASS ===')
console.log('CATALOGUE PAIR 482.30 + 482.05: PAGE 23')
console.log('CATALOGUE PAIR 482.21 + 482.18: PAGE 25')
console.log('OLD 482.21 + 482.05 AUTOMATIC MATE: BLOCKED')
console.log('482.18 TECHNICAL SECTION / GRAPHIC / 24 mm GLAZING: PRESENT')
console.log('AUTOMATIC PROFILE SUBSTITUTION: NO')
console.log('OVERLAP / INSET / GLASS CUT / MACHINING: NOT CREATED')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
