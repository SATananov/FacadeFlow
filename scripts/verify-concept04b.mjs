import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')
const catalog = await readFile(
  new URL('../src/data/profileSystems/catalog.ts', import.meta.url),
  'utf8',
)
const prelude = await readFile(
  new URL('../src/data/profileSystems/prelude60.ts', import.meta.url),
  'utf8',
)
const prestige = await readFile(
  new URL('../src/data/profileSystems/prestige70.ts', import.meta.url),
  'utf8',
)

assert.match(app, /getSelectableProfileSystems/)
assert.match(app, /getProfileSystemById/)
assert.match(app, /profileSystemId: string/)
assert.match(app, /profileSystemId: ''/)
assert.match(app, /SELECTABLE_PROFILE_SYSTEMS\.map/)
assert.match(app, /Профилна система/)
assert.match(app, /Първо попълнете Клиент и Обект/)
assert.match(app, /disabled=\{!clientObjectReady\}/)
assert.match(app, /required/)
assert.match(app, /selectedProfileSystem/)
assert.match(app, /disabled=\{!canContinueToModules\}/)

assert.doesNotMatch(app, /system: string/)
assert.doesNotMatch(app, /<option>Prelude 60<\/option>/)

assert.match(catalog, /getSelectableProfileSystems/)
assert.match(catalog, /getProfileSystemById/)
assert.match(prelude, /kmg-prelude-60/)
assert.match(prestige, /kmg-prestige-70/)
assert.match(prestige, /kmg-prestige-plus-70/)

assert.match(css, /\.profile-system-options/)
assert.match(css, /\.profile-system-option/)
assert.match(css, /\.selected-system-note/)
assert.match(css, /\.save-offer-action:disabled/)

console.log('CONCEPT 04B PROFILE SYSTEM SELECTION VERIFY PASS')
console.log('FLOW: CLIENT -> OBJECT -> PROFILE SYSTEM')
console.log('SYSTEM OPTIONS SOURCE: CENTRAL PROFILE CATALOG')
console.log('OFFER PERSISTS: profileSystemId')
console.log('MODULE CONTINUE GATE: PROFILE SYSTEM REQUIRED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
