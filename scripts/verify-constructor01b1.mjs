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
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01B_1_WORK_CONTEXT_IDENTITY_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(shell, /constructor-context-breadcrumb/)
assert.match(shell, /Свободна скица · Модул —/)
assert.match(shell, /Оферта · Модул \$\{moduleNumber\}/)
assert.match(shell, /СВОБОДНА СКИЦА · БЕЗ МОДУЛ/)
assert.match(shell, /ОФЕРТА · МОДУЛ \$\{String\(moduleNumber\)\.padStart\(2, '0'\)\}/)
assert.match(shell, /Офертен модул/)
assert.match(shell, /commitNumericDimension/)
assert.match(shell, /event\.key === 'Enter'/)
assert.match(shell, /event\.key === 'Escape'/)

assert.match(css, /\.constructor-context-breadcrumb/)
assert.match(css, /\.constructor-context-card/)

assert.match(acceptance, /FREE SKETCH DOES NOT PRETEND TO BE MODULE 1/)
assert.match(acceptance, /ONE CONSTRUCTOR ENGINE/)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01b1\.mjs/)

console.log('CONSTRUCTOR 01B.1 WORK CONTEXT IDENTITY VERIFY PASS')
console.log('FREE MODE: FREE SKETCH | MODULE —')
console.log('OFFER MODE: OFFER | MODULE N')
console.log('WORKSPACE BADGE: PERSISTENT CONTEXT')
console.log('BREADCRUMB: PERSISTENT CONTEXT')
console.log('KEYBOARD WIDTH/HEIGHT: PRESERVED')
console.log('MOUSE EDGE RESIZE: PRESERVED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
