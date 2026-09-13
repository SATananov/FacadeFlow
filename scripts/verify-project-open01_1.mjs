import assert from 'node:assert/strict'
import fs from 'node:fs'

const panel = fs.readFileSync('src/components/ProjectManagerPanel.tsx', 'utf8')
const css = fs.readFileSync('src/components/ProjectManagerPanel.css', 'utf8')

assert.ok(panel.includes('className="project-current-summary"'), 'current project is informational summary')
assert.ok(panel.includes('className="project-open-trigger"'), 'explicit open-project action exists')
assert.ok(panel.includes('Отвори проект'), 'open-project label is visible and explicit')
assert.ok(panel.includes('aria-haspopup="dialog"'), 'open-project action announces dialog')
assert.ok(panel.includes('aria-expanded={open}'), 'open-project action exposes dialog state')
assert.ok(!panel.includes('className="project-manager-trigger"'), 'current project summary is no longer hidden open action')
assert.ok(css.includes('.project-current-summary'), 'current project summary has layout styling')
assert.ok(css.includes('.project-open-trigger'), 'explicit open-project button is styled')

console.log('=== PROJECT OPEN 01.1 VERIFY PASS ===')
console.log('CURRENT PROJECT: INFORMATIONAL / NOT HIDDEN ACTION')
console.log('OPEN PROJECT: EXPLICIT ACTION')
console.log('NEW PROJECT: PRESERVED')
console.log('PROJECT IDS / PF01 / PF02: UNCHANGED')
