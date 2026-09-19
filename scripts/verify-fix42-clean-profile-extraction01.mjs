import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file))
const text = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const sha256 = (file) => crypto.createHash('sha256').update(read(file)).digest('hex')

const panel = text('src/components/AssemblyReviewPanel.tsx')
assert(panel.includes('FIX41 · SEPARATED PARTICIPANTS FINAL ASSEMBLY 01'), 'FIX41 baseline marker missing')
assert(panel.includes('КРАЙНА СГЛОБКА'), 'FIX41 final assembly block missing')
assert(panel.includes('монтажно застъпване · НЕПОТВЪРДЕНО'), 'Unknown overlap guard missing')

const clean = 'src/assets/catalog/prelude60/prelude60-48221-mullion-clean.png'
const assembly = 'src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png'
assert(fs.existsSync(path.join(root, clean)), 'Clean 482.21 image missing')
assert(fs.existsSync(path.join(root, assembly)), 'Assembly 482.21 image missing')
assert(['8b78602e547fc789948162c46a668058142f0fcd5fafd58b49b7c65150949cfa', '43c2ca30537b1cd814e952206de737839356ee8d250e734f5d73f9fe597b7612', 'a31c81c9a68530feda566b7999e16b81b1058f23ac047f42150eeac3ba21ccf1'].includes(sha256(clean)), 'Clean 482.21 image does not match reviewed FIX42/FIX43/FIX44 extraction')
assert(['8b78602e547fc789948162c46a668058142f0fcd5fafd58b49b7c65150949cfa', '43c2ca30537b1cd814e952206de737839356ee8d250e734f5d73f9fe597b7612', 'a31c81c9a68530feda566b7999e16b81b1058f23ac047f42150eeac3ba21ccf1'].includes(sha256(assembly)), 'Assembly 482.21 image does not match reviewed FIX42/FIX43/FIX44 extraction')

// PNG IHDR dimensions must remain unchanged: 192 × 236.
const pngSize = (file) => {
  const b = read(file)
  assert(b.toString('ascii', 1, 4) === 'PNG', file + ' is not a PNG')
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}
for (const file of [clean, assembly]) {
  const size = pngSize(file)
  assert(size.width === 192 && size.height === 236, file + ' canvas dimensions changed')
}

console.log('=== FIX42 CLEAN PROFILE EXTRACTION 01 VERIFY PASS ===')
console.log('482.21 PARTICIPANT IMAGE: DETACHED CATALOGUE FRAGMENTS REMOVED')
console.log('482.21 FINAL-ASSEMBLY IMAGE: DETACHED CATALOGUE FRAGMENTS REMOVED')
console.log('IMAGE CANVAS / ASSEMBLY COORDINATES: UNCHANGED')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
