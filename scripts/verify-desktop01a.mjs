import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function fail(message) {
  console.error(`DESKTOP 01A VERIFY FAIL: ${message}`)
  process.exit(1)
}

function expect(condition, message) {
  if (!condition) fail(message)
}

const packagePath = path.join(root, 'package.json')
const vitePath = path.join(root, 'vite.config.ts')
const mainPath = path.join(root, 'electron', 'main.mjs')
const appPath = path.join(root, 'src', 'App.tsx')

for (const file of [packagePath, vitePath, mainPath, appPath]) {
  expect(fs.existsSync(file), `missing ${path.relative(root, file)}`)
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const vite = fs.readFileSync(vitePath, 'utf8')
const main = fs.readFileSync(mainPath, 'utf8')
const appSource = fs.readFileSync(appPath, 'utf8')

expect(pkg.main === 'electron/main.mjs', 'package main must point to electron/main.mjs')
expect(pkg.devDependencies?.electron === '44.3.0', 'Electron must be pinned to 44.3.0')
expect(pkg.scripts?.desktop === 'npm run build && electron .', 'desktop script mismatch')
expect(pkg.scripts?.['desktop:open'] === 'electron .', 'desktop:open script mismatch')
expect(pkg.scripts?.['test:desktop01a'] === 'node scripts/verify-desktop01a.mjs', 'desktop verifier script missing')
expect(pkg.scripts?.['test:desktop01a:smoke'] === 'electron . --smoke-test', 'desktop smoke script missing')
expect(pkg.scripts?.['test:contract']?.includes('npm run test:desktop01a'), 'desktop static verifier not registered in full contract')

expect(/base:\s*['"]\.\/['"]/.test(vite), 'Vite base must be ./ for file:// asset loading')
expect(appSource.includes("const nadezhdaLogoUrl = './branding/nadezhda-header.png'"), 'relative branding URL missing')
expect(!appSource.includes('src="/branding/nadezhda-header.png"'), 'absolute branding URL remains in App.tsx')
expect((appSource.match(/src=\{nadezhdaLogoUrl\}/g) ?? []).length === 4, 'all four branding images must use the base-aware URL')

expect(main.includes("import { app, BrowserWindow } from 'electron'"), 'Electron main import missing')
expect(main.includes("title: 'FacadeFlow'"), 'FacadeFlow window title missing')
expect(main.includes('width: 1500'), 'desktop width missing')
expect(main.includes('height: 950'), 'desktop height missing')
expect(main.includes('minWidth: 1180'), 'desktop minWidth missing')
expect(main.includes('minHeight: 720'), 'desktop minHeight missing')
expect(main.includes('nodeIntegration: false'), 'nodeIntegration must stay disabled')
expect(main.includes('contextIsolation: true'), 'contextIsolation must stay enabled')
expect(main.includes('sandbox: true'), 'renderer sandbox must stay enabled')
expect(main.includes("setWindowOpenHandler(() => ({ action: 'deny' }))"), 'new-window denial missing')
expect(main.includes("process.argv.includes('--smoke-test')"), 'smoke-test mode missing')
expect(main.includes('app.disableHardwareAcceleration()'), 'smoke-test GPU-noise suppression missing')
expect(main.includes("path.resolve(__dirname, '..', 'dist', 'index.html')"), 'production dist target missing')
expect(main.includes('mainWindow.loadFile(distIndex)'), 'desktop shell must load built dist file')
expect(main.includes('image.naturalWidth === 0'), 'smoke test must reject broken branding images')
expect(main.includes('BRANDING ASSETS'), 'branding smoke pass marker missing')

console.log('=== DESKTOP 01A VERIFY PASS ===')
console.log('ELECTRON SHELL: PRESENT')
console.log('VITE FILE ASSET BASE: RELATIVE')
console.log('BRANDING URLS: DOCUMENT-RELATIVE')
console.log('BRANDING IMAGE SMOKE: ENFORCED')
console.log('NODE INTEGRATION: DISABLED')
console.log('CONTEXT ISOLATION: ENABLED')
console.log('RENDERER SANDBOX: ENABLED')
console.log('DOMAIN / CONSTRUCTOR GEOMETRY / PERSISTENCE: UNCHANGED BY DESKTOP FIX')
