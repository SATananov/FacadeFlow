import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const shell = read('src/components/ConstructorShell.tsx')
const css = read('src/components/ConstructorShell.css')
const coordinates = read('src/components/constructorCoordinates.ts')
const model = read('src/domain/project/projectModel.ts')
const serialization = read('src/domain/project/projectSerialization.ts')

assert.match(shell, /useState<DoorViewOrientation>\(null\)/, 'orientation must start semantically unset')
assert.match(shell, /setDoorViewOrientation\(null\)[\s\S]*?\[activeModuleId, moduleSummary\.productType\]/, 'view state must reset on module/type changes')
assert.match(shell, /moduleSummary\.productType === 'door'[\s\S]{0,500}Гледка:/, 'orientation control must be door-only')
assert.match(shell, /Отвън/)
assert.match(shell, /Отвътре/)
assert.match(shell, /aria-pressed=\{doorViewOrientation === 'outside'\}/)
assert.match(shell, /aria-pressed=\{doorViewOrientation === 'inside'\}/)
assert.match(shell, /const doorViewClass = moduleSummary\.productType === 'door' && doorViewOrientation[\s\S]*?is-door-view-\$\{doorViewOrientation\}/)
assert.match(shell, /doorViewClass,/)

assert.match(shell, /constructor-drawing-layer\$\{insideDoorView \? ' is-view-inside' : ''\}/)
assert.match(css, /\.constructor-drawing-layer\.is-view-inside\s*\{\s*transform:\s*scaleX\(-1\)/)
const baseDrawingLayer = css.match(/\.constructor-drawing-layer\s*\{[^}]+\}/)?.[0] ?? ''
assert.doesNotMatch(baseDrawingLayer, /\btransform\s*:/, 'Outside and unset views must have no mirroring transform')
assert.doesNotMatch(css, /\.constructor-parametric-frame\s*\{[^}]*scaleX\(-1\)/s, 'do not mirror the complete frame wrapper')
assert.match(css, /constructor-field-number-badge[\s\S]{0,120}scaleX\(-1\)/)
assert.match(css, /constructor-field-dimension-label[\s\S]{0,180}scaleX\(-1\)/)
assert.match(shell, /displayedFrame\.widthMm - bay\.startMm - bay\.widthMm/)
const drawingLayerClose = shell.indexOf('\n                </div>\n\n                {frame && dragState?.kind !== \'create\'', shell.indexOf('constructor-drawing-layer'))
const externalWidthDimension = shell.indexOf('constructor-frame-dimension constructor-frame-dimension-width', drawingLayerClose)
assert.ok(drawingLayerClose >= 0 && externalWidthDimension > drawingLayerClose, 'overall dimensions must remain outside the mirrored drawing layer')
assert.match(shell, /Math\.round\(displayedFrame\.widthMm\)/, 'overall width value remains canonical')
assert.match(shell, /Math\.round\(displayedFrame\.heightMm\)/, 'overall height value remains canonical')

const insideFrameLayer = css.match(/\.constructor-drawing-layer\.is-view-inside \.constructor-frame-visual\s*\{[^}]+\}/)?.[0] ?? ''
assert.match(insideFrameLayer, /z-index:\s*auto/, 'Inside view must let only the frame-member children rise above the leaf')
assert.match(css, /\.constructor-drawing-layer\.is-view-inside \.constructor-frame-edge-face,[\s\S]*?\.constructor-frame-mitre\s*\{\s*z-index:\s*11;/, 'Inside frame members must layer above the door leaf')
assert.match(css, /\.constructor-frame-visual\s*\{\s*z-index:\s*8;/, 'Outside view keeps the canonical frame layer')
assert.match(css, /\.constructor-field-surface\.is-door-leaf\s*\{\s*z-index:\s*9;/, 'door leaf layer remains below the Inside frame')
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf\s*\{\s*z-index:\s*10;/, 'sash priority overlay remains below the Inside frame')
assert.match(shell, /<div className="constructor-frame-visual"[\s\S]*?<\/div>\s*\{frameEdges\?\.bottom === 'threshold'[\s\S]*?constructor-frame-threshold-placeholder/, 'threshold presentation remains a separate sibling drawing layer')
assert.match(css, /\.constructor-frame-threshold-placeholder\s*\{\s*position:\s*absolute;\s*z-index:\s*3;/, 'threshold keeps its existing level below the leaf in both views')
assert.match(css, /\.is-door-view-outside \.constructor-field-surface\.is-door-leaf \.constructor-sash-profile-visual,[\s\S]*?inset:\s*-10px -10px var\(--door-leaf-bottom-space\);/, 'Outside leaf covers about half the visible frame face in screen pixels')
assert.match(css, /\.constructor-field-surface\.is-door-leaf\.is-door-view-inside \.constructor-sash-profile-visual\s*\{\s*inset:\s*0 0 var\(--door-leaf-bottom-space\);/, 'Inside leaf remains inset within the full frame face')
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf\.is-door-view-outside::before\s*\{\s*inset:\s*-10px -10px var\(--door-leaf-bottom-space\);/, 'Outside sash-priority visual follows the same pixel inset')
assert.match(css, /\.constructor-operable-sash-priority\.is-door-leaf\.is-door-view-inside::before\s*\{\s*inset:\s*0 0 var\(--door-leaf-bottom-space\);/, 'Inside sash-priority visual follows the inset leaf')
assert.match(css, /\.constructor-field-surface\.is-door-leaf\.is-door-view-outside\.door-leaf-bottom-threshold,[\s\S]*?--door-leaf-bottom-space:\s*7px;/, 'Outside threshold leaf approaches the threshold')
assert.match(css, /\.constructor-field-surface\.is-door-leaf\.is-door-view-inside\.door-leaf-bottom-threshold,[\s\S]*?--door-leaf-bottom-space:\s*10px;/, 'Inside threshold leaf approaches the lower frame zone')
assert.match(css, /\.is-door-view-outside \.constructor-frame-threshold-placeholder\s*\{[^}]*z-index:\s*11;/, 'Outside threshold paints in front of the leaf')
assert.match(css, /\.is-door-view-inside \.constructor-frame-threshold-placeholder\s*\{\s*z-index:\s*3;/, 'Inside threshold remains behind the leaf')
const outsideThreshold = css.match(/\.is-door-view-outside \.constructor-frame-threshold-placeholder\s*\{[^}]+\}/)?.[0] ?? ''
assert.match(outsideThreshold, /left:\s*var\(--constructor-frame-face,\s*18px\)/, 'Outside threshold starts at the inner left frame line')
assert.match(outsideThreshold, /right:\s*var\(--constructor-frame-face,\s*18px\)/, 'Outside threshold ends at the inner right frame line')
assert.match(css, /\.is-door-sketch \.constructor-frame-threshold-placeholder\s*\{[^}]*height:\s*22px/s, 'threshold height remains at its existing screen-space value')
const insideThreshold = css.match(/\.is-door-view-inside \.constructor-frame-threshold-placeholder\s*\{[^}]+\}/)?.[0] ?? ''
assert.doesNotMatch(insideThreshold, /\b(?:left|right|width|height)\s*:/, 'Inside threshold dimensions remain governed by the existing shared styling')
const doorOpeningViewport = css.match(/\.constructor-field-surface\.is-door-leaf \.constructor-operable-visual\s*\{[^}]+\}/)?.[0] ?? ''
assert.match(doorOpeningViewport, /left:\s*14px;[\s\S]*right:\s*14px;[\s\S]*width:\s*calc\(100% - 28px\)/, 'door opening symbol viewport aligns to the 14px inner leaf contour')
assert.match(css, /\.constructor-field-surface\.is-door-leaf \.sash-profile-inner\s*\{\s*inset:\s*14px;/, 'door leaf inner contour remains the opening-symbol visual anchor')
const doorViewPolish = css.slice(css.indexOf('/* DOOR VIEW MINI POLISH 01:'))
assert.match(shell, /<i className="sash-profile-mitre mitre-tl" \/>[\s\S]*?<i className="sash-profile-mitre mitre-tr" \/>[\s\S]*?<i className="sash-profile-mitre mitre-bl" \/>[\s\S]*?<i className="sash-profile-mitre mitre-br" \/>/, 'operable sash renders four schematic corner joints in both views')
assert.match(doorViewPolish, /\.constructor-field-surface\.is-door-leaf \.constructor-sash-profile-visual \.sash-profile-mitre\s*\{[^}]*height:\s*1\.25px;[^}]*background:\s*rgba\(55, 70, 75, \.92\)/, 'door corner joints use thin, frame-matching visual strokes')
assert.match(doorViewPolish, /\.constructor-field-surface\.is-door-leaf\.is-door-view-outside \.constructor-operable-visual\s*\{[^}]*left:\s*4px;[^}]*right:\s*4px;[^}]*width:\s*calc\(100% - 8px\)/, 'Outside triangle apex viewport meets the inner sash contour after its 10px outer extension')
assert.match(doorViewPolish, /\.constructor-field-surface\.is-door-leaf\.is-door-view-outside\.door-leaf-bottom-frame,[\s\S]*?--door-leaf-bottom-space:\s*-10px;/, 'Outside full-frame leaf has the same schematic overlap at all four sides')
assert.match(css, /\.is-door-view-outside \.constructor-frame-threshold-placeholder\s*\{[^}]*left:\s*var\(--constructor-frame-face,\s*18px\);[^}]*right:\s*var\(--constructor-frame-face,\s*18px\);[^}]*z-index:\s*11;/, 'Outside threshold remains inside the frame faces and foregrounded')
assert.match(shell, /x1="0" y1="0" x2="100" y2="50"[\s\S]*?x1="0" y1="100" x2="100" y2="50"/)
assert.match(shell, /x1="100" y1="0" x2="0" y2="50"[\s\S]*?x1="100" y1="100" x2="0" y2="50"/)
assert.match(shell, /<circle cx="100" cy="50" r="2\.2"\s*\/>\s*<line x1="100" y1="50" x2="92" y2="50"\s*\/>/, 'left-hand handle cue begins at its opening-symbol apex')
assert.match(shell, /<circle cx="0" cy="50" r="2\.2"\s*\/>\s*<line x1="0" y1="50" x2="8" y2="50"\s*\/>/, 'right-hand handle cue begins at its opening-symbol apex')
assert.match(css, /\.constructor-drawing-layer\.is-view-inside\s*\{\s*transform:\s*scaleX\(-1\)/, 'apex and handle mirror with the construction layer')
const canonicalBottomNote = css.indexOf('.constructor-parametric-frame.has-open-bottom-frame .constructor-frame-visual::after {')
const insideBottomNote = css.indexOf('.constructor-parametric-frame.has-open-bottom-frame .constructor-drawing-layer.is-view-inside .constructor-frame-visual::after {')
assert.ok(canonicalBottomNote >= 0 && insideBottomNote > canonicalBottomNote, 'Inside bottom-note readability override must follow the canonical note rule')
assert.match(css.slice(insideBottomNote), /transform:\s*translateX\(-50%\) scaleX\(-1\);/, 'P-frame bottom label must remain upright in Inside view')
assert.match(css, /\.constructor-drawing-layer\.is-view-inside \.constructor-frame-threshold-placeholder\s*\{\s*transform:\s*scaleX\(-1\);/, 'threshold label must remain upright in Inside view')

assert.match(coordinates, /frameWidthMm - point\.xMm/)
assert.match(shell, /framePointForDoorView\([\s\S]*?insideDoorView \? 'inside' : null/)
assert.match(shell, /startEdgeResize\(frameEdgeForView\('left'\)/)
assert.match(shell, /startEdgeResize\(frameEdgeForView\('right'\)/)
assert.match(shell, /framePointFromPointer\(event\)/)
const inverseX = (x, width) => width - x
for (const [x, width] of [[0, 100], [17.5, 100], [250, 640]]) {
  assert.equal(inverseX(inverseX(x, width), width), x, 'inside/outside round trip must restore the original X')
}

assert.match(shell, /field\.openingMode === 'side-hinged'/)
assert.match(shell, /className=\{`constructor-operable-visual mode-\$\{field\.openingMode/)
assert.doesNotMatch(shell, /setConstructionFieldOpeningMode\([^\n]*doorViewOrientation/)
assert.doesNotMatch(shell, /setConstructionFieldOpeningHanding\([^\n]*doorViewOrientation/)
const orientationControls = shell.match(/constructor-door-view-control[\s\S]*?<\/div>\s*\)}/)?.[0]
assert.ok(orientationControls, 'view buttons must have an isolated control block')
assert.doesNotMatch(orientationControls, /commitConstruction|broadcastConstruction|publishProfileResolution|setConstruction|setField/)

assert.ok(!model.includes('doorViewOrientation'), 'orientation must not enter project/domain model')
assert.ok(!serialization.includes('doorViewOrientation'), 'orientation must not enter serialized project data')
assert.match(shell, /captureHistoryEntry[\s\S]*?productType: productTypeRef\.current/)
assert.doesNotMatch(shell.match(/type ConstructorHistoryEntry = \{[^}]+\}/)?.[0] ?? '', /doorViewOrientation/)
assert.match(shell, /frameEdges\?\.bottom === 'frame'/)
assert.match(shell, /frameEdges\?\.bottom === 'threshold'/)
assert.match(shell, /has-open-bottom-frame/)
assert.match(css, /\.door-leaf-bottom-none/)
assert.match(css, /\.door-leaf-bottom-threshold/)

for (const boundary of ['AUTOMATIC GEOMETRY = NO', 'RULES VALIDATED = NO', 'MACHINE READY = NO']) {
  assert.ok(shell.includes(boundary) || css.includes(boundary), `missing explicit boundary: ${boundary}`)
}
console.log('DOOR VIEW ORIENTATION 01: PASS')
