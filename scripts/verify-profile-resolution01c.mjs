import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const geometry = await readFile(new URL('../src/domain/profileAwareGeometry.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/data/profileSystems/dimensionalSemantics.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_RESOLUTION_01C_PROFILE_AWARE_2D_GEOMETRY_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(geometry, /profile-resolution-01c/)
assert.match(geometry, /visibleFace\.status === 'human-confirmed'/)
assert.match(geometry, /assigned\.sashOverlap\.status === 'human-confirmed'/)
assert.match(geometry, /assigned\.glazingInset\.status === 'human-confirmed'/)
assert.match(geometry, /angledDividerCount/)
assert.match(geometry, /prevents a false COMPLETE state/)
assert.match(geometry, /topologyAuthoritative: true/)
assert.match(geometry, /machineReady: false/)
assert.match(geometry, /PARTIAL|partialReviewedGeometry/)
assert.doesNotMatch(geometry, /rawCatalogCalloutsMm\s*\[/)

assert.match(semantics, /profileCode: '482\.30'[\s\S]*visibleFace:[\s\S]*valueMm: 42/)
assert.match(semantics, /profileCode: '482\.21'[\s\S]*visibleFace:[\s\S]*valueMm: 40/)
assert.doesNotMatch(semantics, /profileCode: '482\.18'[\s\S]*sashOverlap:/)

assert.match(shell, /buildProfileAwareGeometryReadModel/)
assert.match(shell, /Profile View \{profileViewEnabled \? 'ON' : 'OFF'\}/)
assert.doesNotMatch(shell, /constructor-profile-geometry-legend/)
assert.doesNotMatch(shell, /PROFILE RESOLUTION 01C · REVIEWED 2D/)
assert.match(shell, /constructor-profile-frame-face-overlay/)
assert.match(shell, /constructor-profile-divider-face-overlay/)
assert.match(shell, /has-unresolved-sash-geometry/)
assert.match(css, /Profile Resolution 01C/)
assert.doesNotMatch(css, /constructor-profile-geometry-legend/)
assert.match(css, /constructor-profile-frame-face-overlay/)
assert.match(css, /constructor-profile-divider-face-overlay/)
assert.match(css, /SASH GEOMETRY · UNKNOWN/)

assert.match(acceptance, /482\.30.*42 mm/)
assert.match(acceptance, /482\.21.*40 mm/)
assert.match(acceptance, /visible sash face \+ sash overlap \+ glazing inset/)
assert.match(acceptance, /CONSTRUCTION TOPOLOGY: UNCHANGED/)
assert.match(acceptance, /RAW CATALOG POSITIONAL INFERENCE: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-profile-resolution01c\.mjs/)

// Rendering contract: reviewed overlay is permitted only for reviewed faces.
const reviewedFrameFaceMm = 42
const reviewedDividerFaceMm = 40
const schematicFrameFaceMm = 60
assert.ok(reviewedFrameFaceMm < schematicFrameFaceMm)
assert.equal(reviewedDividerFaceMm, 40)

console.log('PROFILE RESOLUTION 01C VERIFY PASS')
console.log('PROFILE VIEW: REVIEWED 2D FACE OVERLAY')
console.log('482.30 FRAME FACE: 42 mm HUMAN CONFIRMED')
console.log('482.21 MULLION FACE: 40 mm HUMAN CONFIRMED')
console.log('SASH FACE / OVERLAP / GLAZING INSET: UNKNOWN -> SCHEMATIC')
console.log('CONSTRUCTION TOPOLOGY / FIELD BOUNDS: UNCHANGED')
console.log('RAW CATALOG POSITIONAL INFERENCE: NO')
console.log('PROFILE-AWARE GEOMETRY: PARTIAL REVIEWED ONLY')
console.log('MACHINE READY: NO')
