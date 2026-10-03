import type { SourceReference } from '../../domain/assurance/assuranceModel'
import { fingerprint, freezeDeep } from '../../domain/assurance/canonical'
import { kmgPrelude60 } from './prelude60'

export const PRELUDE60_DOOR_EVIDENCE_VERSION = 'prelude60-door-evidence-foundation-01' as const
const audit = 'PRELUDE 60 DOOR CATALOG AUDIT 01'
const systemId = kmgPrelude60.id

export type DoorEvidenceClassification =
  | 'VERIFIED SOURCE FACT' | 'STRONG EVIDENCE' | 'RAW LEGACY VALUE' | 'CONFLICT' | 'UNKNOWN'
type EvidenceValue = string | number | boolean | null | readonly EvidenceValue[] | { readonly [key: string]: EvidenceValue }
type Capture = Readonly<{
  id: string
  classification: DoorEvidenceClassification
  value: EvidenceValue
  sourceReferenceIds: readonly string[]
}>

// SourceReference is the existing assurance locator format. These captures are
// NOT assurance Statements, reviewed rules, selectable inventory or project data.
const sources: SourceReference[] = []
function capture(id: string, classification: DoorEvidenceClassification, value: EvidenceValue,
  documentTitle: string, table: string | null, row: string, section: string,
  pdfPage: number | null = null): Capture {
  const source = {
    documentId: documentTitle,
    documentTitle,
    documentVersion: { state: 'unknown' as const, reason: 'External edition not established by the audit.' },
    sourceSystemId: 'prelude60-door-audit-01', profileSystemId: systemId,
    locator: { printedPage: null, pdfPageIndex: pdfPage === null ? null : pdfPage - 1, section, table, row, item: id },
    capturedRecordVersion: PRELUDE60_DOOR_EVIDENCE_VERSION,
    capturedRecordDigest: fingerprint({ id, classification, value }),
    documentContentDigest: null,
    note: `${audit}; transcribed from the completed user-supplied audit. Capture digest is not a source-file hash. MDB memo/overflow errors limit completeness; no construction authority.`,
  }
  const sourceId = `door-source:${id}`
  sources.push({ ...source, id: sourceId })
  return { id, classification, value, sourceReferenceIds: [sourceId] }
}
const db = (id: string, code: string, value: EvidenceValue) => capture(id, 'VERIFIED SOURCE FACT', value,
  'Installed Mdb/Altest/Altest.mdb', 'items', `id=${code}`, 'Component record')
const legacy = (id: string, value: EvidenceValue, row: string, section: string) => capture(id, 'RAW LEGACY VALUE', value,
  'Installed Mdb/Altest/Altest.mdb', 'standart', row, section)
const finding = (id: string, classification: DoorEvidenceClassification, value: EvidenceValue, section: string) =>
  capture(id, classification, value, audit, null, id, section)

// References to the canonical PDF catalogue, copied only for immutable capture.
// No aliases are registered and no existing catalogue object is frozen/mutated.
const pdfCodes = ['482.20', '482.30', '482.26', '482.27', 'E 3308', 'E 3307', 'KM530', 'AP3174', 'TRE 03', '482.11']
const pdfEntries = [...kmgPrelude60.mainProfiles, ...kmgPrelude60.additionalProfiles,
  ...kmgPrelude60.accessories, ...kmgPrelude60.reinforcements]
const printedMeasurements: Record<string, EvidenceValue> = {
  '482.20': { depthMm: 60, verticalCalloutsMm: [68, 46] },
  '482.30': { depthMm: 60, verticalCalloutsMm: [64, 42] },
  '482.26': { depthMm: 60, printedCalloutsMm: [102, 102] },
  '482.27': { depthMm: 60, printedCalloutsMm: [124, 80] },
  'E 3308': { widthMm: 59.5, heightMm: 20 },
  'E 3307': { widthMm: 56.6, heightMm: 24.3, thicknessCalloutMm: 2 },
  'TRE 03': { printedCalloutsMm: [29.5, 65, 70], S_mm: 2.0 },
}
const pdf = pdfCodes.map((code) => {
  const entry = pdfEntries.find((item) => item.code === code)
  if (!entry) throw new Error(`Missing canonical PRELUDE catalogue evidence: ${code}`)
  return capture(`pdf:${code}`, 'VERIFIED SOURCE FACT', {
    catalogCode: code,
    classification: 'labelCatalog' in entry ? entry.labelCatalog : 'labelBg' in entry ? entry.labelBg : 'reinforcement',
    calloutsMm: 'dimensions' in entry ? [...(entry.dimensions?.calloutsMm ?? [])] : [],
    printedMeasurements: printedMeasurements[code] ?? null,
    statedFor: 'appliesToProfileCodes' in entry ? [...(entry.appliesToProfileCodes ?? [])] : [],
    thicknessOptionsMm: 'thicknessOptionsMm' in entry ? [...entry.thicknessOptionsMm] : [],
  }, 'PVC Prelude_bg.pdf / KMG PVC Profiles Systems', null, code, entry.evidence.section, entry.evidence.page)
})

const components = [
  db('db:482.20', '482.20', { name: 'Каса KMG 4к' }),
  db('db:482.30-K', '482.30-K', { name: 'Каса K KMG 3к' }),
  db('db:482.26', '482.26', { name: 'Крило врата Z 4к KMG', englishLabel: 'inward opening' }),
  db('db:482.27', '482.27', { name: 'Крило врата T 4к KMG', englishLabel: 'outward opening', componentVariable: 'DoorOut=0' }),
  db('db:E3308', 'E3308', { name: 'AL праг за 4к KMG', alprag: 0 }),
  db('db:E 3307', 'E 3307', { name: 'Водобран към ПВЦ крило 60мм' }),
  db('db:TZ18', 'TZ18', { name: 'Четка за плъзг. N18' }),
  db('db:KM530', 'KM530', { name: 'Кап. бяла за AL праг за 4к KMG' }),
  db('db:AP3173', 'AP3173', { name: 'Добавка ПВЦ Крило Врата 60мм', evidenceStatus: 'CONFLICT' }),
  db('db:AP3174', 'AP3174', { name: 'Добавка ПВЦ Крило Врата 70мм', evidenceStatus: 'CONFLICT' }),
  ...[['TRE0312', '1.2mm'], ['TRE0315', '1.5mm'], ['TRE0320 - 2', '2.0mm']].map(([code, group]) =>
    db(`db:${code}`, code, { name: 'Армировка Крило Врата KMG 60mm', sectionalComment: '65*29.5*70', group })),
  db('db:482.11', '482.11', { name: 'Летящ делител за 4к KMG', context: 'double-door source evidence only' }),
  db('db:TRE1700 - 1.2', 'TRE1700 - 1.2', { name: 'Армировка Лет.Делител  KMG 60mm  482.11' }),
  db('db:KM344A', 'KM344A', { name: 'Кап. бяла лет.дел. 4к KMG' }),
  db('db:KM3441A', 'KM3441A', { name: 'Кап. кафе лет.дел. 4к KMG' }),
  db('db:KM3442A', 'KM3442A', { name: 'Кап. черна лет.дел. 4к KMG' }),
  db('db:482.23', '482.23', { name: 'Балк. крило Т KMG 4к', doorSashSubstitutionAllowed: false }),
  db('db:482.25', '482.25', { name: 'Балк. крило Z KMG 4к', doorSashSubstitutionAllowed: false }),
]

const dimensions = [
  ['482.20', 46, 0, 60, 68], ['482.30-K', 42, 0, 60, 64],
  ['482.26', 82, 20, 60, 124], ['482.27', 82, 20, 60, 124],
  ['E3308', 20, 0, 59.5, 20], ['E 3307', 24.3, 0, 56.56, 0],
] as const
const databaseDimensions = dimensions.map(([code, dim_in, dim_out, profilew, profilez]) =>
  capture(`dimensions:${code}`, 'RAW LEGACY VALUE', { code, dim_in, dim_out, profilew, profilez,
    units: 'UNKNOWN', physicalSemantics: 'UNKNOWN', zeroProvesZeroPhysicalSize: false },
  'Installed Mdb/Altest/Altest.mdb', 'items', `id=${code}`, 'dim_in / dim_out / profilew / profilez'))

const configurations = [
  legacy('threshold:4K', { D0B0: '482.20;482.20;E3308;482.20', D4B0: '0110', D4B0Meaning: 'UNKNOWN' },
    'KMG 4K - врата T с AL праг; KMG 4K - врата Z Ал.праг', 'corrections / D0B0 / D4B0'),
  legacy('threshold:3K', { D0B0: '482.30-K;482.30-K;E3308;482.30-K', D4B0: '0110', D4B0Meaning: 'UNKNOWN' },
    'KMG 3K - врата T с AL праг; KMG 3K - врата Z с AL праг', 'corrections / D0B0 / D4B0'),
  legacy('closed:4K', { D0B0: '482.20;482.20;482.20;482.20', D4B0: '0000', D4B0Meaning: 'UNKNOWN' },
    'KMG 4K - врата T затв.каса; KMG 4K - врата Z затв.каса', 'corrections / D0B0 / D4B0'),
  legacy('closed:3K', { D0B0: '482.30-K;482.30-K;482.30-K;482.30-K', D4B0: '0000', D4B0Meaning: 'UNKNOWN' },
    'KMG 3K - врата Z затв.каса', 'corrections / D0B0 / D4B0'),
  finding('threshold:interpretation', 'STRONG EVIDENCE', {
    statement: 'E3308 replaces the bottom frame member in inspected aluminium-threshold configurations.',
    supportingCaptureIds: ['threshold:4K', 'threshold:3K'], ruleValidated: false,
  }, 'C. Door frame / leaf / threshold relationships'),
]
const expressions = [
  ['E 3307 = L - 64', 'TZ18 = L * 2'], ['482.11 = H - 75', 'TRE1700 - 1.2 = H - 102'],
].flatMap((group, index) => group.map((expression, i) => legacy(`expression:${index}:${i}`, {
  expression, status: 'UNEVALUATED LEGACY EVIDENCE', evaluationAllowed: false, L: 'UNKNOWN', H: 'UNKNOWN',
}, index === 0 ? 'KMG 4K - врата T с AL праг; KMG 4K - врата Z Ал.праг' : 'KMG 3K / KMG 4K inspected double-door configurations',
index === 0 ? 'corrections / D2C0B4 / D2C0B5 / D2C1B5' : 'corrections / D2C1B5')))
const corrections = [
  legacy('correction:single-door', { dist_u: 8, dist_b: 8, dist_l: 8, dist_r: 8, Pl: 6,
    Assembly_Use_Rabbet: 1, ReinfCorr: 20, units: 'UNKNOWN', physicalSemantics: 'UNKNOWN' },
  'KMG 3K / KMG 4K inspected door configurations', 'corrections / D3C0B4'),
  legacy('correction:variants', { observedValues: ['-5', '-4.5', '7', '9'], sourceDecimalComma: '-4,5',
    physicalSemantics: 'UNKNOWN' }, 'KMG 3K / KMG 4K variants including каса от делител',
  'corrections / D3C0B4 / D3C0B5 / D3C1B5'),
  finding('correction:interpretation', 'STRONG EVIDENCE', {
    statement: 'Rebate/edge correction semantics are suggested, not resolved.',
    supportingCaptureIds: ['correction:single-door', 'correction:variants'],
    overlapMm: null, floorGapMm: null, sashClearanceMm: null, cuttingDeductionMm: null,
  }, 'C. Door overlap'),
]
const gap = [
  capture('gap:label', 'VERIFIED SOURCE FACT', { english: 'Gap under the door', bulgarianMeaning: 'distance to the floor' },
    'Archive Lang2018.mdb', 'Languages / Languages2', 'SystemsList; Adm_Standart_form2; PositionFrameInfo; StMSG 539 / 1398', 'ENG / BG'),
  capture('gap:option', 'RAW LEGACY VALUE', { ID: 56, value: '10', comment: 'DIST2BOTTOM_SAVED' },
    'Archive and installed Config.mdb / Main2018.mdb; installed ConfigAltest.mdb', 'Options', 'ID=56', 'value / comment'),
  capture('gap:fields', 'VERIFIED SOURCE FACT', ['Working_table.dist2bottom', 'Modul_propertis.Dist2bottom'],
    'Archive Main2018.mdb', 'Working_table / Modul_propertis', 'schema', 'dist2bottom / Dist2bottom'),
  finding('gap:interpretation', 'STRONG EVIDENCE', {
    statement: 'Configurable/persisted door-bottom distance.', supportingCaptureIds: ['gap:label', 'gap:option', 'gap:fields'],
    units: 'UNKNOWN', precedence: 'UNKNOWN', permittedRange: 'UNKNOWN', preludeApplicability: 'UNRESOLVED',
    verifiedPhysicalClearanceMm: null, fixedSystemDefault: false, productionClearance: false,
  }, 'D. Gap under the door findings'),
]
const openFrame = [
  capture('open-frame:labels', 'VERIFIED SOURCE FACT', {
    'Without threshold': 'Отворена каса', 'OUTWARDS without threshold': 'Навън отворена каса',
    'INWARDS without threshold': 'Навътре отворена каса',
  }, 'Archive Lang2018.mdb', 'Languages2', 'StMSG 356 / 359 / 2061', 'ENG / BG'),
  finding('open-frame:interpretation', 'STRONG EVIDENCE', {
    statement: 'Open-frame / three-sided-frame is a legacy configuration concept.', supportingCaptureIds: ['open-frame:labels'],
    storageRepresentation: 'UNKNOWN', bottomMemberOmission: 'UNKNOWN', leafBottomRelation: 'UNKNOWN',
    serializationCommandOrSubtype: 'UNKNOWN', geometry: 'UNRESOLVED',
  }, 'C. P-shaped/open frame'),
]
const conflicts = [
  ['accessory-codes', ['db:AP3173', 'db:AP3174', 'pdf:AP3174'], 'PDF assigns AP3174 to 482.26/482.27; database identifies AP3173 as 60mm and AP3174 as 70mm, and inspected 60mm configurations use AP3173.'],
  ['frame-comment-assignment', ['db:482.20', 'db:482.30-K', 'threshold:3K'], 'Several KMG 3K comments name 482.20 while D0B0 assigns 482.30-K. The -K suffix is not an established alias for PDF 482.30.'],
  ['opening-direction', ['db:482.27'], 'Outward-opening name and DoorOut configuration versus component variable DoorOut=0. No handing or hinge geometry established.'],
  ['threshold-flag', ['db:E3308', 'threshold:4K'], 'Threshold naming/assignment versus alprag=0; flag semantics unresolved.'],
  ['threshold-cap-context', ['db:KM530', 'closed:3K', 'closed:4K'], 'KM530=1 conditional on white colour also occurs in some closed-frame configurations; occurrence does not prove threshold presence.'],
  ['reinforcement-thickness', ['pdf:TRE 03', 'db:TRE0312', 'db:TRE0315', 'db:TRE0320 - 2'], 'PDF TRE 03 S=2.0 for 482.26/482.27 versus multiple database thickness variants; no selection rule established.'],
] as const
const conflictRecords = conflicts.map(([id, supportingCaptureIds, statement]) => finding(`conflict:${id}`, 'CONFLICT', {
  statement, supportingCaptureIds: [...supportingCaptureIds], resolution: 'UNRESOLVED',
}, 'F. Unknowns and unresolved relationships'))
const unknowns = [
  ['code-equivalence', '482.30-K equivalence to PDF 482.30 is not established; codes remain distinct.'],
  ['floor-datum', 'Finished-floor datum and installed threshold elevation are unknown.'],
  ['leaf-bottom', 'Leaf-bottom relation to floor, threshold and brush is unknown.'],
  ['overlap', 'Assembled side/top/bottom overlap and rebate placement are unknown.'],
  ['gap', 'Units, precedence, permitted range and PRELUDE applicability of the saved gap option are unresolved.'],
  ['open-frame', 'Storage representation, omission semantics, leaf-bottom relation and command/subtype remain unknown.'],
  ['formula-variables', 'L and H reference definitions and complete cutting equations are unknown.'],
  ['dimension-semantics', 'PDF 80 versus database 82; PDF 56.6 versus database 56.56 remain separate. Zero database fields do not prove zero physical size.'],
  ['machining', 'Unreadable memo fields and empty PIM tables do not establish machining suitability.'],
].map(([id, reason]) => finding(`unknown:${id}`, 'UNKNOWN', { reason, resolution: 'UNRESOLVED' }, 'H. What must remain UNKNOWN'))

/** Evidence companion to prelude60.ts. Intentionally not exported by the runtime barrel. */
export const prelude60DoorEvidence = freezeDeep({
  version: PRELUDE60_DOOR_EVIDENCE_VERSION, systemId, audit,
  policy: {
    authority: 'SOURCE EVIDENCE ONLY', automaticGeometryAllowed: false, rulesValidated: false, machineReady: false,
    automaticSashPlacementAllowed: false, automaticBottomClearanceAllowed: false,
    automaticThresholdPlacementAllowed: false, automaticPFrameGenerationAllowed: false,
    automaticOverlapGeometryAllowed: false, formulaEvaluationAllowed: false,
    automaticHardwareSelectionAllowed: false, productionReady: false,
  },
  pdf, components, databaseDimensions, configurations, expressions, corrections, gap, openFrame,
  conflicts: conflictRecords, unknowns, sources,
})
