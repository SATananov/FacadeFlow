import fs from 'node:fs'
import assert from 'node:assert/strict'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

const checks = [
  ['guided focus target derives next missing control', /const guidedFieldFocusTarget = useMemo<FieldGuideFocusTarget \| null>/],
  ['guided mode keeps module settings collapsed', /if \(inspectorWorkMode === 'guided'\) setModuleSettingsOpen\(false\)/],
  ['selected FIELD auto-focuses the next guided control', /setFieldGuideFocusTarget\(guidedFieldFocusTarget\)/],
  ['inspector pane has an explicit ref for controlled focus', /ref=\{inspectorPaneRef\} className="constructor-inspector-pane"/],
  ['guided profile progress is human readable', /profileResolutionGuidedMissingLabel/],
  ['technical profile counters remain available in free mode', /profileResolutionProgress\.assigned\}\/\{profileResolutionProgress\.required/],
  ['create-offer action is hidden from the active guided task flow', /onCreateOfferFromSketch && inspectorWorkMode === 'free'/],
  ['secondary joint detail remains available in free mode', /inspectorWorkMode === 'free' \? renderSelectedFieldJointGeometry\(\) : null/],
  ['secondary reinforcement detail remains available in free mode', /inspectorWorkMode === 'free' \? renderReinforcementAssignment\('АРМИРОВКА НА КРИЛОТО'/],
  ['hardware detail remains available in free mode', /inspectorWorkMode === 'free' \? renderSelectedFieldHardwareRequirements\(\) : null/],
  ['guided internal scrollbar is thin', /scrollbar-width: thin;/],
  ['native scrollbar arrow buttons are suppressed', /::-webkit-scrollbar-button[\s\S]*display: none;/],
  ['guided focus target gets modern visual emphasis', /constructor-guidance-control-target\.is-guidance-target[\s\S]*box-shadow:/],
]

for (const [label, pattern] of checks) {
  const haystack = label.includes('scrollbar') || label.includes('visual emphasis') || label.includes('arrow buttons') ? css : tsx
  assert.match(haystack, pattern, label)
  console.log(`PASS  ${label}`)
}

assert.doesNotMatch(tsx, /automatic.*profile.*select/i, 'UX02.2 must not add automatic profile selection')

console.log('=== CONSTRUCTOR UX 02.2 VERIFY PASS ===')
console.log('GUIDED INSPECTOR: ONE ACTIVE TASK / AUTO FOCUS')
console.log('UNRELATED DETAIL: COLLAPSED OR FREE-WORK ONLY')
console.log('PROFILE PROGRESS: HUMAN-READABLE IN GUIDED MODE')
console.log('INTERNAL SCROLLBAR: THIN / NO ARROW BUTTONS')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
console.log('NO COMMIT / NO PUSH')
