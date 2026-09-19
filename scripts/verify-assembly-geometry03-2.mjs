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

must(templates.includes("ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-03-2'"), 'AG03.2 presentation version marker missing')
must(templates.includes('glassSeatInsetFromSashOuterEdgeMm: 7.8'), 'reviewed glass seat presentation anchor missing')
must(templates.includes('glassCenterOffsetFromSashTopMm: 28'), 'reviewed glass centre anchor missing')
must(templates.includes('beadCenterInsetFromSashOuterEdgeMm: 4.5'), '482.15 sash-edge anchor missing')
must(templates.includes('beadCenterOffsetFromSashTopMm: 16.5'), '482.15 sash-face anchor missing')
must(templates.includes('beadLocalRotationDeg: 180'), '482.15 local orientation correction missing')
must(templates.includes("sourceKind: 'reviewed-sectional-presentation'"), 'reviewed presentation evidence boundary missing')
must(!templates.includes('glassCut'), 'AG03.2 must not create a glass-cut rule')
must(!templates.includes('machineCorrection'), 'AG03.2 must not create machine corrections')

must(panel.includes('ASSEMBLY GEOMETRY 03.2 — TRUE PROFILE COMPOSITION'), 'AG03.2 panel marker missing')
must(panel.includes('const glazingPresentationReady = glazingReady && glazingSeatTemplate !== null'), 'glazing must fail closed without a reviewed presentation template')
must(panel.includes('const glazingBaseCenter = rotatePoint(glazingLocalBaseCenter.x, glazingLocalBaseCenter.y)'), 'rotated glazing base center must be defined')
must(panel.includes('const glazingFarCenter = rotatePoint(glazingLocalFarCenter.x, glazingLocalFarCenter.y)'), 'rotated glazing far center must be defined')
must(panel.includes('visualization.canonicalSashXmm + visualization.sash.depthMm - glazingSeatTemplate.glassSeatInsetFromSashOuterEdgeMm'), 'glass must anchor to canonical sash geometry')
must(panel.includes('visualization.canonicalSashYmm + glazingSeatTemplate.glassCenterOffsetFromSashTopMm'), 'glass vertical anchor must come from the sash-local template')
must(panel.includes('visualization.canonicalSashXmm + visualization.sash.depthMm - glazingSeatTemplate.beadCenterInsetFromSashOuterEdgeMm'), '482.15 must anchor to canonical sash geometry')
must(panel.includes('visualization.canonicalSashYmm + glazingSeatTemplate.beadCenterOffsetFromSashTopMm'), '482.15 face anchor must be sash-local')
must(panel.includes('rotate(${visualization.orientationRotationDeg + beadLocalRotationDeg})'), '482.15 must share the joint rotation with a local orientation correction')
must(panel.includes('assembly-auto-glazing-stack is-canonical-seat'), 'canonical glazing-seat rendering class missing')
must(!panel.includes('const beadAcrossSide = -1'), 'obsolete screen-space bead side heuristic must be removed')
must(!panel.includes('beadAcrossSide * beadAcrossDistanceMm'), 'obsolete screen-space bead placement must be removed')

must(css.includes('/* ASSEMBLY GEOMETRY 03.2 · true profile composition */'), 'AG03.2 CSS marker missing')
must(css.includes('.assembly-auto-glazing-stack.is-canonical-seat .assembly-auto-bead-image'), 'canonical bead styling missing')
must(css.includes('mix-blend-mode: normal'), 'bead must no longer rely on multiply blend collage styling')

must(graphics.includes('prelude60-48215-bead-catalogue.png'), '03.1 dimensioned 482.15 catalogue card must be preserved')
must(graphics.includes('assembly: { src: bead48215AssemblyImage'), 'clean 482.15 assembly contour must be preserved')
must(exists('src/assets/catalog/prelude60/prelude60-48215-bead-catalogue.png'), '482.15 catalogue asset missing')
must(exists('src/assets/catalog/prelude60/prelude60-48215-bead-clean.png'), '482.15 clean assembly contour missing')

console.log('=== ASSEMBLY GEOMETRY 03.2 VERIFY PASS ===')
console.log('GLASS + 482.15: SASH-LOCAL CANONICAL COMPOSITION')
console.log('482.15: LOCAL ORIENTATION + JOINT ROTATION / NO SCREEN-SPACE COLLAGE HEURISTIC')
console.log('24 mm GLAZING: REVIEWED PRESENTATION TEMPLATE ONLY')
console.log('GLASS CUT / EXACT SEAT / INSET / MACHINE CORRECTIONS: NOT CREATED')
console.log('TOPOLOGY: UNCHANGED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
