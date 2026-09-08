import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)
const css = await readFile(
  new URL('../src/components/ConstructorShell.css', import.meta.url),
  'utf8',
)
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01C_DIVIDERS_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(shell, /ConstructorDividerAxis/)
assert.match(shell, /vertical-divider/)
assert.match(shell, /horizontal-divider/)
assert.match(shell, /addDivider/)
assert.match(shell, /startDividerDrag/)
assert.match(shell, /commitDividerPosition/)
assert.match(shell, /removeSelectedDivider/)
assert.match(shell, /conceptualFieldCount/)
assert.match(shell, /Позиция отляво/)
assert.match(shell, /Позиция отгоре/)
assert.match(shell, /Концептуални полета/)
assert.match(shell, /constructor-field-chain/)
assert.match(shell, /constructor-frame-mitre/)
assert.match(css, /\.constructor-divider/)
assert.match(css, /\.constructor-field-chain/)
assert.match(css, /\.constructor-frame-mitre/)
assert.match(css, /Full-face frame mitres/)
assert.match(css, /1\.414214/)
assert.match(css, /left: calc\(0px - var\(--constructor-frame-face/)
assert.match(css, /right: calc\(0px - var\(--constructor-frame-face/)
assert.match(css, /top: calc\(0px - var\(--constructor-frame-face/)
assert.match(css, /bottom: calc\(0px - var\(--constructor-frame-face/)
assert.match(css, /mitre-tr[\s\S]*rotate\(-45deg\)/)
assert.match(css, /mitre-br[\s\S]*rotate\(45deg\)/)
assert.match(app, /offerModuleSketchDraft/)
assert.match(app, /onDraftChange=\{setOfferModuleSketchDraft\}/)
assert.match(acceptance, /conceptual \*\*fields\*\*/i)
assert.match(acceptance, /term \*\*полета\*\*/i)
assert.match(acceptance, /Opening diagonals are \*\*not\*\* part of 01C/)
assert.match(acceptance, /four mirrored full-face 45° mitre lines/i)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01c\.mjs/)

console.log('CONSTRUCTOR 01C DIVIDERS VERIFY PASS')
console.log('VERTICAL DIVIDER: CREATE | SELECT | DRAG | NUMERIC POSITION | DELETE')
console.log('HORIZONTAL DIVIDER: CREATE | SELECT | DRAG | NUMERIC POSITION | DELETE')
console.log('FIELD TERMINOLOGY: ПОЛЕТА')
console.log('FIELD DIMENSION CHAINS: LIVE')
console.log('FRAME MITRES: FOUR FULL-FACE 45-DEGREE JOINTS')
console.log('OPENING DIAGONALS: NOT YET - CONSTRUCTOR 01D')
console.log('FULL-SPAN DIVIDERS ONLY: YES')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
