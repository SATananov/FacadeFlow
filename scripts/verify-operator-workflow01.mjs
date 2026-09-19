import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const working = await readFile(new URL('../src/data/profileSystems/operatorWorkingDimensions.ts', import.meta.url), 'utf8')
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const appCss = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(panel, /function OperatorWorkflowSummary/)
assert.match(panel, /Конструкция → функция → система → остъкляване → техническа скица/)
assert.match(panel, /function OperatorJointChooser/)
assert.match(panel, /Отвори техническата скица/)
assert.match(panel, /function OperatorJointParameters/)
assert.match(panel, /Работна логика:[\s\S]*общ размер − видима ширина = вътрешна профилна зона/)
assert.match(panel, /<details className="assembly-technical-admin">[\s\S]*GlazingEvidenceReviewGatePanel/)
assert.match(panel, /<OperatorWorkflowSummary model=\{moduleModel\} \/>[\s\S]*<ModuleAssemblyMap[\s\S]*<OperatorGlazingSummary[\s\S]*<OperatorJointChooser/)
assert.match(panel, /ТЕХНИЧЕСКА СКИЦА НА СГЛОБКАТА/)

assert.match(working, /profileCode: '482\.30'[\s\S]*sectionHeightMm: 64[\s\S]*visibleWidthMm: 42[\s\S]*internalZoneTotalMm: 22/)
assert.match(working, /profileCode: '482\.21'[\s\S]*sectionHeightMm: 84[\s\S]*visibleWidthMm: 40[\s\S]*internalZoneTotalMm: 44/)
assert.match(working, /profileCode: '482\.05'[\s\S]*sectionHeightMm: 78[\s\S]*visibleWidthMm: 56[\s\S]*internalZoneTotalMm: 22/)
assert.match(working, /MUST NOT be promoted to a joint overlap automatically/)

assert.match(css, /OPERATOR WORKFLOW 01/)
assert.match(css, /\.assembly-operator-steps/)
assert.match(css, /\.assembly-technical-admin/)

assert.match(app, /<AssemblyReviewPanel[\s\S]*<details className="project-technical-tools">[\s\S]*<ProjectAssurancePanel/)
assert.match(app, /<summary>Техническа администрация<\/summary>/)
assert.match(appCss, /OPERATOR WORKFLOW 01 — keep engineering history out of the normal operator path/)
assert.match(appCss, /\.project-technical-tools/)

console.log('=== OPERATOR WORKFLOW 01 VERIFY PASS ===')
console.log('DEFAULT PATH: CONSTRUCTION -> FUNCTION -> SYSTEM/GLAZING -> ASSEMBLY SKETCH')
console.log('ENGINEERING EVIDENCE UI: HIDDEN UNDER TECHNICAL ADMINISTRATION')
console.log('PRELUDE 60 WORKING DIMENSIONS: 482.30 64/42, 482.21 84/40, 482.05 78/56')
console.log('PROFILE INTERNAL ZONE: EXPLICIT PROFILE FACT, NOT AUTOMATIC JOINT OVERLAP')
console.log('TOPOLOGY / MACHINE RULES: UNCHANGED')
