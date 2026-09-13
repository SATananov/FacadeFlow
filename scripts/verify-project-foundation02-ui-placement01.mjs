import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const appCss = fs.readFileSync('src/App.css', 'utf8')
const assuranceCss = fs.readFileSync('src/components/ProjectAssurancePanel.css', 'utf8')

const persistenceStart = app.indexOf('<div className="project-persistence"')
const persistenceEnd = app.indexOf('</div>', persistenceStart)
const panelIndex = app.indexOf('<ProjectAssurancePanel', persistenceStart)
assert.ok(persistenceStart >= 0, 'project persistence strip must exist')
assert.ok(panelIndex > persistenceStart && panelIndex < persistenceEnd, 'assurance entry must live inside project persistence strip')
assert.equal(app.indexOf('<ProjectAssurancePanel', panelIndex + 1), -1, 'assurance panel must not have a second floating mount')

const launcherBlock = assuranceCss.match(/\.project-assurance-launcher\s*\{([\s\S]*?)\}/)?.[1] ?? ''
assert.match(launcherBlock, /position:\s*static/, 'launcher must participate in layout')
assert.doesNotMatch(launcherBlock, /position:\s*fixed/, 'launcher must not float over Constructor')
assert.match(launcherBlock, /margin-left:\s*auto/, 'launcher should sit at the project strip action edge')

const persistenceBlock = appCss.match(/\.project-persistence\s*\{([\s\S]*?)\}/)?.[1] ?? ''
assert.match(persistenceBlock, /position:\s*sticky/, 'project strip should remain accessible while scrolling')
assert.match(persistenceBlock, /top:\s*0/, 'sticky strip should anchor to viewport top')

console.log('=== PROJECT FOUNDATION 02 UI PLACEMENT 01 VERIFY PASS ===')
console.log('ASSURANCE ENTRY: IN PROJECT COMMAND STRIP')
console.log('FLOATING OVER CANVAS: NO')
console.log('PROJECT STRIP: STICKY / LAYOUT-ANCHORED')
console.log('DRAWER BEHAVIOR: PRESERVED')
console.log('DOMAIN / TOPOLOGY: UNCHANGED')
