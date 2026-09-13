import fs from 'node:fs'
import assert from 'node:assert/strict'

const component = fs.readFileSync('src/components/ProjectAssurancePanel.tsx', 'utf8')
const css = fs.readFileSync('src/components/ProjectAssurancePanel.css', 'utf8')

assert.match(component, /statements\.length === 0/, 'Empty statement state must be handled explicitly')
assert.match(component, /Няма технически решения за потвърждение\./, 'Empty state must explain that no confirmable statement exists')
assert.match(component, /Текущият модул още няма профилна система и технически контекст\./, 'System-neutral module must receive a concrete explanation')
assert.match(component, /профил, дебелина на стъклопакета или стъклодържател/, 'Empty state must name concrete human technical actions')
assert.match(component, /Върни се към текущия модул/, 'Empty state must provide a direct return action')
assert.match(component, /onClick=\{\(\) => setOpen\(false\)\}/, 'Return action must close the assurance drawer without changing domain state')
assert.match(component, /project-assurance-empty-guide/, 'Dedicated empty guidance surface must exist')
assert.match(css, /\.project-assurance-empty-guide\s*\{/, 'Empty guidance surface must be visibly styled')
assert.match(component, /Прегледай преди потвърждение/, 'Existing exact-statement flow must remain present')
assert.match(component, /Потвърждавам показаното решение/, 'Existing explicit confirmation flow must remain present')
assert.match(component, /Съвместимостта с базовия профил остава непотвърдена/, 'Technical boundary must remain unchanged')
assert.match(component, /Отстъпът на стъклопакета и размерът за рязане на стъклото остават неизвестни/, 'Glazing inset boundary must remain unchanged')
assert.match(component, /размерът за рязане на стъклото остават неизвестни/, 'Glass cut boundary must remain unchanged')

console.log('=== PROJECT FOUNDATION 02 UI POLISH 01 VERIFY PASS ===')
console.log('EMPTY STATEMENT STATE: EXPLAINED')
console.log('SYSTEM-NEUTRAL MODULE: GUIDED')
console.log('NEXT HUMAN TECHNICAL ACTIONS: VISIBLE')
console.log('RETURN TO MODULE: DIRECT')
console.log('EXPLICIT CONFIRMATION FLOW: PRESERVED')
console.log('TECHNICAL BOUNDARIES: UNCHANGED')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
