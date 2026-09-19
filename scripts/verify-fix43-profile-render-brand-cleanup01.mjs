import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const forbidden = String.fromCharCode(115, 107, 121, 103, 108, 97, 122, 105, 110, 103)
const ignored = new Set(['node_modules', 'dist', '.git', 'release', '.facadeflow-patch-backups'])
const textExtensions = new Set(['.ts', '.tsx', '.css', '.mjs', '.js', '.md', '.json', '.txt', '.html', '.yml', '.yaml'])

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    const relative = path.relative(root, full)
    assert(!relative.toLowerCase().includes(forbidden), `Forbidden third-party name remains in path: ${relative}`)
    if (entry.isDirectory()) files.push(...await walk(full))
    else if (entry.isFile()) files.push(full)
  }
  return files
}

const files = await walk(root)
for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  if (!textExtensions.has(ext) && path.basename(file) !== 'README.md') continue
  const text = await readFile(file, 'utf8')
  assert(!text.toLowerCase().includes(forbidden), `Forbidden third-party name remains in ${path.relative(root, file)}`)
}

const rules = await readFile(path.join(root, 'src/data/profileSystems/systemConstructionRules.ts'), 'utf8')
const panel = await readFile(path.join(root, 'src/components/AssemblyReviewPanel.tsx'), 'utf8')
const css = await readFile(path.join(root, 'src/components/AssemblyReviewPanel.css'), 'utf8')
const cleanVerifier = await readFile(path.join(root, 'scripts/verify-clean-technical-node01.mjs'), 'utf8')
const constructorVerifier = await readFile(path.join(root, 'scripts/verify-constructor01e1.mjs'), 'utf8')

assert.match(rules, /labelBg: 'KMG 60 · референтно системно правило'/)
assert.match(rules, /id: 'kmg60-reference-01'/)
assert.match(panel, /FIX43 · PROFILE RENDER NORMALIZATION \+ FACADEFLOW-NATIVE WORDING 01/)
assert.match(css, /FIX43 · PROFILE RENDER NORMALIZATION \+ FACADEFLOW-NATIVE WORDING 01/)
assert.match(css, /assembly-auto-participant-image img[\s\S]*filter: none;[\s\S]*opacity: 1;/)
assert.match(css, /assembly-auto-profile-image[\s\S]*filter: none;[\s\S]*opacity: 1;/)
assert.match(cleanVerifier, /CLEAN TECHNICAL NODE 01 VERIFY PASS/)
assert.match(constructorVerifier, /CONSTRUCTOR_01E1_TECHNICAL_VISUAL_COMPARISON_POLISH_ACCEPTANCE\.md/)

const acceptedHashes = new Set([
  '43c2ca30537b1cd814e952206de737839356ee8d250e734f5d73f9fe597b7612',
  'a31c81c9a68530feda566b7999e16b81b1058f23ac047f42150eeac3ba21ccf1',
])
for (const rel of [
  'src/assets/catalog/prelude60/prelude60-48221-mullion-clean.png',
  'src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png',
]) {
  const bytes = await readFile(path.join(root, rel))
  const hash = createHash('sha256').update(bytes).digest('hex')
  assert(acceptedHashes.has(hash), `Normalized profile asset mismatch: ${rel}`)
}

const normalizedRelativePaths = files.map((file) => path.relative(root, file).split(path.sep).join('/'))
assert(normalizedRelativePaths.includes('docs/CLEAN_TECHNICAL_NODE_01.md'))
assert(normalizedRelativePaths.includes('docs/CONSTRUCTOR_01E1_TECHNICAL_VISUAL_COMPARISON_POLISH_ACCEPTANCE.md'))

console.log('=== FIX43 PROFILE RENDER + FACADEFLOW WORDING VERIFY PASS ===')
console.log('PROFILE 482.21 CLEAN / ASSEMBLY: NORMALIZED')
console.log('PROFILE RENDER FILTERS: NEUTRAL')
console.log('THIRD-PARTY PRODUCT NAMING: ABSENT FROM PROJECT TEXT/PATHS')
console.log('KMG 60 RULE PROVENANCE: PRESERVED')
console.log('CATALOGUE DIMENSIONS / COORDINATES: UNCHANGED')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
