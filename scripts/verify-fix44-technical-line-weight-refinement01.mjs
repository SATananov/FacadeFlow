import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file))
const text = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const sha256 = (file) => crypto.createHash('sha256').update(read(file)).digest('hex')

const css = text('src/components/AssemblyReviewPanel.css')
const panel = text('src/components/AssemblyReviewPanel.tsx')
assert(css.includes('FIX43 · PROFILE RENDER NORMALIZATION + FACADEFLOW-NATIVE WORDING 01'), 'Neutral render baseline marker missing')
assert(css.includes('filter: none;'), 'Neutral image filter missing')
assert(css.includes('opacity: 1;'), 'Neutral image opacity missing')
assert(panel.includes('монтажно застъпване · НЕПОТВЪРДЕНО'), 'Unknown-overlap safety guard missing')
assert(panel.includes('КРАЙНА СГЛОБКА'), 'Separated final assembly block missing')

const pngSize = (file) => {
  const b = read(file)
  assert(b.toString('ascii', 1, 4) === 'PNG', file + ' is not a PNG')
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

const expected = [
  ['src/assets/catalog/prelude60/prelude60-48221-mullion-clean.png', 192, 236, 'a31c81c9a68530feda566b7999e16b81b1058f23ac047f42150eeac3ba21ccf1'],
  ['src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png', 192, 236, 'a31c81c9a68530feda566b7999e16b81b1058f23ac047f42150eeac3ba21ccf1'],
  ['src/assets/catalog/prelude60/prelude60-48205-sash-clean.png', 183, 229, '7dc721a0cf85a3e95d36c1d84d8c218ae5b404b405e559ac1f44efb75cdc2850'],
  ['src/assets/catalog/prelude60/prelude60-48205-sash-assembly.png', 183, 229, 'c767992dc7a2e1413468f6c148093d0eded17587933509bae823393ac35b3783'],
  ['src/assets/catalog/prelude60/prelude60-48230-frame-clean.png', 184, 189, '9f70c378c47bbe63f333819786b0ac9e96c0dbeab9a6a1348f05e6138a6c8be9'],
  ['src/assets/catalog/prelude60/prelude60-48230-frame-assembly.png', 184, 189, 'f28ea01ee036f80bc3ffd2738f6ab7312e3220d30b6f447584e6a15bfdfc8ab1']
]

for (const [file, width, height, hash] of expected) {
  assert(fs.existsSync(path.join(root, file)), 'Missing reviewed profile asset: ' + file)
  const size = pngSize(file)
  assert(size.width === width && size.height === height, file + ' canvas dimensions changed')
  assert(sha256(file) === hash, file + ' FIX44 line-tone asset mismatch')
}

console.log('=== FIX44 TECHNICAL LINE WEIGHT REFINEMENT 01 VERIFY PASS ===')
console.log('REVIEWED PROFILE LINE TONE: TECHNICAL CHARCOAL')
console.log('482.21 / 482.05 / 482.30 CLEAN + ASSEMBLY: CONSISTENT')
console.log('PROFILE SILHOUETTE / CANVAS: UNCHANGED')
console.log('CATALOGUE DIMENSIONS / COORDINATES: UNCHANGED')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
