import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const constructor = await readFile('src/components/ConstructorShell.tsx', 'utf8')
const acceptance = await readFile('docs/CONSTRUCTOR_GUIDANCE_01_FIRST_USE_FIELD_FLOW_ACCEPTANCE.md', 'utf8')
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

// Current accepted UX: canvas-first context inspector.
// Select the concrete object, then show only the controls for that context.
assert.match(constructor, /type InspectorTab = 'properties' \| 'profile' \| 'dimensions' \| 'glazing'/)
assert.match(constructor, /const selectedField = !selectedDivider && !selectedAngledDivider && !frameSelected/)
assert.match(constructor, /inspectorPaneRef\.current\?\.scrollTo\(\{ top: 0 \}\)/)
assert.match(constructor, /renderModuleProductTypeResolution/)
assert.match(constructor, /getFieldGlazingBeadResolutionContext/)
assert.match(constructor, /setFieldHumanGlazingThicknessAssignment/)
assert.match(constructor, /setFieldGlazingBeadAssignment/)
assert.match(constructor, /renderSelectedFieldHardwareRequirements/)
assert.match(constructor, /selectedField\.fieldType === 'fixed'/)
assert.match(constructor, /Стъклопакет/)
assert.match(constructor, /Стъклодържател/)
assert.match(constructor, /Профилен изглед/)
assert.doesNotMatch(constructor, /renderSelectedFieldWorkflowGuide/)
assert.doesNotMatch(constructor, /constructor-field-workflow-progress/)

assert.match(acceptance, /CONSTRUCTION TOPOLOGY: UNCHANGED/)
assert.match(acceptance, /AUTOMATIC BEAD SELECTION: NO/)
assert.match(acceptance, /BASE-PROFILE COMPATIBILITY: UNCONFIRMED/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-constructor-guidance01\.mjs/)

console.log('=== CONSTRUCTOR GUIDANCE 01 CURRENT CONTEXT VERIFY PASS ===')
console.log('FIRST-USE FLOW: CANVAS-FIRST CONTEXT INSPECTOR')
console.log('CONTEXT: MODULE / FIELD / DIVIDER')
console.log('TABS: PROPERTIES / PROFILE / GLAZING / DIMENSIONS')
console.log('AUTO PROFILE / GLAZING / BEAD SELECTION: NO')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
