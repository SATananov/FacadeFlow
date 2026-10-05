import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const semanticSketch = await readFile(new URL('../src/domain/semanticSketch.ts', import.meta.url), 'utf8')
const productResolution = await readFile(new URL('../src/domain/productResolution.ts', import.meta.url), 'utf8')
const derivedProduct = await readFile(new URL('../src/domain/derivedProductModel.ts', import.meta.url), 'utf8')
const construction = await readFile(new URL('../src/domain/construction/constructionModel.ts', import.meta.url), 'utf8')
const composition = await readFile(new URL('../src/domain/combinedModuleComposition.ts', import.meta.url), 'utf8')
const serialization = await readFile(new URL('../src/domain/project/projectSerialization.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')

assert.match(semanticSketch, /topology: ConstructionModel/)
assert.doesNotMatch(semanticSketch, /frame:\s*\{/)
assert.match(semanticSketch, /combinedComposition: CombinedModuleComposition \| null/)
assert.match(semanticSketch, /WINDOW_REGION|DOOR_REGION|CombinedModuleComposition/)
assert.match(semanticSketch, /fieldType|openingMode|openingHanding/)
assert.match(semanticSketch, /ConstructionFrameEdgeKind/)
assert.match(semanticSketch, /LegacyCompositeSketchBoundary/)

assert.match(productResolution, /export type SelectedSystem/)
assert.match(productResolution, /profileSystemId: string \| null/)
assert.match(productResolution, /standardId: string \| null/)
assert.match(productResolution, /profileResolution: ModuleProfileResolution \| null/)
assert.match(productResolution, /offerDefaultGlazingId: string \| null/)
assert.match(productResolution, /hardware:/)
assert.match(productResolution, /'RESOLVED'|\| 'RESOLVED'/)
assert.match(productResolution, /'PARTIALLY_RESOLVED'/)
assert.match(productResolution, /'UNRESOLVED'/)
assert.match(productResolution, /export type ProductFact<T>/)
assert.match(productResolution, /status: 'RESOLVED'/)
assert.match(productResolution, /status: 'UNKNOWN'/)
assert.match(productResolution, /status: 'UNSUPPORTED'/)
assert.match(productResolution, /requiredEvidence/)
assert.match(productResolution, /requiredUserInput/)
assert.match(productResolution, /technicalRenderingAllowed/)
assert.match(productResolution, /blocksProductionReadiness/)

assert.match(derivedProduct, /export type DerivedProductModel/)
assert.match(derivedProduct, /DerivedSketchElementReference/)
assert.match(derivedProduct, /frame: ProductFact<DerivedSketchElementReference>/)
assert.match(derivedProduct, /dividers:/)
assert.match(derivedProduct, /sashIntent:/)
assert.match(derivedProduct, /glazing:/)
assert.match(derivedProduct, /beads:/)
assert.match(derivedProduct, /openings:/)
assert.match(derivedProduct, /hardware:/)
assert.match(derivedProduct, /bottomBoundaries:/)
assert.match(derivedProduct, /machineReady: false/)
assert.doesNotMatch(derivedProduct, /xMm|yMm|widthMm|heightMm|polygon/)

assert.match(construction, /kind: 'semantic-split'/)
assert.match(construction, /kind: 'ZERO_DIVIDER'/)
assert.match(composition, /WINDOW_REGION/)
assert.match(composition, /DOOR_REGION/)
assert.match(composition, /kind: 'ZERO_DIVIDER'/)

assert.match(serialization, /schemaVersion/)
assert.doesNotMatch(serialization, /derived-product-model-contract-02/)
assert.doesNotMatch(shell, /from ['"]\.\.\/domain\/(semanticSketch|productResolution|derivedProductModel)['"]/) 

const changedFiles = execFileSync('git', ['diff', '--name-only', '--',
  'src/components/ConstructorShell.tsx',
  'src/components/ConstructorShell.css',
  'src/domain/project/projectSerialization.ts',
  'src/domain/project/projectMigration.ts',
  'src/domain/profileAwareGeometry.ts',
  'src/domain/profileAwareSashGeometry.ts',
  'src/domain/profileJointGeometry.ts',
], { encoding: 'utf8' })
assert.equal(changedFiles.trim(), '')

console.log('UNIFIED SKETCH -> BUILD PRODUCT ARCHITECTURE CONTRACT 02 VERIFY PASS')
console.log('SEMANTIC SKETCH: REFERENCES CONSTRUCTIONMODEL')
console.log('PRODUCT FACT: RESOLVED / UNKNOWN / UNSUPPORTED')
console.log('DERIVED PRODUCT: SKETCH IDS ONLY; NO AUTHORITATIVE GEOMETRY')
console.log('ZERO_DIVIDER: SEMANTIC / NONPHYSICAL')
console.log('PERSISTED PRODUCT GEOMETRY: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
