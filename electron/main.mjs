import { app, BrowserWindow } from 'electron'
import { ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isSmokeTest = process.argv.includes('--smoke-test')
const isUpdateCheckSmoke = process.argv.includes('--update-check-smoke')
const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html')
const updateVersionUrl = 'https://raw.githubusercontent.com/SATananov/FacadeFlow/master/package.json'
const updateReleasesUrl = 'https://github.com/SATananov/FacadeFlow/releases/latest'
const preloadPath = path.resolve(__dirname, 'preload.cjs')
const windowIcon = app.isPackaged
  ? path.join(process.resourcesPath, 'FacadeFlow.ico')
  : path.resolve(__dirname, '..', 'build', 'FacadeFlow.ico')

if (isSmokeTest || isUpdateCheckSmoke) {
  app.disableHardwareAcceleration()
}

let mainWindow = null
let smokeTimer = null

function finishSmoke(code, message) {
  if (!isSmokeTest) return

  if (smokeTimer) {
    clearTimeout(smokeTimer)
    smokeTimer = null
  }

  if (code === 0) {
    console.log(message)
  } else {
    console.error(message)
  }

  setTimeout(() => app.exit(code), 50)
}


function isValidVersion(value) {
  return typeof value === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.trim())
}

async function fetchLatestVersion() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const separator = updateVersionUrl.includes('?') ? '&' : '?'
    const response = await fetch(`${updateVersionUrl}${separator}ts=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    if (!isValidVersion(payload?.version)) {
      throw new Error('Invalid remote version payload')
    }

    return {
      ok: true,
      latestVersion: payload.version.trim(),
      releasesUrl: updateReleasesUrl,
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      message: `Проверката за обновяване не успя (${detail}).`,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function registerUpdateHandlers() {
  ipcMain.handle('facadeflow:check-for-updates', async () => fetchLatestVersion())

  ipcMain.handle('facadeflow:open-update-page', async () => {
    const url = new URL(updateReleasesUrl)
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith('/SATananov/FacadeFlow/releases')) {
      return { ok: false, message: 'Невалиден адрес за обновяване.' }
    }

    await shell.openExternal(url.toString())
    return { ok: true }
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1180,
    minHeight: 720,
    title: 'FacadeFlow',
    icon: windowIcon,
    backgroundColor: '#f4f7fb',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
    },
  })

  mainWindow.setMenuBarVisibility(false)
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.once('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame === false) return
    finishSmoke(
      1,
      `FACADEFLOW DESKTOP 01A SMOKE FAIL: ${errorCode} ${errorDescription} ${validatedURL}`,
    )
  })

  mainWindow.webContents.once('did-finish-load', async () => {
    if (!isSmokeTest) return

    try {
      const assetState = await mainWindow.webContents.executeJavaScript(`(() => {
        const logos = [...document.images].filter((image) =>
          image.getAttribute('src')?.includes('branding/nadezhda-header.png')
        )
        return {
          count: logos.length,
          broken: logos.filter((image) => !image.complete || image.naturalWidth === 0).length,
        }
      })()`)

      if (assetState.count < 1) {
        finishSmoke(1, 'FACADEFLOW DESKTOP 01A SMOKE FAIL: branding logo not rendered')
        return
      }

      if (assetState.broken > 0) {
        finishSmoke(
          1,
          `FACADEFLOW DESKTOP 01A SMOKE FAIL: ${assetState.broken}/${assetState.count} branding logos failed to load`,
        )
        return
      }

      finishSmoke(
        0,
        `FACADEFLOW DESKTOP 01A SMOKE PASS - BRANDING ASSETS ${assetState.count}/${assetState.count}`,
      )
    } catch (error) {
      finishSmoke(1, `FACADEFLOW DESKTOP 01A SMOKE FAIL: asset inspection error ${error}`)
    }
  })

  if (!isSmokeTest) {
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isSmokeTest) {
    smokeTimer = setTimeout(() => {
      finishSmoke(1, 'FACADEFLOW DESKTOP 01A SMOKE FAIL: renderer load timeout')
    }, 15000)
  }

  void mainWindow.loadFile(distIndex)
}

app.whenReady().then(async () => {
  registerUpdateHandlers()

  if (isUpdateCheckSmoke) {
    const result = await fetchLatestVersion()
    if (result.ok) {
      console.log(`FACADEFLOW DESKTOP 01C.2 UPDATE CHECK SMOKE PASS - LATEST ${result.latestVersion}`)
      app.exit(0)
    } else {
      console.error(`FACADEFLOW DESKTOP 01C.2 UPDATE CHECK SMOKE FAIL - ${result.message}`)
      app.exit(1)
    }
    return
  }

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
