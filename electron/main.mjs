import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isSmokeTest = process.argv.includes('--smoke-test')
const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html')
const windowIcon = app.isPackaged
  ? path.join(process.resourcesPath, 'FacadeFlow.ico')
  : path.resolve(__dirname, '..', 'build', 'FacadeFlow.ico')

if (isSmokeTest) {
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

app.whenReady().then(() => {
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
