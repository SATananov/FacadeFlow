import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const must = (condition, message) => { if (!condition) throw new Error(message) }

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const templates = read('src/data/profileSystems/assemblyGlazingSeatTemplates.ts')

const autoStart = panel.indexOf('function AutomaticSystemAssemblyView')
const autoEnd = panel.indexOf('\nfunction SystemLogicStrip', autoStart)
must(autoStart >= 0 && autoEnd > autoStart, 'AutomaticSystemAssemblyView block not found')
const auto = panel.slice(autoStart, autoEnd)

must(exists('src/data/profileSystems/assemblyGlazingSeatTemplates.ts'), 'glazing seat presentation registry is missing')
must(templates.includes("ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-03'"), 'AG03 version marker is missing')
must(templates.includes("sashProfileCode: '482.05'"), '482.05 reviewed sash template is missing')
must(templates.includes("glazingBeadProfileCode: '482.15'"), '482.15 reviewed bead template is missing')
must(templates.includes('glazingThicknessMm: 24'), '24 mm reviewed glazing context is missing')
must(templates.includes("sourceKind: 'reviewed-sectional-presentation'"), 'template must be presentation-only reviewed evidence')
must(templates.includes('MUST NOT be'), 'production-geometry boundary marker is missing')

must(panel.includes("getAssemblyGlazingSeatPresentationTemplate"), 'panel does not use glazing seat presentation registry')
must(auto.includes('const glazingSeatTemplate = getAssemblyGlazingSeatPresentationTemplate('), 'reviewed glazing seat template is not resolved')
must(auto.includes('const presentationSeatInset = glazingSeatTemplate'), 'glass seat must be inset into sash in presentation geometry')
must(auto.includes('sashOutwardSpan * glazingSeatTemplate.glassSeatInsetRatioOfSashSpan'), 'glass seat must derive from sash span presentation ratio')
must(auto.includes('const beadScale = glazingSeatTemplate?.beadGraphicScale ?? 1'), 'bead display scale is not controlled by template')
must(auto.includes('className="assembly-auto-glass-pane-line"'), 'glass panes are not rendered')
must(auto.includes("'по системна скица'"), 'operator view must expose system-sketch placement state')
must(auto.includes('не създава производствен glass cut, seat/inset или машинна корекция'), 'operator boundary for production geometry is missing')
must(!templates.includes('glassCut'), 'AG03 presentation registry must not define glass-cut rules')
must(!templates.includes('machineCorrection'), 'AG03 presentation registry must not define machine corrections')

must(css.includes('/* ASSEMBLY GEOMETRY 03 · reviewed glazing-seat presentation */'), 'AG03 CSS marker missing')
must(css.includes('.assembly-auto-glass-pane-line'), 'glass pane styling missing')
must(css.includes('mix-blend-mode: multiply'), 'bead image should visually integrate without a white collage box')

console.log('=== ASSEMBLY GEOMETRY 03 VERIFY PASS ===')
console.log('PRELUDE 60 / 482.05 / 482.15 / 24 mm: REVIEWED POSITIONAL PRESENTATION TEMPLATE')
console.log('GLASS: VISUALLY SEATED INTO SASH')
console.log('BEAD: VISUALLY SEATED AT GLAZING EDGE')
console.log('GLASS CUT / EXACT SEAT / INSET / MACHINE CORRECTIONS: NOT CREATED')
console.log('AUTOMATIC PRODUCTION GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
