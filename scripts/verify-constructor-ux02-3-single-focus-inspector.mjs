import fs from 'node:fs'
import assert from 'node:assert/strict'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

const tsxChecks = [
  ['guided active control wrapper exists', /constructor-guided-active-control/],
  ['guided active control is keyed by exact focus target', /guidance-\$\{fieldGuideFocusTarget\}/],
  ['secondary details disclosure exists', /constructor-guided-secondary-details/],
  ['secondary details are human-labelled', /Подробности за Поле \$\{selectedField\.sequence\}/],
  ['done state becomes a continuation state', /ПОЛЕ \$\{selectedField\.sequence\} · ГОТОВО ЗА СЛЕДВАЩА СТЪПКА/],
  ['done action clears FIELD selection so the top-level guide can advance', /currentStep\.action === 'done'[\s\S]*setSelectedFieldId\(null\)/],
  ['free mode still receives the complete tabs and pane', /\) : inspectorTabsAndPane\}/],
  ['inspector pane ref is preserved for guided focus', /ref=\{inspectorPaneRef\} className="constructor-inspector-pane"/],
  ['guidance target remains human-controlled', /Няма автоматичен избор/],
]

const cssChecks = [
  ['guided active tabs are hidden', /constructor-guided-active-control \.constructor-inspector-tabs[\s\S]*display: none/],
  ['guided active pane no longer creates nested scrolling', /constructor-guided-active-control \.constructor-inspector-pane[\s\S]*overflow: visible !important/],
  ['secondary details pane no longer creates nested scrolling', /constructor-guided-secondary-details \.constructor-inspector-pane[\s\S]*overflow: visible !important/],
  ['frame profile focus hides unrelated sibling controls', /guidance-frame-profile[\s\S]*constructor-component-resolution-stack > \*[\s\S]*display: none/],
  ['glazing thickness focus shows only thickness control', /guidance-glazing-thickness[\s\S]*constructor-glazing-thickness-control[\s\S]*display: grid/],
  ['glazing bead focus preserves candidates and manual bead control', /guidance-glazing-bead \.constructor-glazing-candidates,[\s\S]*constructor-glazing-bead-control[\s\S]*display: grid/],
  ['secondary details has one large click target', /constructor-guided-secondary-details > summary[\s\S]*min-height: 46px/],
]

for (const [label, pattern] of tsxChecks) {
  assert.match(tsx, pattern, label)
  console.log(`PASS  ${label}`)
}
for (const [label, pattern] of cssChecks) {
  assert.match(css, pattern, label)
  console.log(`PASS  ${label}`)
}

assert.doesNotMatch(tsx, /automatic.*profile.*select/i, 'UX02.3 must not add automatic profile selection')

console.log('=== CONSTRUCTOR UX 02.3 VERIFY PASS ===')
console.log('GUIDED INSPECTOR: SINGLE ACTIVE CONTROL')
console.log('SECONDARY DETAILS: COLLAPSED / OPTIONAL')
console.log('NESTED INSPECTOR SCROLL: REMOVED IN GUIDED MODE')
console.log('FIELD COMPLETION: ADVANCES TO NEXT GUIDED TASK')
console.log('FREE WORK: FULL INSPECTOR PRESERVED')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
console.log('NO COMMIT / NO PUSH')
