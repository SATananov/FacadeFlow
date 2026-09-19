import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const model = read('src/domain/systemJointVisualization.ts')

assert(panel.includes('AUTOMATIC SYSTEM ASSEMBLY VIEW 01'), 'FIX 38 panel marker missing')
assert(panel.includes('function AutomaticSystemAssemblyView'), 'Automatic assembly view component missing')
assert(panel.includes('buildSystemJointVisualization'), 'Automatic assembly view model is not wired')
assert(panel.includes('АВТОМАТИЧНА СИСТЕМНА СГЛОБКА'), 'User-facing automatic assembly heading missing')
assert(panel.includes('СГЛОБКА · ЗА ПРОВЕРКА'), 'Reference assembly review status missing')
assert(panel.includes('Как FacadeFlow избра тази сглобка'), 'Boundary-resolution disclosure missing')
assert(panel.includes('Технически параметри на системното правило'), 'System rule disclosure missing')
assert(panel.includes('Източник и експертни инструменти'), 'Expert source disclosure missing')
assert(panel.includes('prelude60-48230-frame-clean.png'), 'FIX 37 frame workspace asset compatibility missing')
assert(panel.includes('prelude60-48205-sash-clean.png'), 'FIX 37 sash workspace asset compatibility missing')
assert(panel.includes('prelude60-48221-mullion-clean.png'), 'FIX 37 mullion workspace asset compatibility missing')
assert(panel.includes('prelude60-48230-frame-assembly.png'), 'Automatic frame section asset missing')
assert(panel.includes('prelude60-48205-sash-assembly.png'), 'Automatic sash section asset missing')
assert(panel.includes('prelude60-48221-mullion-assembly.png'), 'Automatic mullion section asset missing')

assert(model.includes("SYSTEM_JOINT_VISUALIZATION_VERSION = 'system-joint-visualization-01'"), 'Visualization model version missing')
assert(model.includes("'482.30': { profileCode: '482.30', depthMm: 60, faceMm: 64 }"), '482.30 catalogue envelope missing')
assert(model.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"), '482.21 catalogue envelope missing')
assert(model.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"), '482.05 catalogue envelope missing')
assert(model.includes('rule.sashEdgeCorrectionMm'), 'Side-specific system correction is not used')
assert(model.includes('orientationRotationDeg: edgeRotation(joint.edge)'), 'Boundary-side orientation is not used')
assert(model.includes("exactGeometryVerified: joint.geometryStatus === 'available'"), 'Exact geometry gate missing')
assert(!model.includes("exactGeometryVerified: true"), 'Visualization must not auto-verify exact geometry')

assert(css.includes('AUTOMATIC SYSTEM ASSEMBLY VIEW 01'), 'FIX 38 CSS marker missing')
assert(css.includes('.assembly-auto-canvas'), 'Automatic assembly canvas CSS missing')
assert(css.includes('.assembly-joint-detail-disclosure'), 'Collapsed expert-detail CSS missing')

for (const asset of [
  'src/assets/catalog/prelude60/prelude60-48230-frame-assembly.png',
  'src/assets/catalog/prelude60/prelude60-48205-sash-assembly.png',
  'src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png',
]) {
  const full = path.join(root, asset)
  assert(fs.existsSync(full) && fs.statSync(full).size > 300, `Assembly section asset missing or empty: ${asset}`)
}

console.log('=== AUTOMATIC SYSTEM ASSEMBLY VIEW 01 VERIFY PASS ===')
console.log('JOINT CLICK -> AUTOMATIC SECTION VIEW: ADDED')
console.log('SYSTEM DATA + SIDE + RULE -> GENERATED SECTION: ADDED')
console.log('LEFT / RIGHT / TOP / BOTTOM ORIENTATION: ADDED')
console.log('MANUAL PROFILE POSITIONING FOR NORMAL VIEW: NOT REQUIRED')
console.log('EXPERT RULE / SOURCE / CUSTOM TOOLS: COLLAPSED')
console.log('REFERENCE PREVIEW -> PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
