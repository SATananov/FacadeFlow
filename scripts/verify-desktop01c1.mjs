import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const pkg = JSON.parse(read('package.json'))
const appVersion = read('src/appVersion.ts')
const app = read('src/App.tsx')
const css = read('src/App.css')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(pkg.version === '0.1.1', 'package version must be 0.1.1')
assert(appVersion.includes("APP_VERSION = '0.1.1'"), 'visible app version source must be 0.1.1')
assert(app.includes("import { APP_VERSION } from './appVersion'"), 'App must import APP_VERSION')
assert(app.includes('версия {APP_VERSION}'), 'home screen must show APP_VERSION')
assert(css.includes('.empty-home-version'), 'version badge styling is missing')

assert(pkg.build?.appId === 'com.facadeflow.desktop', 'stable appId changed; upgrade identity must remain stable')
assert(pkg.build?.productName === 'FacadeFlow', 'productName changed')
assert(pkg.build?.nsis?.perMachine === false, 'update must remain per-user')
assert(pkg.build?.nsis?.createDesktopShortcut === 'always', 'desktop shortcut preservation contract changed')
assert(pkg.build?.nsis?.createStartMenuShortcut === true, 'Start Menu shortcut preservation contract changed')
assert(pkg.build?.nsis?.deleteAppDataOnUninstall === false, 'app-data deletion must remain disabled')
assert(pkg.scripts?.['desktop:update'] === 'npm run build && electron-builder --win nsis --x64 --config.nsis.artifactName=FacadeFlow-Update-${version}.${ext} --config.nsis.runAfterFinish=false', 'manual update build script mismatch')
assert(pkg.scripts?.['test:desktop01c1'] === 'node scripts/verify-desktop01c1.mjs', '01C.1 verifier script mismatch')
assert(pkg.scripts?.['test:contract']?.includes('npm run test:desktop01c1'), '01C.1 verifier is not registered in full verify')
assert(fs.existsSync(path.join(root, 'scripts', 'test-desktop01c1-update.ps1')), 'installed-update preservation test is missing')

console.log('=== DESKTOP 01C.1 VERIFY PASS ===')
console.log('VERSION: 0.1.1')
console.log('MANUAL UPDATE PACKAGE: CONFIGURED')
console.log('APP ID / UPGRADE IDENTITY: STABLE')
console.log('APP DATA DELETE ON UNINSTALL: FALSE')
console.log('VERSION BADGE: VISIBLE')
console.log('UPDATE PRESERVATION TEST: PRESENT')
console.log('DIFFERENTIAL UPDATE: NOT YET - DESKTOP 01C.3')
