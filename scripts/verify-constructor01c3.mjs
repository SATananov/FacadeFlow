import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const model = await readFile(new URL('../src/domain/construction/constructionModel.ts', import.meta.url), 'utf8')
const topology = await readFile(new URL('../src/domain/construction/fieldTopology.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01C_3_FRAME_INTERIOR_DIVIDER_RESIZE_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(model, /CONSTRUCTION_DEFAULT_FRAME_FACE_MM = 60/)
assert.match(model, /field-topology-03/)
assert.match(model, /frameFaceMm\?: number/)
assert.match(model, /constructor-01c\.3/)

assert.match(topology, /getFrameInteriorBounds/)
assert.match(topology, /model\.frame\.widthMm - frameFaceMm \* 2/)
assert.match(topology, /model\.frame\.heightMm - frameFaceMm \* 2/)
assert.match(topology, /resolveTopologyWithBounds\(model\.root, getFrameInteriorBounds\(model\)\)/)
assert.match(topology, /getConstructionMinimumFrameSize/)

assert.match(shell, /FIELD TOPOLOGY 01C\.3\.2/)
assert.match(shell, /version: 'constructor-01c\.3\.2'/)
assert.match(shell, /getConstructionFrameFaceMm/)
assert.match(shell, /frameFaceMm \* pxPerMm/)
assert.match(shell, /Вътрешен схемен размер на полето/)
assert.match(shell, /Схемен размер ляво поле/)
assert.match(shell, /Схемен размер горно поле/)
assert.match(shell, /recordDragHistory/)

assert.match(acceptance, /neutral schematic face of \*\*60 mm\*\*/i)
assert.match(acceptance, /superseded by Constructor 01C\.3\.2/i)
assert.match(acceptance, /Direct pointer resize of divider face width: \*\*REMOVED/i)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01c3\.mjs/)

console.log('CONSTRUCTOR 01C.3 FRAME INTERIOR VERIFY PASS')
console.log('DIRECT DIVIDER THICKNESS RESIZE: SUPERSEDED BY 01C.3.2')
console.log('PROFILE RESOLUTION: NO')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
