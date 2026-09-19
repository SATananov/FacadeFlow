import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const prelude = await readFile(new URL('../src/data/profileSystems/prelude60.ts', import.meta.url), 'utf8')
const jointData = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const jointDomain = await readFile(new URL('../src/domain/profileJointGeometry.ts', import.meta.url), 'utf8')
const profileGeometry = await readFile(new URL('../src/domain/profileAwareGeometry.ts', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// PREDEPLOY_019_04C_VERIFIER_COMPAT
assert.match(prelude, /code: '482\.05'[\s\S]*calloutsMm: \[60, 78, 56\]/)
assert.match(prelude, /code: '482\.18'[\s\S]*calloutsMm: \[60, 78, 56\]/)
assert.match(jointData, /frame48230CalloutsMm: \[60, 64, 42\]/)
assert.match(jointData, /sash48205CalloutsMm: \[60, 78, 56\]/)
assert.match(jointData, /sash48218CalloutsMm: \[60, 78, 56\]/)
assert.match(jointData, /mullion48221CalloutsMm: \[60, 84, 40\]/)
assert.match(jointData, /frameSashOverlapMm: null/)
assert.match(jointData, /mullionSashOverlapMm: null/)
assert.match(jointData, /Arithmetic differences between component callouts are not assembly evidence\./)

assert.equal((jointData.match(/assemblyEvidenceStatus: 'sectional-drawing-uninterpreted'/g) ?? []).length, 2)
assert.equal((jointData.match(/assemblyEvidenceStatus: 'catalogue-overlap-reviewed'/g) ?? []).length, 0)
assert.equal((jointData.match(/assemblyEvidenceStatus: 'component-cross-sections-only'/g) ?? []).length, 0)
assert.equal((jointData.match(/\n\s+sashOverlapMm: null,/g) ?? []).length, 2)
assert.equal((jointData.match(/\n\s+sashInsetMm: null,/g) ?? []).length, 2)
assert.equal((jointData.match(/\n\s+glazingInsetMm: null,/g) ?? []).length, 2)
assert.match(jointData, /page: 23[\s\S]{0,260}482\.30 \+ 482\.05 \+ 482\.15/)
assert.match(jointData, /page: 25[\s\S]{0,260}482\.21 \+ 482\.18 \+ 482\.15/)
assert.doesNotMatch(jointData, /jointKind: 'mullion-sash'[\s\S]{0,700}supportProfileCode: '482\.21'[\s\S]{0,700}sashProfileCode: '482\.05'/)
assert.doesNotMatch(jointData, /PRELUDE_60_REVIEWED_SASH_OVERLAP/)

assert.match(jointDomain, /assemblyEvidenceStatus === 'human-confirmed-assembly'/)
assert.match(jointDomain, /evidenceRule\.sashOverlapMm !== null/)
assert.match(jointDomain, /evidenceRule\.sashInsetMm !== null/)
assert.match(jointDomain, /evidenceRule\.glazingInsetMm !== null/)
assert.match(jointDomain, /status: resolved \? 'resolved' : 'assembly-evidence-required'/)
assert.match(jointDomain, /mutatesConstructionGeometry: false/)
assert.match(jointDomain, /machineReady: false/)

assert.match(profileGeometry, /assigned\.sashOverlap\.status === 'human-confirmed'/)
assert.match(profileGeometry, /assigned\.glazingInset\.status === 'human-confirmed'/)
assert.match(profileGeometry, /UNRESOLVED/)

assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-joint-geometry01a\.mjs/)
assert.equal(packageJson.scripts['test:profile-joint-geometry01a'], 'node scripts/verify-profile-aware-joint-geometry01a.mjs')

console.log('=== PROFILE-AWARE JOINT GEOMETRY 01A VERIFY PASS ===')
console.log('HISTORICAL 22 mm OVERLAP ASSUMPTION: SUPERSEDED')
console.log('FRAME 482.30 + SASH 482.05: SECTION PAGE 23 / UNINTERPRETED GEOMETRY')
console.log('MULLION 482.21 + SASH 482.18: SECTION PAGE 25 / UNINTERPRETED GEOMETRY')
console.log('OLD MULLION 482.21 + SASH 482.05: NOT CATALOGUE-PAIRED')
console.log('SASH OVERLAP / INSET / GLAZING INSET: UNKNOWN')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
