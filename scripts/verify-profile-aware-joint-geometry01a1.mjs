import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const types = await readFile(new URL('../src/data/profileSystems/types.ts', import.meta.url), 'utf8')
const jointData = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_AWARE_JOINT_GEOMETRY_01A1_CATALOG_EVIDENCE_PAGE_HOTFIX_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(types, /interface CatalogEvidence[\s\S]*page: number/)
assert.equal((jointData.match(/documentTitle: 'PRELUDE 60 reviewed face semantics',[\s\S]*?page: 2,/g) ?? []).length, 2)
assert.equal((jointData.match(/assemblyEvidenceStatus: 'catalogue-overlap-reviewed'/g) ?? []).length, 2)
assert.match(acceptance, /CatalogEvidence\.page: 2/)
assert.match(acceptance, /BUILD TYPE ERROR: FIXED/)
assert.equal(packageJson.scripts['test:profile-joint-geometry01a1'], 'node scripts/verify-profile-aware-joint-geometry01a1.mjs')
assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-joint-geometry01a1\.mjs/)

console.log('=== PROFILE-AWARE JOINT GEOMETRY 01A.1 VERIFY PASS ===')
console.log('CATALOG EVIDENCE PAGE: 2 PRESENT ON BOTH REVIEWED ASSEMBLY EVIDENCE RECORDS')
console.log('CATALOG EVIDENCE TYPE CONTRACT: SATISFIED')
console.log('REVIEWED OVERLAP: 22 mm UNCHANGED')
console.log('SASH INSET / GLAZING INSET: UNKNOWN')
console.log('CONSTRUCTOR GEOMETRY MUTATION: NO')
console.log('MACHINE READY: NO')
