import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const must = (condition, message) => { if (!condition) throw new Error(message) }

const template = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')
const panel = read('src/components/AssemblyReviewPanel.tsx')
const sections = read('src/data/profileSystems/technicalSections.ts')

must(template.includes('ASSEMBLY GEOMETRY 03.5'), 'AG03.5 marker missing')
must(/glassSeatInsetFromSashOuterEdgeMm:\s*7\.8/.test(template), 'Reviewed glass-seat presentation inset changed unexpectedly')
must(/beadCenterInsetFromSashOuterEdgeMm:\s*-6\.45/.test(template), '482.15 seat-contact anchor is not -6.45 mm')
must(/beadCenterOffsetFromSashTopMm:\s*7\.75/.test(template), '482.15 vertical anchor changed unexpectedly')
must(/beadLocalRotationDeg:\s*-90/.test(template), 'Reviewed 482.15 installed quarter-turn changed unexpectedly')
must(/profileCode:\s*'482\.15'[\s\S]*?catalogueDepthMm:\s*16\.5[\s\S]*?catalogueFaceMm:\s*28\.5/.test(sections), '482.15 catalogue envelope is not 16.5 x 28.5 mm')

// Presentation invariant: with the installed quarter-turn the 28.5 mm bead run
// is centered so its sash-facing edge lands on the same local x line as the
// reviewed glass-seat presentation anchor: 7.8 - (28.5 / 2) = -6.45.
const expected = 7.8 - 28.5 / 2
must(Math.abs(expected - (-6.45)) < 1e-9, 'AG03.5 alignment invariant changed')

must(panel.includes('ASSEMBLY GEOMETRY 03.4'), 'AG03.4 hook-facing orientation marker missing')
must(panel.includes('const beadLocalRotationDeg = -beadTemplateRotationDeg'), 'Hook-facing installed orientation was regressed')
must(panel.includes('className="assembly-auto-bead-installed"'), 'Installed bead renderer missing')
must(panel.includes('className="assembly-auto-glazing-stack is-profile-composition"'), 'Sash-local glazing composition missing')

must(!template.includes('machineReady: true'), 'AG03.5 must not unlock machine-ready geometry')
must(!template.includes('glassCut'), 'AG03.5 must not create a glass-cut rule')

console.log('=== ASSEMBLY GEOMETRY 03.5 VERIFY PASS ===')
console.log('482.15 SASH-FACING EDGE: ALIGNED TO REVIEWED GLAZING-SEAT PRESENTATION LINE')
console.log('HORIZONTAL CONTACT BASIS: 7.8 - (28.5 / 2) = -6.45 mm')
console.log('VERTICAL ANCHOR / HOOK ORIENTATION: PRESERVED')
console.log('GLASS CUT / EXACT PRODUCTION SEAT / MACHINE CORRECTIONS: NOT CREATED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
