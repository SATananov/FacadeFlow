import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const packageJson = JSON.parse(await read('package.json'))
const packageLock = JSON.parse(await read('package-lock.json'))
const appVersion = await read('src/appVersion.ts')
const readme = await read('README.md')
const releaseDoc = await read('docs/FACADEFLOW_0_1_8_RELEASE_ACCEPTANCE.md')
const constructorShell = await read('src/components/ConstructorShell.tsx')

const RELEASE_VERSION = '0.1.8'

assert.equal(packageJson.version, RELEASE_VERSION, 'package.json version must be 0.1.8')
assert.equal(packageLock.version, RELEASE_VERSION, 'package-lock top-level version must be 0.1.8')
assert.equal(packageLock.packages?.['']?.version, RELEASE_VERSION, 'package-lock root package version must be 0.1.8')
assert.match(appVersion, /APP_VERSION\s*=\s*'0\.1\.8'/, 'visible APP_VERSION must be 0.1.8')

assert.equal(packageJson.devDependencies?.electron, '44.3.0', 'Electron release pin changed unexpectedly')
assert.equal(packageJson.devDependencies?.['electron-builder'], '26.15.3', 'electron-builder release pin changed unexpectedly')
assert.equal(packageLock.packages?.['']?.devDependencies?.electron, '44.3.0', 'package-lock root must mirror Electron pin')
assert.equal(packageLock.packages?.['']?.devDependencies?.['electron-builder'], '26.15.3', 'package-lock root must mirror electron-builder pin')

assert.equal(packageJson.scripts?.['test:atomic-module-history01'], 'node scripts/verify-atomic-module-history01.mjs')
assert.match(packageJson.scripts?.['test:form-constructor-transition01'] ?? '', /verify-form-constructor-transition01\.mjs/)
assert.match(packageJson.scripts?.['test:form-constructor-transition01'] ?? '', /verify-form-constructor-transition01-runtime\.mjs/)
assert.match(packageJson.scripts?.['test:field-glazing-ownership01'] ?? '', /verify-field-glazing-ownership01\.mjs/)
assert.match(packageJson.scripts?.['test:field-glazing-ownership01'] ?? '', /verify-field-glazing-ownership01-runtime\.mjs/)
assert.equal(packageJson.scripts?.['test:human-undo-session01'], 'node scripts/verify-human-undo-session01.mjs')
assert.match(packageJson.scripts?.['test:release018'] ?? '', /verify-release018\.mjs/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /test:atomic-module-history01/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /test:form-constructor-transition01/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /test:field-glazing-ownership01/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /verify-integrated-acceptance01\.mjs/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /test:integrated-acceptance01/)
assert.match(packageJson.scripts?.['test:release018'] ?? '', /test:human-undo-session01/)
assert.match(packageJson.scripts?.verify ?? '', /test:contract/)
assert.match(packageJson.scripts?.verify ?? '', /test:release018/)
assert.match(packageJson.scripts?.verify ?? '', /npm run lint/)
assert.match(packageJson.scripts?.verify ?? '', /npm run build/)
assert.equal(packageJson.scripts?.['verify:release018'], 'npm run verify')

assert.match(readme, /FacadeFlow 0\.1\.8/)
assert.match(readme, /0\.1\.8B.*0\.1\.8E\.1/s)
assert.match(readme, /npm run verify:release018/)
assert.match(releaseDoc, /AUTOMATIC GEOMETRY: \*\*NO\*\*/)
assert.match(releaseDoc, /MACHINE READY: \*\*NO\*\*/)

assert.match(constructorShell, /FACADEFLOW 0\.1\.8B ATOMIC MODULE HISTORY 01/)
assert.match(constructorShell, /FACADEFLOW 0\.1\.8E\.1 HUMAN UNDO SESSION HOTFIX V2/)

console.log('FACADEFLOW 0.1.8 FINAL RELEASE METADATA VERIFY PASS')
console.log('VERSION: package.json = package-lock = APP_VERSION = 0.1.8')
console.log('RELEASE LINE: 0.1.8B -> 0.1.8C -> 0.1.8D -> 0.1.8E -> 0.1.8E.1')
console.log('DEFAULT npm run verify: INCLUDES 0.1.8 RELEASE GATE')
console.log('DESKTOP TOOLCHAIN PINS: ELECTRON 44.3.0 / ELECTRON-BUILDER 26.15.3')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
