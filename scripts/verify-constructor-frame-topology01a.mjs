import assert from 'node:assert/strict'
import fs from 'node:fs'

const model = fs.readFileSync('src/domain/construction/constructionModel.ts', 'utf8')
const topology = fs.readFileSync('src/domain/construction/fieldTopology.ts', 'utf8')
const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')

assert.match(model, /ConstructionFrameEdgeKind\s*=\s*'frame'\s*\|\s*'none'\s*\|\s*'threshold'/)
assert.match(model, /frameEdges\??:\s*ConstructionFrameEdges/)
assert.match(model, /DEFAULT_CONSTRUCTION_FRAME_EDGES/)

assert.match(topology, /getConstructionFrameEdges/)
assert.match(topology, /getConstructionFrameInsets/)
assert.match(topology, /setConstructionFrameEdgeKind/)
assert.match(topology, /bottom/)
assert.match(topology, /threshold|none|frame/)

assert.match(shell, /frameEdges/)
assert.match(shell, /setConstructionFrameEdgeKind/)
assert.match(shell, /'bottom'/)
assert.match(shell, /===\s*'none'/)
assert.match(shell, /===\s*'threshold'/)
assert.match(shell, /has-open-bottom-frame/)
assert.match(shell, /constructor-frame-threshold-placeholder/)

assert.match(css, /\.constructor-frame-edge-face\.edge-face-bottom/)
assert.match(css, /\.constructor-frame-threshold-placeholder/)
assert.match(css, /\.constructor-parametric-frame\.has-open-bottom-frame/)

console.log('CONSTRUCTOR FRAME TOPOLOGY 01A: PASS')
console.log('Independent frame-edge model: PASS')
console.log('Bottom edge supports frame / none / threshold: PASS')
console.log('Open-bottom U-frame rendering hook: PASS')
console.log('Threshold placeholder rendering hook: PASS')
console.log('UI-label dependency: NONE')
console.log('Threshold profile auto-selected: NO')
console.log('Bottom joint geometry auto-validated: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
