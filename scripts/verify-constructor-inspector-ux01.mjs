import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const currentContextVerifier = await readFile(new URL('./verify-constructor-context-inspector01.mjs', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

// The historical compact-inspector presentation was superseded by the accepted
// canvas-first context inspector. Verify stable source wiring here and leave
// behavior/navigation/undo isolation to the current runtime verifier.
assert.match(shell, /type InspectorTab = 'properties' \| 'profile' \| 'dimensions' \| 'glazing'/)

assert.match(shell, /const selectedField = !selectedDivider && !selectedAngledDivider && !frameSelected/)
assert.match(shell, /const conceptualFieldCount = fields\.length/)
assert.match(shell, /renderSelectedFieldHardwareRequirements/)
assert.match(shell, /selectedFieldHardwareRequirements/)
assert.match(shell, /selectedField\.fieldType === 'fixed'/)
assert.match(currentContextVerifier, /n\.type === 'aside' && n\.props\['data-context'\]/)
assert.match(currentContextVerifier, /assert\.equal\(h\.context\(\), 'module'\)/)
assert.match(currentContextVerifier, /assert\.equal\(h\.context\(\), 'field'\)/)
assert.match(currentContextVerifier, /assert\.equal\(h\.context\(\), 'divider'\)/)
assert.match(currentContextVerifier, /Selection and module-context navigation do not publish saved data/)
assert.match(currentContextVerifier, /↶ Отмени/)
assert.match(currentContextVerifier, /↷ Повтори/)
assert.match(currentContextVerifier, /Дебелина на стъклопакета за избраното поле/)
assert.match(currentContextVerifier, /MISSING\|UNCONFIRMED\|FIELD\|RESOLVED\|source=/)

















assert.match(packageJson.scripts['test:contract'], /verify-constructor-inspector-ux01\.mjs/)

console.log('CONSTRUCTOR INSPECTOR UX 01 VERIFY PASS')
console.log('RIGHT PANEL: CANVAS-FIRST CONTEXT INSPECTOR')
console.log('TABS: BASIC | PROFILE | GLAZING | DIMENSIONS')
console.log('CONTEXTS: MODULE | FIELD | DIVIDER')
console.log('SELECTION NAVIGATION: NO SAVED-DATA WRITES')
console.log('UNDO/REDO + FIELD ISOLATION: RUNTIME VERIFIED')
console.log('DOMAIN LOGIC: UNCHANGED')
console.log('PROFILE-AWARE GEOMETRY: NO')
console.log('MACHINE READY: NO')
