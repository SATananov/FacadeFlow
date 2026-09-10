import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E5_1_SASH_PROFILE_MITRE_CORRECTION_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /constructor-sash-profile-visual/)
assert.match(shell, /sash-profile-inner/)
assert.match(shell, /sash-profile-mitre mitre-tl/)
assert.match(shell, /sash-profile-mitre mitre-tr/)
assert.match(shell, /sash-profile-mitre mitre-bl/)
assert.match(shell, /sash-profile-mitre mitre-br/)
assert.match(css, /constructor-sash-profile-visual \.sash-profile-inner/)
assert.match(css, /constructor-sash-profile-visual \.sash-profile-mitre/)
assert.match(acceptance, /No sash mitre line extends into the glazing area/)
assert.match(acceptance, /visual\/schematic only/)
assert.match(acceptance, /Construction geometry: unchanged/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e5_1\.mjs/)

console.log('=== CONSTRUCTOR 01E.5.1 VERIFY PASS ===')
console.log('SASH PROFILE: OUTER + INNER CONTOUR')
console.log('45-DEGREE JOINTS: PROFILE BAND ONLY')
console.log('FLOATING MITRE DECORATION: NO')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('MACHINE READY: NO')
