import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const semanticsData = await readFile(new URL('../src/data/profileSystems/dimensionalSemantics.ts', import.meta.url), 'utf8')
const domain = await readFile(new URL('../src/domain/profileDimensionalSemantics.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const shellCss = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const catalogTypes = await readFile(new URL('../src/data/profileSystems/types.ts', import.meta.url), 'utf8')
const prelude = await readFile(new URL('../src/data/profileSystems/prelude60.ts', import.meta.url), 'utf8')
const acceptance = await readFile(new URL('../docs/PROFILE_RESOLUTION_01B_DIMENSIONAL_SEMANTICS_FOUNDATION_ACCEPTANCE.md', import.meta.url), 'utf8')
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

assert.match(semanticsData, /profileCode: '482\.30'[\s\S]*visibleFace:[\s\S]*valueMm: 42/)
assert.match(semanticsData, /profileCode: '482\.21'[\s\S]*visibleFace:[\s\S]*valueMm: 40/)
assert.doesNotMatch(semanticsData, /profileCode: '482\.18'[\s\S]*visibleFace:/)
assert.match(semanticsData, /Sash geometry is deliberately unresolved/)

assert.match(domain, /profile-resolution-01b/)
assert.match(domain, /constructor-authoritative/)
assert.match(domain, /schematic-only/)
assert.match(domain, /UNKNOWN — raw catalog callouts/)
assert.match(domain, /getSchematicBayWidth/)
assert.match(domain, /half of an adjacent divider face/i)
assert.match(domain, /profileAwareGeometryReady: false/)
assert.match(domain, /machineReady: false/)

assert.match(catalogTypes, /Dimensions are copied from the numeric callouts/)
assert.match(catalogTypes, /intentionally NOT given production semantics/)
assert.match(prelude, /code: '482\.30'.*calloutsMm: \[60, 64, 42\]/)
assert.match(prelude, /code: '482\.21'.*calloutsMm: \[60, 84, 40\]/)

assert.match(shell, /PROFILE RESOLUTION 01B/)
assert.match(shell, /Размерна верига · семантика преди геометрия/)
assert.match(shell, /Схемни модулни ширини/)
assert.match(shell, /МОДУЛ \{bayWidthLabel\}/)
assert.match(shell, /GLASS CUT SIZE/)
assert.match(shell, /PROFILE-AWARE GEOMETRY/)
assert.match(shell, /РАЗМЕРНА СЕМАНТИКА НА КАСАТА/)
assert.match(shell, /РАЗМЕРНА СЕМАНТИКА НА ДЕЛИТЕЛЯ/)
assert.match(shell, /РАЗМЕРНА СЕМАНТИКА НА КРИЛОТО/)
assert.match(shellCss, /Profile Resolution 01B/)
assert.match(shellCss, /constructor-bay-dimension-band/)

assert.match(acceptance, /OUTER OVERALL → SCHEMATIC MODULE \/ BAY → FIELD CLEAR OPENING → SASH → VISIBLE GLAZING → GLASS CUT SIZE/)
assert.match(acceptance, /482\.20.*UNKNOWN/)
assert.match(acceptance, /482\.24.*UNKNOWN/)
assert.match(acceptance, /SASH OVERLAP SEMANTICS: UNKNOWN/)
assert.match(acceptance, /PROFILE-AWARE GEOMETRY: NO/)
assert.match(acceptance, /MACHINE READY: NO/)
assert.match(packageJson.scripts['test:contract'], /verify-profile-resolution01b\.mjs/)

// Contract arithmetic for the reference-style segmented chain.
const frame = 3400
const frameFace = 60
const dividerFace = 40
const clear = [900, 1470, 830]
const bays = [
  frameFace + clear[0] + dividerFace / 2,
  dividerFace / 2 + clear[1] + dividerFace / 2,
  dividerFace / 2 + clear[2] + frameFace,
]
assert.deepEqual(bays, [980, 1510, 910])
assert.equal(bays.reduce((sum, value) => sum + value, 0), frame)

console.log('PROFILE RESOLUTION 01B VERIFY PASS')
console.log('DIMENSION CHAIN: OUTER -> SCHEMATIC BAY -> FIELD -> SASH -> GLAZING -> GLASS CUT')
console.log('482.30 VISIBLE FACE: 42 mm HUMAN CONFIRMED')
console.log('482.21 VISIBLE FACE: 40 mm HUMAN CONFIRMED')
console.log('SASH VISIBLE FACE / OVERLAP / GLAZING INSET: UNKNOWN')
console.log('RAW CATALOG POSITIONAL INFERENCE: NO')
console.log('PROFILE-AWARE GEOMETRY: NO')
console.log('MACHINE READY: NO')
