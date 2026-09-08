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

assert.match(
  modules,
  /export type ModuleOpeningMode = 'side-hinged' \| 'tilt' \| 'tilt-turn'/,
)
assert.match(modules, /MODULE_OPENING_MODE_PRESETS/)
assert.match(modules, /id: 'side-hinged', labelBg: 'Странично'/)
assert.match(modules, /id: 'tilt', labelBg: 'Падащо'/)
assert.match(modules, /id: 'tilt-turn', labelBg: 'Странично \+ падащо'/)
assert.match(modules, /openingMode: ModuleOpeningMode \| null/)
assert.match(modules, /customOpeningModeLabel: string/)
assert.match(modules, /openingModeSource: ModuleInputSource/)
assert.match(modules, /isOfferModuleFieldOperable/)
assert.match(modules, /hasOfferModuleOpeningMode/)
assert.match(modules, /getOfferModuleOperableFieldCount/)
assert.match(modules, /getOfferModuleConfiguredOpeningCount/)
assert.match(modules, /Hinge side \/ handing remains intentionally/)

assert.match(app, /CONCEPT 06C \+ 06D/)
assert.match(app, /Начин на отваряне/)
assert.match(app, /Не е зададено/)
assert.match(app, /MODULE_OPENING_MODE_PRESETS/)
assert.match(app, /Друго \/ ръчно/)
assert.match(app, /Ръчно описание на отварянето/)
assert.match(app, /Начинът на отваряне е опционален/)
assert.match(app, /Посоката ляво \/ дясно/)
assert.match(app, /страната на пантите още не се определят автоматично/)
assert.match(app, /field\.fieldType === 'operable'/)
assert.match(app, /selectFirstModuleFieldOpeningMode/)
assert.match(app, /firstModuleConfiguredOpeningCount/)
assert.match(app, /firstModuleOperableFieldCount/)
assert.match(app, /не определя ляво \/ дясно, страна на панти/)

assert.match(css, /\.module-opening-block/)
assert.match(css, /\.module-opening-note/)

assert.match(packageJson.scripts['test:contract'], /verify-concept06d\.mjs/)

console.log('CONCEPT 06D FIELD OPENING MODE VERIFY PASS')
console.log('FLOW: OPERABLE FIELD -> OPTIONAL OPENING MODE')
console.log('OPENING MODES: SIDE-HINGED | TILT | TILT-TURN | MANUAL CUSTOM')
console.log('OPENING MODE ENTRY: DROPDOWN OR MANUAL CUSTOM')
console.log('OPENING MODE DRAFT GATE: NONE')
console.log('HINGE SIDE / HANDING: NOT YET IMPLEMENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
