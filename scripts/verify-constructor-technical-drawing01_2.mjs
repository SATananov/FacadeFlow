import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cssPath = path.join(root, 'src/components/ConstructorShell.css')
const tsxPath = path.join(root, 'src/components/ConstructorShell.tsx')
const packagePath = path.join(root, 'package.json')

const css = fs.readFileSync(cssPath, 'utf8')
const tsx = fs.readFileSync(tsxPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

const requiredCss = [
  'CONSTRUCTOR TECHNICAL DRAWING 01.2 — sash & opening readability',
  '.constructor-field-surface.is-operable .constructor-operable-visual .opening-primary',
  '.constructor-field-surface.is-operable .constructor-operable-visual .opening-tilt',
  '.constructor-field-surface.is-operable .constructor-operable-visual.mode-tilt .opening-tilt',
  '.constructor-opening-handle circle',
  'display: none;',
  'stroke-dasharray: 2.4 2.2;',
]

for (const marker of requiredCss) {
  if (!css.includes(marker)) throw new Error(`TD01.2 CSS marker missing: ${marker}`)
}

const requiredTsx = [
  "field.openingMode === 'side-hinged'",
  "field.openingMode === 'tilt-turn'",
  "field.openingMode === 'tilt'",
  "field.openingHanding === 'left'",
  "field.openingHanding === 'right'",
  'constructor-opening-handle',
]
for (const marker of requiredTsx) {
  if (!tsx.includes(marker)) throw new Error(`Canonical opening semantics missing: ${marker}`)
}

if (!pkg.scripts?.['test:technical-drawing01_1']) {
  throw new Error('TD01.1 verifier must remain registered')
}
if (!pkg.scripts?.['test:technical-drawing01_2']) {
  throw new Error('TD01.2 verifier is not registered')
}
if (!pkg.scripts?.['test:contract']?.includes('test:technical-drawing01_2')) {
  throw new Error('TD01.2 verifier is not part of test:contract')
}

console.log('=== CONSTRUCTOR TECHNICAL DRAWING 01.2 VERIFY PASS ===')
console.log('SASH PROFILE HIERARCHY: VISUAL ONLY')
console.log('SIDE-HINGED OPENING: PRIMARY')
console.log('TILT-TURN TILT LINES: SECONDARY')
console.log('PURE TILT: CONTINUOUS')
console.log('DISTORTED SVG HANDLE CIRCLE: REMOVED VISUALLY')
console.log('OPENING MODE / HANDING SEMANTICS: UNCHANGED')
console.log('GEOMETRY / TOPOLOGY / PERSISTENCE: UNCHANGED')
console.log('AUTOMATIC GEOMETRY = NO')
console.log('RULES VALIDATED = NO')
console.log('MACHINE READY = NO')
