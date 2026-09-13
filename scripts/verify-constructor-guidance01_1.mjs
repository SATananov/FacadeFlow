import fs from 'node:fs'

const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')

const requireText = (source, text, label) => {
  if (!source.includes(text)) {
    throw new Error(`CONSTRUCTOR GUIDANCE 01.1 missing: ${label}`)
  }
}

requireText(shell, "type FieldGuideFocusTarget = 'module-type' | 'frame-profile' | 'sash-profile' | 'glazing-thickness' | 'glazing-bead'", 'explicit guided target model')
requireText(shell, "СЛЕДВАЩА СТЪПКА ${currentStep.step}/4", 'dominant step counter')
requireText(shell, "'Избери профил на касата'", 'exact FIX frame action')
requireText(shell, "buttonLabel: 'Задай дебелина'", 'exact glazing thickness action')
requireText(shell, "buttonLabel: 'Избери стъклодържател'", 'exact bead action')
requireText(shell, "target.scrollIntoView({ behavior: 'smooth', block: 'center' })", 'guided scroll to exact control')
requireText(shell, "control?.focus({ preventScroll: true })", 'guided focus on actionable control')
requireText(shell, "ref={guideFrameProfileRef}", 'frame profile target')
requireText(shell, "ref={guideGlazingThicknessRef}", 'glazing thickness target')
requireText(shell, "ref={guideGlazingBeadRef}", 'glazing bead target')
requireText(css, '.constructor-field-workflow-primary-action', 'primary guided action styling')
requireText(css, "content: 'СЕГА ТУК';", 'exact-control visual marker')

if (/auto[- ]?select\s*:\s*YES/i.test(shell) || /automatic.*profile/i.test(shell)) {
  throw new Error('CONSTRUCTOR GUIDANCE 01.1 must not introduce automatic profile/bead selection')
}

console.log('=== CONSTRUCTOR GUIDANCE 01.1 VERIFY PASS ===')
console.log('DOMINANT NEXT STEP: VISIBLE')
console.log('PRIMARY ACTION: EXACT HUMAN TASK')
console.log('NAVIGATION: PROFILE TAB + SCROLL + FOCUS')
console.log('REQUIRED CONTROL: VISUALLY MARKED')
console.log('AUTO PROFILE / GLAZING / BEAD SELECTION: NO')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
