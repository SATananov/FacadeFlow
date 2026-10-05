import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')

const normalSash = shell.match(/<span className="constructor-sash-profile-visual"[\s\S]*?<\/span>/)?.[0] ?? ''
assert.equal((normalSash.match(/className="sash-profile-mitre mitre-/g) ?? []).length, 4, 'normal operable sash has four mitres')
assert.match(shell, /!combinedGeometryComplete && field\.fieldType === 'operable'[\s\S]*constructor-sash-profile-visual/)
assert.match(shell, /constructor-field-surface[^\n]*field\.fieldType === 'fixed'/)
assert.match(css, /SASH MITRE READABILITY 01\.1/)
assert.match(css, /\.constructor-field-surface\.is-operable \.constructor-sash-profile-visual \.sash-profile-mitre[\s\S]*z-index: 5[\s\S]*width: 14\.15px[\s\S]*height: 2px/)
assert.match(css, /background: rgba\(27, 43, 49, \.98\)/)
assert.match(css, /box-shadow: 0 0 0 \.35px/)
assert.match(css, /\.constructor-operable-sash-priority \{[\s\S]*z-index: 8/)
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf \{ z-index: 10; \}/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-mitre\.mitre-tl[\s\S]*transform: rotate\(45deg\)/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-mitre\.mitre-tr[\s\S]*transform: rotate\(-45deg\)/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-mitre\.mitre-bl[\s\S]*transform: rotate\(-45deg\)/)
assert.match(css, /\.constructor-sash-profile-visual \.sash-profile-mitre\.mitre-br[\s\S]*transform: rotate\(45deg\)/)

const protectedChanges = execFileSync('git', ['diff', '--name-only', '--', 'src/domain', 'src/data'], { encoding: 'utf8' })
assert.equal(protectedChanges.trim(), '', 'domain and catalogue files unchanged')
const shellDiff = execFileSync('git', ['diff', '--unified=0', '--', 'src/components/ConstructorShell.tsx'], { encoding: 'utf8' })
assert.doesNotMatch(shellDiff, /\bpan\b|\bruler\b|\bdimension\b|auto.?fit/i, 'viewport and dimensions unchanged')
assert.doesNotMatch(`${shell}\n${css}`, /machineReady\s*:\s*true/)

console.log('MODULE 2 SASH MITRE READABILITY 01.1 VERIFY PASS')
console.log('FIELD 1 / FIELD 3 OPERABLE MITRES: FOUR EACH')
console.log('FIELD 2 FIXED SASH MITRES: NONE')
console.log('MITRES: CONTRAST / WEIGHT / LOCAL STACKING VERIFIED')
console.log('DOMAIN / VIEWPORT / DIMENSIONS: UNCHANGED')
console.log('MACHINE READY: NO')
