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

assert.match(app, /useState<OfferModuleDraft\[\]>/)
assert.match(app, /createFirstOfferModule\(moduleDefaults\)/)
assert.match(app, /МОДУЛ 01/)
assert.match(app, />Модул 1</)
assert.match(app, /Наследява общите настройки/)
assert.match(app, /\['window', 'Прозорец'\]/)
assert.match(app, /\['door', 'Врата'\]/)
assert.match(app, /Ширина/)
assert.match(app, /Височина/)
assert.match(app, /widthMm/)
assert.match(app, /heightMm/)
assert.match(app, /Следващият етап ще зададе конструкция, крила и отваряния/)
assert.match(app, /Concept 06A не създава автоматична геометрия/)

assert.match(css, /\.module-workspace/)
assert.match(css, /\.module-inherited-defaults/)
assert.match(css, /\.module-type-options/)
assert.match(css, /\.module-dimensions/)
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
