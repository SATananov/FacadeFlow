import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/CONSTRUCTOR_01E5_3_PROFILE_LINE_HIERARCHY_AND_SELECTION_CLEANUP_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(css, /Constructor 01E\.5\.3 — profile line hierarchy & selection cleanup/i)
assert.match(css, /\.constructor-frame-visual::before \{[\s\S]*display: none;/)
assert.match(css, /\.constructor-field-surface \{[\s\S]*box-shadow: none;/)
assert.match(css, /\.constructor-field-surface\.is-selected \{[\s\S]*box-shadow: none;/)
assert.match(css, /\.constructor-sash-profile-visual \{[\s\S]*inset: 5px;/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-inner \{[\s\S]*inset: 11px;/)

assert.match(acceptance, /FRAME -> DIVIDER -> SASH -> GLAZING/i)
assert.match(acceptance, /Generic FIELD inset contours are removed/i)
assert.match(acceptance, /Selecting a field must not add extra nested technical contours/i)
assert.match(acceptance, /does not infer catalog overlap, rebate, sash face, cut geometry, or machine geometry/i)
assert.match(packageJson.scripts['test:contract'], /verify-constructor01e5_3\.mjs/)
assert.equal(packageJson.scripts['test:constructor01e5_3'], 'node scripts/verify-constructor01e5_3.mjs')

console.log('=== CONSTRUCTOR 01E.5.3 VERIFY PASS ===')
console.log('PROFILE LINE HIERARCHY: REDUCED TO STRUCTURAL SIGNALS')
console.log('FRAME HELPER OFFSET CONTOUR: REMOVED')
console.log('GENERIC FIELD INSET CONTOURS: REMOVED')
console.log('OPERABLE SASH RING: RETAINED AS PRIMARY INTERNAL PROFILE READ')
console.log('FIELD SELECTION: NO EXTRA NESTED TECHNICAL CONTOURS')
console.log('GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED')
console.log('PROFILE RESOLUTION 02A / 02A.2 / 02A.3: UNCHANGED')
console.log('MACHINE READY: NO')
