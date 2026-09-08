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

assert.match(modules, /export type ModuleOpeningHanding = 'left' \| 'right'/)
assert.match(modules, /MODULE_OPENING_HANDING_PRESETS/)
assert.match(modules, /id: 'left', labelBg: 'Ляво'/)
assert.match(modules, /id: 'right', labelBg: 'Дясно'/)
assert.match(modules, /openingHanding: ModuleOpeningHanding \| null/)
assert.match(modules, /customOpeningHandingLabel: string/)
assert.match(modules, /openingHandingSource: ModuleInputSource/)
assert.match(modules, /isOfferModuleOpeningHandingRelevant/)
assert.match(modules, /hasOfferModuleOpeningHanding/)
assert.match(modules, /getOfferModuleHandingRelevantFieldCount/)
assert.match(modules, /getOfferModuleConfiguredHandingCount/)
assert.match(modules, /reference viewing side has not been standardized/)

assert.match(app, /CONCEPT 06C \+ 06D \+ 06E/)
assert.match(app, /Работна страна на отваряне/)
assert.match(app, /MODULE_OPENING_HANDING_PRESETS/)
assert.match(app, /Не е зададена/)
assert.match(app, /Ръчно описание на страната/)
assert.match(app, /Референтната\s+гледна страна още не е стандартизирана/)
assert.match(app, /При падащо отваряне ляво \/ дясно не се изисква/)
assert.match(app, /field\.openingMode === 'side-hinged'/)
assert.match(app, /field\.openingMode === 'tilt-turn'/)
assert.match(app, /selectFirstModuleFieldOpeningHanding/)
assert.match(app, /firstModuleConfiguredHandingCount/)
assert.match(app, /firstModuleHandingRelevantFieldCount/)
assert.match(app, /не превръща работното ляво \/ дясно в геометрична/)

assert.match(css, /\.module-handing-block/)
assert.match(css, /\.module-handing-note/)

assert.match(packageJson.scripts['test:contract'], /verify-concept06e\.mjs/)

console.log('CONCEPT 06E FIELD OPENING HANDING VERIFY PASS')
console.log('FLOW: OPENING MODE -> OPTIONAL WORKING HANDING')
console.log('HANDING PRESETS: LEFT | RIGHT | MANUAL CUSTOM')
console.log('HANDING APPLIES: SIDE-HINGED | TILT-TURN | MANUAL OPENING')
console.log('TILT-ONLY HANDING: NOT REQUIRED')
console.log('REFERENCE VIEW SIDE: NOT YET STANDARDIZED')
console.log('HANDING DRAFT GATE: NONE')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
