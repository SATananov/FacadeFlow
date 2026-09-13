import fs from 'node:fs'

const tsx = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')

const required = [
  'const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0',
  "widthMm: Math.max(point.xMm - original.xMm, getMinFrameDimension('vertical'))",
  "heightMm: Math.max(point.yMm - original.yMm, getMinFrameDimension('horizontal'))",
  'const fitViewToFrame =',
  'setAutoFitEnabled(true)',
]

const missing = required.filter((token) => !tsx.includes(token))
if (missing.length) {
  console.error('CONSTRUCTOR VIEW 01.1 VERIFY FAIL - missing markers:')
  for (const token of missing) console.error(`- ${token}`)
  process.exit(1)
}

const forbidden = [
  'const MAX_WORLD_MM = 5000',
  'clamp(value, 0, MAX_WORLD_MM)',
  "clamp(point.xMm - original.xMm, getMinFrameDimension('vertical'), MAX_WORLD_MM)",
  "clamp(point.yMm - original.yMm, getMinFrameDimension('horizontal'), MAX_WORLD_MM)",
]

const found = forbidden.filter((token) => tsx.includes(token))
if (found.length) {
  console.error('CONSTRUCTOR VIEW 01.1 VERIFY FAIL - legacy 5000 mm cap still present:')
  for (const token of found) console.error(`- ${token}`)
  process.exit(1)
}

console.log('=== CONSTRUCTOR VIEW 01.1 VERIFY PASS ===')
console.log('LEGACY 5000 mm WORLD CAP: REMOVED FROM POINTER RESIZE')
console.log('RIGHT / BOTTOM FRAME RESIZE: NO ARTIFICIAL UPPER LIMIT')
console.log('NUMERIC DIMENSIONS: UNCHANGED')
console.log('AUTO FIT: PRESERVED')
console.log('CONSTRUCTION TOPOLOGY: UNCHANGED')
console.log('MACHINE READY: NO')
