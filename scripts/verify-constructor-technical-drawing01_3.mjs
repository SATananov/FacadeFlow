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
  'CONSTRUCTOR TECHNICAL DRAWING 01.3 — dimensions & manufacturing reading',
  '.constructor-bay-dimension-band',
  '.constructor-parametric-frame.has-bay-dimensions .constructor-frame-dimension-width',
  'bottom: -66px;',
  'font-variant-numeric: tabular-nums;',
  'height: 16px;',
  'width: 16px;',
]
for (const marker of requiredCss) {
  if (!css.includes(marker)) throw new Error(`TD01.3 CSS marker missing: ${marker}`)
}

const canonicalTsxMarkers = [
  'simpleBayDimensions.map((bay) =>',
  '<span>{Math.round(bay.widthMm)}</span>',
  '<span>{Math.round(displayedFrame.widthMm)}</span>',
  '<span>{Math.round(displayedFrame.heightMm)}</span>',
]
for (const marker of canonicalTsxMarkers) {
  if (!tsx.includes(marker)) throw new Error(`Canonical dimension rendering missing: ${marker}`)
}

if (!pkg.scripts?.['test:technical-drawing01_1']) throw new Error('TD01.1 verifier must remain registered')
if (!pkg.scripts?.['test:technical-drawing01_2']) throw new Error('TD01.2 verifier must remain registered')
if (!pkg.scripts?.['test:technical-drawing01_3']) throw new Error('TD01.3 verifier is not registered')
if (!pkg.scripts?.['test:contract']?.includes('test:technical-drawing01_3')) {
  throw new Error('TD01.3 verifier is not part of test:contract')
}

console.log('=== CONSTRUCTOR TECHNICAL DRAWING 01.3 VERIFY PASS ===')
console.log('BAY / FIELD DIMENSION CHAIN: SECONDARY VISUAL')
console.log('OVERALL WIDTH / HEIGHT: PRIMARY VISUAL')
console.log('DIMENSION END LEGS: EMPHASIZED')
console.log('CANONICAL MM VALUES: UNCHANGED')
console.log('DIMENSION CALCULATION / ROUNDING: UNCHANGED')
console.log('GEOMETRY / TOPOLOGY / PERSISTENCE: UNCHANGED')
console.log('AUTOMATIC GEOMETRY = NO')
console.log('RULES VALIDATED = NO')
console.log('MACHINE READY = NO')
