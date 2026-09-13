import fs from 'node:fs'
import path from 'node:path'
import { assertUpdateHandoffContract } from './assert-update-handoff.mjs'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const fail = (message) => {
  console.error(`DESKTOP 01C.3C.1 VERIFY FAIL: ${message}`)
  process.exit(1)
}

const main = read('electron/main.mjs')
assertUpdateHandoffContract({ main, read, fail })
const pkg = JSON.parse(read('package.json'))
const appVersion = read('src/appVersion.ts')
const appVersionMatch = appVersion.match(/APP_VERSION = '(\d+\.\d+\.\d+)'/)
if (!appVersionMatch) fail('visible APP_VERSION declaration missing')
if (appVersionMatch[1] !== pkg.version) fail(`visible APP_VERSION ${appVersionMatch[1]} does not match package version ${pkg.version}`)
const versionParts = pkg.version.split('.').map(Number)
if (versionParts.length !== 3 || versionParts.some((value) => !Number.isInteger(value))) fail('package version is not semantic x.y.z')
if (versionParts[0] !== 0 || versionParts[1] !== 1 || versionParts[2] < 3) fail(`01C.3C.1 requires version >= 0.1.3; found ${pkg.version}`)

if (!main.includes('setTimeout(() => app.quit(), 100)')) fail('quit must happen only after helper readiness')
if (main.includes('setTimeout(() => app.quit(), 250)')) fail('old blind 250ms quit race is still present')
if (!main.includes("createHash('sha256')")) fail('SHA-256 pre-install integrity check missing')
if (!main.includes('actualSha256 !== metadata.sha256')) fail('download integrity recheck missing')
if (!main.includes("process.platform !== 'win32' || !app.isPackaged")) fail('packaged Windows install gate missing')
if (pkg.scripts?.['test:desktop01c3c1'] !== 'node scripts/verify-desktop01c3c1.mjs') fail('01C.3C.1 verifier command missing')
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop01c3c1')) fail('01C.3C.1 not registered in full verify')
if (pkg.build?.appId !== 'com.facadeflow.desktop') fail('stable appId changed')
if (pkg.build?.nsis?.deleteAppDataOnUninstall !== false) fail('user data preservation boundary changed')

console.log('=== DESKTOP 01C.3C.1 VERIFY PASS ===')
console.log(`APP VERSION: ${pkg.version}`)
console.log('BUG: INSTALL HELPER COULD BE LOST BEFORE FIRST POWERSHELL INSTRUCTION')
console.log('FIX: HELPER READY HANDSHAKE BEFORE APP QUIT')
console.log('POWERSHELL: EXPLICIT SYSTEMROOT PATH + SPAWN / EARLY EXIT CAPTURE')
console.log('INSTALL: HUMAN INITIATED ONLY')
console.log('PRE-INSTALL INTEGRITY: PRESERVED')
console.log('USER DATA PRESERVATION: UNCHANGED')
console.log('AUTO BACKGROUND INSTALL: NO')
