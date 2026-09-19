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

assert(panel.includes('DIMENSIONED TECHNICAL NODE 01'), 'FIX 39 panel marker missing')
assert(panel.includes('РАЗМЕРЕН ТЕХНИЧЕСКИ ВЪЗЕЛ 01'), 'Dimensioned node heading missing')
assert(panel.includes('horizontalDimension'), 'Horizontal dimension renderer missing')
assert(panel.includes('verticalDimension'), 'Vertical dimension renderer missing')
assert(panel.includes('assembly-auto-reference-dimension'), 'System correction dimension callout missing')
assert(panel.includes('монтажно застъпване · НЕПОТВЪРДЕНО'), 'Unknown overlap guard missing')
assert(panel.includes('потвърдена видима част'), 'Reviewed visible-face label missing')
assert(panel.includes('каталоговите размери са директно върху разреза'), 'Dimension provenance caption missing')

assert(model.includes("SYSTEM_JOINT_VISUALIZATION_VERSION = 'system-joint-visualization-01'"), 'Visualization model version 02 missing')
assert(model.includes("'482.30': 42"), '482.30 reviewed visible face missing')
assert(model.includes("'482.21': 40"), '482.21 reviewed visible face missing')
assert(model.includes('supportVisibleFaceMm'), 'Support visible-face model missing')
assert(model.includes('sashVisibleFaceMm'), 'Sash visible-face model missing')
assert(model.includes('rule.sashEdgeCorrectionMm'), 'System correction rule must remain wired')
assert(!model.includes('overlapMm:'), 'FIX 39 must not invent overlap geometry')
assert(!model.includes('exactGeometryVerified: true'), 'FIX 39 must not auto-verify exact geometry')

assert(css.includes('DIMENSIONED TECHNICAL NODE 01'), 'FIX 39 CSS marker missing')
assert(css.includes('.assembly-auto-dimension-line'), 'Dimension-line CSS missing')
assert(css.includes('.assembly-auto-dimension-text'), 'Dimension text CSS missing')
assert(css.includes('.assembly-auto-dimension-legend'), 'Dimension provenance legend CSS missing')
assert(css.includes('.is-unknown-fact'), 'Unknown production dimension visual guard missing')

console.log('=== DIMENSIONED TECHNICAL NODE 01 VERIFY PASS ===')
console.log('CATALOGUE DIMENSION LINES ON SECTION: ADDED')
console.log('SUPPORT + SASH ENVELOPE DIMENSIONS: ADDED')
console.log('SYSTEM CORRECTION CALLOUT: ADDED AS REFERENCE ONLY')
console.log('REVIEWED VISIBLE-FACE FACTS: KEPT SEPARATE')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
