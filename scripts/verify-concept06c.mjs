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

assert.match(modules, /export type ModuleFieldType = 'fixed' \| 'operable'/)
assert.match(modules, /MODULE_FIELD_TYPE_PRESETS/)
assert.match(modules, /id: 'fixed', labelBg: 'Фиксирано'/)
assert.match(modules, /id: 'operable', labelBg: 'Отваряемо'/)
assert.match(modules, /MODULE_FIELD_WIDTH_PRESETS_MM: readonly number\[\] = \[\]/)
assert.match(modules, /interface OfferModuleFieldDraft/)
assert.match(modules, /customFieldTypeLabel: string/)
assert.match(modules, /fieldTypeSource: ModuleInputSource/)
assert.match(modules, /widthSource: ModuleInputSource/)
assert.match(modules, /fields: OfferModuleFieldDraft\[\]/)
assert.match(modules, /createOfferModuleFieldDraft/)
assert.match(modules, /resizeOfferModuleFields/)
assert.match(modules, /hasOfferModuleFieldType/)
assert.match(modules, /areOfferModuleFieldsDescribed/)
assert.match(modules, /standard field widths have been supplied yet/)

assert.match(app, /Полетата на Модул \{firstModule\.sequence\}/)
assert.match(app, /Всяко поле е отделна опционална чернова/)
assert.match(app, /Тип поле/)
assert.match(app, /MODULE_FIELD_TYPE_PRESETS/)
assert.match(app, /Ръчно описание на полето/)
assert.match(app, /Ширина на поле/)
assert.match(app, /Няма потвърдени стандартни ширини за отделните/)
assert.match(app, /Полетата са концептуално описание/)
assert.match(app, /не създава\s+автоматично делители/)
assert.match(app, /крила или геометрия/)
assert.match(app, /resizeOfferModuleFields/)
assert.match(app, /firstModuleConfiguredFieldCount/)
assert.match(app, /описанието може да остане непълно/)

assert.match(css, /\.module-fields-section/)
assert.match(css, /\.module-fields-heading/)
assert.match(css, /\.module-fields-progress/)
assert.match(css, /\.module-fields-grid/)
assert.match(css, /\.module-field-card/)
assert.match(css, /\.module-fields-boundary/)

assert.match(packageJson.scripts['test:contract'], /verify-concept06c\.mjs/)

console.log('CONCEPT 06C MODULE FIELDS VERIFY PASS')
console.log('FLOW: FIELD COUNT -> OPTIONAL FIELD DRAFTS')
console.log('FIELD TYPES: FIXED | OPERABLE | MANUAL CUSTOM')
console.log('FIELD WIDTHS: OPTIONAL; MANUAL NOW; PRESET CATALOG READY')
console.log('CONFIRMED FIELD WIDTH PRESETS: NONE - NOT INVENTED')
console.log('FIELD DRAFT SAVE GATE: NONE')
console.log('OPENING MODE: IMPLEMENTED BY LATER CONCEPT 06D')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
