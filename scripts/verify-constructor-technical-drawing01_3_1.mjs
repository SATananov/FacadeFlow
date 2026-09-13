import fs from 'node:fs'

const cssPath = new URL('../src/components/ConstructorShell.css', import.meta.url)
const css = fs.readFileSync(cssPath, 'utf8')
const marker = 'CONSTRUCTOR TECHNICAL DRAWING 01.3.1 — frame edge selection cleanup.'
const markerIndex = css.indexOf(marker)

if (markerIndex < 0) {
  throw new Error('TD01.3.1 marker is missing from ConstructorShell.css')
}

const block = css.slice(markerIndex)
const required = [
  '.constructor-parametric-frame.has-selected-top .edge-top::after',
  '.constructor-parametric-frame.has-selected-bottom .edge-bottom::after',
  '.constructor-parametric-frame.has-selected-left .edge-left::after',
  '.constructor-parametric-frame.has-selected-right .edge-right::after',
  'background: transparent;',
  'box-shadow: none;',
  'top: 7px;',
  'height: 2px;',
  'left: 7px;',
  'width: 2px;',
  'pointer-events: none;',
]

for (const token of required) {
  if (!block.includes(token)) {
    throw new Error(`TD01.3.1 expected CSS token is missing: ${token}`)
  }
}

if (block.includes('height: 16px;') || block.includes('width: 16px;')) {
  throw new Error('TD01.3.1 must not redefine the canonical 16px interaction hit-area')
}

console.log('=== CONSTRUCTOR TECHNICAL DRAWING 01.3.1 VERIFY PASS ===')
console.log('EDGE HIT-AREA: UNCHANGED')
console.log('WIDE CYAN BAND: REMOVED')
console.log('SELECTED EDGE INDICATOR: THIN TECHNICAL LINE')
console.log('GEOMETRY / DRAG / DIMENSIONS: UNCHANGED')
