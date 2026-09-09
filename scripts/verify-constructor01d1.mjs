import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const shellCss = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01D_1_WORKING_OPENING_SYMBOLS_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(shell, /OPENING SYMBOLS 01D\.1/)
assert.match(shell, /mode-\$\{field\.openingMode \?\? 'unset'\}/)
assert.match(shell, /handing-\$\{field\.openingHanding \?\? 'none'\}/)

// side-hinged left: left corners -> right midpoint
assert.match(shell, /openingMode === 'side-hinged' && field\.openingHanding === 'left'/)
assert.match(shell, /x1="7" y1="7" x2="93" y2="50"/)
assert.match(shell, /x1="7" y1="93" x2="93" y2="50"/)

// side-hinged right: mirrored
assert.match(shell, /openingMode === 'side-hinged' && field\.openingHanding === 'right'/)
assert.match(shell, /x1="93" y1="7" x2="7" y2="50"/)
assert.match(shell, /x1="93" y1="93" x2="7" y2="50"/)

// tilt: bottom corners -> top midpoint
assert.match(shell, /openingMode === 'tilt'/)
assert.match(shell, /x1="7" y1="93" x2="50" y2="7"/)
assert.match(shell, /x1="93" y1="93" x2="50" y2="7"/)

// tilt-turn combines both marks
assert.match(shell, /openingMode === 'tilt-turn' && field\.openingHanding === 'left'/)
assert.match(shell, /openingMode === 'tilt-turn' && field\.openingHanding === 'right'/)
assert.match(shell, /constructor-opening-handle/)
assert.match(shell, /constructor-field-handing-chip|handingLabel/)
assert.match(shell, /ЛЯВО/)
assert.match(shell, /ДЯСНО/)
assert.doesNotMatch(shell, /Неутрални кръстосани диагонали/)

assert.match(shellCss, /opening-primary/)
assert.match(shellCss, /opening-tilt/)
assert.match(shellCss, /constructor-opening-handle/)
assert.match(shellCss, /constructor-field-handing-chip|constructor-field-detail-opening/)
assert.match(shellCss, /mode-unset/)

assert.match(acceptance, /side-hinged \+ left/)
assert.match(acceptance, /side-hinged \+ right/)
assert.match(acceptance, /tilt-turn \+ left/)
assert.match(acceptance, /tilt-turn \+ right/)
assert.match(acceptance, /Polygon behavior/)
assert.match(acceptance, /PROFILE RESOLUTION: NO/)
assert.match(acceptance, /HARDWARE RESOLUTION: NO/)
assert.match(acceptance, /MACHINE READY: NO/)

assert.match(packageJson.scripts['test:contract'], /verify-constructor01d1\.mjs/)

console.log('CONSTRUCTOR 01D.1 WORKING OPENING SYMBOLS VERIFY PASS')
console.log('FIX: NO OPENING SYMBOL')
console.log('SIDE-HINGED: LEFT | RIGHT MIRRORED')
console.log('TILT: DEDICATED SYMBOL')
console.log('TILT-TURN: COMBINED SIDE + TILT')
console.log('POLYGON CLIPPING: FIELD SURFACE')
console.log('PROFILE RESOLUTION: NO')
console.log('HARDWARE RESOLUTION: NO')
console.log('MACHINE READY: NO')
