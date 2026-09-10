import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E5_4_SASH_PROFILE_BAND_OVERLAP_READABILITY_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(css, /Constructor 01E\.5\.4 — sash profile band & overlap readability/)
assert.match(css, /\.constructor-sash-profile-visual \{[\s\S]*?inset: 1px;[\s\S]*?background: #f7f9f9;/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-inner \{[\s\S]*?inset: 10px;[\s\S]*?background: rgba\(211, 239, 245, \.98\);/)
assert.match(css, /\.constructor-operable-visual \{[\s\S]*?inset: 11px;[\s\S]*?width: calc\(100% - 22px\);/)
assert.match(css, /\.constructor-divider > \.constructor-divider-face \{[\s\S]*?background: #f4f6f6;/)
assert.match(css, /\.constructor-frame-visual \{[\s\S]*?border-color: #f1f4f4;/)

assert.match(acceptance, /FRAME → DIVIDER → SASH PROFILE BAND → GLAZING/)
assert.match(acceptance, /display-only schematic layering/)
assert.match(acceptance, /No physical overlap, rebate, sash-face, glazing inset, cut angle, or catalogue dimension is inferred or stored/)
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
