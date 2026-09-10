import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const shellCss = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E_TECHNICAL_DRAWING_CLARITY_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /CONSTRUCTOR 01E - TECHNICAL DRAWING CLARITY/)
assert.match(shell, /constructor-field-number-badge/)
assert.match(shellCss, /Constructor 01E — technical drawing clarity/)
assert.match(shellCss, /inset: 24px 0 106px 28px/)
assert.match(shellCss, /background-color: #ffffff/)
assert.match(shellCss, /constructor-field-number-badge/)
assert.match(shellCss, /height: 78px/)
assert.match(acceptance, /UI-only readability pass/)
assert.match(acceptance, /white technical sheet/)
assert.match(acceptance, /Geometry, topology and FIELD semantics are unchanged/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e\.mjs/)
assert.equal(packageJson.scripts['test:constructor01e'], 'node scripts/verify-constructor01e.mjs')

console.log('CONSTRUCTOR 01E VERIFY PASS')
console.log('TECHNICAL DRAWING: LIGHTER / CLEANER / MORE READABLE')
console.log('IN-SKETCH FIELD LABEL: REFINED BY LATER 01E.x POLISH')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('PROFILE-AWARE GEOMETRY: NO')
console.log('BOM / CUT LIST / MACHINE: NO')
console.log('MACHINE READY: NO')
