import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')

assert(panel.includes('FIX41 · SEPARATED PARTICIPANTS FINAL ASSEMBLY 01'), 'FIX41 panel marker missing')
assert(panel.includes('УЧАСТВАЩИ КАТАЛОЖНИ ПРОФИЛИ'), 'Separate participant heading missing')
assert(panel.includes('Първо виждаш отделните детайли'), 'Participant reading order missing')
assert(panel.includes('assembly-auto-participant-grid'), 'Separate participant grid missing')
assert(panel.includes('assembly-auto-participant-card'), 'Participant card missing')
assert(panel.includes('assembly-auto-participant-image'), 'Independent participant image missing')
assert(panel.includes('supportCatalogueGraphic.src'), 'Support catalogue sketch missing from participant stage')
assert(panel.includes('sashCatalogueGraphic.src'), 'Sash catalogue sketch missing from participant stage')
assert(panel.includes('КРАЙНА СГЛОБКА'), 'Final assembly heading missing')
assert(panel.includes('assembly-auto-final-assembly-head'), 'Final assembly separator missing')
assert(panel.includes('assembly-auto-section-grid'), 'Existing final assembly technical grid missing')
assert(panel.includes('монтажно застъпване · НЕПОТВЪРДЕНО'), 'Unknown overlap guard must remain')
assert(panel.includes('СИСТЕМЕН ПРЕГЛЕД'), 'System-review safety status missing')
assert(!panel.includes('assembly-auto-profile-strip-joint" aria-hidden="true">↔'), 'Participants must not be presented as one shared joined sketch')

assert(css.includes('FIX41 · SEPARATED PARTICIPANTS FINAL ASSEMBLY 01'), 'FIX41 CSS marker missing')
assert(css.includes('.assembly-auto-participants-block'), 'Participant block CSS missing')
assert(css.includes('.assembly-auto-profile-strip.assembly-auto-participant-grid'), 'Participant grid CSS missing')
assert(css.includes('.assembly-auto-participant-card'), 'Participant card CSS missing')
assert(css.includes('.assembly-auto-participant-image'), 'Participant image CSS missing')
assert(css.includes('.assembly-auto-final-assembly-head'), 'Final assembly heading CSS missing')

console.log('=== FIX41 SEPARATED PARTICIPANTS FINAL ASSEMBLY 01 VERIFY PASS ===')
console.log('CATALOGUE PARTICIPANTS: SEPARATE / READABLE')
console.log('FINAL ASSEMBLY: SEPARATE BLOCK BELOW PARTICIPANTS')
console.log('SHARED PARTICIPANT SKETCH: NO')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
