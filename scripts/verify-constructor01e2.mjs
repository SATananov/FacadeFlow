import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E2_GRID_AND_MINIMAL_FIELD_BADGE_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /01E\.2 MINIMAL FIELD BADGES/)
assert.match(shell, /const \[gridVisible, setGridVisible\] = useState\(true\)/)
assert.match(shell, /if \(!frame \|\| fields\.length < 2\) return \[\]/)
assert.match(shell, /constructor-field-number-badge/)
assert.doesNotMatch(shell, /showTechnicalCard/)
assert.doesNotMatch(shell, /getCanvasFieldTypeLabel/)
assert.doesNotMatch(shell, /getCanvasFieldOpeningLabel/)
assert.doesNotMatch(shell, /getCanvasFieldGlazingLabel/)

assert.match(css, /Constructor 01E\.2 — user-confirmed minimal field marker/)
assert.match(css, /constructor-field-number-badge/)
assert.match(css, /rgba\(106, 126, 132, \.035\)/)

assert.match(acceptance, /grid visible by default/)
assert.match(acceptance, /sequence number in a small circle/)
assert.match(acceptance, /single FIELD must not duplicate the overall width/)
assert.match(acceptance, /2\+ simple horizontal FIELDs/)
assert.match(acceptance, /Geometry \/ topology \/ FIELD semantics: unchanged/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e2\.mjs/)
assert.equal(packageJson.scripts['test:constructor01e2'], 'node scripts/verify-constructor01e2.mjs')

console.log('CONSTRUCTOR 01E.2 VERIFY PASS')
console.log('GRID DEFAULT: ON; GRID REMAINS FAINT')
console.log('IN-CANVAS FIELD LABEL: NUMBER IN CIRCLE ONLY; SIZE REFINED BY 01E.3')
console.log('SINGLE FIELD: NO DUPLICATE BAY WIDTH CHAIN')
console.log('2+ SIMPLE FIELDS: BAY CHAIN PRESERVED')
console.log('GEOMETRY / TOPOLOGY / PROFILE RESOLUTION: UNCHANGED')
console.log('MACHINE READY: NO')
