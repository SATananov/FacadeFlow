import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cssPath = path.join(root, 'src/components/ConstructorShell.css')
const packagePath = path.join(root, 'package.json')
const docPath = path.join(root, 'docs/CONSTRUCTOR_TECHNICAL_DRAWING_01_1_CANVAS_VISUAL_HIERARCHY_ACCEPTANCE.md')

const css = fs.readFileSync(cssPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const doc = fs.readFileSync(docPath, 'utf8')

const startMarker = '/* CONSTRUCTOR TECHNICAL DRAWING 01.1 — canvas & visual hierarchy.'
const start = css.indexOf(startMarker)
if (start < 0) throw new Error('TD01.1 CSS marker missing')
const endMarker = '/* CONSTRUCTOR TECHNICAL DRAWING 01.2 — sash & opening readability.'
const end = css.indexOf(endMarker, start + startMarker.length)
const block = css.slice(start, end >= 0 ? end : undefined)

const requiredCss = [
  '.constructor-workarea',
  '.constructor-canvas.has-grid',
  '.constructor-frame-visual',
  '.constructor-parametric-frame.is-selected .constructor-frame-visual',
  '.constructor-field-surface.is-fixed',
  '.constructor-field-surface.is-operable',
  '.constructor-divider > .constructor-divider-face',
  '.constructor-sash-profile-visual',
  '.constructor-operable-visual .opening-primary',
  '.constructor-field-number-badge',
]

for (const token of requiredCss) {
  if (!block.includes(token)) throw new Error(`TD01.1 missing visual token: ${token}`)
}

const forbiddenGeometryProperties = [
  /(^|\n)\s*(position|left|right|top|bottom|inset|width|height|min-width|max-width|min-height|max-height|transform|translate|z-index|overflow|clip-path|pointer-events)\s*:/i,
]
for (const pattern of forbiddenGeometryProperties) {
  if (pattern.test(block)) {
    throw new Error(`TD01.1 visual block contains a geometry/layout property: ${pattern}`)
  }
}

const forbiddenClaims = [
  'MACHINE READY = YES',
  'AUTOMATIC GEOMETRY = YES',
  'RULES VALIDATED = YES',
]
for (const claim of forbiddenClaims) {
  if (doc.includes(claim)) throw new Error(`TD01.1 acceptance contains forbidden readiness claim: ${claim}`)
}

if (pkg.scripts?.['test:technical-drawing01_1'] !== 'node scripts/verify-constructor-technical-drawing01_1.mjs') {
  throw new Error('TD01.1 npm script missing or changed')
}
if (!pkg.scripts?.['test:contract']?.includes('npm run test:technical-drawing01_1')) {
  throw new Error('TD01.1 is not included in test:contract')
}

console.log('=== CONSTRUCTOR TECHNICAL DRAWING 01.1 VERIFY PASS ===')
console.log('CANVAS: WHITE / QUIET GRID')
console.log('VISUAL HIERARCHY: FRAME -> DIVIDER -> SASH -> GLAZING -> OPENING SYMBOL')
console.log('GEOMETRY / TOPOLOGY / DOMAIN / PERSISTENCE: UNCHANGED BY TD01.1')
console.log('AUTOMATIC GEOMETRY = NO')
console.log('RULES VALIDATED = NO')
console.log('MACHINE READY = NO')
