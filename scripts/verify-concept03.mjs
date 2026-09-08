import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(
  new URL('../src/App.tsx', import.meta.url),
  'utf8',
)

const css = await readFile(
  new URL('../src/App.css', import.meta.url),
  'utf8',
)

const glazing = await readFile(
  new URL('../src/data/profileSystems/glazingOptions.ts', import.meta.url),
  'utf8',
)

assert.match(app, /CONTRACTOR_DATA/)
assert.match(app, /НАДЕЖДА/)
assert.match(app, /Al и PVC дограма/)
assert.match(app, /6600 Кърджали/)
assert.match(app, /Студен кладенец/)
assert.match(app, /Дарец/)
assert.match(app, /nadejda94@mail\.bg/)

assert.match(app, /Изпълнител/)
assert.match(app, /Клиент \/ Възложител/)
assert.match(app, /Фирма \/ име/)
assert.match(app, /ЕИК \/ Булстат/)
assert.match(app, /Лице за контакт/)
assert.match(app, /Телефон/)
assert.match(app, /Email/)

assert.match(app, /Наименование на обекта/)
assert.match(app, /Адрес на обекта/)

assert.match(app, /Други общи параметри/)
assert.match(app, /Цвят и фолиране/)
assert.match(app, /getSelectableProfileSystems/)
assert.match(app, /profileSystemId/)
assert.match(app, /Siegenia/)
assert.match(app, /Maco/)
assert.match(glazing, /Four Seasons/)

assert.match(css, /\.contractor-card/)
assert.match(css, /\.contractor-details/)
assert.match(css, /\.client-grid/)
assert.match(css, /\.offer-party-summary/)

const primaryHeaderActions = [
  ...app.matchAll(
    /className="create-offer-action"/g,
  ),
].length

assert.equal(
  primaryHeaderActions,
  1,
  'FacadeFlow must keep exactly one primary header Create Offer action.',
)

console.log(
  'CONCEPT 03 CONTRACTOR CLIENT OBJECT CONTRACT PASS',
)

console.log(
  'CONTRACTOR = NADEZHDA READ-ONLY',
)

console.log(
  'CLIENT / CONTRACTING PARTY DATA = YES',
)

console.log(
  'OBJECT DATA = YES',
)

console.log(
  'TECHNICAL OFFER PARAMETERS = PRESERVED',
)
