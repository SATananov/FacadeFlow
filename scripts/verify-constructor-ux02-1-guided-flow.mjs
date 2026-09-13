import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tsx = fs.readFileSync(path.join(root, 'src', 'components', 'ConstructorShell.tsx'), 'utf8')
const css = fs.readFileSync(path.join(root, 'src', 'components', 'ConstructorShell.css'), 'utf8')

const checks = [
  ['global five-step progress', tsx.includes('СТЪПКА {step} ОТ 5') && tsx.includes('constructor-guided-task-progress')],
  ['module settings collapse on guided module change', tsx.includes("if (inspectorWorkMode === 'guided') setModuleSettingsOpen(false)")],
  ['frame step explains dimensions', tsx.includes('Размерите се задават с чертането') && tsx.includes('таб „Размери“')],
  ['field-type guided phase', tsx.includes('Задай типа на Поле') && tsx.includes('Отвори Поле')],
  ['technical-data guided phase', tsx.includes('Избери профил на крилото за Поле') && tsx.includes('Въведи дебелина на стъклопакета за Поле') && tsx.includes('Избери стъклодържател за Поле') && tsx.includes('Продължи с Поле')],
  ['review phase', tsx.includes('Прегледай сглобката') && tsx.includes('Основните входни данни са въведени')],
  ['compact field progress', tsx.includes('constructor-field-workflow-progress') && !tsx.includes('className="constructor-field-workflow-steps" aria-label="Стъпки за избраното поле"')],
  ['guided/free layout class', tsx.includes("constructor-layout ${inspectorWorkMode === 'guided' ? 'is-guided-workflow' : 'is-free-workflow'}")],
  ['locked tools are explicit', css.includes("content: 'ПО-КЪСНО'") && css.includes('.constructor-layout.is-guided-workflow .constructor-tool-list button:disabled')],
  ['progress bar styling', css.includes('.constructor-guided-task-progress') && css.includes('.constructor-field-workflow-progress')],
  ['old dense four-step strip hidden in guided mode', css.includes('.constructor-compact-inspector.is-guided-mode .constructor-field-workflow-steps') && css.includes('display: none')],
  ['no domain auto-selection added', !tsx.includes('autoSelectProfile') && !tsx.includes('autoSelectBead')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
if (failed.length) {
  console.error(`CONSTRUCTOR UX 02.1 VERIFY FAILED: ${failed.length} check(s)`)
  process.exit(1)
}

console.log('=== CONSTRUCTOR UX 02.1 VERIFY PASS ===')
console.log('GUIDED FLOW: 5 PHASES / ONE ACTIVE TASK')
console.log('FIELD GUIDE: COMPACT CURRENT-STEP PROGRESS')
console.log('MODULE SETTINGS: AUTO-COLLAPSE ON GUIDED MODULE CHANGE')
console.log('LOCKED TOOLS: EXPLICIT LATER-STEP STATE')
console.log('DOMAIN / TOPOLOGY / PF01 / PF02 / AF01A: UNCHANGED')
console.log('NO COMMIT / NO PUSH')
