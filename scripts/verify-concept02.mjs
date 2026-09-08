import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /Клиент \/ Възложител/)
assert.match(app, /Обект/)
assert.match(app, /Други общи параметри/)
assert.match(app, /Цвят и фолиране/)
assert.match(app, /getSelectableProfileSystems/)
assert.match(app, /profileSystemId/)
assert.match(app, /Прозорец/)
assert.match(app, /colorId/)
assert.match(app, /foilModeId/)
assert.match(app, /б \+ б \/ 24/)
assert.match(app, /б \+ б \/ 32/)
assert.match(app, /б \+ 4S \/ 24/)
assert.match(app, /к \+ б \/ 32/)
assert.match(app, /к \+ б \+ 4S \/ 44/)
assert.match(app, /Four Seasons/)
assert.match(app, /Siegenia/)
assert.match(app, /Maco/)
assert.match(app, /Общи условия/)
assert.match(app, /Запази и продължи към модули/)
assert.match(app, /Следваща стъпка: Модули/)
assert.doesNotMatch(app, /AI Workspace|PROFILE DATA|Конструктор|Каталог|Импорт|Проекти|Помощ/)

const headerPrimaryActions = [...app.matchAll(/className="create-offer-action"/g)].length
assert.equal(headerPrimaryActions, 1, 'Concept 02 must preserve exactly one primary header action.')

assert.match(css, /\.offer-form/)
assert.match(css, /\.offer-summary/)
assert.match(css, /\.hardware-options/)

console.log('CONCEPT 02 OFFER BASICS CONTRACT PASS')
console.log('CLIENT + OBJECT = YES')
console.log('SYSTEM = CATALOG-DRIVEN | TYPE + FINISH + GLAZING + HARDWARE = YES')
console.log('COMMON CONDITIONS = YES')
console.log('NEXT STEP MODULES = DECLARED ONLY')
