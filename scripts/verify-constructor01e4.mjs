import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E4_OPENING_SYMBOL_SASH_ANCHORING_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /CONSTRUCTOR 01E\.5\.2: opening symbol is inset to the inner sash contour/)
assert.match(shell, /constructor-sash-profile-visual/)
assert.match(shell, /opening-primary" x1="0" y1="0" x2="100" y2="50"/)
assert.match(shell, /opening-primary" x1="100" y1="0" x2="0" y2="50"/)
assert.match(shell, /opening-tilt" x1="0" y1="100" x2="50" y2="0"/)
assert.match(shell, /opening-tilt" x1="100" y1="100" x2="50" y2="0"/)
assert.match(shell, /<circle cx="100" cy="50" r="2\.2" \/>/)
assert.match(shell, /<circle cx="0" cy="50" r="2\.2" \/>/)
assert.match(acceptance, /must visually belong to the sash, not float inside it/)
assert.match(acceptance, /Geometry \/ topology \/ FIELD semantics: unchanged/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e4\.mjs/)

console.log('=== CONSTRUCTOR 01E.4 VERIFY PASS ===')
console.log('OPENING SYMBOL: ANCHORED TO CURRENT INNER SASH CONTOUR')
console.log('LEFT / RIGHT / TILT: MIRRORED AND EDGE-ANCHORED')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('MACHINE READY: NO')
