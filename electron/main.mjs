import { app, BrowserWindow } from 'electron'
import { ipcMain, shell } from 'electron'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isSmokeTest = process.argv.includes('--smoke-test')
const isUpdateCheckSmoke = process.argv.includes('--update-check-smoke')
const isUpdateDownloadSmoke = process.argv.includes('--update-download-smoke')
const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html')
const updateVersionUrl = 'https://raw.githubusercontent.com/SATananov/FacadeFlow/master/package.json'
const updateReleasesUrl = 'https://github.com/SATananov/FacadeFlow/releases/latest'
const updateReleaseApiBase = 'https://api.github.com/repos/SATananov/FacadeFlow/releases/tags/'
const updateAssetPrefix = 'FacadeFlow-Update-'
const preloadPath = path.resolve(__dirname, 'preload.cjs')
const windowIcon = app.isPackaged
  ? path.join(process.resourcesPath, 'FacadeFlow.ico')
  : path.resolve(__dirname, '..', 'build', 'FacadeFlow.ico')

if (isSmokeTest || isUpdateCheckSmoke || isUpdateDownloadSmoke) {
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


function updateAssetName(version) {
  return `${updateAssetPrefix}${version}.exe`
}

function updateDownloadPath(version) {
  return path.join(app.getPath('userData'), 'updates', updateAssetName(version))
}

function isTrustedGithubReleaseAsset(urlString, version) {
  try {
    const url = new URL(urlString)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      url.pathname === `/SATananov/FacadeFlow/releases/download/v${version}/${updateAssetName(version)}`
    )
  } catch {
    return false
  }
}

async function downloadUrlToFile(url, destination, headers = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    if (!response.body) {
      throw new Error('Empty download body')
    }

    await mkdir(path.dirname(destination), { recursive: true })
    await rm(destination, { force: true })
    await pipeline(Readable.fromWeb(response.body), createWriteStream(destination))
    return await stat(destination)
  } finally {
    clearTimeout(timeout)
  }
}

async function resolveUpdateReleaseAsset(version) {
  if (!isValidVersion(version)) {
    throw new Error('Invalid update version')
  }

  const response = await fetch(`${updateReleaseApiBase}v${version}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'FacadeFlow-Desktop-Updater',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub release HTTP ${response.status}`)
  }

  const release = await response.json()
  const expectedName = updateAssetName(version)
  const asset = Array.isArray(release?.assets)
    ? release.assets.find((candidate) => candidate?.name === expectedName)
    : null

  if (!asset?.browser_download_url || !isTrustedGithubReleaseAsset(asset.browser_download_url, version)) {
    throw new Error(`Update asset ${expectedName} is not published`)
  }

  return asset.browser_download_url
}

async function downloadUpdate(version) {
  try {
    if (!isValidVersion(version)) {
      throw new Error('Invalid update version')
    }

    const url = await resolveUpdateReleaseAsset(version)
    const finalPath = updateDownloadPath(version)
    const partialPath = `${finalPath}.part`
    await rm(partialPath, { force: true })

    try {
      const result = await downloadUrlToFile(url, partialPath, {
        Accept: 'application/octet-stream',
        'User-Agent': 'FacadeFlow-Desktop-Updater',
      })
      if (result.size <= 0) {
        throw new Error('Downloaded update is empty')
      }
      await rm(finalPath, { force: true })
      await rename(partialPath, finalPath)
      return {
        ok: true,
        version,
        filePath: finalPath,
        bytes: result.size,
      }
    } catch (error) {
      await rm(partialPath, { force: true })
      throw error
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      message: `Свалянето на обновяването не успя (${detail}).`,
    }
  }
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

  ipcMain.handle('facadeflow:download-update', async (_event, version) => downloadUpdate(version))

  ipcMain.handle('facadeflow:show-downloaded-update', async (_event, version) => {
    if (!isValidVersion(version)) {
      return { ok: false, message: 'Невалидна версия за обновяване.' }
    }

    const filePath = updateDownloadPath(version)
    try {
      await stat(filePath)
      shell.showItemInFolder(filePath)
      return { ok: true }
    } catch {
      return { ok: false, message: 'Сваленият update файл не е намерен.' }
    }
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

  if (isUpdateDownloadSmoke) {
    const smokePath = path.join(app.getPath('temp'), `facadeflow-update-download-smoke-${process.pid}.json`)
    try {
      await downloadUrlToFile(`${updateVersionUrl}?download-smoke=${Date.now()}`, smokePath, {
        Accept: 'application/json',
        'User-Agent': 'FacadeFlow-Desktop-Updater',
      })
      const payload = JSON.parse(await readFile(smokePath, 'utf8'))
      if (!isValidVersion(payload?.version)) {
        throw new Error('Downloaded smoke payload has invalid version')
      }
      console.log(`FACADEFLOW DESKTOP 01C.3A DOWNLOAD ENGINE SMOKE PASS - REMOTE ${payload.version}`)
      app.exit(0)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error(`FACADEFLOW DESKTOP 01C.3A DOWNLOAD ENGINE SMOKE FAIL - ${detail}`)
      app.exit(1)
    } finally {
      await rm(smokePath, { force: true })
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
