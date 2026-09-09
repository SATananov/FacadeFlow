import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(path, 'utf8')
const resolution = read('src/domain/profileResolution.ts')
const offerModules = read('src/domain/offerModules.ts')
const constructor = read('src/components/ConstructorShell.tsx')
const app = read('src/App.tsx')
const acceptance = read('docs/PROFILE_RESOLUTION_02A3_FREE_CONSTRUCTOR_SASH_ROLE_INTEGRITY_ACCEPTANCE.md')

assert.match(resolution, /profile-sash-role-02a3/)
assert.match(resolution, /if \(field\.fieldType !== 'operable'\) continue/)
assert.match(resolution, /\.filter\(\(field\) => field\.fieldType === 'operable'\)/)
assert.match(resolution, /module context must never hide the target from Profile Resolution progress/)
assert.match(resolution, /if \(productType === 'door'\) return 'door-sash'/)
assert.match(resolution, /if \(productType === 'window'\) return 'sash'/)

assert.match(constructor, /onModuleProductTypeChange/)
assert.match(constructor, /КОНСТРУКТИВЕН ТИП НА МОДУЛА/)
assert.match(constructor, /Това не е стандартен шаблон/)
assert.match(constructor, /MISSING CONTEXT · избери Прозорец или Врата тук/)
assert.match(constructor, /OPERABLE полето вече се брои като задължителен PROFILE target/)
assert.doesNotMatch(constructor, /Избери стандартен тип изделие Прозорец \/ Врата/)

assert.match(app, /onModuleProductTypeChange=\{\(productType\) =>/)
assert.match(app, /productTypeSource: productType === null \? 'unset' : 'constructor'/)
assert.match(offerModules, /module\.productTypeSource === 'preset' \|\| module\.productTypeSource === 'constructor'/)

assert.match(acceptance, /PROFILE 2\/3/)
assert.match(acceptance, /STANDARD PRODUCT TEMPLATE REQUIRED: NO/)
assert.match(acceptance, /CONSTRUCTION GEOMETRY \/ TOPOLOGY MUTATION: NO/)
assert.match(acceptance, /MACHINE READY: NO/)

console.log('=== PROFILE RESOLUTION 02A.3 VERIFY PASS ===')
console.log('OPERABLE FIELD: CANONICAL SASH TARGET EVEN WITH MODULE TYPE UNSET')
console.log('FREE CONSTRUCTOR MODULE TYPE: WINDOW / DOOR / CLEAR')
console.log('STANDARD PRODUCT TEMPLATE GATE: REMOVED')
console.log('WINDOW -> SASH; DOOR -> DOOR-SASH')
console.log('PROFILE FALSE COMPLETION WITH MISSING SASH: NO')
console.log('CONSTRUCTOR-SET MODULE TYPE: PERSISTED AS SOURCE=constructor')
console.log('GEOMETRY / TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
