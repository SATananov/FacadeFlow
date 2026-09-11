import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)
const css = await readFile(
  new URL('../src/components/ConstructorShell.css', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(app, /import ConstructorShell(?:, \{[\s\S]*?\})? from '\.\/components\/ConstructorShell'/)
assert.match(app, /constructorMode/)
assert.match(app, /Отвори Конструктор/)
assert.match(app, /Общата офертна конфигурация важи за модула/)
assert.match(app, /Тези стойности важат за всички модули в офертата/)
assert.match(app, /<ConstructorShell/)
assert.match(app, /onClose=\{\(\) => setConstructorMode\(null\)\}/)

assert.match(shell, /FACADEFLOW CONSTRUCTOR · (?:CONSTRUCTOR 01[BC]|FIELD TOPOLOGY 01C\.[12]|FRAME INTERIOR 01C\.3|FIELD TOPOLOGY 01C\.3\.[234567]|FIELD SEMANTICS 01D)/)
assert.match(shell, /Параметрична каса/)
assert.match(shell, /Grid \{gridVisible \? 'ON' : 'OFF'\}/)
assert.match(shell, /Snap \{snapEnabled \? 'ON' : 'OFF'\}/)
assert.match(shell, /constructor-ruler-top/)
assert.match(shell, /constructor-ruler-left/)
assert.match(shell, /constructor-canvas/)
assert.match(shell, /Профилна система/)
assert.match(shell, /Заключени общи настройки/)
assert.match(shell, /Тези стойности важат за всички модули в тази оферта/)
assert.match(shell, /не се измисля профилен код или производствена геометрия/)
assert.match(shell, /CONSTRUCTOR 01[BC]/)
assert.match(shell, /(?:Constructor 01C|FIELD TOPOLOGY 01C\.[12]|FRAME INTERIOR 01C\.3|FIELD TOPOLOGY 01C\.3\.[234567]|FIELD SEMANTICS 01D)/)
assert.match(shell, /(?:Constructor 01D|FIELD SEMANTICS 01D)/)

assert.match(css, /\.constructor-shell/)
assert.match(css, /\.constructor-layout/)
assert.match(css, /\.constructor-canvas\.has-grid/)
assert.match(css, /\.constructor-statusbar/)
assert.match(css, /\.constructor-offer-locks/)
assert.match(css, /grid-template-columns: 192px minmax\(520px, 1fr\) 300px/)

assert.match(packageJson.scripts['test:contract'], /verify-constructor01a\.mjs/)

console.log('CONSTRUCTOR 01A SHELL VERIFY PASS')
console.log('FLOW: MODULE 1 -> FACADEFLOW CONSTRUCTOR')
console.log('LAYOUT: TOOLS | CAD WORKSPACE | PROPERTIES')
console.log('GRID: TOGGLEABLE')
console.log('SNAP: IMPLEMENTED BY LATER CONSTRUCTOR 01B')
console.log('OFFER INVARIANTS: LOCKED IN CONSTRUCTOR')
console.log('PARAMETRIC FRAME: IMPLEMENTED BY LATER CONSTRUCTOR 01B')
console.log('DIVIDER DRAG/RESIZE: NOT YET IMPLEMENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
