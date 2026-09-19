import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const dims = await readFile(new URL('../src/data/profileSystems/dimensionalSemantics.ts', import.meta.url), 'utf8')
const joints = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const domain = await readFile(new URL('../src/domain/profileAwareSashGeometry.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// PREDEPLOY_019_04C_VERIFIER_COMPAT
assert.match(dims, /profileCode: '482\.05'[\s\S]*visibleFace:[\s\S]*valueMm: 56/)
assert.match(dims, /profileCode: '482\.18'[\s\S]*visibleFace:[\s\S]*valueMm: 56/)
assert.doesNotMatch(dims, /PRELUDE_60_REVIEWED_SASH_OVERLAP/)
assert.equal((joints.match(/assemblyEvidenceStatus: 'sectional-drawing-uninterpreted'/g) ?? []).length, 2)
assert.equal((joints.match(/\n\s+sashOverlapMm: null,/g) ?? []).length, 2)
assert.equal((joints.match(/\n\s+glazingInsetMm: null,/g) ?? []).length, 2)
assert.match(joints, /sashProfileCode: '482\.18'/)
assert.doesNotMatch(joints, /jointKind: 'mullion-sash'[\s\S]{0,700}supportProfileCode: '482\.21'[\s\S]{0,700}sashProfileCode: '482\.05'/)

assert.match(domain, /PROFILE_AWARE_SASH_GEOMETRY_VERSION = 'profile-aware-sash-geometry-01'/)
assert.match(domain, /boundary\.sashOverlapMm === null/)
assert.match(domain, /'missing-reviewed-overlap'/)
assert.match(domain, /assemblyEvidenceStatus !== 'catalogue-overlap-reviewed'/)
assert.match(domain, /assemblyEvidenceStatus !== 'human-confirmed-assembly'/)
assert.match(domain, /glazingInsetMm: null/)
assert.match(domain, /frontElevationOnly: true/)
assert.match(domain, /mutatesConstructionGeometry: false/)
assert.match(domain, /machineReady: false/)

assert.match(shell, /buildProfileAwareSashGeometryReadModel/)
assert.match(shell, /has-unresolved-sash-geometry/)
assert.match(shell, /constructor-reviewed-sash-placement/)
assert.match(css, /constructor-reviewed-sash-placement/)

assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-sash-geometry01\.mjs/)
assert.equal(packageJson.scripts['test:profile-sash-geometry01'], 'node scripts/verify-profile-aware-sash-geometry01.mjs')

await import('./verify-profile-aware-sash-geometry01-runtime.mjs')

console.log('=== PROFILE-AWARE SASH GEOMETRY 01 VERIFY PASS ===')
console.log('SASH 482.05 / 482.18 VISIBLE FACE: 56 mm REVIEWED')
console.log('482.21 + 482.05 DIVIDER BOUNDARY: UNSUPPORTED / FAIL-CLOSED')
console.log('482.21 + 482.18 PAIRING: CATALOGUE SECTION PRESENT, GEOMETRY UNINTERPRETED')
console.log('SASH PLACEMENT: FAIL-CLOSED / UNRESOLVED')
console.log('GLAZING INSET / GLASS CUT: UNKNOWN')
console.log('MACHINE READY: NO')
