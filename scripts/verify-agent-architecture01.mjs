import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const rel = (...parts) => path.join(...parts).replaceAll(path.sep, '/')
const requiredFiles = [
  '.ai/README.md',
  '.ai/GLOBAL_RULES.md',
  '.ai/ORCHESTRATOR.md',
  '.ai/skills/geometry.md',
  '.ai/skills/drawing.md',
  '.ai/skills/profile-catalog.md',
  '.ai/skills/ui-ux.md',
  '.ai/skills/verifier.md',
  '.ai/skills/evidence.md',
  '.ai/protocols/task-handoff.md',
  '.ai/protocols/change-control.md',
  '.ai/protocols/human-review.md',
  'docs/AGENT_ARCHITECTURE_01_ACCEPTANCE.md',
  'AGENTS.md',
]
const requiredSkillFiles = [
  '.ai/skills/geometry.md',
  '.ai/skills/drawing.md',
  '.ai/skills/profile-catalog.md',
  '.ai/skills/ui-ux.md',
  '.ai/skills/verifier.md',
  '.ai/skills/evidence.md',
]
const requiredProtocolFiles = [
  '.ai/protocols/task-handoff.md',
  '.ai/protocols/change-control.md',
  '.ai/protocols/human-review.md',
]
const handoffFields = [
  'TASK',
  'ROLE',
  'FILES INSPECTED',
  'FILES CHANGED',
  'FACTS USED',
  'ASSUMPTIONS',
  'UNKNOWN ITEMS',
  'DOMAIN IMPACT',
  'GEOMETRY IMPACT',
  'PERSISTENCE IMPACT',
  'UNDO/REDO IMPACT',
  'RISKS',
  'VERIFIERS REQUIRED',
  'STATUS',
]
const statuses = [
  'INSPECTING',
  'IMPLEMENTING',
  'BLOCKED',
  'READY FOR VERIFICATION',
  'VERIFIED',
  'FAILED',
  'READY FOR HUMAN REVIEW',
]
const mandatoryPhrases = [
  'AUTOMATIC GEOMETRY = NO',
  'RULES VALIDATED = NO',
  'MACHINE READY = NO',
  'UNKNOWN FACTS MUST REMAIN UNKNOWN',
  'Only the Orchestrator may declare',
  'Verifier must not repair',
  'No agent commits or pushes without explicit human instruction',
  'human visual acceptance',
  'geometry/domain changes require Geometry Agent participation',
  'catalogue facts require Profile/Catalog Agent or Evidence Agent review',
  'UNKNOWN',
  'Sequential Role Mode',
]

const errors = []
function read(file) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    errors.push(`Missing required file: ${file}`)
    return ''
  }
  const stat = fs.statSync(full)
  if (!stat.isFile()) errors.push(`Not a file: ${file}`)
  const content = fs.readFileSync(full, 'utf8')
  if (content.length === 0) errors.push(`Empty file: ${file}`)
  if (!content.endsWith('\n')) errors.push(`Missing final newline: ${file}`)
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) errors.push(`Merge marker found: ${file}`)
  content.split(/\n/).forEach((line, index) => {
    if (/[ \t]$/.test(line)) errors.push(`Trailing whitespace: ${file}:${index + 1}`)
  })
  return content
}

const contents = new Map(requiredFiles.map((file) => [file, read(file)]))
const frameworkFiles = fs.readdirSync(path.join(root, '.ai'), { recursive: true })
  .filter((entry) => String(entry).endsWith('.md'))
  .map((entry) => rel('.ai', String(entry)))
  .sort()
for (const file of frameworkFiles) {
  if (!requiredFiles.includes(file)) read(file)
}

const skillFiles = fs.readdirSync(path.join(root, '.ai/skills'))
  .filter((file) => file.endsWith('.md'))
  .map((file) => rel('.ai/skills', file))
  .sort()
if (JSON.stringify(skillFiles) !== JSON.stringify([...requiredSkillFiles].sort())) {
  errors.push(`Skill files mismatch: ${skillFiles.join(', ')}`)
}
const protocolFiles = fs.readdirSync(path.join(root, '.ai/protocols'))
  .filter((file) => file.endsWith('.md'))
  .map((file) => rel('.ai/protocols', file))
  .sort()
if (JSON.stringify(protocolFiles) !== JSON.stringify([...requiredProtocolFiles].sort())) {
  errors.push(`Protocol files mismatch: ${protocolFiles.join(', ')}`)
}

for (const file of [...requiredSkillFiles, ...requiredProtocolFiles]) {
  const inOrchestrator = contents.get('.ai/ORCHESTRATOR.md')?.includes(file)
  const inAcceptance = contents.get('docs/AGENT_ARCHITECTURE_01_ACCEPTANCE.md')?.includes(file)
  if (!inOrchestrator && !inAcceptance) errors.push(`Framework path not referenced: ${file}`)
}

const orchestrator = contents.get('.ai/ORCHESTRATOR.md') ?? ''
for (const match of orchestrator.matchAll(/\.ai\/(?:skills|protocols)\/[A-Za-z0-9_.-]+\.md/g)) {
  const target = match[0]
  if (!fs.existsSync(path.join(root, target))) errors.push(`ORCHESTRATOR references missing file: ${target}`)
}

const taskHandoff = contents.get('.ai/protocols/task-handoff.md') ?? ''
for (const field of handoffFields) {
  if (!new RegExp(`^${field}$`, 'm').test(taskHandoff)) errors.push(`Missing handoff field: ${field}`)
}
for (const status of statuses) {
  if (![...taskHandoff.matchAll(new RegExp(status, 'g'))].length) {
    errors.push(`Missing status in handoff protocol: ${status}`)
  }
}

const allText = [...contents.values()].join('\n')
const allTextLower = allText.toLowerCase()
for (const phrase of mandatoryPhrases) {
  if (!allTextLower.includes(phrase.toLowerCase())) errors.push(`Missing mandatory phrase: ${phrase}`)
}

if (!contents.get('AGENTS.md')?.includes('.ai/ORCHESTRATOR.md')) {
  errors.push('AGENTS.md does not route non-trivial tasks to .ai/ORCHESTRATOR.md')
}
if (!contents.get('AGENTS.md')?.includes('.ai/GLOBAL_RULES.md')) {
  errors.push('AGENTS.md does not require .ai/GLOBAL_RULES.md')
}

const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g
for (const [file, content] of contents) {
  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1]
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('#')) continue
    const clean = target.split('#')[0]
    if (!clean) continue
    const resolved = path.resolve(path.dirname(path.join(root, file)), clean)
    if (!fs.existsSync(resolved)) errors.push(`Malformed relative link in ${file}: ${target}`)
  }
}

console.log(`Checked ${requiredFiles.length} required files.`)
console.log(`Framework files: ${frameworkFiles.join(', ')}`)
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join('\n'))
  process.exit(1)
}
console.log('Agent architecture verifier PASS')
