import frame48230ImageUrl from '../../assets/catalog/prelude60/482-30-frame-page2.png'
import sash48205ImageUrl from '../../assets/catalog/prelude60/482-05-sash-page2.png'
import mullion48221ImageUrl from '../../assets/catalog/prelude60/482-21-mullion-page2.png'
import cataloguePage2ImageUrl from '../../assets/catalog/prelude60/prelude60-catalog-page2.png'

export type Prelude60SectionVisualEvidence = Readonly<{
  profileCode: '482.30' | '482.05' | '482.21'
  roleBg: 'Каса' | 'Крило' | 'Делител'
  imageUrl: string
  sourceTitle: 'KMG PVC Profiles Systems'
  sourcePage: 2
  sourceSection: string
  evidenceUse: 'catalog-component-cross-section'
  assembledJointApproved: false
  productionGeometryApproved: false
}>

const evidence: readonly Prelude60SectionVisualEvidence[] = [
  {
    profileCode: '482.30',
    roleBg: 'Каса',
    imageUrl: frame48230ImageUrl,
    sourceTitle: 'KMG PVC Profiles Systems',
    sourcePage: 2,
    sourceSection: 'Main profiles · 482.30 frame',
    evidenceUse: 'catalog-component-cross-section',
    assembledJointApproved: false,
    productionGeometryApproved: false,
  },
  {
    profileCode: '482.05',
    roleBg: 'Крило',
    imageUrl: sash48205ImageUrl,
    sourceTitle: 'KMG PVC Profiles Systems',
    sourcePage: 2,
    sourceSection: 'Main profiles · 482.05 sash',
    evidenceUse: 'catalog-component-cross-section',
    assembledJointApproved: false,
    productionGeometryApproved: false,
  },
  {
    profileCode: '482.21',
    roleBg: 'Делител',
    imageUrl: mullion48221ImageUrl,
    sourceTitle: 'KMG PVC Profiles Systems',
    sourcePage: 2,
    sourceSection: 'Main profiles · 482.21 mullion',
    evidenceUse: 'catalog-component-cross-section',
    assembledJointApproved: false,
    productionGeometryApproved: false,
  },
]

export const PRELUDE60_CATALOG_PAGE_2_IMAGE_URL = cataloguePage2ImageUrl
export const PRELUDE60_CATALOG_PAGE_2_TITLE = 'KMG PVC Profiles Systems · PRELUDE 60 · стр. 2'

export function getPrelude60SectionVisualEvidence(profileCode: string | null | undefined): Prelude60SectionVisualEvidence | null {
  if (!profileCode) return null
  return evidence.find((item) => item.profileCode === profileCode) ?? null
}
