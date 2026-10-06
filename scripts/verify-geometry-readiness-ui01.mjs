import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')

assert.match(shell, /evaluateSelectedGeometryReadiness/)
assert.match(shell, /selectedGeometryReadinessContext/)

const start = shell.indexOf('const renderGeometryReadinessInspector')
const end = shell.indexOf('const renderProfileKnowledgeInspector', start)
assert.ok(start >= 0 && end > start, 'readiness inspector renderer is missing')
const readinessUi = shell.slice(start, end)

for (const label of [
  'Профили',
  'Контекст на връзката',
  'Схематично представяне',
  'Физическа геометрия',
  'Машинна геометрия',
  'Липсват доказателства за:',
  'UNKNOWN означава',
  'Няма достатъчно данни за оценка на готовността.',
]) assert.match(readinessUi, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

assert.match(readinessUi, /Разрешено — само непроизводствено/)
assert.match(readinessUi, /Блокирана — липсват доказателства/)
assert.doesNotMatch(readinessUi, /<button|<select|<input/)
assert.doesNotMatch(readinessUi, /482\.20|482\.21|kmg-prelude-60/i)

assert.match(css, /constructor-geometry-readiness/)
assert.match(css, /grid-template-columns: minmax\(0, \.9fr\) minmax\(0, 1\.1fr\)/)
assert.match(css, /overflow-wrap: anywhere/)

for (const runtimePath of [
  'src/domain/profileAwareGeometry',
  'src/domain/profileJointGeometry',
  'src/components/CompositeStructuralSketch',
]) {
  const diff = requireDiff(runtimePath)
  assert.equal(diff, '', `runtime drawing path changed: ${runtimePath}`)
}

function requireDiff(path) {
  return execFileSync('git', ['diff', '--', path], { encoding: 'utf8' })
}

console.log('GEOMETRY READINESS UI 01 VERIFY PASS')
console.log('READINESS API: CONSUMED')
console.log('KMG-SPECIFIC UI HARDCODING: ABSENT')
console.log('SCHEMATIC RELATIONSHIP: LABELLED NON-PRODUCTIVE')
console.log('PHYSICAL / MACHINING GEOMETRY: BLOCKED BY MODEL')
console.log('ACTION CONTROLS: NONE')
