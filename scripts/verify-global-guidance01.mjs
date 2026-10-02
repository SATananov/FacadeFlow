import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRuntimeLoader } from './runtime-loader.mjs'

const root = new URL('../', import.meta.url)
const source = path => readFileSync(new URL(path, root), 'utf8')
const { GlobalGuidance, GUIDANCE, getGuidanceContext } = createRuntimeLoader()('src/components/GlobalGuidance.tsx')
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes)
  : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : []
const text = tree => Array.isArray(tree) ? tree.map(text).join(' ')
  : tree && typeof tree === 'object' ? text(tree.props?.children) : String(tree ?? '')

const screen = { section: 'home', constructorMode: null, offerStartOpen: false, offerStep: 1, composite: false }
assert.equal(getGuidanceContext(screen), 'home')
for (const [index, context] of ['offer-client', 'offer-system', 'offer-materials', 'offer-modules'].entries()) {
  assert.equal(getGuidanceContext({ ...screen, offerStartOpen: true, offerStep: index + 1 }), context)
}
for (const section of ['orders', 'completed-orders', 'catalogs', 'models']) {
  assert.equal(getGuidanceContext({ ...screen, section }), section)
}
for (const constructorMode of ['free', 'offer']) {
  assert.equal(getGuidanceContext({ ...screen, constructorMode, offerStartOpen: true }), 'constructor')
  assert.equal(getGuidanceContext({ ...screen, constructorMode, composite: true }), 'composite')
}

for (const context of Object.keys(GUIDANCE)) {
  const id = `test-${context}`
  const tree = GlobalGuidance({ id, context, navigation: true })
  const all = nodes(tree)
  const trigger = all.find(n => n.type === 'button' && n.props.popoverTargetAction !== 'hide')
  const panel = all.find(n => n.type === 'aside')
  const close = all.find(n => n.props?.popoverTargetAction === 'hide')
  assert.equal(trigger.props.popoverTarget, id)
  assert.equal(trigger.props['aria-controls'], id)
  assert.match(text(trigger), /Помощ/)
  assert.equal(panel.props.id, id)
  assert.equal(panel.props.popover, 'auto', 'Native light dismiss and Escape, non-modal')
  assert.equal(panel.props['aria-modal'], undefined)
  assert.equal(panel.props['aria-labelledby'], `${id}-title`)
  assert.ok(all.some(n => n.props?.id === `${id}-title`))
  assert.equal(close.props.popoverTarget, id)
  assert.equal(close.props.autoFocus, true)
  assert.match(text(close), /Затвори/)
  assert.match(text(panel), /Следваща стъпка/)
  assert.doesNotMatch(text(panel), /рисуване|чертане/i)
  let focused = 0
  const currentTarget = { querySelector() { return { focus() { focused++ } } } }
  panel.props.onToggle({ newState: 'open', currentTarget })
  assert.equal(focused, 1, 'Opening moves keyboard focus inside the help, away from assembly Escape handling')
  panel.props.onToggle({ newState: 'closed', currentTarget })
  assert.equal(focused, 1, 'Closing lets the browser return focus to the trigger')
  let stopped = 0
  panel.props.onKeyDown({ key: 'Escape', stopPropagation() { stopped++ } })
  assert.equal(stopped, 1, 'Escape must not close the underlying assembly workspace')
  panel.props.onKeyDown({ key: 'Tab', stopPropagation() { stopped++ } })
  assert.equal(stopped, 1, 'Normal keyboard navigation is preserved')
}
const constructorText = text(GlobalGuidance({ id: 'constructor-test', context: 'constructor' }))
assert.match(constructorText, /скица|скицата/i)
assert.match(constructorText, /FIELD/)
assert.match(constructorText, /Делителите служат за позиция/)
assert.match(constructorText, /информационни означения/)
assert.match(constructorText, /Неизвестните връзки остават неизвестни/)
assert.match(constructorText, /не прави сглобката готова за машинно производство/)
const offerText = text(GlobalGuidance({ id: 'offer-test', context: 'offer-client' }))
assert.match(offerText, /Полетата със \* са задължителни/)
assert.match(offerText, /1 · Клиент и обект/)

const app = source('src/App.tsx')
assert.match(app, /<GlobalGuidance id="global-guidance" navigation context=\{getGuidanceContext\(/)
assert.match(app, /section: headerSection, constructorMode, offerStartOpen, offerStep: offerFlowStep, composite: Boolean\(compositeEditing\)/)
assert.doesNotMatch(app, /headerSection === 'help'/, 'No second Help page or navigation away from current work')
assert.match(source('src/components/AssemblyReviewPanel.tsx'), /<GlobalGuidance id="assembly-guidance" context="assembly"/)
const help = source('src/components/GlobalGuidance.tsx')
assert.doesNotMatch(help, /localStorage|sessionStorage|useEffect|useState|onDraftChange|setConstructorMode|\.\/.*domain/)
assert.equal(source('src/components/GlobalGuidance.css').match(/::backdrop\s*\{\s*background:\s*([^;]+);/)?.[1].trim(), 'transparent')

// Check the exact pre-feature source snapshot without requiring Git or a ZIP.
// Only App, AssemblyReviewPanel and the two new presentation files are excluded.
// All geometry, catalogue, validation, save/load, Constructor TSX/CSS and assets
// (including added/deleted paths) are protected. Future intentional source work
// must explicitly establish a new baseline for this checkpoint-specific guard.
const presentation = new Set(['src/App.tsx', 'src/components/AssemblyReviewPanel.tsx',
  'src/components/GlobalGuidance.tsx', 'src/components/GlobalGuidance.css'])
function files(path) {
  return readdirSync(new URL(`${path}/`, root), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(`${path}/${entry.name}`) : [`${path}/${entry.name}`])
}
const hash = createHash('sha256')
for (const path of files('src').filter(path => !presentation.has(path)).sort()) {
  hash.update(path).update('\0').update(readFileSync(fileURLToPath(new URL(path, root)))).update('\0')
}
assert.equal(hash.digest('hex'), '11afe8478764e1c7b16aebe18176a1c2cfe8d53bed6edbc9f2023448fe95653c',
  'Protected production sources must match the pre-GLOBAL GUIDANCE 01 checkpoint byte for byte')
console.log('GLOBAL GUIDANCE 01: PASS — contexts, native open/close contract, Escape isolation, terminology, protected source fingerprint')
console.log('AUTOMATIC GEOMETRY = NO; RULES VALIDATED = NO; MACHINE READY = NO')

