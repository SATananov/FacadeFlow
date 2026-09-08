import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /<h1>FacadeFlow<\/h1>/)
assert.match(app, /Създай оферта/)
assert.match(app, /Нов клиент \/ обект/)
assert.match(app, /Клиент \/ Обект/)
assert.doesNotMatch(app, /AI Workspace|Конструктор|Каталог|Импорт|Проекти|Помощ/)
assert.match(css, /linear-gradient\(135deg, #08161d/)
assert.match(css, /#13a7ba/)
assert.match(css, /#e87329/)

const headerPrimaryActions = [...app.matchAll(/className="create-offer-action"/g)].length
assert.equal(headerPrimaryActions, 1, 'Concept 01 must expose exactly one primary header action.')

console.log('CONCEPT 01 UI CONTRACT PASS')
console.log('HEADER PRIMARY ACTIONS = 1')
console.log('CREATE OFFER = YES')
console.log('OLD DEMO NAVIGATION = NO')
