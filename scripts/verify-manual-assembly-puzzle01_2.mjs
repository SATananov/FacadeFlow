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

for (const marker of [
  'data-manual-assembly-puzzle="01.2"',
  'ПЪЛЕН КАТАЛОГ НА СИСТЕМАТА',
  'Контекст от активния модул',
  'PUZZLE_WORKSPACE_UNITS_PER_MM = 2.2',
  'PUZZLE_GRID_STEP_MM = 5',
  'PUZZLE_MAJOR_GRID_MM = 25',
  'systemCatalog.mainProfiles.forEach(addProfile)',
  'systemCatalog.glassBeads.forEach(addProfile)',
  'systemCatalog.additionalProfiles.forEach(addProfile)',
  'systemCatalog.gaskets.forEach(addProfile)',
  'systemCatalog.panelsAndSills.forEach(addProfile)',
  'systemCatalog.reinforcements',
  'systemCatalog.accessories',
  'getConfirmedGlazingOptions()',
  "glazingPieceCode('field', currentGlazingThicknessMm)",
  'getAssemblyTechnicalSectionGraphic(section, fallbackLabel)',
  'section.catalogueDepthMm * PUZZLE_WORKSPACE_UNITS_PER_MM',
  'section.catalogueFaceMm * PUZZLE_WORKSPACE_UNITS_PER_MM',
  'Snap към {PUZZLE_GRID_STEP_MM} mm мрежа',
  'manualPuzzleSmallGrid012',
  'manualPuzzleMajorGrid012',
  'Каталожен запис без индексирана техническа скица',
  '<AutomaticSystemAssemblyView joint={joint} fieldGlazingContext={fieldGlazingContext} />',
  'moduleContext={manualAssemblyModuleContext}',
]) {
  assert.ok(panel.includes(marker), `PUZZLE 01.2 missing panel marker: ${marker}`)
}

for (const marker of [
  '.assembly-puzzle-module-context',
  '.assembly-puzzle-category-tabs',
  '.assembly-puzzle-catalog-search',
  '.assembly-puzzle-mm-grid',
  '.assembly-puzzle-true-scale-object',
  '.assembly-puzzle-glazing-piece',
  '.assembly-puzzle-scale-strip',
]) {
  assert.ok(css.includes(marker), `PUZZLE 01.2 missing CSS marker: ${marker}`)
}

// CUSTOM DRAFT persistence contract remains unchanged.
for (const marker of [
  'export type CustomJointPuzzlePiece',
  'puzzlePieces?: readonly CustomJointPuzzlePiece[]',
  'export function getCustomJointPuzzlePieces',
  "status: 'custom-draft'",
]) {
  assert.ok(library.includes(marker), `PUZZLE 01.2 missing custom draft marker: ${marker}`)
}

// 04C.2 safety truth must remain untouched.
assert.match(systemRules, /jointKind === 'mullion-sash'[\s\S]*supportProfileCode === '482\.21'[\s\S]*sashProfileCode === '482\.05'[\s\S]*return null/)
assert.doesNotMatch(systemRules, /kmgPrelude60Window48218/)
assert.match(joints, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.18'/)
assert.doesNotMatch(joints, /jointKind: 'mullion-sash'[\s\S]{0,240}supportProfileCode: '482\.21'[\s\S]{0,240}sashProfileCode: '482\.05'/)
assert.match(presentation, /supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.05'[\s\S]*catalogueSashProfileCode: '482\.18'/)
assert.match(presentation, /FacadeFlow не намества 482\.05 и не го подменя автоматично/)
assert.match(visualization, /ASSEMBLY_FUNCTIONALITY_VERSION = 'assembly-model-04c'/)

// No catalogue-only entry may be silently promoted to geometry.
assert.match(panel, /canPlace: Boolean\(section\)/)
assert.match(panel, /canPlace: false,[\s\S]*usedInCurrentContext: false/)
assert.match(panel, /item\.canPlace \? 'Добави' : 'Каталог'/)

console.log('=== MANUAL ASSEMBLY PUZZLE 01.2 VERIFY PASS ===')
console.log('MODULE CONTEXT: INHERITED FROM ACTIVE MODULE / FIELD / JOINT')
console.log('FULL ACTIVE-SYSTEM CATALOGUE: VISIBLE BY CATEGORY')
console.log('CURRENT JOINT COMPONENTS: HIGHLIGHTED')
console.log('TRUE RELATIVE PROFILE SCALE: CATALOGUE DEPTH/FACE ENVELOPES')
console.log('WORK GRID: 5 mm / MAJOR 25 mm')
console.log('CURRENT GLAZING THICKNESS: PLACEABLE AS PUZZLE ELEMENT')
console.log('CATALOGUE ENTRY WITHOUT INDEXED SKETCH: VISIBLE BUT NOT FABRICATED')
console.log('04C.2 482.21 + 482.05 AUTOMATIC MATE: STILL BLOCKED')
console.log('AUTOMATIC PROFILE SUBSTITUTION: NO')
console.log('CUSTOM DRAFT ONLY: YES')
console.log('PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
