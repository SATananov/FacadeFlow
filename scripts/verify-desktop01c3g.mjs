import fs from 'node:fs'
import path from 'node:path'
import { assertUpdateHandoffContract } from './assert-update-handoff.mjs'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const fail = (message) => {
  console.error(`DESKTOP 01C.3G VERIFY FAIL: ${message}`)
  process.exit(1)
}

const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const appVersion = read('src/appVersion.ts')
const main = read('electron/main.mjs')
const publisher = read('scripts/publish-desktop01c3g-release.ps1')
const previousVerifier = read('scripts/verify-desktop01c3f.mjs')
const handoff = read('electron/updateHandoff.mjs')
const bootstrap = read('electron/update-bootstrap.ps1')
const worker = read('electron/update-worker.ps1')

assertUpdateHandoffContract({ main, read, fail })

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

if (!atLeast(pkg.version, '0.1.6')) fail(`current source version must be >= 0.1.6; found ${pkg.version}`)
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) fail('package-lock root version must match current package version')
if (!visibleMatch || visibleMatch[1] !== pkg.version) fail('visible app version must match current package version')

if (!previousVerifier.includes("$expected = '0.1.5'") && !previousVerifier.includes('RELEASE TARGET: v0.1.5')) {
  fail('historical 0.1.5 updater verifier contract unexpectedly changed')
}

if (pkg.scripts?.['test:desktop01c3g'] !== 'node scripts/verify-desktop01c3g.mjs') fail('01C.3G verifier command missing')
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop01c3g')) fail('01C.3G not registered in full verify')
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop-handoff-survival')) fail('Windows handoff survival test missing from full verify')

if (!publisher.includes("$expected = '0.1.6'")) fail('publisher does not target 0.1.6')
if (!publisher.includes("$previousTag = 'v0.1.5'")) fail('publisher previous-release guard missing')
if (!publisher.includes('Installed FacadeFlow seed must be 0.1.5')) fail('publisher installed-seed guard missing')
if (!publisher.includes('FacadeFlow-Update-$version.exe')) fail('publisher canonical update asset name missing')
if (!publisher.includes('gh release create $tag $exe $blockmap')) fail('publisher release creation missing')
if (!publisher.includes('WMI/CIM')) fail('publisher notes must identify Windows-native WMI/CIM handoff')

if (!handoff.includes("const authorizePath = path.join(transactionDir, 'authorize.flag')")) fail('authorization target regression')
if (!handoff.includes("const authorizeTemp = authorizePath + '.tmp'")) fail('atomic authorization temp-file regression')
if (!handoff.includes('await rename(authorizeTemp, authorizePath)')) fail('atomic authorization rename regression')
if (!handoff.includes("const authorizedPath = path.join(transactionDir, 'worker-authorized.json')")) fail('worker authorization acknowledgement regression')
if (!handoff.includes('authorized.workerPid !== ready.workerPid')) fail('worker authorization identity regression')
if (!bootstrap.includes('Win32_Process')) fail('Windows-native independent worker creation regression')
if (!worker.includes('$request.expectedBytes')) fail('worker size verification regression')
if (!worker.includes('$request.expectedSha256')) fail('worker SHA-256 verification regression')
if (!worker.includes('Installer MZ header mismatch.')) fail('worker MZ verification regression')
if (!worker.includes("-ArgumentList '/S'")) fail('silent NSIS invocation regression')
if (!worker.includes("'worker-authorized.json'")) fail('worker authorization ACK write regression')

if (pkg.build?.appId !== 'com.facadeflow.desktop') fail('stable appId changed')
if (pkg.build?.nsis?.deleteAppDataOnUninstall !== false) fail('user data preservation boundary changed')
if (pkg.build?.nsis?.perMachine !== false) fail('per-user install boundary changed')

console.log('=== DESKTOP 01C.3G VERIFY PASS ===')
console.log(`CURRENT SOURCE / VISIBLE VERSION: ${pkg.version}`)
console.log('INSTALLED TEST SEED: MUST REMAIN 0.1.5 UNTIL REAL 0.1.6 UPDATE TEST')
console.log('WINDOWS HANDOFF: WMI/CIM INDEPENDENT WORKER')
console.log('AUTHORIZATION: ATOMIC TEMP + RENAME + WORKER ACK BEFORE APP QUIT')
console.log('PRE-INSTALL INTEGRITY: FILE NAME + SIZE + SHA-256 + MZ')
console.log('UPDATE INSTALL: HUMAN INITIATED ONLY')
console.log('USER DATA PRESERVATION BOUNDARY: UNCHANGED')
console.log('RELEASE TARGET: v0.1.6 / FacadeFlow-Update-0.1.6.exe')
