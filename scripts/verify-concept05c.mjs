import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')
const hardware = await readFile(
  new URL('../src/data/profileSystems/hardwareOptions.ts', import.meta.url),
  'utf8',
)
const defaults = await readFile(
  new URL('../src/domain/offerModuleDefaults.ts', import.meta.url),
  'utf8',
)
const index = await readFile(
  new URL('../src/data/profileSystems/index.ts', import.meta.url),
  'utf8',
)

assert.match(hardware, /id: 'standard-european'/)
assert.match(hardware, /labelBg: 'Стандартен европейски обков'/)
assert.match(hardware, /manufacturerSelection: 'unspecified'/)
assert.match(hardware, /profileSystemId: 'kmg-prelude-60'/)
assert.match(hardware, /grooveType: 'standard-european'/)
assert.match(hardware, /specialHardwareRequired: false/)
assert.match(hardware, /PRELUDE 60 използва стандартен обковен жлеб/)
assert.match(hardware, /getConfirmedHardwareStandards/)
assert.match(hardware, /getHardwareStandardById/)
assert.match(hardware, /getProfileSystemHardwareCompatibility/)
assert.doesNotMatch(hardware, /profileSystemId: 'kmg-prestige-70'/)
assert.doesNotMatch(hardware, /profileSystemId: 'kmg-prestige-plus-70'/)
assert.match(index, /hardwareOptions/)

assert.match(defaults, /inherit-offer-defaults/)
assert.match(defaults, /profileSystemId: string/)
assert.match(defaults, /colorId: string/)
assert.match(defaults, /foilModeId: string/)
assert.match(defaults, /glazingId: string/)
assert.match(defaults, /hardwareStandardId: string/)
assert.match(defaults, /hardwareManufacturerId: 'unspecified'/)
assert.match(defaults, /buildOfferModuleDefaults/)
assert.match(defaults, /does not create geometry/)

assert.match(app, /hardwareStandardId: string/)
assert.match(app, /hardwareManufacturerId: 'unspecified'/)
assert.match(app, /hardwareStandardId: ''/)
assert.match(app, /getConfirmedHardwareStandards/)
assert.match(app, /getHardwareStandardById/)
assert.match(app, /getProfileSystemHardwareCompatibility/)
assert.match(app, /buildOfferModuleDefaults/)
assert.match(hardware, /Стандартен европейски обков/)
assert.match(app, /ПРОИЗВОДИТЕЛ \/ МАРКА/)
assert.match(app, /Не е уточнен/)
assert.match(app, /Потвърдено за PRELUDE 60/)
assert.match(app, /не пренася автоматично правилото на PRELUDE 60/)
assert.match(app, /Boolean\(selectedHardwareStandard\)/)
assert.match(app, /hardwareStandardId: ''/)
assert.match(app, /ОБЩИ НАСТРОЙКИ ЗА МОДУЛИТЕ/)
assert.match(app, /Система · Цвят · Фолиране · Стъклопакет · Обков/)
assert.match(app, /наследени общи настройки/)
assert.match(app, /Тип изделие = параметър на модула/)
assert.doesNotMatch(app, /productType/)
assert.doesNotMatch(app, /name="hardware"/)
assert.doesNotMatch(app, /\['Siegenia', 'Maco'\]/)

assert.match(css, /\.hardware-section/)
assert.match(css, /\.hardware-lock/)
assert.match(css, /\.hardware-workflow/)
assert.match(css, /\.hardware-manufacturer-card/)
assert.match(css, /\.hardware-compatibility-note/)
assert.match(css, /\.module-defaults-note/)
assert.match(css, /\.module-scope-note/)

console.log('CONCEPT 05C HARDWARE + OFFER MODULE DEFAULTS VERIFY PASS')
console.log('FLOW: GLAZING -> HARDWARE -> MODULES')
console.log('HARDWARE STANDARD: STANDARD EUROPEAN')
console.log('HARDWARE MANUFACTURER: UNSPECIFIED')
console.log('PRELUDE 60 GROOVE COMPATIBILITY: HUMAN-CONFIRMED')
console.log('PRESTIGE HARDWARE COMPATIBILITY: NOT YET VALIDATED')
console.log('MODULE DEFAULTS: SYSTEM + COLOR + FOIL + GLAZING + HARDWARE')
console.log('PRODUCT TYPE: MODULE-LEVEL')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
