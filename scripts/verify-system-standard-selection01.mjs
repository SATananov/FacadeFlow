import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const standards = read('src/data/profileSystems/systemStandards.ts')
const constructor = read('src/components/ConstructorShell.tsx')
const serialization = read('src/domain/project/projectSerialization.ts')
const profileIndex = read('src/data/profileSystems/index.ts')
const ids = [
  'kmg-3k', 'kmg-3k-balcony-t', 'kmg-3k-balcony-z', 'kmg-3k-door-t-threshold',
  'kmg-3k-door-z-closed', 'kmg-3k-door-z-threshold', 'kmg-4k', 'kmg-4k-balcony-t',
  'kmg-4k-balcony-z', 'kmg-4k-door-t-closed', 'kmg-4k-door-t-threshold',
  'kmg-4k-door-z-threshold', 'kmg-4k-door-z-closed', 'kmg-4k-frame-from-mullion',
  'kmg-4k-frame-from-sash', 'kmg-4k-bead-482-01', 'kmg-4k-budget',
]

assert.match(profileIndex, /export \* from '\.\/systemStandards'/, 'standards must use the profile-system data barrel')
assert.match(standards, /export const prelude60SystemStandards: readonly SystemStandard\[\]/)
for (const id of ids) assert.ok(standards.includes(`id: '${id}'`), `missing standard ${id}`)
assert.equal((standards.match(/id: 'kmg-/g) ?? []).length, ids.length, 'expected the requested 17 KMG records')

assert.match(standards, /code: '482\.23'.{0,100}evidence: 'direct-role-block'/s, 'balcony T needs direct role-block evidence')
assert.match(standards, /code: '482\.25'.{0,100}evidence: 'direct-role-block'/s, 'balcony Z needs direct role-block evidence')
assert.match(standards, /code: '482\.27'.{0,100}evidence: 'direct-role-block'.{0,80}D6 DoorOut/s, 'door T must retain DoorOut provenance')
assert.match(standards, /code: '482\.26'.{0,100}evidence: 'direct-role-block'.{0,80}D6 Door/s, 'door Z must retain Door provenance')
assert.match(standards, /code: 'E3308'.{0,100}evidence: 'd0b0'/s, 'threshold must be tied to D0B0 evidence')
assert.match(standards, /code: '482\.22'.{0,100}evidence: 'formula-reference'/s, '482.22 must remain formula-reference evidence')
assert.ok(!/code: '482\.22'.{0,100}evidence: 'direct-role-block'/s.test(standards), '482.22 cannot be promoted to a direct role block')
assert.match(standards, /482\.30 и 482\.30-K не са доказани като взаимозаменяеми/)
assert.match(standards, /Коментар 482\.26 срещу D6 DoorOut 482\.27/)
for (const conflict of ['ap3173-ap3174', 'doorout-naming-variable', 'e3308-alprag', 'km530-context', 'tre03-thickness']) {
  assert.ok(standards.includes(`id: '${conflict}'`), `missing unresolved conflict ${conflict}`)
}

assert.match(constructor, /useState\(''\).*selectedSystemStandardId/s, 'standard selector must begin unselected')
assert.match(constructor, /<option value="">Избери вариант<\/option>/)
assert.match(constructor, /rankSystemStandardSuggestions\(candidates, activeSystemStandard\)/)
assert.match(constructor, /Препоръчано от системния вариант/)
assert.match(constructor, /Не избира автоматично профили/)
assert.match(constructor, /Не е потвърдена съвместимост с конкретното крило/)
assert.match(constructor, /Altest\.mdb · standart/)
assert.match(constructor, /Legacy конфликт:/)
assert.match(constructor, /setSelectedSystemStandardId\(event\.target\.value\)/)
assert.ok(!/setSelectedSystemStandardId\([^)]*profileCode|apply(?:Frame|Divider|SelectedFieldSash|SelectedFieldGlazingBead)\([^)]*activeSystemStandard/.test(constructor), 'standard selection must not assign components')

assert.ok(!serialization.includes('selectedSystemStandardId'), 'standard selection must not add persisted project state')
assert.ok(!standards.includes('profileAwareGeometry') && !standards.includes('evaluate'), 'standard evidence must not implement geometry or compatibility rules')
assert.match(standards, /automatic geometry|geometry inputs/i)
assert.match(standards, /sourceStatus|UNKNOWN|unresolved|not automatic/i)
assert.match(standards, /automaticGeometry: false/)
assert.match(standards, /rulesValidated: false/)
assert.match(standards, /machineReady: false/)
assert.match(standards, /formulaEvaluation: false/)
assert.doesNotMatch(standards, /\beval\s*\(/, 'legacy formulas must remain unevaluated')
const selector = constructor.match(/const renderSystemStandardSelector = \(\) => \{[\s\S]*?\n  const renderModuleBasics/)?.[0]
assert.ok(selector, 'selector renderer must remain a separate presentation-only function')
assert.doesNotMatch(selector, /apply(?:Frame|Divider|SelectedFieldSash|SelectedFieldGlazingBead)|publishProfileResolution|profileResolutionRef/, 'selecting a standard must not write profile assignments')
assert.doesNotMatch(constructor, /prelude60DoorEvidence/, 'door evidence companion must not be consumed as an automatic geometry rule')
console.log('SYSTEM STANDARD SELECTION FOUNDATION 01: PASS')
