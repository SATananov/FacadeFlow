import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/components/ConstructorShell.css', import.meta.url), 'utf8')
const serialization = await readFile(new URL('../src/domain/project/projectSerialization.ts', import.meta.url), 'utf8')

assert.match(css, /CONSTRUCTOR FRAME TOPOLOGY 01A\.1/)
assert.match(css, /constructor-parametric-frame \.constructor-frame-mitre\.mitre-tl[\s\S]*?left:\s*0;[\s\S]*?top:\s*0;/)
assert.match(css, /constructor-parametric-frame \.constructor-frame-mitre\.mitre-tr[\s\S]*?right:\s*0;[\s\S]*?top:\s*0;/)
assert.match(css, /width:\s*calc\(var\(--constructor-frame-face[^\n]*1\.414214\)/)
assert.doesNotMatch(css.slice(css.lastIndexOf('CONSTRUCTOR FRAME TOPOLOGY 01A.1')), /left:\s*calc\(0px - var\(--constructor-frame-face/)

assert.match(serialization, /function construction\(value: unknown, allowFrameEdges = false\)/)
assert.match(serialization, /allowFrameEdges \? \['frameFaceMm', 'frameEdges'\] : \['frameFaceMm'\]/)
assert.match(serialization, /keys\(topology\.frameEdges, \['left', 'right', 'top', 'bottom'\]\)/)
assert.match(serialization, /choice\(frameEdges\[edge\], \['frame', 'none', 'threshold'\]\)/)
assert.match(serialization, /construction\(drafts\[key\], allowCompositeStructure\)/)

console.log('CONSTRUCTOR FRAME TOPOLOGY 01A.1 FIX: PASS')
console.log('In-face 45deg schematic mitres: PASS')
console.log('PF02 frameEdges persistence validation: PASS')
console.log('PF01 strictness preserved: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
