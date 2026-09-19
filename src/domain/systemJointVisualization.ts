import { getTechnicalProfileSection } from '../data/profileSystems/technicalSections'
import {
  getAssemblyJointPresentationConflict,
  getAssemblyJointPresentationTemplate,
} from '../data/profileSystems/assemblyJointPresentationTemplates'
import type { SystemDrivenJointReadModel } from './systemDrivenProductModel'

export const SYSTEM_JOINT_VISUALIZATION_VERSION = 'system-joint-visualization-04c' as const
export const ASSEMBLY_FUNCTIONALITY_VERSION = 'assembly-model-04c' as const

// Historical FIX45-FIX49 envelope contract markers. The executable source of
// truth moved to technicalSections.ts in ASSEMBLY FUNCTIONALITY 01A.
// '482.30': { profileCode: '482.30', depthMm: 60, faceMm: 64 }
// '482.21': { profileCode: '482.21', depthMm: 60, faceMm: 84 }
// '482.05': { profileCode: '482.05', depthMm: 60, faceMm: 78 }

export type JointProfileSectionSize = Readonly<{
  profileCode: string
  depthMm: number
  faceMm: number
}>

export type SystemJointVisualizationModel = Readonly<{
  version: typeof SYSTEM_JOINT_VISUALIZATION_VERSION
  functionalityVersion: typeof ASSEMBLY_FUNCTIONALITY_VERSION
  status: 'available' | 'unavailable'
  technicalSectionStatus: 'resolved' | 'missing-section' | 'missing-rule'
  draftingTemplateKey: string | null
  reasonBg: string | null
  support: JointProfileSectionSize | null
  sash: JointProfileSectionSize | null
  correctionMm: number | null
  canonicalSupportXmm: number
  canonicalSupportYmm: number
  canonicalSashXmm: number
  canonicalSashYmm: number
  canonicalWidthMm: number
  canonicalHeightMm: number
  orientationRotationDeg: number
  sourceLabelBg: string | null
  supportVisibleFaceMm: number | null
  sashVisibleFaceMm: number | null
  exactGeometryVerified: boolean
  presentationMateStatus: 'reviewed-sectional' | 'legacy-reference' | 'unavailable'
  presentationFaceOverlapMm: number | null
  presentationDepthOffsetMm: number | null
  presentationSourceLabelBg: string | null
}>

function edgeRotation(edge: SystemDrivenJointReadModel['edge']): number {
  if (edge === 'right') return 180
  if (edge === 'top') return 90
  if (edge === 'bottom') return -90
  return 0
}

function sectionSize(
  systemId: string,
  profileCode: string | null,
): JointProfileSectionSize | null {
  const section = getTechnicalProfileSection(systemId, profileCode)
  if (!section) return null
  return {
    profileCode: section.profileCode,
    depthMm: section.catalogueDepthMm,
    faceMm: section.catalogueFaceMm,
  }
}

/**
 * ASSEMBLY FUNCTIONALITY 01A
 *
 * Boundary -> real profile pair -> technical-section registry -> system rule ->
 * drafting view. The rendering component no longer decides catalogue section
 * dimensions from profile-code conditionals. A different registered pair can
 * therefore use the same drafting pipeline without a pair-specific component.
 *
 * The system correction remains a reference placement input only. It is not
 * overlap, exact mate geometry, a production allowance, or a machine-ready fact.
 */
export function buildSystemJointVisualization(
  joint: SystemDrivenJointReadModel,
): SystemJointVisualizationModel {
  const support = sectionSize(joint.systemId, joint.supportProfileCode)
  const sash = sectionSize(joint.systemId, joint.sashProfileCode)
  const rule = joint.systemRule
  const supportVisibleFaceMm = joint.supportVisibleFaceReviewed ? joint.supportVisibleFaceMm : null
  const sashVisibleFaceMm = joint.sashVisibleFaceReviewed ? joint.sashVisibleFaceMm : null
  const draftingTemplateKey = support && sash
    ? `${joint.systemId}:${joint.jointKind}:${support.profileCode}:${sash.profileCode}:technical-section-v1`
    : null
  const presentationTemplate = support && sash
    ? getAssemblyJointPresentationTemplate(joint.systemId, joint.jointKind, support.profileCode, sash.profileCode)
    : null
  const presentationConflict = support && sash
    ? getAssemblyJointPresentationConflict(joint.systemId, joint.jointKind, support.profileCode, sash.profileCode)
    : null

  if (presentationConflict) {
    return {
      version: SYSTEM_JOINT_VISUALIZATION_VERSION,
      functionalityVersion: ASSEMBLY_FUNCTIONALITY_VERSION,
      status: 'unavailable',
      technicalSectionStatus: 'resolved',
      draftingTemplateKey,
      reasonBg: presentationConflict.reasonBg,
      support,
      sash,
      correctionMm: null,
      canonicalSupportXmm: 0,
      canonicalSupportYmm: 0,
      canonicalSashXmm: 0,
      canonicalSashYmm: 0,
      canonicalWidthMm: 0,
      canonicalHeightMm: 0,
      orientationRotationDeg: edgeRotation(joint.edge),
      sourceLabelBg: presentationConflict.sourceLabelBg,
      supportVisibleFaceMm,
      sashVisibleFaceMm,
      exactGeometryVerified: false,
      presentationMateStatus: 'unavailable',
      presentationFaceOverlapMm: null,
      presentationDepthOffsetMm: null,
      presentationSourceLabelBg: presentationConflict.sourceLabelBg,
    }
  }

  if (!support || !sash || (!rule && !presentationTemplate)) {
    return {
      version: SYSTEM_JOINT_VISUALIZATION_VERSION,
      functionalityVersion: ASSEMBLY_FUNCTIONALITY_VERSION,
      status: 'unavailable',
      technicalSectionStatus: !support || !sash ? 'missing-section' : 'missing-rule',
      draftingTemplateKey,
      reasonBg: !support || !sash
        ? 'Липсва регистриран технически разрез за един от участващите профили. FacadeFlow не създава заместителна геометрия.'
        : 'За тази реална двойка профили няма потвърдена каталожна секционна сглобка или системно конструктивно правило.',
      support,
      sash,
      correctionMm: null,
      canonicalSupportXmm: 0,
      canonicalSupportYmm: 0,
      canonicalSashXmm: 0,
      canonicalSashYmm: 0,
      canonicalWidthMm: 0,
      canonicalHeightMm: 0,
      orientationRotationDeg: edgeRotation(joint.edge),
      sourceLabelBg: rule?.source.labelBg ?? presentationTemplate?.sourceLabelBg ?? null,
      supportVisibleFaceMm,
      sashVisibleFaceMm,
      exactGeometryVerified: joint.geometryStatus === 'available',
      presentationMateStatus: 'unavailable',
      presentationFaceOverlapMm: null,
      presentationDepthOffsetMm: null,
      presentationSourceLabelBg: null,
    }
  }

  const correctionMm = rule
    ? Math.max(0, Math.min(rule.sashEdgeCorrectionMm, Math.min(support.depthMm, sash.depthMm) * 0.45))
    : null

  // ASSEMBLY MODEL 04C — CATALOGUE PAIRING TRUTH.
  // A reviewed sectional template may render without an automatic system rule.
  // This is intentional for 482.21 + 482.18: the current PRELUDE catalogue proves
  // the sectional pairing, while no production correction is invented. Conversely,
  // 482.21 + 482.05 is explicitly blocked above instead of being visually forced.
  const canonicalSupportXmm = 0
  const canonicalSupportYmm = 0
  const canonicalSashXmm = presentationTemplate
    ? presentationTemplate.depthOffsetPresentationMm
    : support.depthMm - (correctionMm ?? 0)
  const canonicalSashYmm = presentationTemplate
    ? support.faceMm - presentationTemplate.faceOverlapPresentationMm
    : (Math.max(support.faceMm, sash.faceMm) - sash.faceMm) / 2
  const canonicalWidthMm = presentationTemplate
    ? Math.max(
        support.depthMm,
        canonicalSashXmm + sash.depthMm,
      )
    : canonicalSashXmm + sash.depthMm
  const canonicalHeightMm = presentationTemplate
    ? Math.max(
        support.faceMm,
        canonicalSashYmm + sash.faceMm,
      )
    : Math.max(support.faceMm, sash.faceMm)

  return {
    version: SYSTEM_JOINT_VISUALIZATION_VERSION,
    functionalityVersion: ASSEMBLY_FUNCTIONALITY_VERSION,
    status: 'available',
    technicalSectionStatus: 'resolved',
    draftingTemplateKey,
    reasonBg: null,
    support,
    sash,
    correctionMm,
    canonicalSupportXmm,
    canonicalSupportYmm,
    canonicalSashXmm,
    canonicalSashYmm,
    canonicalWidthMm,
    canonicalHeightMm,
    orientationRotationDeg: edgeRotation(joint.edge),
    sourceLabelBg: rule?.source.labelBg ?? presentationTemplate?.sourceLabelBg ?? null,
    supportVisibleFaceMm,
    sashVisibleFaceMm,
    exactGeometryVerified: joint.geometryStatus === 'available',
    presentationMateStatus: presentationTemplate ? 'reviewed-sectional' : 'legacy-reference',
    presentationFaceOverlapMm: presentationTemplate?.faceOverlapPresentationMm ?? null,
    presentationDepthOffsetMm: presentationTemplate?.depthOffsetPresentationMm ?? null,
    presentationSourceLabelBg: presentationTemplate?.sourceLabelBg ?? null,
  }
}
