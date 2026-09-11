import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const dims = await readFile(new URL('../src/data/profileSystems/dimensionalSemantics.ts', import.meta.url), 'utf8')
const joints = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const domain = await readFile(new URL('../src/domain/profileAwareSashGeometry.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_AWARE_SASH_GEOMETRY_01_PRELUDE60_REVIEWED_PLACEMENT_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(dims, /profileCode: '482\.05'[\s\S]*visibleFace:[\s\S]*PRELUDE_60_REVIEWED_SASH_OVERLAP\.sashVisibleFaceMm/)
assert.match(dims, /profileCode: '482\.05'[\s\S]*sashOverlap:[\s\S]*PRELUDE_60_REVIEWED_SASH_OVERLAP\.overlapMm/)
assert.match(joints, /sashVisibleFaceMm: 56/)
assert.match(joints, /overlapMm: 22/)
assert.match(joints, /glazingInsetMm: null/)

assert.match(domain, /PROFILE_AWARE_SASH_GEOMETRY_VERSION = 'profile-aware-sash-geometry-01'/)
assert.match(domain, /assemblyEvidenceStatus !== 'catalogue-overlap-reviewed'/)
assert.match(domain, /reviewedVisibleFaceMm/)
assert.match(domain, /centerMm \+ faceMm \/ 2/)
assert.match(domain, /centerMm - faceMm \/ 2/)
assert.match(domain, /frame\.widthMm - faceMm/)
assert.match(domain, /frame\.heightMm - faceMm/)
assert.match(domain, /innerProfileBoundsMm/)
assert.match(domain, /glazingInsetMm: null/)
assert.match(domain, /frontElevationOnly: true/)
assert.match(domain, /mutatesConstructionGeometry: false/)
assert.match(domain, /machineReady: false/)

assert.match(shell, /buildProfileAwareSashGeometryReadModel/)
assert.match(shell, /constructor-reviewed-sash-placement/)
assert.match(shell, /ПРЕГЛЕДАНА ПРЕДНА ГЕОМЕТРИЯ НА КРИЛОТО/)
assert.match(shell, /Glazing inset \/ glass cut: НЕИЗВЕСТНО/)
assert.match(css, /PROFILE-AWARE SASH GEOMETRY 01/)
assert.match(css, /--constructor-reviewed-sash-face/)
assert.match(css, /has-reviewed-sash-placement \.constructor-sash-profile-visual/)

assert.match(acceptance, /482\.30.*42 mm/)
assert.match(acceptance, /482\.21.*40 mm/)
assert.match(acceptance, /482\.05.*56 mm/)
assert.match(acceptance, /22 mm per side/)
assert.match(acceptance, /glazingInsetMm.*UNKNOWN/)
assert.match(acceptance, /Construction topology \/ FIELD bounds: \*\*UNCHANGED\*\*/)
assert.match(acceptance, /MACHINE READY: \*\*NO\*\*/)

assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-sash-geometry01\.mjs/)
assert.equal(packageJson.scripts['test:profile-sash-geometry01'], 'node scripts/verify-profile-aware-sash-geometry01.mjs')

// Preserve the source contracts above and require executable geometry/render
// regressions to pass in both the standalone verifier and npm run verify.
await import('./verify-profile-aware-sash-geometry01-runtime.mjs')

console.log('=== PROFILE-AWARE SASH GEOMETRY 01 VERIFY PASS ===')
console.log('PRELUDE 60 SASH 482.05 VISIBLE FACE: 56 mm REVIEWED')
console.log('FRAME 482.30 / MULLION 482.21 SUPPORT FACES: REVIEWED')
console.log('FRONT-ELEVATION OVERLAP: 22 mm EVIDENCE-BOUND')
console.log('SASH OUTER PLACEMENT: REVIEWED SUPPORT-FACE GEOMETRY')
console.log('GLAZING INSET / GLASS CUT: UNKNOWN')
console.log('CONSTRUCTION TOPOLOGY / FIELD BOUNDS: UNCHANGED')
console.log('POLYGON / ANGLED SASH GEOMETRY: DEFERRED')
console.log('MACHINE READY: NO')
