import assert from 'node:assert/strict'
import { readSource, functionNode, callNames, code, requireJsxHandler } from './constructor-source-inspection.mjs'

const shell = readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
const move = functionNode(shell, 'handleCanvasPointerMove')
assert.ok(callNames(move).includes('pointFromPointer'), 'Resize must remove visual placement and pan offsets')
assert.match(code(move), /widthMm: Math\.max\(point\.xMm - original\.xMm, getMinFrameDimension\('vertical'\)\)/)
assert.match(code(move), /heightMm: Math\.max\(point\.yMm - original\.yMm, getMinFrameDimension\('horizontal'\)\)/)
assert.doesNotMatch(code(shell), /MAX_WORLD_MM/)
assert.ok(callNames(functionNode(shell, 'restoreFitView')).includes('fitViewToFrame'))
requireJsxHandler(shell, 'onClick', 'restoreFitView')
assert.equal(requireJsxHandler(shell, 'onPointerDown', 'startEdgeResize').length, 4)
console.log('RESIZE SOURCE CONTRACT: canonical pointer conversion, minimum dimensions and no legacy world cap. Interaction not exercised.')
