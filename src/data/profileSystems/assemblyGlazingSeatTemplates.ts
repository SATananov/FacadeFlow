export const ASSEMBLY_GLAZING_SEAT_PRESENTATION_VERSION = 'assembly-glazing-seat-presentation-04c' as const

export type AssemblyGlazingSeatPresentationTemplate = Readonly<{
  systemId: string
  sashProfileCode: string
  glazingBeadProfileCode: string
  glazingThicknessMm: number
  /**
   * Reviewed operator-presentation anchors in sash-local section coordinates.
   * X follows the 60 mm system depth; Y follows the sash face direction.
   * None of these values is a glass cut, machine seat/inset or machining value.
   */
  glassDepthCenterFromSashStartMm: number
  glassFaceStartFromSashTopMm: number
  glassPresentationRunMm: number
  beadGraphicScale: number
  beadCenterDepthFromSashStartMm: number
  beadCenterFaceFromSashTopMm: number
  beadLocalRotationDeg: number
  beadMirrorX: boolean
  sourceKind: 'reviewed-sectional-presentation'
  sourceLabelBg: string
  noteBg: string
}>

const templates: readonly AssemblyGlazingSeatPresentationTemplate[] = [
  {
    systemId: 'kmg-prelude-60',
    sashProfileCode: '482.05',
    glazingBeadProfileCode: '482.15',
    glazingThicknessMm: 24,
    // ASSEMBLY MODEL 04B: glass thickness follows the system-depth axis.
    // The previous sketch drew 24 mm across the face axis and made the glazing
    // look like a horizontal appendage. The current section is represented with
    // the 24 mm thickness across X and the pane continuation along Y.
    // 41.5 mm is the reviewed local presentation start used with 482.05; the
    // visible pane run continues beyond the sash envelope so the operator can read the glass direction; it is not a glass-cut length.
    glassDepthCenterFromSashStartMm: 30,
    glassFaceStartFromSashTopMm: 41.5,
    glassPresentationRunMm: 52,
    beadGraphicScale: 1.0,
    // Effective installed orientation is unchanged from 04A; only the anchor is
    // moved onto the glazing side of the sash instead of outside its envelope.
    beadCenterDepthFromSashStartMm: 44,
    beadCenterFaceFromSashTopMm: 41.5,
    beadLocalRotationDeg: 90,
    beadMirrorX: true,
    sourceKind: 'reviewed-sectional-presentation',
    sourceLabelBg: 'PRELUDE 60 · актуален секционен каталог · стр. 23 · 482.05 + 24 mm + 482.15',
    noteBg: '24 mm стъклопакетът се показва през 60 mm дълбочина на 482.05, а не напречно на лицето му. 482.15 е закотвен към същата локална зона на остъкляването. Това е операторска презентационна геометрия, не производствен glass cut / seat / inset.',
  },
  {
    systemId: 'kmg-prelude-60',
    sashProfileCode: '482.18',
    glazingBeadProfileCode: '482.15',
    glazingThicknessMm: 24,
    glassDepthCenterFromSashStartMm: 30,
    glassFaceStartFromSashTopMm: 41.5,
    glassPresentationRunMm: 52,
    beadGraphicScale: 1.0,
    beadCenterDepthFromSashStartMm: 44,
    beadCenterFaceFromSashTopMm: 41.5,
    beadLocalRotationDeg: 90,
    beadMirrorX: true,
    sourceKind: 'reviewed-sectional-presentation',
    sourceLabelBg: 'PRELUDE 60 · актуален секционен каталог · стр. 25 · 482.18 + 24 mm + 482.15',
    noteBg: 'Стр. 25 потвърждава 24 mm стъклопакет и 482.15 към крило 482.18 при делител 482.21. Позицията е само за операторската секционна скица; glass cut / seat / inset и machining остават неизвестни.',
  },
]

export function getAssemblyGlazingSeatPresentationTemplate(
  systemId: string | null | undefined,
  sashProfileCode: string | null | undefined,
  glazingBeadProfileCode: string | null | undefined,
  glazingThicknessMm: number | null | undefined,
): AssemblyGlazingSeatPresentationTemplate | null {
  if (!systemId || !sashProfileCode || !glazingBeadProfileCode || glazingThicknessMm === null || glazingThicknessMm === undefined) {
    return null
  }

  return templates.find((template) => (
    template.systemId === systemId &&
    template.sashProfileCode === sashProfileCode &&
    template.glazingBeadProfileCode === glazingBeadProfileCode &&
    template.glazingThicknessMm === glazingThicknessMm
  )) ?? null
}
