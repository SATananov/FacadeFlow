import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const errors = []
const read = (relativePath) => {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    errors.push(`Missing required file: ${relativePath}`)
    return ''
  }
  const content = fs.readFileSync(fullPath, 'utf8')
  if (!content.trim()) errors.push(`Empty required file: ${relativePath}`)
  if (!content.endsWith('\n')) errors.push(`Missing final newline: ${relativePath}`)
  content.split(/\r?\n/).forEach((line, index) => {
    if (/[\t ]$/.test(line)) errors.push(`Trailing whitespace: ${relativePath}:${index + 1}`)
  })
  return content
}

const required = [
  '.ai/skills/technical-drawing/SKILL.md',
  '.ai/skills/technical-drawing/WINDOW_RULES.md',
  '.ai/skills/technical-drawing/DOOR_RULES.md',
  '.ai/skills/technical-drawing/COMBINED_DOOR_WINDOW_RULES.md',
  '.ai/skills/technical-drawing/OPENING_SYMBOL_RULES.md',
  '.ai/skills/technical-drawing/DIMENSION_RULES.md',
  '.ai/skills/technical-drawing/REFERENCE_EVIDENCE_RULES.md',
  '.ai/agents/TECHNICAL_DRAWING_SPECIALIST.md',
  'docs/technical-drawing-reference/README.md',
  'docs/technical-drawing-reference/REFERENCE_ENTRY_TEMPLATE.md',
  'docs/technical-drawing-reference/windows/README.md',
  'docs/technical-drawing-reference/doors/README.md',
  'docs/technical-drawing-reference/combined/README.md',
  'docs/technical-drawing-reference/opening-symbols/README.md',
  'docs/technical-drawing-reference/dimensions/README.md',
  'docs/technical-drawing-reference/sliding/README.md',
  '.ai/ORCHESTRATOR.md',
]
const contents = new Map(required.map((file) => [file, read(file)]))
const combined = [...contents.values()].join('\n').toLowerCase()
const requiredPhrases = [
  'approved visual reference',
  'approved semantic reference',
  'catalogue verified',
  'example only',
  'unknown',
  'window_region',
  'door_region',
  'fixed',
  'operable',
  'zero_divider',
  'no physical width',
  'exterior void',
  'do not infer handing',
  'automatic geometry = no',
  'rules validated = no',
  'machine ready = no',
  'unknown facts must remain unknown',
  'technical drawing specialist',
  'does not replace the single primary implementation owner',
]
for (const phrase of requiredPhrases) {
  if (!combined.includes(phrase)) errors.push(`Missing knowledge safety/convention: ${phrase}`)
}

const specialist = contents.get('.ai/agents/TECHNICAL_DRAWING_SPECIALIST.md') ?? ''
for (const section of [
  'DRAWING TYPE', 'FUNCTIONAL REGIONS', 'FRAME / OUTLINE', 'FIELD STRUCTURE',
  'OPENING SYMBOLS', 'DIMENSION LAYOUT', 'ZERO_DIVIDER', 'EXTERIOR VOID',
  'VISUAL CLUTTER', 'SEMANTIC ISSUES', 'UNVERIFIED FACTS', 'RECOMMENDED CHANGES',
  'DRAWING REVIEW PASS', 'DRAWING REVIEW NEEDS CHANGES', 'BLOCKED — FACTS REQUIRED',
]) {
  if (!specialist.includes(section)) errors.push(`Specialist output missing: ${section}`)
}

const referenceFiles = required.filter((file) => file.includes('docs/technical-drawing-reference/'))
for (const file of referenceFiles) {
  const content = contents.get(file) ?? ''
  if (file.endsWith('.md') && !content.trim()) errors.push(`Reference index/template is empty: ${file}`)
}

const orchestrator = contents.get('.ai/ORCHESTRATOR.md') ?? ''
if (!orchestrator.includes('.ai/skills/technical-drawing/SKILL.md') ||
    !orchestrator.includes('.ai/agents/TECHNICAL_DRAWING_SPECIALIST.md')) {
  errors.push('Orchestrator does not route applicable drawing tasks through the skill and specialist')
}

console.log(`Checked ${required.length} knowledge architecture files.`)
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join('\n'))
  process.exit(1)
}
console.log('Technical drawing knowledge verifier PASS')
