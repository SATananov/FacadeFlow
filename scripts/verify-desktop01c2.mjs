import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const requireText = (text, expected, label) => {
  if (!text.includes(expected)) throw new Error(`${label}: missing ${expected}`)
}
const forbidText = (text, forbidden, label) => {
  if (text.includes(forbidden)) throw new Error(`${label}: forbidden ${forbidden}`)
}

const pkg = JSON.parse(read('package.json'))
const main = read('electron/main.mjs')
const preload = read('electron/preload.cjs')
const app = read('src/App.tsx')
const css = read('src/App.css')
const update = read('src/desktopUpdate.ts')
const appVersion = read('src/appVersion.ts')

const versionMatch = appVersion.match(/APP_VERSION\s*=\s*'([^']+)'/)
if (!versionMatch || pkg.version !== versionMatch[1]) throw new Error(`package/app version mismatch: ${pkg.version} vs ${versionMatch?.[1] ?? 'missing'}`)
requireText(pkg.scripts['test:contract'], 'npm run test:desktop01c2', 'full verify registration')
requireText(pkg.scripts['test:desktop01c2:network'], '--update-check-smoke', 'network smoke command')
requireText(main, "https://raw.githubusercontent.com/SATananov/FacadeFlow/master/package.json", 'public version source')
requireText(main, "https://github.com/SATananov/FacadeFlow/releases/latest", 'controlled download page')
requireText(main, "ipcMain.handle('facadeflow:check-for-updates'", 'check IPC')
requireText(main, "ipcMain.handle('facadeflow:open-update-page'", 'download IPC')
requireText(main, "url.protocol !== 'https:'", 'https restriction')
requireText(main, "url.hostname !== 'github.com'", 'host restriction')
requireText(main, 'preload: preloadPath', 'preload registration')
requireText(main, "process.argv.includes('--update-check-smoke')", 'network smoke mode')
requireText(main, 'UPDATE CHECK SMOKE PASS', 'network smoke result')
requireText(main, 'nodeIntegration: false', 'node integration security')
requireText(main, 'contextIsolation: true', 'context isolation security')
requireText(main, 'sandbox: true', 'sandbox security')

requireText(preload, "contextBridge.exposeInMainWorld('facadeFlowDesktop'", 'safe preload bridge')
requireText(preload, "ipcRenderer.invoke('facadeflow:check-for-updates')", 'check bridge')
requireText(preload, "ipcRenderer.invoke('facadeflow:open-update-page')", 'download bridge')
forbidText(preload, 'require(\'fs\')', 'preload filesystem exposure')
forbidText(preload, 'require(\'child_process\')', 'preload process exposure')

requireText(app, 'Провери за обновяване', 'manual check UI')
requireText(app, 'Свали обновяването', 'controlled download UI')
requireText(app, "status: 'checking'", 'checking state')
requireText(app, "status: 'current'", 'current state')
requireText(app, "status: 'available'", 'available state')
requireText(app, "status: 'error'", 'error state')
requireText(app, 'compareAppVersions(result.latestVersion, APP_VERSION) > 0', 'version comparison')
forbidText(app, 'useEffect(', 'automatic startup update check')

requireText(update, 'export function compareAppVersions', 'version comparator')
requireText(update, 'window.facadeFlowDesktop ?? null', 'desktop bridge access')
requireText(css, '.empty-home-update', 'update UI styling')

forbidText(pkg.dependencies ? JSON.stringify(pkg.dependencies) : '', 'electron-updater', 'no auto-updater dependency')
forbidText(main, 'autoUpdater', 'no automatic installer execution')

console.log('=== DESKTOP 01C.2 VERIFY PASS ===')
console.log('UPDATE CHECK: MANUAL / USER INITIATED')
console.log('VERSION SOURCE: PUBLIC GITHUB MASTER PACKAGE.JSON')
console.log('UPDATE PAGE: GITHUB RELEASES / HTTPS HOST-LOCKED')
console.log('AUTO DOWNLOAD / AUTO INSTALL: NO')
console.log('NODE INTEGRATION: OFF')
console.log('CONTEXT ISOLATION: ON')
console.log('RENDERER SANDBOX: ON')
console.log(`APP VERSION: ${pkg.version}`)
