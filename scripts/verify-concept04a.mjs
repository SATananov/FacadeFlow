import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mustExist = [
  'src/data/profileSystems/types.ts',
  'src/data/profileSystems/prelude60.ts',
  'src/data/profileSystems/prestige70.ts',
  'src/data/profileSystems/catalog.ts',
  'src/data/profileSystems/index.ts',
  'docs/CONCEPT_04A_PROFILE_SYSTEM_CATALOG_FOUNDATION_ACCEPTANCE.md',
]

for (const relative of mustExist) {
  const full = path.join(root, relative)
  if (!fs.existsSync(full)) throw new Error(`Missing Concept 04A file: ${relative}`)
}

const prelude = fs.readFileSync(path.join(root, 'src/data/profileSystems/prelude60.ts'), 'utf8')
const prestige = fs.readFileSync(path.join(root, 'src/data/profileSystems/prestige70.ts'), 'utf8')
const catalog = fs.readFileSync(path.join(root, 'src/data/profileSystems/catalog.ts'), 'utf8')
const types = fs.readFileSync(path.join(root, 'src/data/profileSystems/types.ts'), 'utf8')

const requiredPrelude = ['482.30', '482.20', '482.05', '482.18', '482.25', '482.23', '482.26', '482.27', '482.21', '482.24', '482.11']
const requiredPrestige = ['549.15', '549.20', '549.16', '549.19', '549.05', '549.11', '549.17', '549.04']
const requiredPlus = ['549.01', '549.02', '549.12', '549.03']

for (const code of requiredPrelude) {
  if (!prelude.includes(`'${code}'`)) throw new Error(`PRELUDE profile missing: ${code}`)
}
for (const code of requiredPrestige) {
  if (!prestige.includes(`'${code}'`)) throw new Error(`PRESTIGE profile missing: ${code}`)
}
for (const code of requiredPlus) {
  if (!prestige.includes(`'${code}'`)) throw new Error(`PRESTIGE PLUS profile missing: ${code}`)
}

for (const id of ['kmg-prelude-60', 'kmg-prestige-70', 'kmg-prestige-plus-70']) {
  if (!catalog.includes(id.split('-').slice(1).join('-')) && !prelude.includes(id) && !prestige.includes(id)) {
    throw new Error(`Catalogue system id missing: ${id}`)
  }
}

if (!types.includes('calloutsMm')) throw new Error('Raw catalogue dimension boundary missing')
if (!types.includes('catalog-derived')) throw new Error('Source-status boundary missing')
if (!catalog.includes('getSelectableProfileSystems')) throw new Error('Selectable systems API missing')
if (!catalog.includes('getProfileSystemById')) throw new Error('Profile system lookup API missing')

console.log('CONCEPT 04A VERIFY PASS')
console.log('Systems: PRELUDE 60 | PRESTIGE 70 | PRESTIGE PLUS')
console.log('Boundary: RAW CATALOG CALLOUTS != PRODUCTION SEMANTICS')
console.log('Automatic geometry: NO')
console.log('Machine ready: NO')
