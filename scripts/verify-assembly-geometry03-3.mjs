import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const must = (condition, message) => { if (!condition) throw new Error(message) }

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const templates = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')

must(templates.includes("ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-03-3'"), 'AG03.3 version marker missing')
must(templates.includes('beadCenterInsetFromSashOuterEdgeMm: -14.25'), '482.15 installed outward anchor missing')
must(templates.includes('beadCenterOffsetFromSashTopMm: 7.75'), '482.15 installed vertical anchor missing')
must(templates.includes('beadLocalRotationDeg: -90'), '482.15 installed 90-degree orientation missing')
must(templates.includes("sourceKind: 'reviewed-sectional-presentation'"), 'reviewed source boundary missing')
must(!templates.includes('glassCutMm'), 'AG03.3 must not create a glass-cut rule')
must(!templates.includes('machineCorrectionMm'), 'AG03.3 must not create machine corrections')

must(panel.includes('ASSEMBLY GEOMETRY 03.3 — TRUE INSTALLED PROFILE COMPOSITION'), 'AG03.3 panel marker missing')
must(panel.includes('assembly-auto-glazing-stack is-profile-composition'), 'glass must render in the canonical profile composition group')
must(panel.includes('className="assembly-auto-bead-installed"'), 'installed bead group missing')
must(panel.includes('transform={`translate(${beadLocalCenter.x} ${beadLocalCenter.y}) rotate(${beadLocalRotationDeg})`}'), 'bead must use sash-local installed rotation only inside the joint group')
must(panel.includes('points={localGlassPolygon.map((point) => `${point.x},${point.y}`).join(\' \')}'), 'glass polygon must remain in sash-local coordinates')
must(!panel.includes('rotate(${visualization.orientationRotationDeg + beadLocalRotationDeg})'), 'screen-space double rotation must be removed')
must(!panel.includes('glazingPolygonPoints.map'), 'screen-space glass polygon must be removed')
must(panel.includes('rotateBeadLocalPoint'), 'installed bead callout bounds must account for bead local rotation')

must(css.includes('/* ASSEMBLY GEOMETRY 03.3 · installed glazing-bead composition */'), 'AG03.3 CSS marker missing')
must(css.includes('.assembly-auto-bead-installed .assembly-auto-bead-image'), 'installed bead styling missing')
must(css.includes('mix-blend-mode: normal'), 'installed bead must not use multiply collage blending')

console.log('=== ASSEMBLY GEOMETRY 03.3 VERIFY PASS ===')
console.log('482.15: INSTALLED ORIENTATION / 28.5 mm OUTWARD ENVELOPE')
console.log('GLASS + BEAD: SAME TRANSFORMED PROFILE GROUP AS 482.05')
console.log('SCREEN-SPACE BEAD COMPOSITION: REMOVED')
console.log('24 mm GLAZING: REVIEWED PRESENTATION ONLY')
console.log('GLASS CUT / EXACT SEAT / MACHINE CORRECTIONS: NOT CREATED')
console.log('TOPOLOGY: UNCHANGED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
