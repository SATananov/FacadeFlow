import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const fail = (message) => {
  console.error(`DESKTOP 01B.1 VERIFY FAIL: ${message}`)
  process.exit(1)
}

const pkg = JSON.parse(read('package.json'))
const main = read('electron/main.mjs')
const gitignore = read('.gitignore')
const iconPath = path.join(root, 'build', 'FacadeFlow.ico')

if (pkg.main !== 'electron/main.mjs') fail('Electron main entry changed unexpectedly')
if (pkg.devDependencies?.['electron-builder'] !== '26.15.3') fail('electron-builder 26.15.3 is not pinned')
if (pkg.scripts?.['desktop:portable'] !== 'npm run build && electron-builder --win portable --x64') fail('portable build script missing')
if (pkg.scripts?.['test:desktop01b1'] !== 'node scripts/verify-desktop01b1.mjs') fail('01B.1 verifier script missing')
if (!pkg.scripts?.['test:contract']?.includes('npm run test:desktop01b1')) fail('01B.1 verifier is not registered in full verify')

const build = pkg.build
if (!build) fail('electron-builder configuration missing')
if (build.appId !== 'com.facadeflow.desktop') fail('stable appId missing')
if (build.productName !== 'FacadeFlow') fail('productName is not FacadeFlow')
if (build.asar !== true) fail('asar packaging must stay enabled')
if (build.directories?.output !== 'release') fail('release output directory mismatch')
if (build.directories?.buildResources !== 'build') fail('build resources directory mismatch')
if (build.win?.icon !== 'build/FacadeFlow.ico') fail('Windows app icon is not configured')
if (build.artifactName !== 'FacadeFlow-Portable-${version}.${ext}') fail('portable artifact name mismatch')

const target = build.win?.target?.[0]
if (target?.target !== 'portable') fail('Windows target is not portable')
if (!Array.isArray(target?.arch) || target.arch.length !== 1 || target.arch[0] !== 'x64') fail('portable target must be x64 only for 01B.1')

const extraIcon = build.extraResources?.find((entry) => entry?.from === 'build/FacadeFlow.ico' && entry?.to === 'FacadeFlow.ico')
if (!extraIcon) fail('runtime window icon is not copied into resources')
if (!fs.existsSync(iconPath) || fs.statSync(iconPath).size < 1000) fail('FacadeFlow.ico is missing or invalid')
if (!gitignore.split(/\r?\n/).includes('release/')) fail('release/ must be Git-ignored')

if (!main.includes("app.isPackaged")) fail('packaged/dev icon path split missing')
if (!main.includes("process.resourcesPath, 'FacadeFlow.ico'")) fail('packaged icon resource path missing')
if (!main.includes("path.resolve(__dirname, '..', 'build', 'FacadeFlow.ico')")) fail('development icon path missing')
if (!main.includes('icon: windowIcon')) fail('BrowserWindow icon is not set')
if (!main.includes('nodeIntegration: false')) fail('nodeIntegration must remain disabled')
if (!main.includes('contextIsolation: true')) fail('contextIsolation must remain enabled')
if (!main.includes('sandbox: true')) fail('renderer sandbox must remain enabled')

console.log('=== DESKTOP 01B.1 VERIFY PASS ===')
console.log('WINDOWS TARGET: PORTABLE X64')
console.log('PRODUCT NAME: FacadeFlow')
console.log('WINDOW / EXE ICON: CONFIGURED')
console.log('ASAR: ENABLED')
console.log('RELEASE OUTPUT: GIT-IGNORED')
console.log('NODE INTEGRATION: OFF')
console.log('CONTEXT ISOLATION: ON')
console.log('RENDERER SANDBOX: ON')
console.log('INSTALLER / DESKTOP SHORTCUT: NOT YET - DESKTOP 01B.2')
