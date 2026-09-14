import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Execute the real viewport hook against measured canvases. Browser acceptance
// separately verifies native scrolling, nested dialogs and catalogue rendering.
const source = readFileSync(new URL('../src/components/useDrawingViewport.ts', import.meta.url), 'utf8')
let current
const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
const react = {
  useState(initial) {
    const h = current, i = h.index++
    if (!(i in h.slots)) h.slots[i] = initial
    return [h.slots[i], next => {
      const value = typeof next === 'function' ? next(h.slots[i]) : next
      if (!Object.is(value, h.slots[i])) { h.slots[i] = value; h.dirty = true }
    }]
  },
  useRef(initial) { const i = current.index++; return current.slots[i] ??= { current: initial } },
  useLayoutEffect(fn, deps) {
    const h = current, i = h.index++
    if (!equal(h.slots[i], deps)) { h.slots[i] = deps; h.effects.push(fn) }
  },
}
const module = { exports: {} }
new Function('require', 'exports', 'ResizeObserver', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(() => react, module.exports, class { observe() {} disconnect() {} })

function fixture(width, height, viewportWidth, viewportHeight) {
  const h = { slots: [], index: 0, effects: [], dirty: true, key: 'overview' }
  const viewport = { clientWidth: viewportWidth, clientHeight: viewportHeight, scrollLeft: 0, scrollTop: 0,
    scrollTo({ left, top }) { this.scrollLeft = left; this.scrollTop = top } }
  const canvas = { offsetWidth: width, offsetHeight: height }
  h.render = () => {
    for (let i = 0; i < 12; i++) {
      current = h; h.index = 0; h.effects = []; h.dirty = false
      h.value = module.exports.useDrawingViewport(h.key)
      h.value.viewportRef.current = viewport; h.value.canvasRef.current = canvas
      h.effects.forEach(fn => fn())
      if (!h.dirty) return
    }
    throw new Error('Viewport did not settle')
  }
  h.render()
  return { h, viewport, canvas }
}

for (const [width, height, vw, vh] of [[1280, 517, 1760, 810], [1446, 640, 1712, 824], [1446, 640, 1136, 584]]) {
  const { h, viewport, canvas } = fixture(width, height, vw, vh)
  assert.ok(h.value.fit)
  assert.ok(h.value.pageStyle.width <= vw - 31)
  assert.ok(h.value.pageStyle.height <= vh - 31)
  h.value.setZoom(200); h.render()
  assert.equal(h.value.zoom, 200)
  assert.ok(h.value.spaceStyle.width > vw, 'Full scaled width is reserved')
  assert.ok(h.value.spaceStyle.height > vh, 'Full scaled height is reserved')
  viewport.scrollLeft = 300; viewport.scrollTop = 100
  const centerX = (viewport.scrollLeft + vw / 2 - 16) / 2
  const centerY = (viewport.scrollTop + vh / 2 - 16) / 2
  h.value.setZoom(250); h.render()
  assert.ok(Math.abs((viewport.scrollLeft + vw / 2 - 16) / 2.5 - centerX) < 0.01)
  assert.ok(Math.abs((viewport.scrollTop + vh / 2 - 16) / 2.5 - centerY) < 0.01)
  h.value.setZoom(100); h.render()
  assert.equal(h.value.pageStyle.width, width)
  assert.equal(h.value.pageStyle.height, height)
  h.value.fitToView(); h.render()
  assert.equal(viewport.scrollLeft, 0); assert.equal(viewport.scrollTop, 0)
  h.value.setZoom(200); h.render()
  h.key = 'source'; canvas.offsetWidth = 848; canvas.offsetHeight = 1200; h.render()
  assert.ok(h.value.fit, 'Changing drawings measures and fits the new content')
  assert.ok(h.value.pageStyle.height <= vh - 31)
}
console.log('PASS: measured fit, full X/Y canvas, stable zoom center, 100%, refit after navigation')
