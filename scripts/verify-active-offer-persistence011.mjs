import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const hook = fs.readFileSync(new URL('../src/hooks/useProjectWorkspace.ts', import.meta.url), 'utf8')
const storage = fs.readFileSync(new URL('../src/persistence/localProjectStorage.ts', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

// Starting an empty project must not overwrite the last meaningful active-project pointer.
assert.match(hook, /const session: ProjectSession = \{ snapshot: next, hydrated: true, blocked: false, detached: true, status: 'unsaved'/,
  'new blank projects must stay detached until meaningful content exists')
assert.match(storage, /if \(!session\.hydrated \|\| session\.blocked \|\| session\.detached\) return session/,
  'detached blank projects must not be persisted as the startup project')

// A saved project must be openable directly into offer setup without creating a new project.
assert.match(hook, /const loadProject = \(id: string, screen\?: ProjectSnapshot\['workspace'\]\['screen'\]\) =>/,
  'project loading must support an explicit safe target screen')
assert.match(hook, /const openProjectForOffer = \(id: string\) => loadProject\(id, 'offer-setup'\)/,
  'saved offer recovery must open the stored project itself')
assert.match(hook, /saveNow, newProject, openProject, openProjectForOffer, deleteProject/,
  'offer recovery API must be exposed by the workspace hook')

// Empty in-memory state with one saved meaningful project gets one-click recovery.
assert.match(app, /const recoverableProjects = workspace\.projects\.filter/,
  'home must inspect saved projects when the in-memory project is empty')
assert.match(app, /const singleRecoverableProject = !hasActiveProject && recoverableProjects\.length === 1/,
  'one unambiguous saved project must be recoverable directly')
assert.match(app, /const resumeStoredOffer = \(projectId: string\) =>[\s\S]*workspace\.openProjectForOffer\(projectId\)/,
  'recovery must open the existing stored project, not start a new one')
assert.match(app, /if \(singleRecoverableProject\) \{[\s\S]*resumeStoredOffer\(singleRecoverableProject\.id\)[\s\S]*return/,
  'primary offer action must recover the single stored offer before creating anything new')
assert.match(app, /Върни се към офертата/, 'toolbar must surface recovery when active state is empty')
assert.match(app, /Запазени проекти/, 'home must explain that saved work is available through the saved-project shortlist')
assert.match(app, /empty-home-saved-projects/, 'multiple saved offers must remain directly discoverable on Home')
assert.match(app, /resumeStoredOffer\(project\.id\)/, 'saved-project cards must reopen the selected stored offer directly')
assert.match(css, /\.empty-home-recovery\s*\{/, 'recovery prompt must be intentionally styled')

// Recovery step is derived from the loaded snapshot, including modules.
assert.match(app, /const getStoredOfferStep = \(snapshot: ProjectSnapshot\): 1 \| 2 \| 3 \| 4 =>/,
  'reopened offers must resolve their actual workflow step')
assert.match(app, /storedOffer\.setupStage === 'modules' \|\| getOfferModules\(snapshot\)\.length > 0\) return 4/,
  'stored offer with modules must reopen at Modules')

assert.doesNotMatch(app, /AUTOMATIC GEOMETRY:\s*YES/i)
assert.doesNotMatch(app, /RULES VALIDATED:\s*YES/i)
assert.doesNotMatch(app, /MACHINE READY:\s*YES/i)

console.log('ACTIVE OFFER PERSISTENCE 01.1: PASS')
console.log('Blank new project overwrites last active pointer: NO')
console.log('Single saved offer one-click recovery: PASS')
console.log('Recovery creates a new project: NO')
console.log('Stored module offer returns to Modules: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
