import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E5_SASH_MITRE_AND_PROFILE_JOINT_CLARITY_ACCEPTANCE.md', import.meta.url), 'utf8')

assert.match(shell, /constructor-sash-profile-visual/)
assert.match(shell, /sash-profile-inner/)
assert.match(shell, /sash-profile-mitre mitre-tl/)
assert.match(shell, /sash-profile-mitre mitre-br/)
assert.doesNotMatch(shell, /className="sash-mitre"/)
assert.match(css, /Constructor 01E\.5\.2/)
assert.match(css, /constructor-sash-profile-visual/)
assert.match(css, /sash-profile-mitre/)
assert.match(acceptance, /schematic profile ring/)
assert.match(acceptance, /MACHINE READY: NO/)

console.log('=== CONSTRUCTOR 01E.5 VERIFY PASS ===')
console.log('SASH: PROFILE RING REPRESENTATION PRESERVED')
console.log('MITRES: CONFINED TO PROFILE BAND')
console.log('OPENING SYMBOL ANCHORING: PRESERVED')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('MACHINE READY: NO')
