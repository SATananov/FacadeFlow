import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const evidence = load('src/data/profileSystems/profileResolutionEvidence.ts')
const profiles = load('src/domain/profileResolution.ts')
const catalog = load('src/data/profileSystems/catalog.ts')

const evaluate = (systemId, profileId, requestedRole, context) =>
  evidence.evaluateProfileResolutionEvidence({ systemId, profileId, requestedRole, context })

const supportedCases = [
  ['kmg-prelude-60', '482.20', 'frame', 'FRAME_ASSIGNMENT'],
  ['kmg-prelude-60', '482.21', 'mullion', 'MULLION_ASSIGNMENT'],
  ['kmg-prelude-60', '482.05', 'sash', 'SASH_ASSIGNMENT'],
  ['kmg-prelude-60', '482.18', 'sash', 'SASH_ASSIGNMENT'],
  ['vivaplast', 'ГОЛ.КАСА 5522', 'frame', 'FRAME_ASSIGNMENT'],
  ['profilink16', '130000049', 'sash', 'SASH_ASSIGNMENT'],
  ['schuco', 'SCH 19460', 'mullion', 'MULLION_ASSIGNMENT'],
  ['baufen', '1607', 'frame', 'FRAME_ASSIGNMENT'],
  ['weissprofil2018-113', '3001', 'frame', 'FRAME_ASSIGNMENT'],
]
for (const [systemId, profileId, requestedRole, context] of supportedCases) {
  const result = evaluate(systemId, profileId, requestedRole, context)
  assert.equal(result.resolutionStatus, 'SUPPORTED_BY_DATABASE_ROLE')
  assert.equal(result.context, context)
  assert.equal(result.requestedRole, requestedRole)
  assert.equal(result.recognizedRole, requestedRole)
  assert.equal(result.evidenceStatus, 'DATABASE_EVIDENCE')
  assert.ok(result.unknowns.length > 0)
}

assert.equal(evaluate('kmg-prelude-60', '482.20', 'mullion', 'MULLION_ASSIGNMENT').resolutionStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '482.21', 'frame', 'FRAME_ASSIGNMENT').resolutionStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '482.05', 'frame', 'FRAME_ASSIGNMENT').resolutionStatus, 'ROLE_MISMATCH')

const contradictoryRoleContext = evaluate('kmg-prelude-60', '482.20', 'frame', 'MULLION_ASSIGNMENT')
assert.equal(contradictoryRoleContext.resolutionStatus, 'CONTEXT_MISMATCH')
assert.equal(contradictoryRoleContext.recognizedRole, 'frame')
assert.match(contradictoryRoleContext.reasons[0], /contradicts context MULLION_ASSIGNMENT/)
const contradictoryMullionContext = evaluate('kmg-prelude-60', '482.21', 'mullion', 'FRAME_ASSIGNMENT')
assert.equal(contradictoryMullionContext.resolutionStatus, 'CONTEXT_MISMATCH')

const unknownProfile = evaluate('kmg-prelude-60', '482.20-dimension-match', 'frame', 'FRAME_ASSIGNMENT')
assert.equal(unknownProfile.resolutionStatus, 'PROFILE_NOT_FOUND')
assert.equal(unknownProfile.evidenceStatus, 'UNKNOWN')
const unknownSystem = evaluate('not-a-runtime-system', '482.20', 'frame', 'FRAME_ASSIGNMENT')
assert.equal(unknownSystem.resolutionStatus, 'SYSTEM_NOT_FOUND')
assert.equal(unknownSystem.evidenceStatus, 'UNKNOWN')

assert.equal(evaluate('kmg-prelude-60', '482.20', 'sash', 'SASH_ASSIGNMENT').resolutionStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '482.05', 'mullion', 'MULLION_ASSIGNMENT').resolutionStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '1607', 'frame', 'FRAME_ASSIGNMENT').resolutionStatus, 'PROFILE_NOT_FOUND')
assert.equal(evaluate('baufen', '482.20', 'frame', 'FRAME_ASSIGNMENT').resolutionStatus, 'PROFILE_NOT_FOUND')

const system = catalog.getProfileSystemById('kmg-prelude-60')
const resolution = profiles.createModuleProfileResolution(system.id)
const snapshot = JSON.stringify(resolution)
const supported = evaluate('kmg-prelude-60', '482.20', 'frame', 'FRAME_ASSIGNMENT')
assert.equal(supported.resolutionStatus, 'SUPPORTED_BY_DATABASE_ROLE')
assert.equal(JSON.stringify(resolution), snapshot)
const assigned = profiles.setFrameProfileAssignment(resolution, system, '482.20')
assert.equal(assigned.frame.profileCode, '482.20')
assert.equal(JSON.stringify(resolution), snapshot)

const evidenceSource = await readFile(new URL('../src/data/profileSystems/profileResolutionEvidence.ts', import.meta.url), 'utf8')
const assignmentSource = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
assert.doesNotMatch(evidenceSource, /setFrameProfileAssignment|setDividerProfileAssignment|setFieldSashProfileAssignment/)
assert.doesNotMatch(assignmentSource, /evaluateProfileResolutionEvidence|profileResolutionEvidence/)
for (const systemName of ['VivaPlast', 'Profilink16', 'Schuco', 'Baufen', 'WeissProfil']) {
  assert.doesNotMatch(evidenceSource, new RegExp(systemName, 'i'))
}
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('PROFILE RESOLUTION CONTEXT RULES 01 VERIFY PASS')
console.log('FRAME CONTEXT SUPPORT: PASS')
console.log('SASH CONTEXT SUPPORT: PASS')
console.log('MULLION CONTEXT SUPPORT: PASS')
console.log('ROLE MISMATCH GUARD: PASS')
console.log('CONTEXT MISMATCH GUARD: PASS')
console.log('UNKNOWN PROFILE GUARD: PASS')
console.log('UNKNOWN SYSTEM GUARD: PASS')
console.log('MULTI-SYSTEM GENERIC LOOKUP: PASS')
console.log('DIMENSION FALLBACK: ABSENT')
console.log('AUTOMATIC ASSIGNMENT CHANGED: NO')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
