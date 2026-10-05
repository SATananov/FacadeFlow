import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const profileSkill = await read('.ai/skills/profile-recognition/SKILL.md')
const profileRules = await read('.ai/skills/profile-recognition/PROFILE_IDENTIFICATION_RULES.md')
const profileEvidence = await read('.ai/skills/profile-recognition/EVIDENCE_RULES.md')
const profileSystems = await read('.ai/skills/profile-recognition/SYSTEM_CONTEXT_RULES.md')
const jointSkill = await read('.ai/skills/joint-knowledge/SKILL.md')
const jointEvidence = await read('.ai/skills/joint-knowledge/JOINT_EVIDENCE_RULES.md')
const jointTokens = await read('.ai/skills/joint-knowledge/RELATION_TOKEN_RULES.md')
const coreProfiles = await read('.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv')
const enrichedProfiles = await read('.ai/skills/profile-recognition/data/MASTER_PROFILES_ENRICHED.csv')
const systemSummary = await read('.ai/skills/profile-recognition/data/SYSTEM_SUMMARY.csv')
const standardTokens = await read('.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv')

assert.match(profileSkill, /CATALOGUE_VERIFIED[\s\S]*DATABASE_VERIFIED[\s\S]*HIGH_CONFIDENCE_MATCH[\s\S]*POSSIBLE_MATCH[\s\S]*UNRESOLVED/)
assert.match(profileSkill, /selected system[\s\S]*exact profile\/article code[\s\S]*role\/subtype[\s\S]*profileW\/profileZ/i)
assert.match(profileRules, /Never identify a profile purely because another profile has similar dimensions/i)
assert.match(profileEvidence, /Database evidence is not automatically catalogue truth/i)
assert.match(profileSystems, /PremiumPlast[\s\S]*LOCKED[\s\S]*UIUT-STIL[\s\S]*LOCKED/i)
assert.match(jointSkill, /CATALOGUE_VERIFIED[\s\S]*DATABASE_RULE_EVIDENCE[\s\S]*POSSIBLE[\s\S]*UNRESOLVED/)
assert.match(jointSkill, /cuttingang[\s\S]*notch contour[\s\S]*standardoperations/i)
assert.match(jointEvidence, /UNKNOWN/i)
assert.match(jointTokens, /SglobkaDelitel[\s\S]*POS\[\][\s\S]*MM1[\s\S]*MM4/)

const profile48220 = /Altest,482\.20,[^\n]*,Каса KMG 4к,[^\n]*,Каса,Frame,DATABASE_EVIDENCE/
const profile48221 = /Altest,482\.21,[^\n]*,Делител KMG 4к,[^\n]*,Делител,,DATABASE_EVIDENCE/
assert.match(coreProfiles, profile48220)
assert.match(coreProfiles, profile48221)
assert.match(enrichedProfiles, profile48220)
assert.match(enrichedProfiles, profile48221)
assert.match(enrichedProfiles, /Altest,482\.21,[^\n]*,84\.0,60\.0,[^\n]*,Делител,,DATABASE_EVIDENCE/)
assert.match(standardTokens, /Altest,BeamHorizontalKMG4k,PVC,L_Fr,19,SglobkaDelitel,POS\[\],0,MM1,,DATABASE_RULE_EVIDENCE/)
assert.match(standardTokens, /Altest,BeamHorizontalKMG4k,PVC,R_Fr,19,SglobkaDelitel,POS\[\],0,MM4,,DATABASE_RULE_EVIDENCE/)
assert.match(standardTokens, /Altest,BeamVerticalKMG4k,PVC,U_Fr,19,SglobkaDelitel,POS\[\],0,MM1,,DATABASE_RULE_EVIDENCE/)
assert.match(standardTokens, /Altest,BeamVerticalKMG4k,PVC,D_Fr,19,SglobkaDelitel,POS\[\],0,MM1,,DATABASE_RULE_EVIDENCE/)

assert.match(profileSkill, /UNKNOWN FACTS MUST REMAIN UNKNOWN/)
assert.match(jointSkill, /AUTOMATIC GEOMETRY = NO[\s\S]*RULES VALIDATED = NO[\s\S]*MACHINE READY = NO/)
assert.match(jointTokens, /do not prove notch, overlap, rebate, cutter, or machine geometry/i)
assert.match(systemSummary, /PremiumPlast,,,,,,,,,,LOCKED_MDB_PASSWORD/)
assert.match(systemSummary, /UIUT-STIL,,,,,,,,,,LOCKED_MDB_PASSWORD/)

const status = execFileSync('git', ['status', '--short'], { encoding: 'utf8' })
const reviewedReadOnlyRuntimeProjections = new Set([
  'src/data/profileSystems/profileKnowledge.ts',
  'src/data/profileSystems/knowledge/derivedProfileKnowledge.ts',
  'src/data/profileSystems/vivaplast.ts',
  'src/data/profileSystems/profilink16.ts',
])
const untrackedPaths = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean)
const addedPaths = status.split(/\r?\n/)
  .filter((entry) => /^(?: A|A )\s/.test(entry))
  .map((entry) => entry.slice(3))
const unexpectedRuntimeAdditions = [...untrackedPaths, ...addedPaths]
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => /^(?:src|public|dist)\//.test(path))
  .filter((path) => !reviewedReadOnlyRuntimeProjections.has(path))
assert.deepEqual(unexpectedRuntimeAdditions, [])
for (const text of [profileSkill, profileRules, profileEvidence, profileSystems, jointSkill, jointEvidence, jointTokens]) {
  assert.doesNotMatch(text, /SkyGlazing/i)
}

console.log('PROFILE RECOGNITION + JOINT KNOWLEDGE SKILLS 01 VERIFY PASS')
console.log('PROFILE RECOGNITION: PASS')
console.log('JOINT KNOWLEDGE: PASS')
console.log('KMG 482.20 LOOKUP: PASS')
console.log('KMG 482.21 LOOKUP: PASS')
console.log('SGLOBKADELITEL LOOKUP: PASS')
console.log('UNKNOWN-GEOMETRY GUARD: PASS')
console.log('LOCKED SYSTEM GUARD: PASS')
console.log('UNREVIEWED RUNTIME / GEOMETRY FILES: NONE')
