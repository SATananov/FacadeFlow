import assert from 'node:assert/strict'
import { cssRules, uniqueCssValue } from './constructor-source-inspection.mjs'
import { readFile } from 'node:fs/promises'

const shell = await readFile(
  new URL('../src/components/ConstructorShell.tsx', import.meta.url),
  'utf8',
)
const css = await readFile(
  new URL('../src/components/ConstructorShell.css', import.meta.url),
  'utf8',
)
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const acceptance = await readFile(
  new URL('../docs/CONSTRUCTOR_01C_DIVIDERS_ACCEPTANCE.md', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

// 01C interaction baseline remains available after the 01C.1 topology upgrade.
assert.match(shell, /ConstructorDividerAxis/)
assert.match(shell, /vertical-divider/)
assert.match(shell, /horizontal-divider/)
assert.match(shell, /addDivider/)
assert.match(shell, /startDividerDrag/)
assert.match(shell, /commitDividerPosition/)
assert.match(shell, /removeSelectedDivider/)
assert.match(shell, /conceptualFieldCount/)
assert.match(shell, /(?:Позиция отляво|Светъл размер ляво поле|Схемен размер ляво поле)/)
assert.match(shell, /(?:Позиция отгоре|Светъл размер горно поле|Схемен размер горно поле)/)
assert.match(shell, /const conceptualFieldCount = fields\.length/)
assert.match(shell, /const selectedField = !selectedDivider && !selectedAngledDivider && !frameSelected/)
assert.match(shell, /constructor-frame-mitre/)
assert.match(css, /\.constructor-divider/)
assert.match(css, /\.constructor-field-number-badge/)
assert.match(css, /\.constructor-frame-mitre/)
assert.match(css, /1\.414214/)
const frameRules = cssRules(new URL('../src/components/ConstructorShell.css', import.meta.url))
for (const [corner, xEdge, yEdge, rotation] of [
  ['tl', 'left', 'top', '45deg'], ['tr', 'right', 'top', '-45deg'],
  ['bl', 'left', 'bottom', '-45deg'], ['br', 'right', 'bottom', '45deg'],
]) {
  const selector = '.constructor-parametric-frame .constructor-frame-mitre.mitre-' + corner
  assert.equal(uniqueCssValue(frameRules, selector, xEdge), '0')
  assert.equal(uniqueCssValue(frameRules, selector, yEdge), '0')
  assert.equal(uniqueCssValue(frameRules, selector, 'transform'), 'rotate(' + rotation + ')')
}
assert.match(css, /mitre-tr[\s\S]*rotate\(-45deg\)/)
assert.match(css, /mitre-br[\s\S]*rotate\(45deg\)/)
assert.match(app, /(?:offerModuleSketchDraft|moduleSketchDrafts)/)
assert.match(app, /onDraftChange=\{(?:setOfferModuleSketchDraft|setActiveModuleDraft)\}/)
assert.match(acceptance, /conceptual \*\*fields\*\*/i)
assert.match(acceptance, /term \*\*полета\*\*/i)
assert.match(acceptance, /Opening diagonals are \*\*not\*\* part of 01C/)
assert.match(acceptance, /four mirrored full-face 45° mitre lines/i)
assert.match(acceptance, /AUTOMATIC PRODUCTION GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01c\.mjs/)

console.log('CONSTRUCTOR 01C DIVIDERS BASELINE VERIFY PASS')
console.log('CREATE | SELECT | DRAG | NUMERIC POSITION | DELETE: PRESERVED')
console.log('FIELD TERMINOLOGY: ПОЛЕТА')
console.log('FRAME MITRES: PRESERVED')
console.log('FULL-SPAN LIMIT: SUPERSEDED BY CONSTRUCTOR 01C.3 FRAME-INTERIOR FIELD TOPOLOGY')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('MACHINE READY: NO')
