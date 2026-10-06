import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')
const start = shell.indexOf('const renderGeometryReadinessInspector')
const end = shell.indexOf('const renderProfileKnowledgeInspector', start)
assert.ok(start >= 0 && end > start, 'readiness inspector renderer is missing')
const readinessUi = shell.slice(start, end)

assert.match(shell, /selectedGeometryReadinessContext/)
assert.match(readinessUi, /evaluation\?\.allowedUses/)
assert.match(readinessUi, /evaluation\.physicalGeometryStatus/)
assert.match(readinessUi, /evaluation\.machineGeometryStatus/)
assert.match(readinessUi, /СТАТУС НА СГЛОБКАТА/)
assert.match(readinessUi, /Връзката е известна, но физическата сглобка не е потвърдена\./)
assert.match(readinessUi, /Няма достатъчно данни за оценка на сглобката\./)
assert.match(readinessUi, /Изберете участниците в сглобката\./)
assert.match(readinessUi, /НЕ Е ГОТОВО ЗА ПРОИЗВОДСТВО/)
assert.match(readinessUi, /evaluation\.physicalGeometryStatus === 'BLOCKED'/)
assert.match(readinessUi, /GeometryReadinessSchematic context=\{context\} evaluation=\{evaluation\}/)
assert.match(readinessUi, /Технически детайли:/)
assert.match(readinessUi, /UNKNOWN означава, че липсва достатъчно доказателство/)
assert.doesNotMatch(readinessUi, /482\.20|482\.21|kmg-prelude-60/i)
assert.doesNotMatch(readinessUi, /evaluateGeometryReadiness\(/)
assert.doesNotMatch(readinessUi, /profileW|profileZ|dim_in|dim_out|cuttingang/i)
assert.doesNotMatch(readinessUi, /<button|<select|<input|onClick=|onChange=/)
assert.doesNotMatch(readinessUi, /несъвместими/i)

for (const className of [
  'constructor-geometry-readiness-summary',
  'constructor-geometry-readiness-production-warning',
  'constructor-geometry-readiness-blockers',
  'overflow-wrap: anywhere',
]) assert.match(css, new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

for (const runtimePath of [
  'src/domain/profileAwareGeometry',
  'src/domain/profileJointGeometry',
  'src/components/CompositeStructuralSketch',
]) {
  assert.equal(execFileSync('git', ['diff', '--', runtimePath], { encoding: 'utf8' }), '', `runtime drawing path changed: ${runtimePath}`)
}

console.log('INSPECTOR READINESS SUMMARY 02 VERIFY PASS')
console.log('SUMMARY: HUMAN-FACING AND READINESS-DRIVEN')
console.log('PRODUCTION WARNING: PHYSICAL BLOCK ONLY')
console.log('SCHEMATIC DISTINCTION: PRESERVED')
console.log('ACTION CONTROLS: NONE')
console.log('RUNTIME DRAWING / READINESS LOGIC: UNCHANGED')
