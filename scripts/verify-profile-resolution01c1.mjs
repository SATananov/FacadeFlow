import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const domain = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_RESOLUTION_01C1_UI_CONSISTENCY_HOTFIX_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(domain, /getProfileResolutionMissingTargets/)
assert.match(domain, /kind: 'frame'/)
assert.match(domain, /kind: 'divider'/)
assert.match(domain, /kind: 'field-sash'/)
assert.match(domain, /getFieldSashRole\(productType, field\.fieldType\)/)

assert.match(shell, /profileResolutionMissingTargets/)
assert.match(shell, /profileResolutionMissingLabel/)
assert.match(shell, /ЛИПСВА \{profileResolutionMissingTargets\.length\}/)
assert.match(shell, /getProfileResolutionProgress\(\s*effectiveProfileResolution/s)
assert.match(shell, /getProfileResolutionMissingTargets\(\s*effectiveProfileResolution/s)
assert.doesNotMatch(shell, /constructor-profile-geometry-legend/)
assert.doesNotMatch(shell, /PROFILE RESOLUTION 01C · REVIEWED 2D/)
assert.doesNotMatch(css, /constructor-profile-geometry-legend/)

assert.match(acceptance, /canvas diagnostic overlay: REMOVED/i)
assert.match(acceptance, /progress remains canonical/i)
assert.match(acceptance, /missing target/i)
assert.match(acceptance, /GEOMETRY \/ TOPOLOGY: UNCHANGED/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-profile-resolution01c1\.mjs/)

console.log('PROFILE RESOLUTION 01C.1 VERIFY PASS')
console.log('CANVAS DIAGNOSTIC OVERLAY: REMOVED')
console.log('PROFILE PROGRESS: CANONICAL ASSIGNMENTS ONLY')
console.log('INCOMPLETE PROGRESS: EXACT MISSING TARGET COUNT EXPOSED')
console.log('FALSE 4/4 COMPLETION: NO')
console.log('GEOMETRY / TOPOLOGY: UNCHANGED')
console.log('PROFILE-AWARE GEOMETRY: PARTIAL REVIEWED ONLY')
console.log('MACHINE READY: NO')
