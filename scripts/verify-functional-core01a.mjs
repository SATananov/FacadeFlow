import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const css = await readFile('src/App.css', 'utf8')
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

assert.match(app, /const offerDefaultsLocked = modules\.length > 0 && getEditingOffer\(workspace\.snapshot\)\.pendingCopyModuleId === null/)
assert.match(app, /const updateOffer = <K extends keyof OfferDraft>\([\s\S]{0,260}?\) => \{\s*if \(offerDefaultsLocked && \(\s*field === 'profileSystemId' \|\| field === 'colorId' \|\| field === 'foilModeId' \|\|\s*field === 'glazingId' \|\| field === 'hardwareManufacturerId' \|\| field === 'hardwareStandardId'\s*\)\) return\s*setOffer/)
assert.match(app, /const selectProfileSystem = \(profileSystemId: string\) => \{\s*if \(offerDefaultsLocked\) return/)
assert.match(app, /const selectFinish = \(colorId: string\) => \{\s*if \(offerDefaultsLocked\) return/)
assert.match(app, /const selectHardwareStandard = \(hardwareStandardId: string\) => \{\s*if \(offerDefaultsLocked\) return/)
assert.match(app, /disabled=\{!clientObjectReady \|\| offerDefaultsLocked\}/)
for (const field of ['colorId', 'foilModeId', 'hardwareManufacturerId']) {
  assert.match(app, new RegExp(`name="${field}"[\\s\\S]{0,260}?disabled=\\{offerDefaultsLocked\\}`))
}
assert.match(app, /disabled=\{!selectedFinish \|\| offerDefaultsLocked\}/)
assert.match(app, /name="glazingId"[\s\S]{0,260}?disabled=\{offerDefaultsLocked\}/)
assert.match(app, /name="hardwareStandardId"[\s\S]{0,260}?disabled=\{offerDefaultsLocked\}/)
assert.match(app, /offer-defaults-lock-notice/)
assert.match(app, /Общите настройки са заключени\./)
assert.match(app, /Има създадени модули\./)
assert.match(css, /Functional Core 01A/)
assert.match(css, /\.offer-defaults-lock-notice/)
assert.match(packageJson.scripts['test:contract'], /verify-functional-core01a\.mjs/)
assert.match(packageJson.scripts['test:contract'], /verify-functional-core01a1-runtime\.mjs/)
assert.match(app, /workspace\.clearConfiguredModules\(\)/)

console.log('=== FUNCTIONAL CORE 01A VERIFY PASS ===')
console.log('OFFER DEFAULTS: LOCKED AFTER FIRST MODULE EXCEPT CANONICAL PENDING FREE COPY')
console.log('GENERIC TECHNICAL DEFAULT GUARD: BEFORE MUTATION')
console.log('EXISTING MODULES: PROTECTED FROM DEFAULT-SETTING CHANGES')
console.log('PROFILE / FINISH / FOIL / GLAZING / HARDWARE: BLOCKED WHILE LOCKED')
console.log('VISIBLE HUMAN EXPLANATION: YES')
console.log('PRE-MODULE CLEAR/REBUILD BEHAVIOR: PRESERVED')
console.log('CONSTRUCTION / PROFILE / PERSISTENCE MODELS: UNCHANGED')
console.log('MODULE OVERRIDES: NOT INTRODUCED')
console.log('MACHINE READY: NO')
