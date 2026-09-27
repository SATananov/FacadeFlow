import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

const checks = [
  ['friendly optional guidance', app.includes('Попълнете само това, което знаете за изделието.')],
  ['manual mm wording', (app.match(/Въведи ръчно \(mm\)/g) || []).length >= 2],
  ['calm draft wording', app.includes('е непълен, но може да бъде запазен като чернова.')],
  ['single clear next action panel', app.includes('className="module-next-action"')],
  ['constructor CTA at module end', app.includes("firstModuleStructureReady ? 'Отвори Конструктора' : 'Продължи с чернова'")],
  ['next action styling', css.includes('.module-next-action {')],
]

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`UX MODULE FLOW 01 FAIL: ${name}`)
}

console.log('UX MODULE FLOW 01: PASS')
console.log('Friendly module guidance: PASS')
console.log('Manual dimensions wording: PASS')
console.log('Calm draft status: PASS')
console.log('Clear constructor next action: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
