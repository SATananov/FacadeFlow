import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const { buildCompositeStructuralSketchProjection: project } = load('src/components/compositeStructuralSketchProjection')
const { CompositeStructuralSketch: Sketch } = load('src/components/CompositeStructuralSketch')

let passed = 0
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
function nodes(value, acc = []) {
  if (value == null || typeof value === 'boolean') return acc
  if (Array.isArray(value)) { value.forEach((item) => nodes(item, acc)); return acc }
  if (typeof value !== 'object') return acc
  acc.push(value)
  nodes(value.props?.children, acc)
  return acc
}
function text(value) {
  if (value == null || typeof value === 'boolean') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(text).join(' ')
  if (typeof value === 'object') return text(value.props?.children)
  return ''
}
function structure() {
  return { schemaVersion: 2, systemId: 'kmg-prelude-60', frameParts: [
    { id: 'window', function: 'window', widthMm: 1500, heightMm: 1500, frameProfileCode: '482.30', fieldIds: [],
      frameSides: { top: true, right: true, bottom: true, left: true }, placement: { order: 1, verticalAlignment: 'TOP' } },
    { id: 'door', function: 'door', widthMm: 700, heightMm: 2000, frameProfileCode: '482.20', fieldIds: [],
      frameSides: { top: true, right: true, bottom: false, left: true }, placement: { order: 2, verticalAlignment: 'TOP' } },
  ], connections: [{ id: 'zero', fromFramePartId: 'window', toFramePartId: 'door', kind: 'ZERO_DIVIDER' }] }
}

test('projection exposes only presentation metadata needed by the technical sketch', () => {
  const result = project(structure())
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.parts.map((part) => [part.id, part.function, part.profileCode, part.widthMm, part.heightMm]), [
    ['window', 'window', '482.30', 1500, 1500],
    ['door', 'door', '482.20', 700, 2000],
  ])
})

test('frame sides render as visible schematic bands; door bottom stays absent', () => {
  const tree = Sketch({ projection: project(structure()), scale: 0.18, offset: { xPx: 20, yPx: 30 } })
  const windowNode = nodes(tree).find((node) => node.props?.['data-frame-part-id'] === 'window')
  const doorNode = nodes(tree).find((node) => node.props?.['data-frame-part-id'] === 'door')
  const windowSides = nodes(windowNode).filter((node) => node.props?.['data-frame-band'] === 'schematic').map((node) => node.props['data-frame-side'])
  const doorSides = nodes(doorNode).filter((node) => node.props?.['data-frame-band'] === 'schematic').map((node) => node.props['data-frame-side'])
  assert.deepEqual(windowSides, ['top', 'right', 'bottom', 'left'])
  assert.deepEqual(doorSides, ['top', 'right', 'left'])
  assert.ok(text(windowNode).includes('482.30'))
  assert.ok(text(doorNode).includes('482.20'))
})

test('ZERO_DIVIDER is visually anchored to the participating door contact side', () => {
  const tree = Sketch({ projection: project(structure()), scale: 0.18, offset: { xPx: 20, yPx: 30 } })
  const marker = nodes(tree).find((node) => node.props?.['data-connection-id'] === 'zero')
  assert.ok(marker)
  assert.equal(marker.props['data-zero-divider-anchor-id'], 'door')
  assert.equal(marker.props['data-zero-divider-anchor-side'], 'left')
  assert.ok(text(marker).includes('Нулев делител'))
})

test('reversed connection direction does not move the marker away from the door', () => {
  const value = structure()
  value.connections[0].fromFramePartId = 'door'
  value.connections[0].toFramePartId = 'window'
  const tree = Sketch({ projection: project(value), scale: 0.18, offset: { xPx: 20, yPx: 30 } })
  const marker = nodes(tree).find((node) => node.props?.['data-connection-id'] === 'zero')
  assert.equal(marker.props['data-zero-divider-anchor-id'], 'door')
  assert.equal(marker.props['data-zero-divider-anchor-side'], 'left')
})

test('no connection invents no zero-divider marker', () => {
  const value = structure(); value.connections = []
  const tree = Sketch({ projection: project(value), scale: 0.18, offset: { xPx: 20, yPx: 30 } })
  assert.equal(nodes(tree).filter((node) => node.props?.['data-zero-divider-anchor-id']).length, 0)
  assert.ok(!text(tree).includes('Нулев делител'))
})

test('technical frame face stays explicitly presentation-only in source and docs', () => {
  const source = readFileSync(new URL('../src/components/CompositeStructuralSketch.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/components/CompositeStructuralSketch.css', import.meta.url), 'utf8')
  assert.match(source, /Presentation-only face width/)
  assert.match(source, /NOT an engineering\/profile dimension/)
  assert.match(css, /presentation face/)
  assert.match(css, /NOT a production profile section/)
  assert.doesNotMatch(source, /overlapMm|insetMm|cutMm|seatMm/)
})

console.log(`COMPOSITE TECHNICAL SKETCH 01D.2C PASS: ${passed} cases`)
console.log('STRUCTURAL SKETCH PROJECTION = VIEW ONLY')
console.log('FRAME BAND WIDTH = PRESENTATION ONLY')
console.log('ZERO DIVIDER = EXPLICIT RELATIONSHIP MARKER, NOT PHYSICAL PROFILE')
console.log('AUTOMATIC GEOMETRY = NO')
console.log('AUTOMATIC PLACEMENT = NO')
console.log('RULES VALIDATED = NO')
console.log('MACHINE READY = NO')
console.log('EXACT CUT / OVERLAP / INSET = UNKNOWN')
