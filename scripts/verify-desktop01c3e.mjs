import fs from 'node:fs'
import path from 'node:path'
import { assertUpdateHandoffContract } from './assert-update-handoff.mjs'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const fail = (message) => {
  console.error(`DESKTOP 01C.3E VERIFY FAIL: ${message}`)
  process.exit(1)
}

const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const appVersion = read('src/appVersion.ts')
const main = read('electron/main.mjs')
assertUpdateHandoffContract({ main, read, fail })
const preload = read('electron/preload.cjs')
const api = read('src/desktopUpdate.ts')
const app = read('src/App.tsx')
const previousReleaseVerifier = read('scripts/verify-desktop01c3d.mjs')
const readyAckVerifier = read('scripts/verify-desktop01c3c1.mjs')
const publisher = read('scripts/publish-desktop01c3e-release.ps1')

const parseVersion = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value)
  return match ? match.slice(1).map(Number) : null
}
const atLeast = (value, minimum) => {
  const current = parseVersion(value)
  const floor = parseVersion(minimum)
  if (!current || !floor) return false
  for (let index = 0; index < 3; index += 1) {
    if (current[index] > floor[index]) return true
    if (current[index] < floor[index]) return false
  }
  return true
}
const visibleMatch = appVersion.match(/APP_VERSION\s*=\s*'([^']+)'/)

if (!atLeast(pkg.version, '0.1.4')) fail(`current source version must be >= 0.1.4; found ${pkg.version}`)
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) fail('package-lock root version must match current package version')
if (!visibleMatch || visibleMatch[1] !== pkg.version) fail('visible app version must match current package version')

if (!previousReleaseVerifier.includes("$expected = '0.1.3'") && !previousReleaseVerifier.includes('HISTORICAL RELEASE TARGET')) {
  fail('historical 0.1.3 release verifier/publisher contract unexpectedly changed')
}
if (!readyAckVerifier.includes('HELPER READY HANDSHAKE BEFORE APP QUIT')) fail('READY-ACK regression verifier missing')
if (!main.includes("ipcMain.handle('facadeflow:download-update'")) fail('download IPC regression')
if (!main.includes("ipcMain.handle('facadeflow:install-downloaded-update'")) fail('install IPC regression')
if (!main.includes("createHash('sha256')")) fail('SHA-256 recheck regression')
if (!main.includes('hasWindowsExecutableHeader')) fail('Windows executable validation regression')
if (!main.includes("process.platform !== 'win32' || !app.isPackaged")) fail('packaged Windows install boundary regression')
if (!preload.includes('installDownloadedUpdate')) fail('preload install bridge regression')
if (!api.includes('installDownloadedUpdate')) fail('renderer install API regression')
if (!app.includes('Обнови и рестартирай')) fail('human install action regression')
if (!app.includes('Увери се, че текущият проект е запазен. Продължаваме ли?')) fail('save reminder regression')

if (pkg.build?.appId !== 'com.facadeflow.desktop') fail('stable appId changed')
if (pkg.build?.nsis?.deleteAppDataOnUninstall !== false) fail('user data preservation boundary changed')
if (pkg.build?.nsis?.perMachine !== false) fail('per-user install boundary changed')
if (!pkg.scripts?.['desktop:update']?.includes('FacadeFlow-Update-${version}.${ext}')) fail('canonical update artifact naming changed')
if (pkg.scripts?.['test:desktop01c3e'] !== 'node scripts/verify-desktop01c3e.mjs') fail('01C.3E verifier command missing')
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop01c3e')) fail('01C.3E not registered in full verify')

if (!publisher.includes("$expected = '0.1.4'")) fail('historical publisher no longer targets 0.1.4')
if (!publisher.includes("$previousTag = 'v0.1.3'")) fail('historical publisher previous-release guard missing')
if (!publisher.includes('FacadeFlow-Update-$version.exe')) fail('historical publisher canonical update asset name missing')
if (!publisher.includes('gh release create $tag $exe $blockmap')) fail('historical publisher release creation missing')
if (!publisher.includes("Installed FacadeFlow seed must be 0.1.3")) fail('historical publisher installed-seed guard missing')

console.log('=== DESKTOP 01C.3E VERIFY PASS ===')
console.log(`CURRENT SOURCE / VISIBLE VERSION: ${pkg.version}`)
console.log('HISTORICAL RELEASE TARGET: v0.1.4 / FacadeFlow-Update-0.1.4.exe')
console.log('WINDOWS-NATIVE HANDOFF CONTRACT: REGRESSION PROTECTED')
console.log('PRE-INSTALL INTEGRITY: SHA-256 + SIZE + FILE NAME + MZ HEADER')
console.log('USER DATA PRESERVATION BOUNDARY: UNCHANGED')
console.log('AUTO BACKGROUND INSTALL: NO')
