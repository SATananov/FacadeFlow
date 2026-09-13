import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cssPath = path.join(root, 'src/components/ConstructorShell.css')
const tsxPath = path.join(root, 'src/components/ConstructorShell.tsx')
const packagePath = path.join(root, 'package.json')
const acceptancePath = path.join(root, 'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_4_HUMAN_ACCEPTANCE_POLISH.md')

const css = fs.readFileSync(cssPath, 'utf8')
const tsx = fs.readFileSync(tsxPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const acceptance = fs.readFileSync(acceptancePath, 'utf8')

const priorCssMarkers = [
  'CONSTRUCTOR TECHNICAL DRAWING 01.1',
  'CONSTRUCTOR TECHNICAL DRAWING 01.2',
  'CONSTRUCTOR TECHNICAL DRAWING 01.3 — dimensions & manufacturing reading',
  'CONSTRUCTOR TECHNICAL DRAWING 01.3.1 — frame edge selection cleanup.',
]
for (const marker of priorCssMarkers) {
  if (!css.includes(marker)) throw new Error(`TD01.4 prior visual layer marker missing: ${marker}`)
}

const priorArtifacts = [
  'scripts/verify-constructor-technical-drawing01_1.mjs',
  'scripts/verify-constructor-technical-drawing01_2.mjs',
  'scripts/verify-constructor-technical-drawing01_3.mjs',
  'scripts/verify-constructor-technical-drawing01_3_1.mjs',
  'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_1_CANVAS_VISUAL_HIERARCHY_ACCEPTANCE.md',
  'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_2_SASH_OPENING_READABILITY_ACCEPTANCE.md',
  'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_3_DIMENSIONS_MANUFACTURING_READING_ACCEPTANCE.md',
  'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_3_1_FRAME_EDGE_SELECTION_CLEANUP_ACCEPTANCE.md',
]
for (const rel of priorArtifacts) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`TD01.4 required prior acceptance artifact missing: ${rel}`)
}

const scripts = pkg.scripts ?? {}
const expectedScripts = {
  'test:technical-drawing01_1': 'node scripts/verify-constructor-technical-drawing01_1.mjs',
  'test:technical-drawing01_2': 'node scripts/verify-constructor-technical-drawing01_2.mjs',
  'test:technical-drawing01_3': 'node scripts/verify-constructor-technical-drawing01_3.mjs',
  'test:technical-drawing01_3_1': 'node scripts/verify-constructor-technical-drawing01_3_1.mjs',
  'test:technical-drawing01_4': 'node scripts/verify-constructor-technical-drawing01_4.mjs',
}
for (const [name, command] of Object.entries(expectedScripts)) {
  if (scripts[name] !== command) throw new Error(`TD01.4 npm script missing or changed: ${name}`)
}
for (const name of Object.keys(expectedScripts)) {
  if (!scripts['test:contract']?.includes(`npm run ${name}`)) {
    throw new Error(`TD01.4 full contract chain does not include: ${name}`)
  }
}

const requiredAcceptance = [
  'ACCEPTANCE-ONLY CHECKPOINT',
  'HUMAN ACCEPTANCE: PASS',
  'CONSTRUCTOR TECHNICAL DRAWING 01: ACCEPTED',
  'RUNTIME / UI SOURCE CHANGES: NONE',
  'GEOMETRY / TOPOLOGY: UNCHANGED',
  'DIMENSION VALUES / CALCULATIONS: UNCHANGED',
  'AUTOMATIC GEOMETRY = NO',
  'RULES VALIDATED = NO',
  'MACHINE READY = NO',
]
for (const token of requiredAcceptance) {
  if (!acceptance.includes(token)) throw new Error(`TD01.4 acceptance token missing: ${token}`)
}

const forbiddenClaims = [
  'AUTOMATIC GEOMETRY = YES',
  'RULES VALIDATED = YES',
  'MACHINE READY = YES',
]
for (const claim of forbiddenClaims) {
  if (acceptance.includes(claim)) throw new Error(`TD01.4 forbidden readiness claim: ${claim}`)
}

if (css.includes('CONSTRUCTOR TECHNICAL DRAWING 01.4')) {
  throw new Error('TD01.4 is acceptance-only and must not add a runtime CSS layer')
}
if (tsx.includes('CONSTRUCTOR TECHNICAL DRAWING 01.4')) {
  throw new Error('TD01.4 is acceptance-only and must not add Constructor TSX runtime logic')
}

console.log('=== CONSTRUCTOR TECHNICAL DRAWING 01.4 VERIFY PASS ===')
console.log('CHECKPOINT TYPE: ACCEPTANCE-ONLY')
console.log('HUMAN ACCEPTANCE: PASS')
console.log('TD01.1 / TD01.2 / TD01.3 / TD01.3.1: REGRESSION-REGISTERED')
console.log('RUNTIME / UI SOURCE CHANGES: NONE BY TD01.4')
console.log('CONSTRUCTOR TECHNICAL DRAWING 01: ACCEPTED')
console.log('AUTOMATIC GEOMETRY = NO')
console.log('RULES VALIDATED = NO')
console.log('MACHINE READY = NO')
