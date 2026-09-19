export const ASSEMBLY_JOINT_PRESENTATION_VERSION = 'assembly-joint-presentation-04c' as const

export type AssemblyJointPresentationTemplate = Readonly<{
  systemId: string
  jointKind: 'frame-sash' | 'mullion-sash'
  supportProfileCode: string
  sashProfileCode: string
  /** Operator-sketch placement only; never production geometry. */
  depthOffsetPresentationMm: number
  faceOverlapPresentationMm: number
  sourceKind: 'reviewed-sectional-presentation'
  sourceLabelBg: string
  noteBg: string
}>

export type AssemblyJointPresentationConflict = Readonly<{
  systemId: string
  jointKind: 'frame-sash' | 'mullion-sash'
  supportProfileCode: string
  sashProfileCode: string
  catalogueSashProfileCode: string
  sourceLabelBg: string
  reasonBg: string
}>

const templates: readonly AssemblyJointPresentationTemplate[] = [
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'frame-sash',
    supportProfileCode: '482.30',
    sashProfileCode: '482.05',
    depthOffsetPresentationMm: 15.5,
    faceOverlapPresentationMm: 30,
    sourceKind: 'reviewed-sectional-presentation',
    sourceLabelBg: 'PRELUDE 60 · актуален секционен каталог · стр. 23',
    noteBg: 'Стр. 23 показва 482.30 + 482.05 + 482.15 при 24 mm стъклопакет. В операторската скица се използват 15.5 mm секционно отместване и 30 mm визуално лицево застъпване (64 + 78 − 112). Това не е производствено правило.',
  },
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'mullion-sash',
    supportProfileCode: '482.21',
    sashProfileCode: '482.18',
    depthOffsetPresentationMm: 15.5,
    faceOverlapPresentationMm: 30,
    sourceKind: 'reviewed-sectional-presentation',
    sourceLabelBg: 'PRELUDE 60 · актуален секционен каталог · стр. 25',
    noteBg: 'Стр. 25 показва 482.21 + 482.18 + 482.15 при 24 mm стъклопакет. Общият лицев размер 180 mm = 84 + 48 + 48, а 78 − 48 = 30 mm визуално застъпване за всяко крило. Секционният габарит е 75.5 mm при 15.5 mm отместване. Само за операторската скица.',
  },
]

const conflicts: readonly AssemblyJointPresentationConflict[] = [
  {
    systemId: 'kmg-prelude-60',
    jointKind: 'mullion-sash',
    supportProfileCode: '482.21',
    sashProfileCode: '482.05',
    catalogueSashProfileCode: '482.18',
    sourceLabelBg: 'PRELUDE 60 · актуален секционен каталог · стр. 25',
    reasonBg: 'Няма потвърдена каталожна сглобка 482.21 + 482.05. Актуалната секционна скица на стр. 25 показва делител 482.21 с крило 482.18, стъклодържател 482.15 и 24 mm стъклопакет. FacadeFlow не намества 482.05 и не го подменя автоматично.',
  },
]

export function getAssemblyJointPresentationTemplate(
  systemId: string,
  jointKind: 'frame-sash' | 'mullion-sash',
  supportProfileCode: string | null | undefined,
  sashProfileCode: string | null | undefined,
): AssemblyJointPresentationTemplate | null {
  if (!supportProfileCode || !sashProfileCode) return null
  return templates.find((template) => (
    template.systemId === systemId &&
    template.jointKind === jointKind &&
    template.supportProfileCode === supportProfileCode &&
    template.sashProfileCode === sashProfileCode
  )) ?? null
}

export function getAssemblyJointPresentationConflict(
  systemId: string,
  jointKind: 'frame-sash' | 'mullion-sash',
  supportProfileCode: string | null | undefined,
  sashProfileCode: string | null | undefined,
): AssemblyJointPresentationConflict | null {
  if (!supportProfileCode || !sashProfileCode) return null
  return conflicts.find((conflict) => (
    conflict.systemId === systemId &&
    conflict.jointKind === jointKind &&
    conflict.supportProfileCode === supportProfileCode &&
    conflict.sashProfileCode === sashProfileCode
  )) ?? null
}
