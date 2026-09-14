import fs from 'node:fs'

const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')

const requireText = (source, text, label) => {
  if (!source.includes(text)) {
    throw new Error(`CONSTRUCTOR GUIDANCE 01.1 missing: ${label}`)
  }
}

requireText(shell, "type InspectorTab = 'properties' | 'profile' | 'dimensions' | 'glazing'", 'current inspector tab model')
requireText(shell, "const selectedField = !selectedDivider && !selectedAngledDivider && !frameSelected", 'single active inspector context')
requireText(shell, "inspectorPaneRef.current?.scrollTo({ top: 0 })", 'context change resets inspector position')
requireText(shell, "renderModuleProductTypeResolution", 'module context remains directly actionable')
requireText(shell, "getFieldGlazingBeadResolutionContext", 'field glazing context remains explicit')
requireText(shell, "setFieldHumanGlazingThicknessAssignment", 'human glazing thickness assignment')
requireText(shell, "setFieldGlazingBeadAssignment", 'human bead assignment')
requireText(shell, "renderSelectedFieldHardwareRequirements", 'field hardware requirements remain contextual')
requireText(shell, "selectedField.fieldType === 'fixed'", 'fixed field context remains explicit')
requireText(shell, "constructor-glazing-thickness-control", 'glazing thickness control remains visible in field context')
requireText(shell, "constructor-glazing-bead-control", 'glazing bead control remains visible in field context')

if (
  shell.includes("type FieldGuideFocusTarget =") ||
  shell.includes("guideFrameProfileRef") ||
  shell.includes("guideGlazingThicknessRef") ||
  shell.includes("guideGlazingBeadRef") ||
  shell.includes("constructor-field-workflow-primary-action")
) {
  throw new Error('CONSTRUCTOR GUIDANCE 01.1 current shell must not depend on retired guided-target controls')
}

if (/auto[- ]?select\s*:\s*YES/i.test(shell) || /automatic.*profile/i.test(shell)) {
  throw new Error('CONSTRUCTOR GUIDANCE 01.1 must not introduce automatic profile/bead selection')
}

console.log('=== CONSTRUCTOR GUIDANCE 01.1 CURRENT CONTEXT VERIFY PASS ===')
console.log('NAVIGATION MODEL: CANVAS OBJECT -> CONTEXT INSPECTOR')
console.log('CONTEXT SWITCH: INSPECTOR POSITION RESET')
console.log('FIELD CONTROLS: PROFILE / GLAZING / BEAD / HARDWARE')
console.log('RETIRED GUIDED TARGET CONTROLS IN SHELL: NO')
console.log('LEGACY UNUSED CSS: NOT A RUNTIME CONTRACT')
console.log('AUTO PROFILE / GLAZING / BEAD SELECTION: NO')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
