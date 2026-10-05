import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const knowledge = load('src/data/profileSystems/profileKnowledge.ts')
const knowledgeData = load('src/data/profileSystems/knowledge/derivedProfileKnowledge.ts')
const catalog = load('src/data/profileSystems/catalog.ts')

const targetSystems = [
  'VivaPlast',
  'Profilink16',
  'ProfilinkEN',
  'Baufen',
  'Schuco',
  'WeissProfil2018_113',
]
const unmappedSystems = targetSystems.filter((systemPackage) => systemPackage !== 'VivaPlast')
const mappedPackages = { VivaPlast: 'vivaplast', Profilink16: 'profilink16', Schuco: 'schuco', Baufen: 'baufen' }
const lockedSystems = ['PremiumPlast', 'UIUT-STIL']
const structuralRoles = new Set(['Frame', 'Wing', 'Mullion', 'Flying mullion'])
const rows = knowledgeData.derivedProfileEvidenceRows
const imported = rows.filter((row) => targetSystems.includes(row.sourceSystem))
const vivaRows = imported.filter((row) => row.sourceSystem === 'VivaPlast')
const profilink16Rows = imported.filter((row) => row.sourceSystem === 'Profilink16')
const schucoRows = imported.filter((row) => row.sourceSystem === 'Schuco')
const baufenRows = imported.filter((row) => row.sourceSystem === 'Baufen')

assert.equal(new Set(imported.map((row) => row.sourceSystem)).size, targetSystems.length)
assert.ok(imported.length >= targetSystems.length * 3)
assert.ok(vivaRows.every((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED' && row.systemId === 'vivaplast'))
assert.ok(profilink16Rows.filter((row) => ['1330000056', '130000049', '311007'].includes(row.profileId)).every((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED' && row.systemId === 'profilink16'))
assert.ok(schucoRows.filter((row) => ['SCH 19411', 'SCH 19431', 'SCH 19460'].includes(row.profileId)).every((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED' && row.systemId === 'schuco'))
assert.ok(baufenRows.filter((row) => ['1607', '1608', '1632'].includes(row.profileId)).every((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED' && row.systemId === 'baufen'))
assert.ok(imported.filter((row) => unmappedSystems.includes(row.sourceSystem) && !Object.hasOwn(mappedPackages, row.sourceSystem)).every((row) => row.runtimeMappingStatus === 'RUNTIME_UNMAPPED'))
assert.ok(imported.filter((row) => unmappedSystems.includes(row.sourceSystem) && !Object.hasOwn(mappedPackages, row.sourceSystem)).every((row) => !('systemId' in row)))
assert.ok(imported.every((row) => structuralRoles.has(row.roleEn)))
assert.ok(imported.every((row) => row.profileName !== undefined))
assert.ok(imported.every((row) => row.sourcePath.endsWith('MASTER_CORE_PROFILES.csv')))

for (const systemPackage of lockedSystems) {
  assert.equal(rows.some((row) => row.sourceSystem === systemPackage), false)
}

const duplicateArticleRows = imported.filter((row) => row.profileId === '130000049')
assert.equal(new Set(duplicateArticleRows.map((row) => row.sourceSystem)).size, 2)
assert.equal(knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', '130000049'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('unmapped-profilink16', '130000049'), undefined)
assert.equal(knowledge.getProfileKnowledgeEvidence('profilink16', '130000049').sourceSystem, 'Profilink16')

const mappedRows = rows.filter((row) => row.runtimeMappingStatus === 'RUNTIME_MAPPED')
for (const row of mappedRows) {
  assert.equal(knowledgeData.hasDerivedProfileEvidenceConflict(row.systemId, row.profileId), false)
}
assert.equal(knowledgeData.hasDerivedProfileEvidenceConflict('kmg-prelude-60', '482.20'), false)

assert.equal(knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', '482.20').profileId, '482.20')
assert.equal(knowledge.getProfileKnowledgeEvidence('kmg-prelude-60', '482.21').profileId, '482.21')

for (const systemPackage of unmappedSystems.filter((systemPackage) => !Object.hasOwn(mappedPackages, systemPackage))) {
  assert.equal(catalog.getProfileSystemById(systemPackage), undefined)
}

assert.deepEqual(knowledge.getDividerJointKnowledgeEvidence({
  systemId: 'kmg-prelude-60',
  dividerProfileId: '130000049',
  dividerAxis: 'horizontal',
}), [])
assert.equal(knowledgeData.derivedDividerJointContexts.every((context) => context.systemId === 'kmg-prelude-60'), true)

const shellSource = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const adapterSource = await readFile(new URL('../src/data/profileSystems/profileKnowledge.ts', import.meta.url), 'utf8')
for (const systemPackage of [...targetSystems, ...lockedSystems]) {
  assert.doesNotMatch(shellSource, new RegExp(systemPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(adapterSource, new RegExp(systemPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

const changedDomainFiles = await import('node:child_process').then(({ execFileSync }) =>
  execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(),
)
assert.equal(changedDomainFiles, '')

console.log('PROFILE KNOWLEDGE DATASET 02 VERIFY PASS')
console.log(`STRUCTURAL IMPORTED SYSTEMS: ${targetSystems.join(', ')}`)
console.log(`STRUCTURAL RECORDS: ${imported.length}`)
console.log('RUNTIME MAPPED RECORDS: KMG PRELUDE 60, VivaPlast, Profilink16, Schuco, Baufen')
console.log('RUNTIME UNMAPPED RECORDS: PASS')
console.log('DUPLICATE-ID COLLISION GUARD: PASS')
console.log('EVIDENCE CONFLICT GUARD: PASS')
console.log('LOCKED SYSTEM GUARD: PASS')
console.log('MISSING-JOINT-EVIDENCE GUARD: PASS')
console.log('GEOMETRY/DOMAIN/PERSISTENCE BEHAVIOR CHANGED: NO')
