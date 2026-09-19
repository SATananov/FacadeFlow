import fs from 'node:fs'
import assert from 'node:assert/strict'

const evidence = fs.readFileSync('src/data/profileSystems/glazingEvidence.ts', 'utf8')
const model = fs.readFileSync('src/domain/systemDrivenProductModel.ts', 'utf8')
const panel = fs.readFileSync('src/components/AssemblyReviewPanel.tsx', 'utf8')
const adapter = fs.readFileSync('src/domain/assurance/legacyEvidenceAdapter.ts', 'utf8')

assert(evidence.includes("sourceUrl: 'https://altestgroup.com/pdf/system/40/bg.pdf'"), 'Canonical evidence URL must stay unchanged')
assert(evidence.includes("sourceOpenUrl: 'https://altestgroup.com/pdf/system/40/bg.pdf#page=24'"), 'Exact PDF viewer open URL missing')
assert(evidence.includes('sourcePage: 23'), 'Printed page 23 must remain the evidence locator')
assert(evidence.includes('sourcePdfViewerPage: 24'), 'PDF viewer page 24 missing')
assert(evidence.includes('Отпечатана стр. 23 · PDF viewer 24/106 · sectional drawings · секции 1–2'), 'Verified display locator missing')
assert(evidence.includes("'altest-prelude60-p23-48205-48215-bead-base-candidate-01'"), 'Bead/base candidate identity changed')
assert(evidence.includes("'altest-prelude60-p23-48205-48215-placement-candidate-01'"), 'Placement candidate identity changed')

assert(model.includes('candidateSourceOpenUrl: acquiredCandidate.sourceOpenUrl'), 'Read model exact source URL not wired')
assert(model.includes('candidateSourcePdfViewerPage: acquiredCandidate.sourcePdfViewerPage'), 'Read model PDF viewer page not wired')
assert(model.includes('candidateSourceVerifiedLocatorBg: acquiredCandidate.sourceVerifiedLocatorBg'), 'Read model verified locator not wired')

assert(panel.includes('Проверен локатор:'), 'UI verified locator label missing')
assert(panel.includes('Отвори официалната техническа скица · точна страница'), 'Exact technical-sketch link label missing')
assert(panel.includes('item.candidateSourceOpenUrl ?? item.candidateSourceUrl'), 'UI must prefer exact source open URL')

const sourceReferenceBody = adapter.slice(
  adapter.indexOf('function sectionalEvidenceSourceReference'),
  adapter.indexOf('export function evidenceDigest'),
)
assert(sourceReferenceBody.includes('candidate.sourceUrl'), 'Canonical evidence identity URL unexpectedly removed')
assert(sourceReferenceBody.includes('candidate.sourcePage'), 'Canonical printed-page evidence locator unexpectedly removed')
assert(sourceReferenceBody.includes('candidate.sourceSection'), 'Canonical source section unexpectedly removed')
assert(sourceReferenceBody.includes('candidate.sourceLocatorBg'), 'Canonical source item unexpectedly removed')
assert(!sourceReferenceBody.includes('candidate.sourceOpenUrl'), 'Display open URL must not enter evidence fingerprint')
assert(!sourceReferenceBody.includes('candidate.sourcePdfViewerPage'), 'Display viewer page must not enter evidence fingerprint')
assert(!sourceReferenceBody.includes('candidate.sourceVerifiedLocatorBg'), 'Display locator must not enter evidence fingerprint')

console.log('=== EVIDENCE REVIEW 01B.2 SOURCE LOCATOR VERIFY PASS ===')
console.log('PRINTED PAGE: 23')
console.log('PDF VIEWER PAGE: 24/106')
console.log('SECTIONAL DRAWINGS: SECTIONS 1-2')
console.log('CANONICAL EVIDENCE IDENTITY: PRESERVED')
console.log('R1 HUMAN CONFIRMATIONS: NOT REBOUND / NOT REWRITTEN')
console.log('RULE PROMOTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')
