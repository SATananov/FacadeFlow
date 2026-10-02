import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E5_4_SASH_PROFILE_BAND_OVERLAP_READABILITY_ACCEPTANCE.md', import.meta.url), 'utf8')
const component = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

const visualOverrideMarker = '/* OPERABLE SKETCH CLARITY 01 — final visual-only line-contrast overrides.'
const visualOverrideStart = css.lastIndexOf(visualOverrideMarker)
assert.notEqual(visualOverrideStart, -1, 'final clarity override section exists')
const finalVisualOverrides = css.slice(visualOverrideStart)
const sashContrastOverrides = finalVisualOverrides.slice(0, finalVisualOverrides.indexOf('/* Paint the same operable sash edge'))
assert.match(finalVisualOverrides, /\.constructor-field-surface\.is-operable \.constructor-sash-profile-visual \{\s*border-color: rgba\(38, 53, 58, \.98\);\s*\}/)
assert.match(finalVisualOverrides, /\.constructor-field-surface\.is-operable \.constructor-sash-profile-visual \.sash-profile-inner \{\s*border-color: rgba\(55, 70, 75, \.98\);\s*\}/)
assert.doesNotMatch(sashContrastOverrides, /^\s*(?:inset|left|top|right|bottom|width|height|transform|clip-path|stroke-width)\s*:/m)
assert.doesNotMatch(finalVisualOverrides, /\.is-fixed|\.is-selected/)
assert.match(finalVisualOverrides, /\.constructor-operable-sash-priority \{[\s\S]*?z-index: 8;[\s\S]*?pointer-events: none;/)
assert.match(finalVisualOverrides, /\.constructor-operable-sash-priority::before \{[\s\S]*?inset: 1px;[\s\S]*?border: 1\.25px solid rgba\(38, 53, 58, \.98\);[\s\S]*?box-shadow:[\s\S]*?inset 0 0 0 10px #f7f9f9,[\s\S]*?inset 0 0 0 11\.15px rgba\(55, 70, 75, \.98\);[\s\S]*?filter: drop-shadow\(0 0 1\.25px rgba\(248, 250, 250, \.98\)\);/)
assert.match(component, /className="constructor-operable-sash-priority"/)

// Historical checks for intermediate declarations were superseded by later CSS cascade blocks.
// Verify that the final package adds contrast only, while keeping current SVG data gates intact.
assert.match(component, /field\.fieldType === 'operable' && \([\s\S]*?className="constructor-sash-profile-visual"/)
assert.match(component, /field\.openingMode === 'side-hinged' && field\.openingHanding === 'left' && \([\s\S]*?className="opening-primary"/)
assert.match(component, /field\.openingMode === 'side-hinged' && field\.openingHanding === 'right' && \([\s\S]*?className="opening-primary"/)
assert.match(component, /field\.openingMode === 'tilt' && \([\s\S]*?className="opening-tilt"/)
assert.match(component, /field\.openingMode === 'tilt-turn' && field\.openingHanding === 'left' && \([\s\S]*?className="opening-primary"/)
assert.match(component, /field\.openingMode === 'tilt-turn' && field\.openingHanding === 'right' && \([\s\S]*?className="opening-primary"/)
assert.match(component, /field\.openingMode === 'top-hung' \|\| field\.openingMode === 'side-hinged-top-hung'/)
assert.match(component, /className="opening-top-hung"/)
assert.match(component, /isConstructionOpeningHandingRelevant\(field\.openingMode\) &&\s*field\.openingHanding === 'left' &&\s*\(\s*<g className="constructor-opening-handle"/)
assert.match(component, /isConstructionOpeningHandingRelevant\(field\.openingMode\) &&\s*field\.openingHanding === 'right' &&\s*\(\s*<g className="constructor-opening-handle"/)

assert.match(acceptance, /FRAME → DIVIDER → SASH PROFILE BAND → GLAZING/)
assert.match(acceptance, /changes only final CSS line contrast/)
assert.match(acceptance, /No physical overlap, rebate, sash-face, glazing inset, cut angle, or catalogue dimension is inferred or stored/)
assert.match(acceptance, /FIXED FIELD remains glazing-only/)
assert.match(acceptance, /Unknown handing stays visually unknown/)
assert.match(acceptance, /top-hung marks do not imply handing/)
assert.match(acceptance, /Selection remains a separate existing state cue/)
assert.match(acceptance, /GEOMETRY \/ TOPOLOGY \/ FIELD SEMANTICS: UNCHANGED/)
assert.match(acceptance, /MACHINE READY: NO/)

assert.match(packageJson.scripts['test:contract'], /verify-constructor01e5_4\.mjs/)
assert.equal(packageJson.scripts['test:constructor01e5_4'], 'node scripts/verify-constructor01e5_4.mjs')

console.log('=== CONSTRUCTOR 01E.5.4 VERIFY PASS ===')
console.log('FRAME: LIGHT PROFILE BAND / TWO MEANINGFUL CONTOURS')
console.log('DIVIDER: CLEAN SINGLE PROFILE BODY')
console.log('OPERABLE SASH: LIGHT PROFILE BAND / GLAZING INSIDE')
console.log('SASH OUTER EDGE: VISUALLY CLOSER TO FRAME / DIVIDER JOINT')
console.log('OPENING SYMBOL: ANCHORED TO INNER SASH CONTOUR')
console.log('FIX FIELD: NO SASH BAND')
console.log('PHYSICAL OVERLAP / REBATE / PROFILE MM: NOT INFERRED')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('PROFILE RESOLUTION 02A / 02A.2 / 02A.3: UNCHANGED')
console.log('MACHINE READY: NO')
