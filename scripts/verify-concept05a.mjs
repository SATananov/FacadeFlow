import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')
const finishes = await readFile(
  new URL('../src/data/profileSystems/finishOptions.ts', import.meta.url),
  'utf8',
)
const index = await readFile(
  new URL('../src/data/profileSystems/index.ts', import.meta.url),
  'utf8',
)

assert.match(finishes, /id: 'anthracite'/)
assert.match(finishes, /labelBg: 'Антрацит'/)
assert.match(finishes, /id: 'both-sides'/)
assert.match(finishes, /labelBg: 'Двустранно фолиран'/)
assert.match(finishes, /id: 'exterior-only'/)
assert.match(finishes, /labelBg: 'Външно фолиран'/)
assert.match(finishes, /sourceStatus: 'human-confirmed'/)
assert.match(finishes, /interiorColorStatus: 'unspecified'/)
assert.match(finishes, /kmg-prelude-60/)
assert.match(finishes, /kmg-prestige-70/)
assert.match(finishes, /kmg-prestige-plus-70/)
assert.match(finishes, /getProfileSystemFinishOptions/)
assert.match(finishes, /getProfileSystemFinishOptionById/)
assert.match(finishes, /getProfileSystemFoilModeById/)
assert.match(index, /finishOptions/)

assert.match(app, /colorId: string/)
assert.match(app, /foilModeId: string/)
assert.match(app, /colorId: ''/)
assert.match(app, /foilModeId: ''/)
assert.match(app, /getProfileSystemFinishOptions/)
assert.match(app, /getProfileSystemFinishOptionById/)
assert.match(app, /getProfileSystemFoilModeById/)
assert.match(app, /Цвят и фолиране/)
assert.match(app, /Първо изберете профилна система/)
assert.match(app, /Първо изберете цвят/)
assert.match(finishes, /Двустранно фолиран/)
assert.match(finishes, /Външно фолиран/)
assert.match(app, /вътрешният цвят остава неуточнен/)
assert.match(app, /Boolean\(selectedFinish\)/)
assert.match(app, /Boolean\(selectedFoilMode\)/)
assert.match(app, /const selectProfileSystem/)
assert.match(app, /const selectFinish/)
assert.match(app, /colorId: ''/)
assert.match(app, /foilModeId: ''/)
assert.doesNotMatch(app, /color: 'Бяло'/)
assert.doesNotMatch(app, /value=\{offer\.color\}/)

assert.match(css, /\.finish-section/)
assert.match(css, /\.finish-workflow/)
assert.match(css, /\.finish-option/)
assert.match(css, /\.foil-mode-option/)
assert.match(css, /\.finish-boundary-note/)

console.log('CONCEPT 05A COLOR + FOIL SELECTION VERIFY PASS')
console.log('FLOW: PROFILE SYSTEM -> COLOR -> FOIL MODE')
console.log('COLOR: ANTHRACITE')
console.log('FOIL MODES: BOTH SIDES | EXTERIOR ONLY')
console.log('SOURCE: HUMAN-CONFIRMED OPERATIONAL DATA')
console.log('EXTERIOR-ONLY INTERIOR COLOR: UNSPECIFIED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
