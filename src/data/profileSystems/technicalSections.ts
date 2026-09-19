import type { ProfileRole } from './types'

export const TECHNICAL_SECTION_REGISTRY_VERSION = 'technical-section-registry-01' as const

export type TechnicalSectionGraphicKey =
  | 'prelude60-frame-48230'
  | 'prelude60-mullion-48221'
  | 'prelude60-sash-48205'
  | 'prelude60-sash-48218'
  | 'prelude60-glass-bead-48215'

export type TechnicalSectionContourAnchor = Readonly<{
  xRatio: number
  yRatio: number
}>

export type TechnicalProfileSection = Readonly<{
  systemId: string
  profileCode: string
  profileRole: ProfileRole
  labelBg: string
  catalogueDepthMm: number
  catalogueFaceMm: number
  graphicKey: TechnicalSectionGraphicKey
  contourAnchors: readonly TechnicalSectionContourAnchor[]
  sourceKind: 'catalogue-reviewed'
  sourceNoteBg: string
}>

const technicalSections: readonly TechnicalProfileSection[] = [
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.30',
    profileRole: 'frame',
    labelBg: 'Каса',
    catalogueDepthMm: 60,
    catalogueFaceMm: 64,
    graphicKey: 'prelude60-frame-48230',
    contourAnchors: [
      { xRatio: 0.10, yRatio: 0.01 },
      { xRatio: 0.05, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.99 },
    ],
    sourceKind: 'catalogue-reviewed',
    sourceNoteBg: 'Каталожният разрез и габаритът са прегледани за PRELUDE 60. Това не доказва монтажно застъпване.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.21',
    profileRole: 'mullion',
    labelBg: 'Делител',
    catalogueDepthMm: 60,
    catalogueFaceMm: 84,
    graphicKey: 'prelude60-mullion-48221',
    contourAnchors: [
      { xRatio: 0.10, yRatio: 0.025 },
      { xRatio: 0.10, yRatio: 0.50 },
      { xRatio: 0.98, yRatio: 0.50 },
      { xRatio: 0.10, yRatio: 0.985 },
    ],
    sourceKind: 'catalogue-reviewed',
    sourceNoteBg: 'Каталожният разрез и габаритът са прегледани за PRELUDE 60. Това не доказва монтажно застъпване.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.05',
    profileRole: 'sash',
    labelBg: 'Крило',
    catalogueDepthMm: 60,
    catalogueFaceMm: 78,
    graphicKey: 'prelude60-sash-48205',
    contourAnchors: [
      { xRatio: 0.10, yRatio: 0.01 },
      { xRatio: 0.05, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.99 },
    ],
    sourceKind: 'catalogue-reviewed',
    sourceNoteBg: 'PRELUDE 60: 482.05 е 60 × 78 mm с видима ширина 56 mm в актуалния системен каталог. 22 mm е разлика общ/видим и не се превръща автоматично в machine rule.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.18',
    profileRole: 'sash',
    labelBg: 'Крило',
    catalogueDepthMm: 60,
    catalogueFaceMm: 78,
    graphicKey: 'prelude60-sash-48218',
    contourAnchors: [
      { xRatio: 0.10, yRatio: 0.01 },
      { xRatio: 0.05, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.50 },
      { xRatio: 0.95, yRatio: 0.99 },
    ],
    sourceKind: 'catalogue-reviewed',
    sourceNoteBg: 'PRELUDE 60: 482.18 е крилото, показано в актуалната секционна скица с делител 482.21 на стр. 25. Каталожният габарит е 60 × 78 mm; точна производствена монтажна геометрия не се извежда от регистъра.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.15',
    profileRole: 'glass-bead',
    labelBg: 'Стъклодържател 24 mm',
    catalogueDepthMm: 16.5,
    catalogueFaceMm: 28.5,
    graphicKey: 'prelude60-glass-bead-48215',
    contourAnchors: [
      { xRatio: 0.02, yRatio: 0.18 },
      { xRatio: 0.95, yRatio: 0.18 },
      { xRatio: 0.92, yRatio: 0.86 },
      { xRatio: 0.38, yRatio: 0.98 },
    ],
    sourceKind: 'catalogue-reviewed',
    sourceNoteBg: 'Каталожният профил 482.15 е стъклодържател за 24 mm glazing. Контурът е от официалния PRELUDE 60 каталог; монтажната позиция не се извлича като координати.',
  },
]

export function getTechnicalProfileSection(
  systemId: string | null | undefined,
  profileCode: string | null | undefined,
): TechnicalProfileSection | null {
  if (!systemId || !profileCode) return null
  return technicalSections.find((section) => section.systemId === systemId && section.profileCode === profileCode) ?? null
}

export function listTechnicalProfileSections(systemId: string): readonly TechnicalProfileSection[] {
  return technicalSections.filter((section) => section.systemId === systemId)
}
