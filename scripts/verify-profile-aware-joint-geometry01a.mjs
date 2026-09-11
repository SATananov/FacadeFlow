import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const prelude = await readFile(new URL('../src/data/profileSystems/prelude60.ts', import.meta.url), 'utf8')
const jointData = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const jointDomain = await readFile(new URL('../src/domain/profileJointGeometry.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const profileGeometry = await readFile(new URL('../src/domain/profileAwareGeometry.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_AWARE_JOINT_GEOMETRY_01A_PRELUDE60_REVIEWED_OVERLAP_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// Current reviewed catalogue callouts for the working PRELUDE 60 sash.
assert.match(prelude, /code: '482\.05'.*calloutsMm: \[60, 78, 56\]/)
assert.match(prelude, /code: '482\.18'.*calloutsMm: \[60, 78, 56\]/)
assert.match(prelude, /currentSeries60Source = 'KMG \/series 60mm\/'/)

// The reviewed 22 mm overlap must be derived consistently from all three faces.
assert.match(jointData, /frameOverallFaceMm: 64/)
assert.match(jointData, /frameVisibleFaceMm: 42/)
assert.match(jointData, /frameCoveredZoneMm: 22/)
assert.match(jointData, /sashOverallFaceMm: 78/)
assert.match(jointData, /sashVisibleFaceMm: 56/)
assert.match(jointData, /sashOverlapZoneMm: 22/)
assert.match(jointData, /mullionOverallFaceMm: 84/)
assert.match(jointData, /mullionVisibleCenterMm: 40/)
assert.match(jointData, /mullionSideZoneMm: 22/)
assert.match(jointData, /overlapMm: 22/)
assert.equal(64 - 42, 22)
assert.equal(78 - 56, 22)
assert.equal((84 - 40) / 2, 22)

assert.equal((jointData.match(/assemblyEvidenceStatus: 'catalogue-overlap-reviewed'/g) ?? []).length, 2)
assert.equal((jointData.match(/sashOverlapMm: PRELUDE_60_REVIEWED_SASH_OVERLAP\.overlapMm/g) ?? []).length, 2)
assert.equal((jointData.match(/sashInsetMm: null/g) ?? []).length, 2)
assert.equal((jointData.match(/glazingInsetMm: null/g) ?? []).length, 2)
assert.match(jointData, /jointKind: 'frame-sash'[\s\S]*supportProfileCode: '482\.30'[\s\S]*sashProfileCode: '482\.05'/)
assert.match(jointData, /jointKind: 'mullion-sash'[\s\S]*supportProfileCode: '482\.21'[\s\S]*sashProfileCode: '482\.05'/)
assert.match(jointData, /front-elevation sash\/support overlap/)
assert.match(jointData, /productionGeometryApproved: false/)
assert.match(jointData, /machineReady: false/)

// 22 mm is visible in the read model, but does not unlock full assembly geometry.
assert.match(jointDomain, /assemblyEvidenceStatus === 'human-confirmed-assembly'/)
assert.match(jointDomain, /evidenceRule\.sashInsetMm !== null/)
assert.match(jointDomain, /evidenceRule\.glazingInsetMm !== null/)
assert.match(jointDomain, /sashOverlapMm: evidenceRule\.sashOverlapMm/)
assert.match(jointDomain, /reviewedOverlapCount/)
assert.match(jointDomain, /mutatesConstructionGeometry: false/)
assert.match(jointDomain, /machineReady: false/)

// The existing renderer remains gated by human-confirmed profile geometry.
assert.match(profileGeometry, /assigned\.sashOverlap\.status === 'human-confirmed'/)
assert.match(profileGeometry, /assigned\.glazingInset\.status === 'human-confirmed'/)
assert.match(profileGeometry, /UNRESOLVED — крилото остава schematic/)

// Bulgarian inspector exposes partial evidence without claiming the whole joint is ready.
assert.match(shell, /ЗАСТЪПВАНЕ ПОТВЪРДЕНО/)
assert.match(shell, /прегледано застъпване/)
assert.match(shell, /точните inset и glazing inset/)
assert.match(shell, /profileJointGeometry\.reviewedOverlapCount/)
assert.match(shell, /ЗАСТЪПВАНЕ \{profileJointGeometry\.reviewedOverlapCount\}/)

assert.match(acceptance, /64 - 42 = 22 mm/)
assert.match(acceptance, /78 - 56 = 22 mm/)
assert.match(acceptance, /\(84 - 40\) \/ 2 = 22 mm/)
assert.match(acceptance, /sashInsetMm.*UNKNOWN/)
assert.match(acceptance, /glazingInsetMm.*UNKNOWN/)
assert.match(acceptance, /Constructor geometry mutation: \*\*NO\*\*/)
assert.match(acceptance, /MACHINE READY: \*\*NO\*\*/)

assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-joint-geometry01a\.mjs/)
assert.equal(packageJson.scripts['test:profile-joint-geometry01a'], 'node scripts/verify-profile-aware-joint-geometry01a.mjs')

console.log('=== PROFILE-AWARE JOINT GEOMETRY 01A VERIFY PASS ===')
console.log('PRELUDE 60 REVIEWED FRONT-ELEVATION OVERLAP: 22 mm')
console.log('FRAME 482.30: 64 - 42 = 22 mm')
console.log('SASH 482.05: 78 - 56 = 22 mm')
console.log('MULLION 482.21: (84 - 40) / 2 = 22 mm PER SIDE')
console.log('SASH INSET / GLAZING INSET: UNKNOWN')
console.log('CONSTRUCTOR GEOMETRY MUTATION: NO')
console.log('PROFILE-AWARE SASH GEOMETRY: STILL GATED')
console.log('BOM / CUT LIST / MACHINE: NO')
console.log('MACHINE READY: NO')
