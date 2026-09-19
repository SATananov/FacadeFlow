import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const must = (condition, message) => { if (!condition) throw new Error(message) }

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const sections = read('src/data/profileSystems/technicalSections.ts')
const graphics = read('src/components/assemblyTechnicalSectionGraphics.ts')

const autoStart = panel.indexOf('function AutomaticSystemAssemblyView')
const autoEnd = panel.indexOf('\nfunction SystemLogicStrip', autoStart)
must(autoStart >= 0 && autoEnd > autoStart, 'AutomaticSystemAssemblyView block not found')
const auto = panel.slice(autoStart, autoEnd)

must(auto.includes('fieldGlazingContext: SystemDrivenFieldGlazingContextReadModel | null'), 'assembly sketch must receive FIELD glazing context')
must(auto.includes('assembly-auto-glazing-stack'), 'glazing stack is missing from final assembly sketch')
must(auto.includes('assembly-auto-glass-unit'), 'glass unit geometry is missing')
must(auto.includes('assembly-auto-bead-image'), 'glass bead graphic is missing from final assembly sketch')
must(auto.includes('СТЪКЛОПАКЕТ'), 'glazing participant card is missing')
must(auto.includes('СТЪКЛОДЪРЖАТЕЛ'), 'glass bead participant card is missing')
must(auto.includes('Разлика общ/видим'), 'operator-facing total/visible difference is missing')
must(!auto.includes('Вътрешна зона ·'), 'operator sketch must not present total/visible difference as a one-sided internal zone')
must(auto.includes('const showSystemCorrectionInOperatorSketch = false'), 'system correction must be hidden from the default operator sketch')
must(auto.includes('showSystemCorrectionInOperatorSketch && visualization.correctionMm !== null'), 'FIX49 correction must remain available behind the operator-display gate')
must(auto.includes('Размер на стъклото, точен seat/inset и машинни корекции'), 'knowledge boundary for production dimensions is missing')
must(panel.includes('<AutomaticSystemAssemblyView joint={joint} fieldGlazingContext={fieldGlazingContext} />'), 'JointDetail does not pass glazing context to final sketch')

must(sections.includes("profileCode: '482.15'"), '482.15 technical section is not registered')
must(sections.includes("profileRole: 'glass-bead'"), '482.15 must be registered as glass-bead')
must(sections.includes('catalogueDepthMm: 16.5'), '482.15 catalogue 16.5 mm callout is missing')
must(sections.includes('catalogueFaceMm: 28.5'), '482.15 catalogue 28.5 mm callout is missing')
must(graphics.includes("prelude60-48215-bead-clean.png"), '482.15 graphic is not wired into technical graphics')
must(exists('src/assets/catalog/prelude60/prelude60-48215-bead-clean.png'), '482.15 clean graphic asset is missing')

must(css.includes('.assembly-auto-glass-unit'), 'final glazing CSS is missing')
must(css.includes('.assembly-auto-participant-card.is-glazing'), 'glazing participant styling is missing')
must(css.includes('.assembly-auto-profile-strip.assembly-auto-participant-grid'), 'participant grid styling is missing')

console.log('=== FINAL ASSEMBLY SKETCH 02 VERIFY PASS ===')
console.log('OPERATOR SKETCH: SUPPORT + SASH + FIELD GLAZING + GLASS BEAD')
console.log('PRELUDE 60 BEAD 482.15: CATALOGUE GRAPHIC REGISTERED')
console.log('GLAZING THICKNESS: FIELD INPUT, DIMENSIONED WHEN PRESENT')
console.log('TOTAL/VISIBLE DIFFERENCE: SHOWN AS DIFFERENCE, NOT ONE-SIDED OVERLAP')
console.log('SYSTEM CORRECTION 8.5 mm: HIDDEN FROM DEFAULT OPERATOR SKETCH')
console.log('GLASS CUT / SEAT / INSET / MACHINE CORRECTIONS: NOT INFERRED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
