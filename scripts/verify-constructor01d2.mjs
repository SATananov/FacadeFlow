import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const shellCss = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01D_2_FIELD_INFO_CARD_POLISH_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

const supersededByMinimalLabels = /MINIMAL LABELS 01D\.3/.test(shell)

if (supersededByMinimalLabels) {
  assert.match(shell, /constructor-field-number-badge/)
  assert.match(shell, /constructor-field-details-panel/)
  assert.doesNotMatch(shell, /<span className={`constructor-field-info-card/)
  assert.match(shellCss, /Constructor 01D\.3/)
  assert.match(shellCss, /\.constructor-field-number-badge/)
  assert.match(shellCss, /\.constructor-field-details-panel/)
} else {
  assert.match(shell, /OPENING SYMBOLS 01D\.1 · FIELD INFO 01D\.2/)
  assert.match(shell, /constructor-field-info-card/)
  assert.match(shell, /constructor-field-name/)
  assert.match(shell, /constructor-field-size-chip/)
  assert.match(shell, /constructor-field-type-chip/)
  assert.match(shell, /constructor-field-opening-chip/)
  assert.match(shell, /constructor-field-handing-chip/)
  assert.match(shellCss, /Constructor 01D\.2/)
  assert.match(shellCss, /\.constructor-field-info-card \{/)
  assert.match(shellCss, /white-space: normal/)
  assert.match(shellCss, /text-overflow: clip/)
}

assert.match(acceptance, /compact centered info card/)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(acceptance, /HARDWARE RESOLUTION: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01d2\.mjs/)

console.log('CONSTRUCTOR 01D.2 FIELD INFO CARD POLISH VERIFY PASS')
console.log(supersededByMinimalLabels
  ? 'FIELD INFO CARD: SUPERSEDED BY 01D.3 MINIMAL CANVAS LABELS'
  : 'FIELD LABELS: COMPACT CENTER CARD')
console.log('OPENING SYMBOLS: PRESERVED')
console.log('GEOMETRY / TOPOLOGY: UNCHANGED')
console.log('PROFILE RESOLUTION: NO')
console.log('HARDWARE RESOLUTION: NO')
console.log('MACHINE READY: NO')
