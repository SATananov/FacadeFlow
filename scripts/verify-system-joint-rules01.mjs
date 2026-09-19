import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const rules = read('src/data/profileSystems/systemConstructionRules.ts')
const model = read('src/domain/systemDrivenProductModel.ts')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const styles = read('src/components/AssemblyReviewPanel.css')
const semantics = read('src/data/profileSystems/jointSemantics.ts')

assert(rules.includes("sashProfileCode: '482.05'"), 'KMG PRELUDE 60 sash rule missing')
assert(rules.includes("frameProfileCode: '482.30'"), 'KMG PRELUDE 60 frame rule missing')
assert(rules.includes("profileCode: '482.21'"), 'KMG PRELUDE 60 divider rule missing')
assert(rules.includes('left: 8.5') && rules.includes('right: 8.5') && rules.includes('top: 8') && rules.includes('bottom: 8'), 'Side correction mapping missing')
assert(rules.includes('assemblyUseRabbet: true'), 'Rabbet rule missing')
assert(rules.includes("nominalThicknessMm: 24") && rules.includes("glazingBeadProfileCode: '482.15'"), '24 mm glazing bead rule missing')
assert(rules.includes('exactAssemblyGeometryProven: false'), 'Rule/evidence safety boundary missing')
assert(model.includes("system-driven-product-model-04"), 'System-driven model v04 missing')
assert(model.includes('buildJointLibrary'), 'Joint library grouping missing')
assert(model.includes('systemRuleJointTypeCount'), 'System rule metrics missing')
assert(panel.includes('БИБЛИОТЕКА НА ВЪЗЛИТЕ'), 'Joint library UI missing')
assert(panel.includes('СИСТЕМНО КОНСТРУКТИВНО ПРАВИЛО'), 'System construction rule UI missing')
assert(styles.includes('SYSTEM JOINT RULES + LIBRARY RESOLUTION 01'), 'FIX 36 styles marker missing')
assert(semantics.includes('frameSashOverlapMm: null'), 'Frame/sash overlap safety reset was altered')
assert(semantics.includes('mullionSashOverlapMm: null'), 'Mullion/sash overlap safety reset was altered')

console.log('SYSTEM JOINT RULES + LIBRARY RESOLUTION 01 VERIFY PASS')
console.log('KMG PRELUDE 60 REFERENCE RULES: PRESENT')
console.log('JOINT TYPE DEDUPLICATION: PRESENT')
console.log('EXACT GEOMETRY GATE: STILL LOCKED')
console.log('MACHINE READY: NO')
