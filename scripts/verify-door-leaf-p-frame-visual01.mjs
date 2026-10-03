import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const c = load('src/domain/construction')
const { doorLeafVisualClass } = load('src/components/doorLeafVisual')
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : []
const has = (node, name) => node.props?.className?.split(' ').includes(name)
const oldWindow = globalThis.window
globalThis.window = { requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}, removeEventListener() {} }

function render(topology, productType) {
  const slots = []
  let index = 0
  const hooks = {
    useState(initial) { const i = index++; slots[i] ??= typeof initial === 'function' ? initial() : initial; return [slots[i], () => {}] },
    useRef(initial) { return { current: initial } },
    useMemo(fn) { return fn() }, useEffect() {},
  }
  const Shell = createRuntimeLoader({ react: hooks })('src/components/ConstructorShell.tsx').default
  return nodes(Shell({ mode: 'free', activeModuleId: 'test', moduleNumber: 1,
    moduleItems: [{ id: 'test', sequence: 1 }], onClose() {},
    initialDraft: { version: 'constructor-01d', frame: topology.frame, topology },
    moduleSummary: { productType, productTypeLabel: productType, widthMm: 1500, heightMm: 2200 },
  }))
}

try {
  for (const bottom of ['frame', 'none', 'threshold']) {
    let topology = c.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1500, heightMm: 2200 })
    topology = c.setConstructionFrameEdgeKind(topology, 'bottom', bottom)
    topology = c.splitField(topology, 'field-1', 'horizontal', 350)
    let fields = c.resolveConstructionTopology(topology).fields
    const transomId = fields[0].id
    topology = c.splitField(topology, fields[1].id, 'vertical', 450)
    fields = c.resolveConstructionTopology(topology).fields
    const sideId = fields[1].id
    const leafId = fields[2].id
    topology = c.setConstructionFieldType(topology, transomId, 'operable')
    topology = c.setConstructionFieldType(topology, sideId, 'fixed')
    topology = c.setConstructionFieldType(topology, leafId, 'operable')
    const before = JSON.stringify(topology)
    fields = c.resolveConstructionTopology(topology).fields
    for (const type of ['window', 'terrace-door', null, 'door']) {
      const classes = fields.map(f => doorLeafVisualClass(type, f, bottom, 2200, c.getConstructionFrameFaceMm(topology)))
      assert.deepEqual(classes, type === 'door' ? ['', '', `is-door-leaf door-leaf-bottom-${bottom}`] : ['', '', ''])
      const tree = render(topology, type)
      const surfaces = tree.filter(n => has(n, 'constructor-field-surface'))
      assert.equal(surfaces.length, 3, 'Topology retained')
      assert.equal(surfaces.filter(n => has(n, 'is-door-leaf')).length, type === 'door' ? 1 : 0)
      assert.equal(tree.filter(n => has(n, 'constructor-operable-sash-priority') && has(n, 'is-door-leaf')).length, type === 'door' ? 1 : 0)
      assert.equal(tree.filter(n => has(n, 'edge-face-bottom')).length, bottom === 'frame' ? 1 : 0)
      assert.equal(tree.filter(n => has(n, 'constructor-frame-threshold-placeholder')).length, bottom === 'threshold' ? 1 : 0)
      assert.equal(tree.some(n => has(n, 'has-open-bottom-frame')), bottom === 'none')
      assert.equal(JSON.stringify(topology), before, 'Rendering must not mutate persisted state')
    }
    const polygon = { ...fields[2], polygon: [{ xMm: 0, yMm: 0 }] }
    assert.equal(doorLeafVisualClass('door', polygon, bottom, 2200, c.getConstructionFrameFaceMm(topology)), '', 'No guessed polygon door geometry')
  }
  for (const mode of ['side-hinged', 'tilt', 'top-hung', 'tilt-turn', 'side-hinged-top-hung']) {
    for (const handing of [null, 'left', 'right']) {
      let topology = c.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 2200 })
      topology = c.setConstructionFieldType(topology, 'field-1', 'operable')
      topology = c.setConstructionFieldOpeningMode(topology, 'field-1', mode)
      topology = c.setConstructionFieldOpeningHanding(topology, 'field-1', handing)
      const signature = type => render(topology, type).filter(n => n.type === 'line' || n.type === 'circle').map(n => n.props)
      assert.deepEqual(signature('door'), signature('window'), `${mode}/${handing}: same opening symbols and known-data-only handle`)
    }
  }
} finally { globalThis.window = oldWindow }

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const css = read('src/components/ConstructorShell.css').split('/* DOOR LEAF / P-FRAME VISUAL SEMANTICS 01.')[1]
const helper = read('src/components/doorLeafVisual.ts')
const shell = read('src/components/ConstructorShell.tsx')
assert.ok(css)
assert.match(css, /\.door-leaf-bottom-none \{ --door-leaf-bottom-space: \d+px;/)
assert.match(css, /\.door-leaf-bottom-threshold \{ --door-leaf-bottom-space: \d+px;/)
assert.match(css, /\.constructor-field-surface\.is-door-leaf\.door-leaf-bottom-threshold \.constructor-sash-profile-visual \{\s*inset: -6px -6px var\(--door-leaf-bottom-space\);/)
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf\.door-leaf-bottom-threshold::before \{\s*inset: -6px -6px var\(--door-leaf-bottom-space\);/)
assert.match(css, /\.door-leaf-bottom-threshold \{ --door-leaf-bottom-space: 36px;/)
assert.match(css, /\.constructor-field-surface\.is-door-leaf \{\s*z-index: 9;/)
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf \{ z-index: 10;/)
assert.match(css, /\.is-door-sketch \.constructor-frame-threshold-placeholder/)
assert.doesNotMatch(css, /\d+(?:\.\d+)?mm\b|dist2bottom|E3308|482\.2[67]/i)
assert.doesNotMatch(helper + shell, /prelude60DoorEvidence|DIST2BOTTOM_SAVED|eval\(|new Function/)
assert.match(shell, /Схематично отстояние под крилото · без зададен физически размер/)
assert.match(shell, /constructor-frame-threshold-placeholder">ПРАГ<\/i/)
for (const boundary of ['AUTOMATIC GEOMETRY = NO', 'RULES VALIDATED = NO', 'MACHINE READY = NO']) {
  assert.ok(css.includes(boundary)); assert.ok(helper.includes(boundary))
  assert.ok(read('docs/DOOR_LEAF_P_FRAME_VISUAL_SEMANTICS_01_ACCEPTANCE.md').includes(boundary))
}
console.log('PASS DOOR LEAF / P-FRAME VISUAL SEMANTICS 01: rendered bottom states, multi-field scope, unchanged symbols/handles, no state mutation, pixel-only display, evidence isolation')
console.log('AUTOMATIC GEOMETRY = NO\nRULES VALIDATED = NO\nMACHINE READY = NO')
