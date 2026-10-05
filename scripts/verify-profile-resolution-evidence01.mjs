import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const evidence = load('src/data/profileSystems/profileResolutionEvidence.ts')
const profiles = load('src/domain/profileResolution.ts')
const catalog = load('src/data/profileSystems/catalog.ts')

function evaluate(systemId, profileId, requestedRole) {
  const contextByRole = {
    frame: 'FRAME_ASSIGNMENT',
    sash: 'SASH_ASSIGNMENT',
    mullion: 'MULLION_ASSIGNMENT',
  }
  return evidence.evaluateProfileResolutionEvidence({
    systemId,
    profileId,
    requestedRole,
    context: contextByRole[requestedRole],
  })
}

const supportedCases = [
  ['kmg-prelude-60', '482.20', 'frame'],
  ['kmg-prelude-60', '482.21', 'mullion'],
  ['kmg-prelude-60', '482.05', 'sash'],
  ['kmg-prelude-60', '482.18', 'sash'],
  ['vivaplast', 'ГОЛ.КАСА 5522', 'frame'],
  ['profilink16', '130000049', 'sash'],
  ['schuco', 'SCH 19460', 'mullion'],
  ['baufen', '1607', 'frame'],
  ['weissprofil2018-113', '3001', 'frame'],
]
for (const [systemId, profileId, requestedRole] of supportedCases) {
  const result = evaluate(systemId, profileId, requestedRole)
  assert.equal(result.resolutionStatus, 'SUPPORTED_BY_DATABASE_ROLE')
  assert.equal(result.evidenceStatus, 'DATABASE_EVIDENCE')
  assert.equal(result.recognizedRole, requestedRole)
  assert.ok(result.unknowns.length > 0)
}

const frameAsMullion = evaluate('kmg-prelude-60', '482.20', 'mullion')
assert.equal(frameAsMullion.resolutionStatus, 'ROLE_MISMATCH')
assert.equal(frameAsMullion.recognizedRole, 'frame')
const mullionAsFrame = evaluate('kmg-prelude-60', '482.21', 'frame')
assert.equal(mullionAsFrame.resolutionStatus, 'ROLE_MISMATCH')
assert.equal(mullionAsFrame.recognizedRole, 'mullion')
assert.ok(frameAsMullion.reasons[0].includes('not mullion'))

const unknownProfile = evaluate('kmg-prelude-60', '482.20-dimension-match', 'frame')
assert.equal(unknownProfile.resolutionStatus, 'PROFILE_NOT_FOUND')
assert.equal(unknownProfile.evidenceStatus, 'UNKNOWN')
assert.equal(unknownProfile.recognizedRole, null)
const unknownSystem = evaluate('not-a-runtime-system', '482.20', 'frame')
assert.equal(unknownSystem.resolutionStatus, 'SYSTEM_NOT_FOUND')
assert.equal(unknownSystem.evidenceStatus, 'UNKNOWN')

assert.equal(evaluate('kmg-prelude-60', '482.20', 'sash').resolutionStatus, 'ROLE_MISMATCH')
assert.equal(evaluate('kmg-prelude-60', '482.05', 'mullion').resolutionStatus, 'ROLE_MISMATCH')

assert.equal(evaluate('kmg-prelude-60', '1607', 'frame').resolutionStatus, 'PROFILE_NOT_FOUND')
assert.equal(evaluate('baufen', '482.20', 'frame').resolutionStatus, 'PROFILE_NOT_FOUND')
assert.equal(evaluate('unmapped-profilinken', '130000049', 'sash').resolutionStatus, 'SYSTEM_NOT_FOUND')

const system = catalog.getProfileSystemById('kmg-prelude-60')
const before = profiles.createModuleProfileResolution(system.id)
const assigned = profiles.setFrameProfileAssignment(before, system, '482.20')
const evaluated = evaluate('kmg-prelude-60', '482.20', 'frame')
assert.equal(evaluated.resolutionStatus, 'SUPPORTED_BY_DATABASE_ROLE')
assert.deepEqual(assigned, { ...before, frame: { profileCode: '482.20', source: 'human' } })
assert.equal(assigned.dividers[0], undefined)

const evidenceSource = await readFile(new URL('../src/data/profileSystems/profileResolutionEvidence.ts', import.meta.url), 'utf8')
const assignmentSource = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
assert.doesNotMatch(evidenceSource, /setFrameProfileAssignment|setDividerProfileAssignment|setFieldSashProfileAssignment/)
assert.doesNotMatch(assignmentSource, /evaluateProfileResolutionEvidence|profileResolutionEvidence/)
for (const systemName of ['VivaPlast', 'Profilink16', 'Schuco', 'Baufen', 'WeissProfil']) {
  assert.doesNotMatch(evidenceSource, new RegExp(systemName, 'i'))
}
assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/persistence', 'src/hooks'], { encoding: 'utf8' }).trim(), '')

console.log('PROFILE RESOLUTION EVIDENCE 01 VERIFY PASS')
console.log('EXACT ROLE SUPPORT: PASS')
console.log('ROLE MISMATCH GUARD: PASS')
console.log('UNKNOWN PROFILE GUARD: PASS')
console.log('UNKNOWN SYSTEM GUARD: PASS')
console.log('MULTI-SYSTEM GENERIC LOOKUP: PASS')
console.log('DIMENSION-ONLY FALLBACK: ABSENT')
console.log('AUTOMATIC PROFILE SELECTION CHANGED: NO')
console.log('RUNTIME GEOMETRY BEHAVIOR CHANGED: NO')
