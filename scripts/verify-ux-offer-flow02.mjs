import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /useState<1 \| 2 \| 3 \| 4>\(saved \? 4 : 1\)/, 'compact offer flow needs explicit active step state')
assert.match(app, /setOfferFlowStep\(4\)/, 'saving the offer must advance to Modules')
assert.match(app, /hidden=\{offerFlowStep !== 1\}/, 'step 1 sections must collapse outside the active step')
assert.match(app, /hidden=\{offerFlowStep !== 2\}/, 'step 2 section must collapse outside the active step')
assert.match(app, /hidden=\{offerFlowStep !== 3\}/, 'step 3 sections must collapse outside the active step')
assert.match(app, /hidden=\{offerFlowStep !== 4\}/, 'module workspace must collapse outside step 4')
assert.match(app, /Продължи към Система/, 'step 1 must expose a clear next action')
assert.match(app, /Продължи към Материали/, 'step 2 must expose a clear next action')
assert.match(app, /moduleEditorOpen/, 'module workspace must support compact collapse')
assert.match(app, /Свий модула/, 'module collapse action must be visible')
assert.match(app, /Редактирай модула/, 'collapsed module must expose edit action')
assert.doesNotMatch(app, /Concept 06B не генерира геометрия/, 'developer concept prose must not be rendered to operators')
assert.doesNotMatch(app, /isOfferModuleBasicsReady/, 'obsolete unused helper must be removed')

assert.match(css, /UX OFFER FLOW 02 · COMPACT STEP WORKFLOW/, 'compact-flow stylesheet block must exist')
assert.match(css, /\.offer-flow-steps\s*\{[\s\S]*position:\s*sticky/, 'offer progress must remain visible while scrolling')
assert.match(css, /\.offer-step-actions\s*\{/, 'step transition actions must be styled')
assert.match(css, /\.module-workspace\.is-collapsed/, 'collapsed module styling must exist')

assert.doesNotMatch(app, /AUTOMATIC GEOMETRY:\s*YES/i)
assert.doesNotMatch(app, /RULES VALIDATED:\s*YES/i)
assert.doesNotMatch(app, /MACHINE READY:\s*YES/i)

console.log('UX OFFER FLOW 02: PASS')
console.log('Compact step workflow: PASS')
console.log('Sticky progress: PASS')
console.log('Collapsed completed stages: PASS')
console.log('Collapsible module editor: PASS')
console.log('Developer concept prose hidden from operators: PASS')
console.log('Unused module helper removed: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
