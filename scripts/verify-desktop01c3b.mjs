import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const fail = (message) => {
  console.error(`DESKTOP 01C.3B VERIFY FAIL: ${message}`)
  process.exit(1)
}

const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const appVersion = read('src/appVersion.ts')
const c1 = read('scripts/verify-desktop01c1.mjs')
const c2 = read('scripts/verify-desktop01c2.mjs')
const c3a = read('scripts/verify-desktop01c3a.mjs')
const publish = read('scripts/publish-desktop01c3b-release.ps1')

const appVersionMatch = appVersion.match(/APP_VERSION\s*=\s*'(\d+\.\d+\.\d+)'/)
if (!appVersionMatch) fail('visible APP_VERSION declaration missing')
if (appVersionMatch[1] !== pkg.version) fail(`visible APP_VERSION ${appVersionMatch[1]} does not match package version ${pkg.version}`)
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) fail(`package-lock root version must match package version ${pkg.version}`)
const versionParts = pkg.version.split('.').map(Number)
if (versionParts.length !== 3 || versionParts.some((value) => !Number.isInteger(value))) fail('package version is not semantic x.y.z')
if (versionParts[0] !== 0 || versionParts[1] !== 1 || versionParts[2] < 2) fail(`01C.3B requires version >= 0.1.2; found ${pkg.version}`)
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop01c3b')) fail('01C.3b not registered in full verify')
if (pkg.scripts?.['test:desktop01c3b'] !== 'node scripts/verify-desktop01c3b.mjs') fail('01C.3b verifier command missing')
if (!publish.includes("$expected = '0.1.2'")) fail('publish script does not pin release version 0.1.2')
if (!publish.includes('git rev-parse origin/master')) fail('publish script must verify pushed source state')
if (!publish.includes('gh auth status')) fail('publish script must require authenticated GitHub CLI')
if (!publish.includes('gh release create')) fail('publish script does not create GitHub release')
if (!publish.includes('FacadeFlow-Update-$version.exe')) fail('publish script does not use canonical update artifact name')
if (!publish.includes('INSTALLED LOCAL APP: NOT UPDATED')) fail('publish boundary must keep local installed 0.1.1 untouched')

for (const [label, source] of [['01C.1', c1], ['01C.2', c2], ['01C.3a', c3a]]) {
  if (source.includes("pkg.version === '0.1.1'") || source.includes("pkg.version !== '0.1.1'")) {
    fail(`${label} regression verifier still hard-codes 0.1.1 and would block future updates`)
  }
}

if (pkg.build?.appId !== 'com.facadeflow.desktop') fail('stable appId changed')
if (pkg.build?.nsis?.deleteAppDataOnUninstall !== false) fail('user data preservation boundary changed')

console.log('=== DESKTOP 01C.3B VERIFY PASS ===')
console.log(`CURRENT SOURCE VERSION: ${pkg.version}`)
console.log(`CURRENT VISIBLE VERSION: ${appVersionMatch[1]}`)
console.log('LEGACY UPDATE VERIFIERS: FUTURE-VERSION TOLERANT')
console.log('RELEASE PUBLISH SCRIPT: PRESENT / PUSH-GATED / GH-AUTH-GATED')
console.log('RELEASE ASSET NAME: FacadeFlow-Update-0.1.2.exe')
console.log('INSTALLED 0.1.1: MUST REMAIN UNTOUCHED UNTIL DOWNLOAD TEST')
