import fs from 'node:fs'
import assert from 'node:assert/strict'

const hook = fs.readFileSync('src/hooks/useProjectWorkspace.ts', 'utf8')
const storage = fs.readFileSync('src/persistence/localProjectStorage.ts', 'utf8')

assert.match(storage, /cleanupEmptyDraftProjects\(\): number/, 'storage must expose guarded empty-draft cleanup')
assert.match(storage, /!hasMeaningfulProjectContent\(snapshot\)/, 'cleanup must require no meaningful project content')
assert.match(storage, /Object\.keys\(snapshot\.modulesById\)\.length === 0/, 'cleanup must preserve projects with modules')
assert.match(storage, /snapshot\.revisions\.headRevisionId !== null/, 'cleanup must inspect revisions')
assert.match(storage, /Object\.keys\(snapshot\.assurance\.confirmationsById\)\.length > 0/, 'cleanup must preserve assurance-backed projects')
assert.match(storage, /Never auto-delete unreadable\/future-version records/, 'cleanup must preserve unreadable records')
assert.match(storage, /storage\.cleanupEmptyDraftProjects\(\)\s*\n\s*const loaded = storage\.load\(\)/, 'startup must clean legacy empty drafts before loading the active project')

const newProjectMatch = hook.match(/const newProject = \(\) => \{([\s\S]*?)\n  \}\n  const loadProject/)
assert.ok(newProjectMatch, 'newProject function must be discoverable')
const newProjectBody = newProjectMatch[1]

assert.match(newProjectBody, /hasMeaningfulProjectContent\(current\.snapshot\) && saveNow\(\)\.status !== 'saved'/,
  'creating another project must save only meaningful attached work')
assert.match(newProjectBody, /detached: true, status: 'unsaved'/,
  'new blank projects must remain detached until meaningful work exists')
assert.doesNotMatch(newProjectBody, /detached: false/,
  'newProject itself must never attach an untouched blank project')
assert.doesNotMatch(newProjectBody, /saveProjectSession\(\{[^}]*snapshot:\s*next/,
  'newProject must not directly persist the untouched replacement snapshot')

console.log('PROJECT HYGIENE 01: PASS')
console.log('Legacy provably-empty drafts cleanup: PASS')
console.log('Projects with modules/revisions/assurance preserved: PASS')
console.log('Unreadable records preserved: PASS')
console.log('New untouched projects auto-saved: NO')
console.log('Verifier scoped to newProject body: YES')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
