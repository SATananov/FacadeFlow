import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const rulebook = await readFile(new URL('../docs/technical-drawing-reference/FACADEFLOW_VISUAL_REFERENCE_LIBRARY_01.md', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

assert.match(rulebook, /FF-REF-W03/)
assert.match(rulebook, /FF-REF-W04/)
for (const referenceId of ['FF-REF-S01', 'FF-REF-S02', 'FF-REF-S03', 'FF-REF-S04', 'FF-REF-S05', 'FF-REF-S06']) {
  assert.match(rulebook, new RegExp(referenceId))
}
assert.match(rulebook, /Reference priority[\s\S]*FF-REF-S03[\s\S]*FF-REF-S01[\s\S]*FF-REF-S05[\s\S]*FF-REF-S06/i)
assert.match(rulebook, /SIDE-HUNG[\s\S]*two clean lines[\s\S]*no tilt line/i)
assert.match(rulebook, /TILT-TURN[\s\S]*side-hung pair[\s\S]*one additional tilt cue/i)
assert.match(rulebook, /centered `\+` fixed marker/i)
assert.match(rulebook, /hardware[\s\S]*belongs to the sash[\s\S]*physical divider/i)
assert.match(rulebook, /ZERO_DIVIDER[\s\S]*semantic only[\s\S]*zero physical thickness/i)
assert.match(rulebook, /Profile visual width may be schematic/i)
assert.match(rulebook, /opening symbol[\s\S]*semantic presentation/i)
assert.match(rulebook, /Visual consistency principle[\s\S]*technical readability[\s\S]*minimal visual noise/i)
assert.match(rulebook, /SAAV source:[\s\S]*saav\.bg/i)

const operableBranch = shell.match(/!combinedGeometryComplete && field\.fieldType === 'operable'[\s\S]*?<\/svg>/)?.[0] ?? ''
assert.match(operableBranch, /constructor-sash-profile-visual/)
assert.equal((operableBranch.match(/className="sash-profile-mitre mitre-/g) ?? []).length, 4)
assert.match(operableBranch, /constructor-sash-hardware/)

const fixedBranch = shell.match(/!combinedGeometryComplete && field\.fieldType === 'fixed'[\s\S]*?constructor-fixed-plus[\s\S]*?<\/span>/)?.[0] ?? ''
assert.match(fixedBranch, /constructor-fixed-plus/)
assert.doesNotMatch(fixedBranch, /constructor-sash-profile-visual|constructor-operable-visual|constructor-sash-hardware/)

assert.match(shell, /openingHanding === 'left'[\s\S]*<rect x="87" y="43" width="4" height="14"/)
assert.match(shell, /openingHanding === 'right'[\s\S]*<rect x="9" y="44" width="5" height="12"/)
assert.match(css, /\.constructor-sash-hardware[\s\S]*fill:/)
assert.match(css, /\.constructor-fixed-plus[\s\S]*pointer-events: none/)

const protectedChanges = execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/data', 'src/persistence'], { encoding: 'utf8' })
assert.equal(protectedChanges.trim(), '')
const shellDiff = execFileSync('git', ['diff', '--unified=0', '--', 'src/components/ConstructorShell.tsx'], { encoding: 'utf8' })
assert.doesNotMatch(shellDiff, /\bpan\b|\bruler\b|\bdimension\b|auto.?fit/i)
assert.doesNotMatch(`${shell}\n${css}`, /machineReady\s*:\s*true/)

console.log('FACADEFLOW VISUAL REFERENCE RULEBOOK 01 VERIFY PASS')
console.log('RULEBOOK: PRESENT')
console.log('MODULE 2: OPERABLE / FIXED / OPERABLE ALIGNMENT DOCUMENTED')
console.log('HARDWARE: SASH-LOCAL, EXPLICIT-HANDING ONLY')
console.log('ZERO_DIVIDER: NONPHYSICAL')
console.log('DOMAIN / PERSISTENCE / VIEWPORT: UNCHANGED')
console.log('MACHINE READY: NO')
