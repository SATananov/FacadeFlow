import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRuntimeLoader } from './runtime-loader.mjs'

const component = fs.readFileSync('src/components/GeometryReadinessSchematic.tsx', 'utf8')
const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const css = fs.readFileSync('src/components/GeometryReadinessSchematic.css', 'utf8')
const load = createRuntimeLoader()
const context = load('src/data/profileSystems/geometryReadinessContext.ts')

assert.match(shell, /GeometryReadinessSchematic context=\{context\} evaluation=\{evaluation\}/)
assert.match(component, /SCHEMATIC_RELATIONSHIP_DISPLAY/)
assert.match(component, /if \(!schematicAllowed.*return null/s)
assert.match(component, /СХЕМАТИЧНО/)
assert.match(component, /Не е производствена геометрия/)
assert.match(component, /Физическата сглобка остава блокирана/)
assert.doesNotMatch(component, /profileW|profileZ|dim_in|dim_out|mm|overlap|rebate|notch|machin|cutAngle|cutLength/i)
assert.doesNotMatch(component, /buildProfile|createJoint|create.*Geometry|<svg|<path|path\s*=/i)
assert.doesNotMatch(component, /482\.20|482\.21|kmg-prelude-60/i)
assert.match(css, /geometry-readiness-schematic-visual/)
assert.match(css, /border: 1px dashed/)

const base = {
  participantA: { role: 'frame', profileId: '482.20', systemId: 'kmg-prelude-60', selectionId: 'frame' },
  participantB: { role: 'mullion', profileId: '482.21', systemId: 'kmg-prelude-60', selectionId: 'divider-1' },
  relationshipContext: 'FRAME_TO_MULLION',
  orientation: 'horizontal',
}
const allowed = context.evaluateSelectedGeometryReadiness(base)
assert.equal(allowed.status, 'READY')
assert.ok(allowed.evaluation.allowedUses.some((item) => item.use === 'SCHEMATIC_RELATIONSHIP_DISPLAY'))
assert.equal(allowed.evaluation.physicalGeometryStatus, 'BLOCKED')
assert.equal(allowed.evaluation.machineGeometryStatus, 'BLOCKED')

const blocked = context.evaluateSelectedGeometryReadiness({ ...base, relationshipContext: null })
assert.equal(blocked.evaluation, null)
assert.equal(blocked.status, 'CONTEXT_UNAVAILABLE')
const reversed = context.evaluateSelectedGeometryReadiness({ ...base, participantA: base.participantB, participantB: base.participantA })
assert.equal(reversed.status, 'ROLE_MISMATCH')
const nonKmg = context.evaluateSelectedGeometryReadiness({
  ...base,
  participantA: { ...base.participantA, profileId: '5522', systemId: 'vivaplast' },
  participantB: { ...base.participantB, profileId: '5523', systemId: 'vivaplast' },
})
assert.equal(nonKmg.evaluation.relationshipEvidenceStatus, 'UNKNOWN')
assert.ok(!nonKmg.evaluation.allowedUses.some((item) => item.use === 'SCHEMATIC_RELATIONSHIP_DISPLAY'))

for (const runtimePath of ['src/domain/profileAwareGeometry', 'src/domain/profileJointGeometry', 'src/components/CompositeStructuralSketch']) {
  assert.equal(execFileSync('git', ['diff', '--', runtimePath], { encoding: 'utf8' }), '', `runtime path changed: ${runtimePath}`)
}

console.log('SCHEMATIC JOINT PRESENTATION 01 VERIFY PASS')
console.log('READINESS GATE: PASS')
console.log('NON-PRODUCTION LABELS: PASS')
console.log('PHYSICAL DIMENSIONS / PROFILE SHAPE: ABSENT')
console.log('PHYSICAL AND MACHINING GEOMETRY: BLOCKED')
console.log('BLOCKED SCHEMATIC STATES: NOT RENDERED')
console.log('AUTOMATIC JOINT CREATION / RUNTIME GEOMETRY: NONE')
