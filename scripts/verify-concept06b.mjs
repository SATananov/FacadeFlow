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

assert.match(modules, /export type ModuleInputSource = 'unset' \| 'preset' \| 'manual'/)
assert.match(modules, /MODULE_PRODUCT_TYPE_PRESETS/)
assert.match(modules, /MODULE_FIELD_COUNT_PRESETS = \[1, 2, 3, 4\]/)
assert.match(modules, /MODULE_DIMENSION_PRESETS_MM: readonly number\[\] = \[\]/)
assert.match(modules, /customProductTypeLabel: string/)
assert.match(modules, /productTypeSource: ModuleInputSource/)
assert.match(modules, /widthSource: ModuleInputSource/)
assert.match(modules, /heightSource: ModuleInputSource/)
assert.match(modules, /fieldCount: number \| null/)
assert.match(modules, /fieldCountSource: ModuleInputSource/)
assert.match(modules, /Every module-specific value starts unset/)
assert.match(modules, /getOfferModuleMissingFields/)
assert.match(modules, /isOfferModuleStructureReady/)
assert.match(modules, /not a save gate/)

assert.match(app, /Модул 1 може да остане чернова/)
assert.match(app, /Всички модулни стойности на този етап са опционални/)
assert.match(app, /Не е избран/)
assert.match(app, /Друго \/ ръчно/)
assert.match(app, /Ръчно \/ нестандартно/)
assert.match(app, /Стандартен размер/)
assert.match(app, /Няма заредени потвърдени стандартни размери/)
assert.match(app, /БРОЙ ПОЛЕТА/)
assert.match(app, /Друг брой \/ ръчно/)
assert.match(app, /Това не блокира черновата/)
assert.match(app, /Concept 06B не генерира геометрия/)
assert.match(app, /не предполага стандартни/)

assert.match(css, /\.module-optional-note/)
assert.match(css, /\.module-hybrid-grid/)
assert.match(css, /\.module-hybrid-card/)
assert.match(css, /\.module-hybrid-heading/)
assert.match(css, /\.module-preset-boundary/)

assert.match(packageJson.scripts['test:contract'], /verify-concept06b\.mjs/)

console.log('CONCEPT 06B OPTIONAL HYBRID MODULE INPUTS VERIFY PASS')
console.log('MODULE INPUTS: OPTIONAL DRAFT FIELDS')
console.log('ENTRY: DROPDOWN PRESET OR MANUAL CUSTOM')
console.log('PRODUCT TYPE: WINDOW | DOOR | MANUAL CUSTOM')
console.log('DIMENSIONS: OPTIONAL; MANUAL NOW; PRESET CATALOG READY')
console.log('CONFIRMED DIMENSION PRESETS: NONE - NOT INVENTED')
console.log('FIELD COUNT: 1 | 2 | 3 | 4 | MANUAL CUSTOM')
console.log('DRAFT SAVE GATE: NONE AT MODULE LEVEL')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
