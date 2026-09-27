import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /const homeSavedProjects = !hasActiveProject/, 'home saved-project shortlist must exist only when no project is active')
assert.match(app, /\.slice\(0, 3\)/, 'home shortlist must stay compact at three projects')
assert.match(app, /empty-home-saved-projects/, 'home must render the saved-project shortcut section')
assert.match(app, /Запазени проекти/, 'saved projects must have a clear Bulgarian heading')
assert.match(app, /Продължете директно от проекта, който ви трябва\./, 'home must explain the direct continuation action')
assert.match(app, /resumeStoredOffer\(project\.id\)/, 'each saved project must continue the selected stored offer directly')
assert.match(app, /Още .* „Отвори проект“ горе/, 'projects outside the compact shortlist must remain discoverable')
assert.doesNotMatch(app, /Използвайте „Отвори проект“ горе, за да изберете кой да продължите\./, 'old detour-only multiple-project message must be removed')
assert.match(css, /\.empty-home-saved-projects\s*\{/, 'saved project section styling must exist')
assert.match(css, /\.empty-home-saved-project\s*\{/, 'saved project card styling must exist')

console.log('HOME SAVED PROJECTS 01: PASS')
console.log('Direct saved-project continuation: PASS')
console.log('Compact shortlist: PASS')
console.log('Project-dialog fallback for additional projects: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
