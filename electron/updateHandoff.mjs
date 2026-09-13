import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, copyFile, rename } from 'node:fs/promises'

const sourceDir = path.dirname(fileURLToPath(import.meta.url))
export function windowsPowerShellPath() {
  const windowsRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows'
  return path.join(windowsRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
}
const quotePS = (value) => "'" + value.replaceAll("'", "''") + "'"
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Exported for the harmless Windows survival verifier; no Electron/UI dependency.
export async function prepareWindowsUpdateHandoff({
  updatesDir, request, timeoutMs = 20000, powershellPath = windowsPowerShellPath(),
}) {
  if (process.platform !== 'win32') throw new Error('Windows handoff requires Windows')
  const token = randomUUID()
  const transactionDir = path.join(updatesDir, 'handoff-' + token)
  await mkdir(transactionDir, { recursive: true })
  // Copy out of app.asar: the updater must not depend on files replaced by NSIS.
  const bootstrapPath = path.join(transactionDir, 'bootstrap.ps1')
  const workerPath = path.join(transactionDir, 'worker.ps1')
  await copyFile(path.join(sourceDir, 'update-bootstrap.ps1'), bootstrapPath)
  await copyFile(path.join(sourceDir, 'update-worker.ps1'), workerPath)
  const requestPath = path.join(transactionDir, 'request.json')
  await writeFile(requestPath, JSON.stringify({ ...request, parentPid: process.pid, token }), 'utf8')
  const command = '& ' + quotePS(bootstrapPath) + ' -RequestPath ' + quotePS(requestPath)
    + ' -PowerShellPath ' + quotePS(powershellPath)
  let spawnFailure = null
  let bootstrapExit = null
  let stderr = ''
  const child = spawn(powershellPath, [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64'),
  ], { detached: false, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true })
  child.stderr?.on('data', (chunk) => { stderr = (stderr + chunk).slice(-4096) })
  child.once('error', (error) => { spawnFailure = error })
  child.once('exit', (code, signal) => { bootstrapExit = { code, signal } })
  const cancel = async () => {
    await writeFile(path.join(transactionDir, 'cancel.flag'), token, 'utf8')
  }
  try {
    const deadline = Date.now() + timeoutMs
    while (!bootstrapExit) {
      if (spawnFailure) throw new Error('Update bootstrap failed to start: ' + spawnFailure.message)
      if (Date.now() >= deadline) throw new Error('Update bootstrap did not acknowledge startup in time')
      await delay(100)
    }
    if (bootstrapExit.code !== 0) {
      throw new Error('Update bootstrap exited before readiness: ' + JSON.stringify(bootstrapExit) + ' ' + stderr)
    }
    const ready = JSON.parse((await readFile(path.join(transactionDir, 'worker-ready.json'), 'utf8')).replace(/^\uFEFF/, ''))
    const ack = JSON.parse((await readFile(path.join(transactionDir, 'bootstrap-ack.json'), 'utf8')).replace(/^\uFEFF/, ''))
    if (ready.token !== token || ack.token !== token || ready.parentPid !== process.pid
      || ack.workerPid !== ready.workerPid || !Number.isInteger(ready.workerPid) || ready.workerPid <= 0
      || ready.workerPid === process.pid || ready.workerPid === child.pid
      || ready.sessionId !== ack.sessionId) {
      throw new Error('Update worker readiness identity mismatch')
    }
    process.kill(ready.workerPid, 0) // Worker must still exist after bootstrap has exited.
    return {
      transactionDir, workerPid: ready.workerPid, token, cancel,
      async authorize() {
        process.kill(ready.workerPid, 0)
        const authorizePath = path.join(transactionDir, 'authorize.flag')
        const authorizeTemp = authorizePath + '.tmp'
        const authorizedPath = path.join(transactionDir, 'worker-authorized.json')
        await writeFile(authorizeTemp, token, 'utf8')
        await rename(authorizeTemp, authorizePath)
        const deadline = Date.now() + 5000
        while (true) {
          process.kill(ready.workerPid, 0)
          try {
            const authorized = JSON.parse((await readFile(authorizedPath, 'utf8')).replace(/^\uFEFF/, ''))
            if (authorized.token !== token || authorized.workerPid !== ready.workerPid
              || authorized.parentPid !== process.pid) {
              throw new Error('Update worker authorization acknowledgement identity mismatch')
            }
            break
          } catch (error) {
            if (error instanceof SyntaxError || error?.code === 'ENOENT') {
              if (Date.now() >= deadline) throw new Error('Update worker did not acknowledge authorization in time')
              await delay(100)
              continue
            }
            throw error
          }
        }
      },
    }
  } catch (error) {
    await cancel().catch(() => {})
    if (!bootstrapExit) child.kill()
    throw error
  }
}
