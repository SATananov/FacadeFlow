import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const must = (condition, message) => { if (!condition) throw new Error(message) }

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const templates = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')
const graphics = read('src/components/assemblyTechnicalSectionGraphics.ts')

const asset = 'src/assets/catalog/prelude60/prelude60-48215-bead-catalogue.png'
must(exists(asset), 'catalogue 482.15 asset is missing')

must(panel.includes('const beadAcrossSide = -1'), '482.15 must be placed on the catalogue-consistent side of the glazing stack')
must(panel.includes('beadAcrossSide * beadAcrossDistanceMm'), 'bead side must drive the final seat position')
must(panel.includes('matching the reviewed PRELUDE sectional drawing instead of floating above it'), 'catalogue orientation rationale is missing')
must(panel.includes('beadTechnicalSection.catalogueFaceMm'), 'operator card must show catalogue bead dimensions')
must(panel.includes('официален каталожен детайл'), 'operator card must identify the catalogue source presentation')

must(templates.includes('beadGraphicScale: 1.00'), '482.15 must render at catalogue-scale presentation, not the old 0.60 miniaturized scale')
must(templates.includes('beadAcrossOverlapMm: 1.5'), '482.15 glazing-edge overlap presentation value is missing')
must(templates.includes("ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-03'"), 'AG03 glazing-seat presentation contract marker is missing')
must(templates.includes("sourceKind: 'reviewed-sectional-presentation'"), 'presentation-only evidence boundary must remain')
must(!templates.includes('glassCut'), '03.1 must not invent a glass-cut rule')
must(!templates.includes('machineCorrection'), '03.1 must not invent machine corrections')

must(graphics.includes("prelude60-48215-bead-catalogue.png"), '482.15 catalogue card must use the dimensioned catalogue asset')
must(graphics.includes('catalogue: { src: bead48215CatalogueImage'), 'catalogue and assembly bead graphics must be separated')
must(graphics.includes('assembly: { src: bead48215AssemblyImage'), 'final assembly must keep the clean bead contour')

must(css.includes('/* ASSEMBLY GEOMETRY 03 · reviewed glazing-seat presentation */'), 'AG03 base CSS contract marker missing')
must(css.includes('/* ASSEMBLY GEOMETRY 03.1 · catalogue bead presentation */'), '03.1 CSS marker missing')
must(css.includes('.assembly-auto-participant-card.is-bead .assembly-auto-participant-image img'), '482.15 participant-card scale guard missing')

console.log('=== ASSEMBLY GEOMETRY 03.1 V2 VERIFY PASS ===')
console.log('AG03 BASE CONTRACT: PRESERVED IN CURRENT TARGET FILES')
console.log('482.15 CATALOGUE CARD: DIMENSIONED PRELUDE 60 DETAIL')
console.log('482.15 FINAL ASSEMBLY: OPPOSITE SIDE OF GLASS / SASH-SEAT PRESENTATION')
console.log('482.15 DISPLAY SCALE: CATALOGUE SCALE')
console.log('GLASS CUT / EXACT SEAT / INSET / MACHINE CORRECTIONS: NOT CREATED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
