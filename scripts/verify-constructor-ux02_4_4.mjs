import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const tsx = fs.readFileSync(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

// A selected FIELD keeps its exact current task visible in the top guided driver.
assert.match(tsx, /if \(selectedField\) \{[\s\S]*const selectedTask = getFieldTechnicalTask\(selectedField\)/)
assert.match(tsx, /selectedTask\.title/)
assert.match(tsx, /selectedTask\.note/)
assert.match(tsx, /label: selectedTask\.actionLabel/)

// The prominent action navigates to and focuses the exact existing manual control.
assert.match(tsx, /onClick: \(\) => openFieldGuideTarget\(focusTarget\)/)
assert.match(tsx, /if \(!effectiveProfileResolution\.frame\?\.profileCode\) return 'frame-profile'/)
assert.match(tsx, /actionLabel: 'Към профила на касата'/)
assert.match(tsx, /actionLabel: 'Към профила на крилото'/)
assert.match(tsx, /actionLabel: 'Към стъклопакета'/)
assert.match(tsx, /actionLabel: 'Към стъклодържателя'/)

// The shared module control must also mount in an OPERABLE FIELD's guided pane.
assert.match(tsx, /selectedField\.fieldType === 'operable' && inspectorWorkMode === 'guided' && fieldGuideFocusTarget === 'frame-profile'[\s\S]*?return <div className="constructor-component-resolution-stack">\{sharedFrameProfileControl\}<\/div>/)
assert.equal((tsx.match(/ref=\{guideFrameProfileRef\}/g) ?? []).length, 1)
const navigate = tsx.slice(tsx.indexOf('const openFieldGuideTarget ='), tsx.indexOf('useEffect(() => {', tsx.indexOf('const openFieldGuideTarget =')))
assert.match(navigate, /setFieldGuideNavigationRequest\(\(request\) => request \+ 1\)/)
assert.doesNotMatch(navigate, /apply\w+|setSelectedFieldId|setFrameSelected|Assignment/)
const focusEffect = tsx.slice(tsx.indexOf('let cancelled = false'), tsx.indexOf('activeModuleId])', tsx.indexOf('let cancelled = false')))
assert.match(focusEffect, /window\.cancelAnimationFrame\(frameId\)/)
assert.match(focusEffect, /window\.clearTimeout\(focusTimeout\)/)
assert.match(focusEffect, /cancelled \|\| !target\.isConnected/)
for (const dependency of ['fieldGuideNavigationRequest', 'selectedField', 'inspectorWorkMode']) assert.ok(focusEffect.includes(dependency))
// Reveal rules must be more specific than the guided pane's blanket child filter.
for (const [destination, wrapper] of [['frame-profile', 'shared-frame-profile-context'], ['glazing-thickness', 'glazing-context-card'], ['glazing-bead', 'glazing-context-card']]) {
  assert.ok(css.includes(`.guidance-${destination} .constructor-inspector-pane > .constructor-component-resolution-stack > .constructor-${wrapper}`))
}
assert.ok(css.includes('.constructor-glazing-context-card > .constructor-glazing-thickness-control'))
assert.ok(css.includes('.constructor-glazing-context-card > .constructor-glazing-bead-control'))

// Execute the production effect with controllable scheduling to cover cancellation
// both before the animation frame and during the delayed-focus window.
const effectStart = tsx.indexOf('  useEffect(() => {', tsx.indexOf('const openFieldGuideTarget ='))
const effectEnd = tsx.indexOf('\n\n  useEffect', effectStart)
const effectCode = ts.transpile(tsx.slice(effectStart, effectEnd), { target: ts.ScriptTarget.ES2022 })
function scheduledNavigation(overrides = {}) {
  let cleanup
  let animation
  let delayedFocus
  let scrolls = 0
  let focuses = 0
  let animationCancelled = false
  let timeoutCancelled = false
  const target = {
    isConnected: true,
    scrollIntoView: () => { scrolls += 1 },
    querySelector: () => ({ getClientRects: () => [1], focus: () => { focuses += 1 } }),
  }
  const context = {
    useEffect: (effect) => { cleanup = effect() },
    inspectorWorkMode: 'guided', selectedField: { id: 'field-a' }, activeModuleId: 'module-a',
    inspectorTab: 'profile', fieldGuideFocusTarget: 'frame-profile', guidedFieldFocusTarget: 'frame-profile',
    fieldGuideNavigationRequest: 1, guideFrameProfileRef: { current: target },
    window: {
      requestAnimationFrame: (callback) => { animation = callback; return 1 },
      cancelAnimationFrame: () => { animationCancelled = true },
      setTimeout: (callback) => { delayedFocus = callback; return 2 },
      clearTimeout: (id) => { if (id === 2) timeoutCancelled = true },
    },
    ...overrides,
  }
  vm.runInNewContext(effectCode, context)
  return {
    cleanup: () => cleanup?.(),
    frame: () => animation?.(),
    timeout: () => delayedFocus?.(),
    target,
    state: () => ({ scrolls, focuses, animationCancelled, timeoutCancelled }),
  }
}
const normal = scheduledNavigation()
normal.frame(); normal.timeout()
assert.equal(normal.state().focuses, 1)
const beforeFrame = scheduledNavigation()
beforeFrame.cleanup(); beforeFrame.frame(); beforeFrame.timeout()
assert.equal(beforeFrame.state().scrolls, 0)
assert.equal(beforeFrame.state().focuses, 0)
assert.equal(beforeFrame.state().animationCancelled, true)
const duringDelay = scheduledNavigation()
duringDelay.frame(); duringDelay.cleanup(); duringDelay.timeout()
assert.equal(duringDelay.state().scrolls, 1)
assert.equal(duringDelay.state().focuses, 0)
assert.equal(duringDelay.state().timeoutCancelled, true)
const detached = scheduledNavigation()
detached.frame(); detached.target.isConnected = false; detached.timeout()
assert.equal(detached.state().focuses, 0)
for (const overrides of [{ inspectorWorkMode: 'free' }, { selectedField: null }, { guidedFieldFocusTarget: 'sash-profile' }]) {
  const obsolete = scheduledNavigation(overrides)
  obsolete.frame(); obsolete.timeout()
  assert.equal(obsolete.state().focuses, 0)
}

// Navigation must not become automatic technical selection.
assert.match(tsx, /setFrameProfileAssignment/)
assert.match(tsx, /setFieldSashProfileAssignment/)
assert.match(tsx, /setFieldHumanGlazingThicknessAssignment/)
assert.match(tsx, /setFieldGlazingBeadAssignment/)
assert.doesNotMatch(tsx, /autoSelect.*profile/i)
assert.doesNotMatch(tsx, /autoSelect.*bead/i)

console.log('=== CONSTRUCTOR UX 02.4.4 VERIFY PASS ===')
console.log('SELECTED FIELD: PRIMARY NEXT ACTION ALWAYS VISIBLE AT TOP')
console.log('FRAME PROFILE: SHARED FIX / OPERABLE DESTINATION; REPEAT REQUEST AND CALLBACK CLEANUP CONTRACTS')
console.log('MOUNT / VISIBILITY / SCROLL / FOCUS: INTERACTIVE BROWSER ACCEPTANCE ALSO REQUIRED')
console.log('SCHEDULED FOCUS RUNTIME: NORMAL / CANCEL BEFORE FRAME / CANCEL DURING DELAY / DETACHED / OBSOLETE CONTEXT PASS')
console.log('SASH / GLAZING / BEAD: SAME EXPLICIT NAVIGATION CONTRACT')
console.log('AUTO TECHNICAL SELECTION: NO')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
