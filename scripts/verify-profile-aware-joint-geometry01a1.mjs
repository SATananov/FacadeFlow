import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const types = await readFile(new URL('../src/data/profileSystems/types.ts', import.meta.url), 'utf8')
const jointData = await readFile(new URL('../src/data/profileSystems/jointSemantics.ts', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// PREDEPLOY_019_04C_VERIFIER_COMPAT
assert.match(types, /interface CatalogEvidence[\s\S]*page: number/)
assert.equal((jointData.match(/documentTitle: 'KMG PVC Profiles Systems'/g) ?? []).length, 4)
assert.equal((jointData.match(/page: 2,/g) ?? []).length, 4)
assert.equal((jointData.match(/\n\s+assemblyEvidence:/g) ?? []).length, 2)
assert.equal((jointData.match(/documentTitle: 'Altest PRELUDE 60 · актуален системен каталог'/g) ?? []).length, 2)
assert.equal((jointData.match(/assemblyEvidenceStatus: 'sectional-drawing-uninterpreted'/g) ?? []).length, 2)
assert.equal((jointData.match(/assemblyEvidenceStatus: 'catalogue-overlap-reviewed'/g) ?? []).length, 0)
assert.equal((jointData.match(/\n\s+sashOverlapMm: null,/g) ?? []).length, 2)
assert.match(jointData, /page: 23[\s\S]{0,260}482\.30 \+ 482\.05 \+ 482\.15/)
assert.match(jointData, /page: 25[\s\S]{0,260}482\.21 \+ 482\.18 \+ 482\.15/)
assert.match(jointData, /componentEvidence:/)
assert.match(packageJson.scripts['test:contract'], /verify-profile-aware-joint-geometry01a1\.mjs/)
assert.equal(packageJson.scripts['test:profile-joint-geometry01a1'], 'node scripts/verify-profile-aware-joint-geometry01a1.mjs')

console.log('=== PROFILE-AWARE JOINT GEOMETRY 01A.1 VERIFY PASS ===')
console.log('COMPONENT EVIDENCE: PAGE 2')
console.log('SECTIONAL PAIRING EVIDENCE: PAGES 23 + 25')
console.log('SECTIONAL GEOMETRY AUTHORITY: UNINTERPRETED')
console.log('ASSEMBLY OVERLAP EVIDENCE: NOT CREATED')
console.log('SASH OVERLAP / INSET / GLAZING INSET: UNKNOWN')
console.log('MACHINE READY: NO')
