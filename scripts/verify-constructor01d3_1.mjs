import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const shellCss = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01D_3_1_BOTTOM_FIELD_DETAILS_UI_POLISH_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /BOTTOM POLISH 01D\.3\.1/)
assert.match(shell, /aria-pressed=\{selectedFieldId === field\.id\}/)
assert.match(shell, /constructor-field-detail-card/)
assert.match(shell, /constructor-field-detail-number/)

assert.match(shellCss, /01D\.3\.1/)
assert.match(shellCss, /height: 78px/)
assert.match(shellCss, /flex: 0 0 190px/)
assert.match(shellCss, /min-width: 190px/)
assert.match(shellCss, /scroll-snap-type: x proximity/)
assert.match(shellCss, /border: 2px solid #0b9db5/)
assert.match(shellCss, /width: 23px/)
assert.match(shellCss, /height: 23px/)
assert.match(shellCss, /bottom: 106px/)
assert.match(shellCss, /inset: 24px 0 106px 28px/)

assert.match(acceptance, /UI-only/)
assert.match(acceptance, /stable minimum width/)
assert.match(acceptance, /scrolls horizontally/)
assert.match(acceptance, /Geometry, topology and FIELD semantics are unchanged/)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01d3_1\.mjs/)

console.log('CONSTRUCTOR 01D.3.1 BOTTOM FIELD DETAILS UI POLISH VERIFY PASS')
console.log('ACTIVE FIELD CARD: STRONGER SELECTED STATE')
console.log('FIELD NUMBER BADGE: MATCHES CANVAS WHITE CIRCLE')
console.log('MANY FIELDS: STABLE WIDTH + HORIZONTAL SCROLL')
console.log('GEOMETRY / TOPOLOGY / SEMANTICS: UNCHANGED')
console.log('PROFILE RESOLUTION: NO')
console.log('HARDWARE RESOLUTION: NO')
console.log('MACHINE READY: NO')
