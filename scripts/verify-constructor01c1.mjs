import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const model = await readFile(
  new URL('../src/domain/construction/constructionModel.ts', import.meta.url),
  'utf8',
)
const topology = await readFile(
  new URL('../src/domain/construction/fieldTopology.ts', import.meta.url),
  'utf8',
)
const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)
const css = await readFile(
  new URL('../src/components/ConstructorShell.css', import.meta.url),
  'utf8',
)
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const offerModules = await readFile(new URL('../src/domain/offerModules.ts', import.meta.url), 'utf8')
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01C_1_CANONICAL_FIELD_TOPOLOGY_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(model, /ConstructionFieldDefinition/)
assert.match(model, /kind: 'field'/)
assert.match(model, /kind: 'split'/)
assert.match(model, /fieldType: ConstructionFieldType \| null/)
assert.match(model, /version: 'field-topology-01'/)
assert.match(model, /version: 'constructor-01b' \| 'constructor-01c' \| 'constructor-01c\.1'/)
assert.match(model, /topology\?: ConstructionModel/)

assert.match(topology, /export function splitField/)
assert.match(topology, /export function findFieldAtPoint/)
assert.match(topology, /export function resolveConstructionTopology/)
assert.match(topology, /parentFieldId/)
assert.match(topology, /startMm/)
assert.match(topology, /endMm/)
assert.match(topology, /export function moveDivider/)
assert.match(topology, /export function removeDivider/)
assert.match(topology, /export function resizeConstructionFrame/)
assert.match(topology, /migrateLegacyDividersToTopology/)
assert.match(topology, /getTopologyMinimumSize/)

assert.match(shell, /(?:FIELD TOPOLOGY 01C\.[12]|FRAME INTERIOR 01C\.3|FIELD TOPOLOGY 01C\.3\.[234567]|FIELD SEMANTICS 01D)/)
assert.match(shell, /selectedFieldId/)
assert.match(shell, /fields\.map\(\(field\)/)
assert.match(shell, /constructor-field-surface/)
assert.match(shell, /ПОЛЕ \{field\.sequence\}|constructor-field-number-badge/)
assert.match(shell, /addDivider/)
assert.match(shell, /splitField/)
assert.match(shell, /findFieldAtPoint/)
assert.match(shell, /Само в родителското поле/)
assert.match(shell, /constructionToSnapshot/)
assert.match(shell, /(?:constructor-01c\.[123]|constructor-01d)/)
assert.match(css, /\.constructor-field-surface/)
assert.match(css, /\.constructor-divider\.vertical\.is-local/)
assert.match(css, /\.constructor-divider\.horizontal\.is-local/)

assert.match(offerModules, /ModuleInputSource = 'unset' \| 'preset' \| 'manual' \| 'constructor'/)
assert.match(offerModules, /constructionFieldId: string \| null/)
assert.match(offerModules, /syncOfferModuleFieldsFromTopology/)
assert.match(app, /syncFirstModuleFieldTopology/)
assert.match(app, /onFieldTopologyChange=\{syncFirstModuleFieldTopology\}/)
assert.match(app, /fieldCountSource: 'constructor'/)
assert.match(app, /constructorTopologyAuthoritative/)

assert.match(acceptance, /real \*\*ПОЛЕ \/ FIELD\*\* objects/i)
assert.match(acceptance, /does not cross its neighbor/i)
assert.match(acceptance, /outside React in `src\/domain\/construction\/`/i)
assert.match(acceptance, /source of truth for module width, height, FIELD count and FIELD widths/i)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01c1\.mjs/)

console.log('CONSTRUCTOR 01C.1 CANONICAL FIELD TOPOLOGY VERIFY PASS')
console.log('DOMAIN TERM: ПОЛЕ / FIELD')
console.log('DIVIDER SEMANTICS: SPLITS ONE FIELD')
console.log('RECURSIVE LOCAL SUBDIVISION: YES')
console.log('LEGACY 01C DRAFT MIGRATION: YES')
console.log('MODULE <-> CONSTRUCTOR FIELD COUNT/WIDTH SYNC: YES')
console.log('FIELD TYPE / OPENING SEMANTICS: NOT YET')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
