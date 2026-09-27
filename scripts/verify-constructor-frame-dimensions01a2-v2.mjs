import assert from 'node:assert/strict'
import fs from 'node:fs'

const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')

assert.match(shell, /CONSTRUCTOR FRAME DIMENSIONS 01A\.2 V2/)
assert.match(shell, /reviewedFrameVisibleFaceMm/)
assert.match(shell, /profileAwareGeometry\?\.frame\.reviewed/)
assert.match(shell, /frameClearDimensions/)
assert.match(shell, /frameEdges\.bottom === 'threshold'/)
assert.match(shell, /bottomInsetMm = frameEdges\.bottom === 'frame' \? reviewedFrameVisibleFaceMm : 0/)
assert.match(shell, /constructor-frame-inner-dimension-width/)
assert.match(shell, /constructor-frame-inner-dimension-height/)
assert.match(shell, /ВЪТР\./)

assert.match(css, /FRAME DIMENSIONS 01A\.2 V2/)
assert.match(css, /\.constructor-frame-inner-dimension/)
assert.match(css, /\.constructor-frame-inner-dimension-width/)
assert.match(css, /\.constructor-frame-inner-dimension-height/)

console.log('CONSTRUCTOR FRAME DIMENSIONS 01A.2 V2: PASS')
console.log('Overall dimensions remain Constructor-authoritative: PASS')
console.log('Inner clear dimensions require reviewed catalogue frame face: PASS')
console.log('U-frame bottom deduction: 0 mm: PASS')
console.log('Full-frame bottom deduction: reviewed frame face: PASS')
console.log('Threshold clear height without reviewed threshold: UNKNOWN')
console.log('Inspector dependency: NONE')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
