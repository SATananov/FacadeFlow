import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { mkdtemp, readFile, access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareWindowsUpdateHandoff } from '../electron/updateHandoff.mjs'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const exists = async (file) => access(file).then(() => true, () => false)
const readJson = async (file) => JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''))
const self = fileURLToPath(import.meta.url)

async function runParent() {
  const handoff = await prepareWindowsUpdateHandoff({
    updatesDir: process.argv[3], request: { mode: 'probe' },
  })
  process.send({ transactionDir: handoff.transactionDir, workerPid: handoff.workerPid, token: handoff.token })
  process.once('message', async (message) => {
    try {
      if (message === 'cancel') await handoff.cancel()
      else if (message === 'exit') await handoff.authorize()
      else throw new Error('Unexpected supervisor instruction')
      // Actual process exit is essential: do not simulate parent death in-process.
      process.exit(0)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })
}

async function runScenario(root, instruction) {
  const parent = fork(self, ['--parent', root], {
    detached: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  })
  let ready = null
  let parentExit = null
  let spawnError = null
  let output = ''
  parent.stdout.on('data', (chunk) => { output += chunk })
  parent.stderr.on('data', (chunk) => { output += chunk })
  parent.once('message', (message) => { ready = message })
  parent.once('error', (error) => { spawnError = error })
  parent.once('exit', (code, signal) => { parentExit = { code, signal } })
  try {
    const deadline = Date.now() + 30000
    while (!ready) {
      if (spawnError) throw spawnError
      assert.equal(parentExit, null, 'Node parent exited before READY: ' + output)
      assert.ok(Date.now() < deadline, 'Parent READY timeout: ' + output)
      await delay(100)
    }
    const postPath = path.join(ready.transactionDir, 'post-parent.json')
    const bootstrap = await readJson(path.join(ready.transactionDir, 'bootstrap-ready.json'))
    const ack = await readJson(path.join(ready.transactionDir, 'bootstrap-ack.json'))
    assert.equal(bootstrap.token, ready.token)
    assert.equal(ack.workerPid, ready.workerPid)
    process.kill(ready.workerPid, 0)
    await delay(400)
    assert.equal(await exists(postPath), false, 'Worker acted before parent exit/authorization')
    parent.send(instruction)
    while (!parentExit) {
      assert.ok(Date.now() < deadline, 'Node parent failed to exit: ' + output)
      await delay(100)
    }
    assert.equal(parentExit.code, 0, output)
    assert.equal(parentExit.signal, null)
    const postDeadline = Date.now() + 10000
    if (instruction === 'exit') {
      while (!(await exists(postPath))) {
        assert.ok(Date.now() < postDeadline, 'Worker did not survive Node parent exit: ' + ready.transactionDir)
        await delay(100)
      }
      const post = await readJson(postPath)
      assert.equal(post.token, ready.token)
      assert.equal(post.parentPid, parent.pid)
      assert.equal(post.workerPid, ready.workerPid)
      assert.equal(post.parentGone, true)
      console.log('PASS: bootstrap -> worker READY -> real Node parent EXIT -> post-parent action')
    } else {
      const logPath = path.join(ready.transactionDir, 'worker.log')
      while (!(await readFile(logPath, 'utf8').catch(() => '')).includes('FAIL Handoff cancelled.')) {
        assert.ok(Date.now() < postDeadline, 'Worker did not acknowledge cancellation: ' + ready.transactionDir)
        await delay(100)
      }
      assert.equal(await exists(postPath), false, 'Cancelled worker performed a post-parent action')
      console.log('PASS: cancellation prevents post-parent action')
    }
    console.log('Evidence: ' + ready.transactionDir)
  } finally {
    if (!parentExit) parent.kill()
  }
}

async function run() {
  if (process.platform !== 'win32') {
    console.log('SKIP: handoff survival requires real Windows process creation; run on Windows before release')
    return
  }
  const root = await mkdtemp(path.join(os.tmpdir(), "facadeflow-handoff-Юникод ' "))
  console.log('Harmless Windows handoff evidence: ' + root)
  await runScenario(root, 'exit')
  await runScenario(root, 'cancel')
  await assert.rejects(prepareWindowsUpdateHandoff({
    updatesDir: root, request: { mode: 'probe' },
    powershellPath: path.join(root, 'missing-powershell.exe'), timeoutMs: 2000,
  }), /failed to start/)
  console.log('PASS: bootstrap spawn failure rejects handoff')
  console.log('WINDOWS HANDOFF SURVIVAL PASS; NO INSTALLER EXECUTED')
}

(process.argv[2] === '--parent' ? runParent() : run()).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
