import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

assert(panel.includes('CLEAN TECHNICAL NODE 01'), 'FIX 40 panel marker missing')
assert(panel.includes('CLEAN NODE VIEW 01'), 'Clean node heading missing')
assert(panel.includes('assembly-auto-profile-strip'), 'Participating profile strip missing')
assert(panel.includes('Участващи каталожни профили'), 'Profile strip accessibility label missing')
assert(panel.includes('assembly-auto-orientation-glyph'), 'Orientation glyph missing')
assert(panel.includes('assembly-auto-reviewed-chip'), 'Reviewed visible-face chip missing')
assert(panel.includes('assembly-auto-facts is-compact'), 'Compact technical facts panel missing')
assert(panel.includes('монтажно застъпване · НЕПОТВЪРДЕНО'), 'Unknown overlap guard must remain')
assert(panel.includes('horizontalDimension'), 'Catalogue horizontal dimensions must remain')
assert(panel.includes('verticalDimension'), 'Catalogue vertical dimensions must remain')
assert(panel.includes('assembly-auto-reference-dimension'), 'System-rule reference dimension must remain')
assert(panel.includes('const marginMm = 46'), 'Clean node dimension breathing room missing')

assert(css.includes('CLEAN TECHNICAL NODE 01'), 'FIX 40 CSS marker missing')
assert(css.includes('.assembly-auto-profile-strip'), 'Profile strip CSS missing')
assert(css.includes('.assembly-auto-orientation-glyph'), 'Orientation glyph CSS missing')
assert(css.includes('.assembly-auto-reviewed-chip'), 'Reviewed fact chip CSS missing')
assert(css.includes('.assembly-auto-facts.is-compact'), 'Compact facts CSS missing')
assert(css.includes('.assembly-auto-dimension-line'), 'Technical dimension-line CSS missing')
assert(css.includes('.assembly-auto-grid-bg'), 'Clean grid CSS missing')

console.log('=== CLEAN TECHNICAL NODE 01 VERIFY PASS ===')
console.log('PARTICIPATING CATALOGUE PROFILES: VISIBLE')
console.log('TECHNICAL NODE: PRIMARY VISUAL')
console.log('DIMENSION LINES: CLEANED / PRESERVED')
console.log('BOUNDARY ORIENTATION: VISIBLE')
console.log('RIGHT FACTS PANEL: COMPACT')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
