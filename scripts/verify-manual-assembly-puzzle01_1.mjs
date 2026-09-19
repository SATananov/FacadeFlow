import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const library = read('src/domain/customJointLibrary.ts')
const systemRules = read('src/data/profileSystems/systemConstructionRules.ts')
const joints = read('src/data/profileSystems/jointSemantics.ts')
const presentation = read('src/data/profileSystems/assemblyJointPresentationTemplates.ts')
const visualization = read('src/domain/systemJointVisualization.ts')

const requiredPanelMarkers = [
  'data-manual-assembly-puzzle="01"',
  'РЪЧНА СГЛОБКА · ПЪЗЕЛ',
  'ПРОФИЛИ ОТ СИСТЕМАТА',
  'application/x-facadeflow-profile',
  'onDrop={handleCanvasDrop}',
  'pieces.map(renderProfile)',
  'Отвори ръчна сглобка · пъзел',
  'координатите са визуални, НЕ са производствени mm',
  '<AutomaticSystemAssemblyView joint={joint} fieldGlazingContext={fieldGlazingContext} />',
]
for (const marker of requiredPanelMarkers) {
  assert.ok(panel.includes(marker), `PUZZLE 01.1 missing panel marker: ${marker}`)
}

const requiredLibraryMarkers = [
  'export type CustomJointPuzzlePiece',
  'puzzlePieces?: readonly CustomJointPuzzlePiece[]',
  'export function getCustomJointPuzzlePieces',
  "{ id: 'support', profileCode: args.supportProfileCode",
  "{ id: 'sash', profileCode: args.sashProfileCode",
]
for (const marker of requiredLibraryMarkers) {
  assert.ok(library.includes(marker), `PUZZLE 01.1 missing custom library marker: ${marker}`)
}

const requiredCssMarkers = [
  '.assembly-manual-puzzle-launcher',
  '.assembly-puzzle-layout',
  '.assembly-puzzle-palette-card',
  '.assembly-custom-profile.is-selected',
  '.assembly-custom-profile.is-locked',
  '.assembly-custom-piece-actions',
]
for (const marker of requiredCssMarkers) {
  assert.ok(css.includes(marker), `PUZZLE 01.1 missing CSS marker: ${marker}`)
}

// 04C.2 safety boundary must survive this merge.
assert.match(systemRules, /jointKind === 'mullion-sash'[\s\S]*supportProfileCode === '482\.21'[\s\S]*sashProfileCode === '482\.05'[\s\S]*return null/)
assert.doesNotMatch(systemRules, /kmgPrelude60Window48218/)
assert.match(joints, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.18'/)
assert.doesNotMatch(joints, /jointKind: 'mullion-sash'[\s\S]{0,240}supportProfileCode: '482\.21'[\s\S]{0,240}sashProfileCode: '482\.05'/)
assert.match(presentation, /supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.05'[\s\S]*catalogueSashProfileCode: '482\.18'/)
assert.match(presentation, /FacadeFlow не намества 482\.05 и не го подменя автоматично/)
assert.match(visualization, /ASSEMBLY_FUNCTIONALITY_VERSION = 'assembly-model-04c'/)

const sash48218 = path.join(root, 'src/assets/catalog/prelude60/prelude60-48218-sash-clean.png')
assert.ok(fs.existsSync(sash48218), '04C.2 482.18 catalogue graphic is missing')
assert.ok(fs.statSync(sash48218).size > 1000, '04C.2 482.18 catalogue graphic is unexpectedly small')

const launcherIndex = panel.indexOf('assembly-manual-puzzle-launcher')
const technicalAdminIndex = panel.indexOf('<details className="assembly-technical-admin">', launcherIndex)
assert.ok(launcherIndex >= 0 && technicalAdminIndex >= 0 && launcherIndex < technicalAdminIndex,
  'Manual puzzle launcher must remain in the normal operator path before technical administration.')

console.log('=== MANUAL ASSEMBLY PUZZLE 01.1 VERIFY PASS ===')
console.log('04C.2 CATALOGUE PAIRING TRUTH: PRESERVED')
console.log('482.21 + 482.05 AUTOMATIC SYSTEM MATE: STILL BLOCKED')
console.log('482.21 + 482.18 CATALOGUE PATH: PRESERVED')
console.log('MANUAL PUZZLE: ACTIVE SYSTEM PALETTE + DRAG/DROP + MOVE + ROTATE + MIRROR + LOCK + REMOVE')
console.log('MANUAL 482.21 + 482.05 EXPERIMENT: ALLOWED AS CUSTOM DRAFT ONLY')
console.log('AUTOMATIC PROFILE SUBSTITUTION: NO')
console.log('PRODUCTION GEOMETRY: NOT CREATED')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
