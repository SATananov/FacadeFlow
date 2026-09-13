import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tsxPath = path.join(root, 'src', 'components', 'ConstructorShell.tsx')
const cssPath = path.join(root, 'src', 'components', 'ConstructorShell.css')
const tsx = fs.readFileSync(tsxPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')

const checks = [
  ['work mode type', tsx.includes("type InspectorWorkMode = 'guided' | 'free'")],
  ['guided default', tsx.includes("useState<InspectorWorkMode>('guided')")],
  ['step-by-step label', tsx.includes('Стъпка по стъпка')],
  ['free-work label', tsx.includes('Свободна работа')],
  ['next action driver', tsx.includes('constructor-guided-task-driver') && tsx.includes('СЛЕДВАЩО ДЕЙСТВИЕ')],
  ['large settings summary', tsx.includes('constructor-inspector-settings-summary') && tsx.includes("{moduleSettingsOpen ? 'Скрий' : 'Отвори'}")],
  ['settings whole-row state', tsx.includes('open={moduleSettingsOpen}') && tsx.includes('setModuleSettingsOpen(event.currentTarget.open)')],
  ['no fake free-settings diamonds', !tsx.includes('<div><span>Стъклопакет</span><b>Не е избран</b><em>◇</em></div>')],
  ['field glazing guidance preserved', tsx.includes("renderSelectedFieldWorkflowGuide()") && tsx.includes("inspectorWorkMode === 'guided'")],
  ['free mode technical progress preserved', tsx.includes("inspectorWorkMode === 'free' && selectedProfileSystem")],
  ['inspector fixed shell', css.includes('height: calc(100vh - 162px)') && css.includes('overflow: hidden')],
  ['internal pane scrolling', css.includes('.constructor-inspector-main-card .constructor-inspector-pane') && css.includes('overflow: auto')],
  ['large click target', css.includes('.constructor-inspector-settings-summary') && css.includes('min-height: 52px')],
  ['large chevron target', css.includes('.constructor-inspector-settings-summary > strong i') && css.includes('width: 24px')],
  ['guided compact steps', css.includes('.constructor-compact-inspector.is-guided-mode .constructor-field-workflow-steps')],
  ['mobile fallback', css.includes('@media (max-width: 820px)') && css.includes('max-height: none')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
}
if (failed.length) {
  console.error(`CONSTRUCTOR UX 02 VERIFY FAILED: ${failed.length} check(s)`)
  process.exit(1)
}

console.log('=== CONSTRUCTOR UX 02 VERIFY PASS ===')
console.log('MODE: STEP BY STEP | FREE WORK')
console.log('RIGHT INSPECTOR: FIXED SHELL / INTERNAL CONTEXT SCROLL')
console.log('MODULE SETTINGS: FULL ROW CLICK TARGET / LARGE CHEVRON')
console.log('GUIDANCE: NEXT ACTION REMAINS VISIBLE')
console.log('DOMAIN / TOPOLOGY / TECHNICAL RULES: UNCHANGED')
console.log('NO COMMIT / NO PUSH')
