import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const jointData = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const jointDomain = await readFile(new URL('../src/domain/profileJointGeometry.ts', import.meta.url), 'utf8')
const profileGeometry = await readFile(new URL('../src/domain/profileAwareGeometry.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const assemblyPanel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const assemblyCss = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const drawingViewport = await readFile(new URL('../src/components/useDrawingViewport.ts', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// PREDEPLOY_019_04C_VERIFIER_COMPAT
// 04C catalogue-pairing truth supersedes the historical 482.21 + 482.05 mullion pair.
assert.match(jointData, /PRELUDE_60_CATALOG_TRUTH_RESET_01/)
assert.match(jointData, /frame48230CalloutsMm: \[60, 64, 42\]/)
assert.match(jointData, /sash48205CalloutsMm: \[60, 78, 56\]/)
assert.match(jointData, /sash48218CalloutsMm: \[60, 78, 56\]/)
assert.match(jointData, /mullion48221CalloutsMm: \[60, 84, 40\]/)

assert.match(jointData, /jointKind: 'frame-sash'[\s\S]{0,700}supportProfileCode: '482\.30'[\s\S]{0,700}sashProfileCode: '482\.05'/)
assert.match(jointData, /supportRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01\.frame48230CalloutsMm/)
assert.match(jointData, /sashRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01\.sash48205CalloutsMm/)
assert.match(jointData, /page: 23[\s\S]{0,260}482\.30 \+ 482\.05 \+ 482\.15/)

assert.match(jointData, /jointKind: 'mullion-sash'[\s\S]{0,700}supportProfileCode: '482\.21'[\s\S]{0,700}sashProfileCode: '482\.18'/)
assert.match(jointData, /supportRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01\.mullion48221CalloutsMm/)
assert.match(jointData, /sashRawCalloutsMm: PRELUDE_60_CATALOG_TRUTH_RESET_01\.sash48218CalloutsMm/)
assert.match(jointData, /page: 25[\s\S]{0,260}482\.21 \+ 482\.18 \+ 482\.15/)
assert.doesNotMatch(jointData, /jointKind: 'mullion-sash'[\s\S]{0,700}supportProfileCode: '482\.21'[\s\S]{0,700}sashProfileCode: '482\.05'/)

assert.equal((jointData.match(/assemblyEvidenceStatus: 'sectional-drawing-uninterpreted'/g) ?? []).length, 2)
assert.equal((jointData.match(/\n\s+sashOverlapMm: null,/g) ?? []).length, 2)
assert.equal((jointData.match(/\n\s+sashInsetMm: null,/g) ?? []).length, 2)
assert.equal((jointData.match(/\n\s+glazingInsetMm: null,/g) ?? []).length, 2)
assert.doesNotMatch(jointData, /PRELUDE_60_REVIEWED_SASH_OVERLAP/)

assert.match(jointDomain, /PROFILE_JOINT_GEOMETRY_VERSION = 'profile-aware-joint-geometry-01'/)
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

assert.match(shell, /buildProfileJointGeometryReadModel/)
assert.match(app, /AssemblyReviewPanel/)
assert.match(assemblyPanel, /buildSystemJointVisualization/)
assert.match(assemblyPanel, /CustomJointDraft/)
assert.match(assemblyPanel, /AutomaticSystemAssemblyView/)
assert.match(assemblyCss, /assembly/)
assert.match(drawingViewport, /fit/i)
assert.match(drawingViewport, /zoom/i)

assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-joint-geometry01\.mjs/)
assert.equal(packageJson.scripts['test:profile-joint-geometry01'], 'node scripts/verify-profile-aware-joint-geometry01.mjs')

console.log('=== PROFILE-AWARE JOINT GEOMETRY 01 VERIFY PASS ===')
console.log('PRELUDE 60 FRAME PAIR: 482.30 + 482.05 / PAGE 23')
console.log('PRELUDE 60 MULLION PAIR: 482.21 + 482.18 / PAGE 25')
console.log('OLD 482.21 + 482.05 MULLION PAIR: NOT ACCEPTED')
console.log('SECTIONAL DRAWINGS: PAIRING EVIDENCE ONLY / UNINTERPRETED')
console.log('SASH OVERLAP / INSET / GLAZING INSET: UNKNOWN')
console.log('CONSTRUCTION GEOMETRY MUTATION: NO')
console.log('MACHINE READY: NO')
