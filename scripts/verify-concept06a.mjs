import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')
const modules = await readFile(
  new URL('../src/domain/offerModules.ts', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(modules, /export type ModuleProductType = 'window' \| 'door'/)
assert.match(modules, /interface OfferModuleDraft/)
assert.match(modules, /inheritedDefaults: OfferModuleDefaults/)
assert.match(modules, /productType: ModuleProductType \| null/)
assert.match(modules, /widthMm: number \| null/)
assert.match(modules, /heightMm: number \| null/)
assert.match(modules, /createFirstOfferModule/)
assert.match(modules, /inheritedDefaults: \{ \.\.\.defaults \}/)
assert.match(modules, /isOfferModuleBasicsReady/)
assert.match(modules, /not a geometry generator/)
assert.match(modules, /MODULE_PRODUCT_TYPE_PRESETS/)
assert.match(modules, /id: 'window', labelBg: 'Прозорец'/)
assert.match(modules, /id: 'door', labelBg: 'Врата'/)

assert.match(app, /useState<OfferModuleDraft\[\]>/)
assert.match(app, /createFirstOfferModule\(moduleDefaults\)/)
assert.match(app, /МОДУЛ 01/)
assert.match(app, />Модул 1</)
assert.match(app, /Наследява общите настройки/)
assert.match(app, /ШИРИНА/)
assert.match(app, /ВИСОЧИНА/)
assert.match(app, /widthMm/)
assert.match(app, /heightMm/)

assert.match(css, /\.module-workspace/)
assert.match(css, /\.module-inherited-defaults/)
assert.match(css, /\.dimension-input-wrap/)
assert.match(css, /\.module-basics-status/)
assert.match(css, /\.module-geometry-boundary/)

assert.match(packageJson.scripts['test:contract'], /verify-concept06a\.mjs/)

console.log('CONCEPT 06A MODULE 1 FOUNDATION VERIFY PASS')
console.log('FLOW: OFFER DEFAULTS -> MODULE 1 -> TYPE + WIDTH + HEIGHT')
console.log('MODULE DEFAULTS: INHERITED SNAPSHOT')
console.log('PRODUCT TYPES: WINDOW | DOOR')
console.log('DIMENSIONS: WIDTH MM | HEIGHT MM')
console.log('MODULE OVERRIDES: NOT YET IMPLEMENTED')
console.log('MULTIPLE MODULES: NOT YET IMPLEMENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
