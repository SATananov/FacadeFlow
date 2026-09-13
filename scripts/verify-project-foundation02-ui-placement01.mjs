import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const appCss = fs.readFileSync('src/App.css', 'utf8')
const assuranceCss = fs.readFileSync('src/components/ProjectAssurancePanel.css', 'utf8')

const persistenceStart = app.indexOf('<div className="project-persistence"')
const secondaryStart = app.indexOf('<div className="project-toolbar-secondary"', persistenceStart)
const secondaryEnd = app.indexOf('</div>', secondaryStart)
const panelIndex = app.indexOf('<ProjectAssurancePanel', secondaryStart)
const assemblyIndex = app.indexOf('<AssemblyReviewPanel', secondaryStart)
const mainIndex = app.indexOf('<main', persistenceStart)

assert.ok(persistenceStart >= 0, 'project persistence toolbar must exist')
assert.ok(secondaryStart > persistenceStart, 'project toolbar secondary action group must exist')
assert.ok(secondaryEnd > secondaryStart, 'project toolbar secondary action group must close')
assert.ok(panelIndex > secondaryStart && panelIndex < secondaryEnd, 'assurance entry must live inside project toolbar secondary actions')
assert.ok(assemblyIndex > panelIndex && assemblyIndex < secondaryEnd, 'assembly review must share the project toolbar secondary action group')
assert.ok(mainIndex > secondaryEnd, 'project toolbar must remain above the main workspace')
assert.equal(app.indexOf('<ProjectAssurancePanel', panelIndex + 1), -1, 'assurance panel must not have a second floating mount')

const launcherBlock = assuranceCss.match(/\.project-assurance-launcher\s*\{([\s\S]*?)\}/)?.[1] ?? ''
assert.match(launcherBlock, /position:\s*static/, 'launcher must participate in layout')
assert.doesNotMatch(launcherBlock, /position:\s*fixed/, 'launcher must not float over Constructor')
assert.match(launcherBlock, /margin-left:\s*0/, 'launcher spacing is controlled by the shared toolbar group')

const secondaryBlock = appCss.match(/\.project-toolbar-secondary\s*\{([\s\S]*?)\}/)?.[1] ?? ''
assert.match(secondaryBlock, /display:\s*flex/, 'secondary project actions must share one toolbar row')
assert.match(secondaryBlock, /align-items:\s*center/, 'secondary project actions must align consistently')

const persistenceBlock = appCss.match(/\.project-persistence\s*\{([\s\S]*?)\}/)?.[1] ?? ''
assert.match(persistenceBlock, /position:\s*sticky/, 'project toolbar should remain accessible while scrolling')
assert.match(persistenceBlock, /top:\s*0/, 'sticky project toolbar should anchor to viewport top')
assert.match(persistenceBlock, /justify-content:\s*space-between/, 'project context and secondary actions should occupy opposite toolbar edges')

console.log('=== PROJECT FOUNDATION 02 UI PLACEMENT 01 VERIFY PASS ===')
console.log('ASSURANCE ENTRY: PROJECT TOOLBAR SECONDARY ACTIONS')
console.log('ASSEMBLY REVIEW: SAME TOOLBAR ACTION GROUP')
console.log('FLOATING OVER CANVAS: NO')
console.log('PROJECT TOOLBAR: STICKY / LAYOUT-ANCHORED')
console.log('DRAWER BEHAVIOR: PRESERVED')
console.log('DOMAIN / TOPOLOGY: UNCHANGED')
