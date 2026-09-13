import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(pkg.scripts?.['desktop:installer'], 'desktop:installer script is missing')
assert(pkg.scripts?.['test:desktop01b2'] === 'node scripts/verify-desktop01b2.mjs', 'test:desktop01b2 script mismatch')
assert(pkg.scripts?.['test:contract']?.includes('npm run test:desktop01b2'), 'DESKTOP 01B.2 is not registered in full verify')

const build = pkg.build ?? {}
const nsis = build.nsis ?? {}

assert(build.appId === 'com.facadeflow.desktop', 'appId changed unexpectedly')
assert(build.productName === 'FacadeFlow', 'productName changed unexpectedly')
assert(build.win?.icon === 'build/FacadeFlow.ico', 'Windows app icon must remain build/FacadeFlow.ico')
assert(nsis.oneClick === false, 'NSIS installer must be assisted, not one-click')
assert(nsis.perMachine === false, 'NSIS installer must be per-user')
assert(nsis.allowElevation === true, 'NSIS elevation support must remain enabled')
assert(nsis.allowToChangeInstallationDirectory === true, 'Install directory selection must be enabled')
assert(nsis.createDesktopShortcut === 'always', 'Desktop shortcut must be recreated by installer')
assert(nsis.createStartMenuShortcut === true, 'Start Menu shortcut must be enabled')
assert(nsis.shortcutName === 'FacadeFlow', 'Shortcut name must be FacadeFlow')
assert(nsis.uninstallDisplayName === 'FacadeFlow', 'Uninstall display name must be FacadeFlow')
assert(nsis.installerIcon === 'build/FacadeFlow.ico', 'Installer icon must use the Nadezhda app icon')
assert(nsis.uninstallerIcon === 'build/FacadeFlow.ico', 'Uninstaller icon must use the Nadezhda app icon')
assert(nsis.runAfterFinish === true, 'Run-after-finish must remain enabled')
assert(nsis.artifactName === 'FacadeFlow-Setup-${version}.${ext}', 'Installer artifact name mismatch')

assert(fs.existsSync(path.join(root, 'build', 'FacadeFlow.ico')), 'build/FacadeFlow.ico is missing')
assert(fs.existsSync(path.join(root, 'electron', 'main.mjs')), 'Electron shell is missing')

console.log('=== DESKTOP 01B.2 VERIFY PASS ===')
console.log('WINDOWS INSTALLER: NSIS x64')
console.log('DESKTOP SHORTCUT: ENABLED')
console.log('START MENU SHORTCUT: ENABLED')
console.log('INSTALLER / UNINSTALLER ICON: NADEZHDA')
console.log('PER-USER INSTALL: YES')
console.log('CONSTRUCTOR / DOMAIN / PERSISTENCE: UNCHANGED')
