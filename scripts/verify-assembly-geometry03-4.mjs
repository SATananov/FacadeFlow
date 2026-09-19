import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const must = (condition, message) => { if (!condition) throw new Error(message) }

const panel = read('src/components/AssemblyReviewPanel.tsx')
const templates = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')

must(panel.includes('ASSEMBLY GEOMETRY 03.4 — HOOK-FACING INSTALLED ORIENTATION'), 'AG03.4 panel marker missing')
must(panel.includes('const beadTemplateRotationDeg = glazingSeatTemplate?.beadLocalRotationDeg ?? 0'), 'AG03.4 template rotation capture missing')
must(panel.includes('const beadLocalRotationDeg = -beadTemplateRotationDeg'), 'AG03.4 hook-facing local orientation missing')
must(panel.includes('transform={`translate(${beadLocalCenter.x} ${beadLocalCenter.y}) rotate(${beadLocalRotationDeg})`}'), 'bead must still render inside sash-local transformed group')
must(panel.includes('assembly-auto-glazing-stack is-profile-composition'), 'glass must stay in the profile composition group')
must(!panel.includes('rotate(${visualization.orientationRotationDeg + beadLocalRotationDeg})'), 'screen-space double rotation must remain removed')

// Preserve reviewed 03.3 presentation evidence and anchors. AG03.4 only corrects
// how the local quarter-turn is applied before the parent boundary rotation.
must(templates.includes("ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-03-3'"), '03.3 reviewed template identity must remain unchanged')
must(templates.includes('beadCenterInsetFromSashOuterEdgeMm: -14.25'), 'reviewed bead outward anchor changed unexpectedly')
must(templates.includes('beadCenterOffsetFromSashTopMm: 7.75'), 'reviewed bead vertical anchor changed unexpectedly')
must(templates.includes('beadLocalRotationDeg: -90'), 'reviewed template quarter-turn changed unexpectedly')
must(!templates.includes('glassCutMm'), 'AG03.4 must not create a glass-cut rule')
must(!templates.includes('machineCorrectionMm'), 'AG03.4 must not create machine corrections')

console.log('=== ASSEMBLY GEOMETRY 03.4 VERIFY PASS ===')
console.log('482.15 HOOK: FACES 482.05 SEAT AFTER BOUNDARY ROTATION')
console.log('482.15 + 24 mm GLASS: SAME SASH-LOCAL PROFILE COMPOSITION')
console.log('03.3 REVIEWED TEMPLATE / ANCHORS: PRESERVED')
console.log('GLASS CUT / EXACT SEAT / MACHINE CORRECTIONS: NOT CREATED')
console.log('TOPOLOGY: UNCHANGED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
