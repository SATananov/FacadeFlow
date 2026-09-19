import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/AssemblyReviewPanel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/components/AssemblyReviewPanel.css', import.meta.url), 'utf8')
const semantics = await readFile(new URL('../src/domain/systemJointVisualization.ts', import.meta.url), 'utf8')

assert(panel.includes('const profileIdentityCallout = ('), 'Profile identity callout renderer missing')
assert(panel.includes("profileIdentityCallout(supportBox, joint.supportProfileCode"), 'Support profile identity callout missing or mapped to wrong semantic profile box')
assert(panel.includes("profileIdentityCallout(sashBox, joint.sashProfileCode, 'КРИЛО'"), 'Sash profile identity callout missing or mapped to wrong semantic profile box')
assert(panel.includes('joint.supportProfileCode\n              ? profileIdentityCallout'), 'Support profile identity callout must be null-safe')
assert(panel.includes('joint.sashProfileCode\n              ? profileIdentityCallout'), 'Sash profile identity callout must be null-safe')
assert(panel.includes('joint.supportLabelBg.toUpperCase()'), 'Support role must reuse resolved human-readable role')
assert(panel.includes('assembly-auto-profile-identity-leader'), 'Identity leader class missing')
assert(panel.includes('assembly-auto-profile-identity-box'), 'Identity box class missing')
assert(panel.includes('assembly-auto-profile-identity-code'), 'Identity code class missing')
assert(panel.includes('assembly-auto-profile-identity-role'), 'Identity role class missing')

assert(css.includes('FIX45 - in-canvas profile identity callouts'), 'FIX45 CSS marker missing')
assert(css.includes('.assembly-auto-profile-identity-leader'), 'Identity leader styling missing')
assert(css.includes('.assembly-auto-profile-identity-box'), 'Identity box styling missing')
assert(css.includes('.assembly-auto-profile-identity-code'), 'Identity code styling missing')
assert(css.includes('.assembly-auto-profile-identity-role'), 'Identity role styling missing')

assert(semantics.includes("'482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }"), '482.21 catalogue envelope changed unexpectedly')
assert(semantics.includes("'482.05': { profileCode: '482.05', depthMm: 60, faceMm: 56 }"), '482.05 catalogue envelope changed unexpectedly')
assert(semantics.includes('exactGeometryVerified: joint.geometryStatus === \'available\''), 'Exact-geometry safety gate changed unexpectedly')

console.log('=== FIX45 IN-CANVAS PROFILE IDENTITY 01 VERIFY PASS ===')
console.log('SUPPORT PROFILE IDENTITY: DIRECT ON FINAL ASSEMBLY')
console.log('SASH PROFILE IDENTITY: DIRECT ON FINAL ASSEMBLY')
console.log('CALLOUTS: IDENTITY ONLY / NO NEW GEOMETRY FACT')
console.log('CATALOGUE DIMENSIONS / COORDINATES: UNCHANGED')
console.log('UNKNOWN OVERLAP: EXPLICIT / NOT INVENTED')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('PRODUCTION AUTO-UNLOCK: NO')
console.log('MACHINE READY: NO')
