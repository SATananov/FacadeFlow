import assert from 'node:assert/strict'
import fs from 'node:fs'
import { runInNewContext } from 'node:vm'
import { readSource, functionNode, callNames, code, requireJsxHandler, dragBranch, cssRules, uniqueCssValue, ts } from './constructor-source-inspection.mjs'

const shell = readSource(new URL('../src/components/ConstructorShell.tsx', import.meta.url))
const coordinatesPath = new URL('../src/components/constructorCoordinates.ts', import.meta.url)
const coordinates = readSource(coordinatesPath)
const rules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))

// Only dependency-free view transforms are evaluated in memory. No app, DOM or output files.
const output = ts.transpileModule(fs.readFileSync(coordinatesPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(output, { exports }, { timeout: 1000 })
const { screenToCadWorld, cadWorldToScreen, frameOriginInCadWorld, screenToFrameLocal, screenToConstructionWorld } = exports
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, actual + ' != ' + expected)
for (const pxPerMm of [0.07, 0.154, 0.28, 0.56]) {
  for (const placement of [{ xMm: -200, yMm: -40 }, { xMm: 350.5, yMm: 210.25 }]) {
    for (const pan of [{ xPx: 0, yPx: 0 }, { xPx: 137, yPx: -83 }]) {
      const viewport = { origin: { xPx: 128 + pan.xPx, yPx: 224 + pan.yPx }, pxPerMm }
      const frame = { xMm: 420, yMm: 260, widthMm: 1200, heightMm: 1800 }
      const view = { frame, placement }
      const before = JSON.stringify(view)
      const origin = frameOriginInCadWorld(view)
      // Interior divider / endpoint and frame edges, after Fit or visual moves.
      for (const local of [{ xMm: 0, yMm: 0 }, { xMm: 1200, yMm: 1800 }, { xMm: 500, yMm: 700 }]) {
        const world = { xMm: origin.xMm + local.xMm, yMm: origin.yMm + local.yMm }
        const screen = cadWorldToScreen(world, viewport)
        const roundTrip = screenToCadWorld(screen, viewport)
        const framePoint = screenToFrameLocal(screen, viewport, view)
        const technical = screenToConstructionWorld(screen, viewport, view)
        near(roundTrip.xMm, world.xMm); near(roundTrip.yMm, world.yMm)
        near(framePoint.xMm, local.xMm); near(framePoint.yMm, local.yMm)
        near(technical.xMm - frame.xMm, local.xMm); near(technical.yMm - frame.yMm, local.yMm)
      }
      const zero = screenToCadWorld(viewport.origin, viewport)
      near(zero.xMm, 0); near(zero.yMm, 0)
      assert.equal(JSON.stringify(view), before, 'View conversion must not mutate geometry')
    }
  }
}

assert.ok(callNames(functionNode(shell, 'cadPointFromPointer')).includes('screenToCadWorld'))
assert.ok(callNames(functionNode(shell, 'framePointFromPointer')).includes('screenToFrameLocal'))
assert.ok(callNames(functionNode(shell, 'pointFromPointer')).includes('framePointFromPointer'))
assert.ok(!callNames(functionNode(coordinates, 'screenToCadWorld')).length)
for (const insertion of ['addDivider', 'addAngledDivider']) {
  for (const handler of requireJsxHandler(shell, 'onPointerDown', insertion)) {
    assert.ok(callNames(handler).includes('framePointFromPointer'), insertion + ' must use local frame coordinates')
  }
}
for (const kind of ['divider', 'angled-divider', 'angled-endpoint']) {
  assert.ok(callNames(dragBranch(shell, kind)).includes('framePointFromPointer'))
}
const move = dragBranch(shell, 'move-frame')
assert.match(code(move), /world\.xMm - dragState\.startPointer\.xMm/)
assert.deepEqual(callNames(move).filter((name) => /^(set|broadcast|commit)/.test(name)), ['setFramePlacementOffsetMm'])
const zoom = functionNode(shell, 'changeViewZoom')
assert.deepEqual(callNames(zoom).filter((name) => name.startsWith('set')), ['setAutoFitEnabled', 'setZoom'])
requireJsxHandler(shell, 'onClick', 'changeViewZoom')
requireJsxHandler(shell, 'onClick', 'restoreFitView')
requireJsxHandler(shell, 'onPointerDownCapture', 'handleCanvasPointerDownCapture')
assert.match(code(functionNode(shell, 'fitViewToFrame')), /MIN_VIEW_ZOOM/)
assert.doesNotMatch(code(functionNode(shell, 'fitViewToFrame')), /Math\.max\(MIN_VIEW_ZOOM, 55\)/)
assert.match(code(shell), /if \(browserZoomChanged\)\s*return/)
assert.match(code(shell), /gridVisible && !isCompositeView/)
assert.equal(uniqueCssValue(rules, '.constructor-canvas', 'background-position'), '0 0')
assert.equal(uniqueCssValue(rules, '.constructor-ruler-top', 'left'), 'var(--constructor-cad-left)')
assert.equal(uniqueCssValue(rules, '.constructor-ruler-left', 'top'), 'var(--constructor-cad-top)')
assert.equal(uniqueCssValue(rules, '.constructor-canvas', 'inset'), 'var(--constructor-cad-top) 0 var(--constructor-cad-bottom) var(--constructor-cad-left)')
assert.ok(!rules.some((rule) => rule.selector.includes('constructor-canvas') && rule.selector !== '.constructor-canvas'
  && rule.declarations.some((declaration) => declaration.property === 'background-position')))
console.log('CONSTRUCTOR VIEW: coordinate unit cases + source contracts passed; browser interaction not exercised.')
