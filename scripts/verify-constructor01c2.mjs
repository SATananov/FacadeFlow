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
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01C_2_PHYSICAL_DIVIDER_HISTORY_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

assert.match(model, /thicknessMm: number/)
assert.match(model, /version: 'field-topology-01' \| 'field-topology-02' \| 'field-topology-03'/)
assert.match(model, /constructor-01c\.2/)
assert.match(model, /Clear size of the first child FIELD/)

assert.match(topology, /CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM = 40/)
assert.match(topology, /first\.widthMm \+ dividerThicknessMm \+ second\.widthMm/)
assert.match(topology, /first\.heightMm \+ dividerThicknessMm \+ second\.heightMm/)
assert.match(topology, /bounds\.widthMm - offsetMm - dividerThicknessMm/)
assert.match(topology, /bounds\.heightMm - offsetMm - dividerThicknessMm/)
assert.match(topology, /upgradeConstructionModelPhysicalDividers/)
assert.match(topology, /version: 'field-topology-0[23]'/)

assert.match(shell, /(?:FIELD TOPOLOGY 01C\.2|FRAME INTERIOR 01C\.3|FIELD TOPOLOGY 01C\.3\.2)/)
assert.match(shell, /version: 'constructor-01c\.(?:2|3|3\.2)'/)
assert.match(shell, /(?:Светъл размер ляво поле|Схемен размер ляво поле)/)
assert.match(shell, /(?:Светъл размер горно поле|Схемен размер горно поле)/)
assert.match(shell, /(?:Конструктивна ширина на делителя|Схемна видима ширина)/)
assert.match(shell, /selectedDivider\.thicknessMm/)
assert.match(shell, /undoStack/)
assert.match(shell, /redoStack/)
assert.match(shell, /undoConstruction/)
assert.match(shell, /redoConstruction/)
assert.match(shell, /Ctrl\+Z/)
assert.match(shell, /Ctrl\+Y \/ Ctrl\+Shift\+Z/)
assert.match(shell, /event\.key === 'Delete'/)
assert.match(shell, /recordDragHistory/)
assert.match(shell, /grabOffsetMm/)
assert.match(css, /--constructor-divider-face/)
assert.match(css, /width: max\(22px, var\(--constructor-divider-face/)
assert.match(css, /height: max\(22px, var\(--constructor-divider-face/)

assert.match(acceptance, /neutral schematic divider face of \*\*40 mm\*\*/i)
assert.match(acceptance, /upper FIELD \+ divider face \+ lower FIELD = parent FIELD height/i)
assert.match(acceptance, /left FIELD \+ divider face \+ right FIELD = parent FIELD width/i)
assert.match(acceptance, /Ctrl\+Z/)
assert.match(acceptance, /Delete.*Backspace/i)
assert.match(acceptance, /one history transaction each/i)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01c2\.mjs/)

console.log('CONSTRUCTOR 01C.2 PHYSICAL DIVIDER + HISTORY VERIFY PASS')
console.log('FIELD DOMAIN: CANONICAL')
console.log('DIVIDER FOOTPRINT: PHYSICAL SCHEMATIC 40 mm')
console.log('MEASUREMENT: FIRST FIELD CLEAR SIZE -> DIVIDER LEADING FACE')
console.log('UNDO / REDO: YES')
console.log('KEYBOARD DELETE: YES')
console.log('PROFILE RESOLUTION: NO')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
