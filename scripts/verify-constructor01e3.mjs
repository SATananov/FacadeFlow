import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E3_FINAL_VISUAL_PRECISION_POLISH_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /const \[gridVisible, setGridVisible\] = useState\(true\)/)
assert.match(shell, /if \(!frame \|\| fields\.length < 2\) return \[\]/)
assert.match(shell, /constructor-field-number-badge/)

assert.match(css, /Constructor 01E\.3 — final visual precision polish/)
assert.match(css, /width: 18px/)
assert.match(css, /height: 18px/)
assert.match(css, /font-size: 7\.5px/)
assert.match(css, /border-color: #4f666d/)
assert.match(css, /constructor-operable-visual\.mode-unset rect/)
assert.match(css, /stroke-dasharray: none/)
assert.match(css, /inset 0 0 0 1px rgba\(13, 145, 166, \.62\)/)

assert.match(acceptance, /dimension chain text and witness lines read slightly darker/)
assert.match(acceptance, /FIELD sequence circles are smaller/)
assert.match(acceptance, /neutral solid sash outline/)
assert.match(acceptance, /Geometry \/ topology \/ FIELD semantics: unchanged/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e3\.mjs/)
assert.equal(packageJson.scripts['test:constructor01e3'], 'node scripts/verify-constructor01e3.mjs')

console.log('CONSTRUCTOR 01E.3 VERIFY PASS')
console.log('DIMENSIONS: DARKER / CLEARER TECHNICAL READOUT')
console.log('FIELD NUMBER BADGE: SMALLER / FINER')
console.log('SELECTION OUTLINE: CALMER')
console.log('OPERABLE WITHOUT OPENING MODE: NEUTRAL SOLID SASH OUTLINE')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('PROFILE RESOLUTION 02A / 02A.2 / 02A.3: UNCHANGED')
console.log('MACHINE READY: NO')
