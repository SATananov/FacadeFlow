import {
  getProfileSystemById,
  type ProfileDefinition,
  type ProfileRole,
  type ProfileSystemCatalogEntry,
} from '../data/profileSystems'
import { getProfileDimensionalSemantics } from '../data/profileSystems/dimensionalSemantics'
import { findPrelude60SectionalEvidenceCandidate } from '../data/profileSystems/glazingEvidence'
import { getTechnicalProfileSection } from '../data/profileSystems/technicalSections'
import { getJointAssemblyEvidenceRecord, isJointAssemblyEvidenceReviewed } from '../data/profileSystems/jointAssemblyEvidence'
import { getProfileJointEvidenceRule, type ProfileJointKind } from '../data/profileSystems/jointSemantics'
import {
  getSystemGlazingConstructionRule,
  resolveSystemBoundaryRule,
  type ResolvedSystemBoundaryRule,
  type SystemDividerOrientation,
} from '../data/profileSystems/systemConstructionRules'
import {
  getFrameInteriorBounds,
  resolveConstructionTopology,
  type ConstructionModel,
  type ResolvedConstructionDivider,
  type ResolvedConstructionField,
} from './construction'
import type { ModuleProfileResolution } from './profileResolution'
import {
  getEffectiveFieldGlazingSpecification,
  getEffectiveFieldGlazingThicknessMm,
  getFieldGlazingBeadResolutionContext,
  getFieldHumanGlazingThicknessMm,
  getReinforcementTargetKey,
} from './profileResolution'
import { evaluateGlazingBeadCompatibility, type ComponentCompatibilityStatus } from './componentCompatibility'
import { resolveGlazingEvidenceContext } from './glazingEvidence'
import type { ProjectSnapshot } from './project/projectModel'
import { assessStatement } from './assurance/assuranceSelectors'

export const SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION = 'system-driven-product-model-04' as const
export const ASSEMBLY_BOUNDARY_COVERAGE_VERSION = 'assembly-functionality-01b' as const
export const ASSEMBLY_FIELD_GLAZING_CONTEXT_VERSION = 'assembly-functionality-01c' as const
export const ASSEMBLY_JOINT_GLAZING_LINK_VERSION = 'assembly-functionality-01d' as const
export const ASSEMBLY_GLAZING_EVIDENCE_STATUS_VERSION = 'assembly-functionality-01e' as const
export const ASSEMBLY_GLAZING_EVIDENCE_GAP_VERSION = 'assembly-functionality-01f' as const
export const ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION = 'assembly-functionality-01g' as const
export const EVIDENCE_ACQUISITION_VERSION = 'evidence-acquisition-01a' as const
export const EVIDENCE_REVIEW_VERSION = 'evidence-review-01b' as const

type Edge = 'left' | 'right' | 'top' | 'bottom'

export type SystemDrivenBoundaryRole = 'frame-sash' | 'divider-sash'

export type SystemDrivenComponentKind =
  | 'frame'
  | 'divider'
  | 'sash'
  | 'glass-bead'

export type SystemDrivenComponentReadModel = Readonly<{
  id: string
  kind: SystemDrivenComponentKind
  targetId: string
  targetLabelBg: string
  profileCode: string | null
  profileRole: ProfileRole | null
  profileLabelBg: string | null
  visibleFaceMm: number | null
  visibleFaceReviewed: boolean
  reinforcementCode: string | null
  reinforcementThicknessMm: number | null
  glazingThicknessMm: number | null
  systemRecommendedProfileCode: string | null
  systemRecommendationStatus: 'not-applicable' | 'matched' | 'different' | 'rule-available' | 'no-rule'
  systemRuleSourceLabelBg: string | null
  status: 'resolved' | 'missing-profile' | 'not-required'
}>

export type SystemDrivenJointReadModel = Readonly<{
  id: string
  systemId: string
  fieldId: string
  fieldSequence: number
  edge: Edge
  supportKind: 'frame' | 'divider'
  supportId: string
  supportLabelBg: string
  boundaryRole: SystemDrivenBoundaryRole
  boundaryLabelBg: string
  jointKind: ProfileJointKind
  supportProfileCode: string | null
  supportProfileRole: ProfileRole | null
  supportVisibleFaceMm: number | null
  supportVisibleFaceReviewed: boolean
  sashProfileCode: string | null
  sashProfileRole: ProfileRole | null
  sashVisibleFaceMm: number | null
  sashVisibleFaceReviewed: boolean
  roleResolutionStatus: 'resolved' | 'missing-profile' | 'role-mismatch'
  systemRuleStatus: 'available' | 'missing'
  systemRule: ResolvedSystemBoundaryRule | null
  libraryKey: string | null
  evidenceStatus: 'verified' | 'missing-evidence' | 'missing-profile' | 'invalid-role'
  geometryStatus: 'available' | 'locked'
  noteBg: string
}>

export type SystemDrivenBoundaryCoverageStatus =
  | 'resolved'
  | 'support-unresolved'
  | 'missing-profile'
  | 'invalid-role'
  | 'missing-technical-section'
  | 'missing-system-rule'

export type SystemDrivenBoundaryCoverageReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_BOUNDARY_COVERAGE_VERSION
  fieldId: string
  fieldSequence: number
  edge: Edge
  status: SystemDrivenBoundaryCoverageStatus
  jointId: string | null
  supportKind: 'frame' | 'divider' | null
  supportId: string | null
  supportLabelBg: string | null
  supportProfileCode: string | null
  sashProfileCode: string | null
  technicalSectionStatus: 'resolved' | 'missing' | 'not-applicable'
  systemRuleStatus: 'available' | 'missing' | 'not-applicable'
  noteBg: string
}>


export type SystemDrivenFieldGlazingContextReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_FIELD_GLAZING_CONTEXT_VERSION
  fieldId: string
  fieldSequence: number
  fieldType: 'fixed' | 'operable'
  glazingThicknessMm: number | null
  glazingThicknessSource: 'human-field' | 'field-override' | 'module-override' | 'offer-default' | 'unset'
  baseProfileCode: string | null
  baseProfileRole: 'frame' | 'sash' | 'door-sash' | null
  glazingBeadProfileCode: string | null
  inputStatus: 'complete' | 'missing' | 'invalid'
  compatibilityStatus: ComponentCompatibilityStatus
  compatibilityCode: string
  noteBg: string
  exactGlazingInsetKnown: false
}>

export type SystemDrivenJointGlazingLinkStatus =
  | 'linked-confirmed'
  | 'linked-unconfirmed'
  | 'missing-field-context'
  | 'base-profile-mismatch'
  | 'missing-input'
  | 'invalid-input'

export type SystemDrivenJointGlazingLinkReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_JOINT_GLAZING_LINK_VERSION
  jointId: string
  fieldId: string
  fieldSequence: number
  edge: Edge
  fieldGlazingContextId: string | null
  glazingThicknessMm: number | null
  glazingBeadProfileCode: string | null
  baseProfileCode: string | null
  jointSashProfileCode: string | null
  baseProfileMatchesJoint: boolean | null
  inputStatus: 'complete' | 'missing' | 'invalid' | 'missing-context'
  compatibilityStatus: ComponentCompatibilityStatus | null
  compatibilityCode: string | null
  linkStatus: SystemDrivenJointGlazingLinkStatus
  noteBg: string
  exactGlazingInsetKnown: false
  exactGlazingSeatKnown: false
  exactGlassCutDimensionsKnown: false
}>

export type SystemDrivenGlazingEvidenceTier =
  | 'blocked'
  | 'input-context'
  | 'catalogue-supported'
  | 'compatibility-reviewed'
  | 'placement-reviewed'

export type SystemDrivenJointGlazingEvidenceReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_GLAZING_EVIDENCE_STATUS_VERSION
  jointId: string
  fieldId: string
  fieldSequence: number
  edge: Edge
  jointGlazingLinkId: string
  evidenceTier: SystemDrivenGlazingEvidenceTier
  inputContextStatus: 'complete' | 'missing' | 'invalid' | 'missing-context'
  selectedBeadProfileCode: string | null
  glazingThicknessMm: number | null
  catalogueThicknessEvidenceStatus: 'supported' | 'missing' | 'not-applicable'
  catalogueEvidenceSourceLabel: string | null
  beadToBaseEvidenceStatus: 'reviewed' | 'unconfirmed' | 'invalid' | 'missing'
  placementEvidenceStatus: 'reviewed' | 'unknown'
  glassCutEvidenceStatus: 'reviewed' | 'unknown'
  automaticGeometryAllowed: false
  machineReady: false
  noteBg: string
}>

export type SystemDrivenGlazingEvidenceGapKind =
  | 'field-input'
  | 'catalogue-bead-thickness'
  | 'bead-base-compatibility'
  | 'placement-evidence'
  | 'glass-cut-rule'

export type SystemDrivenGlazingEvidenceGapReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_GLAZING_EVIDENCE_GAP_VERSION
  kind: SystemDrivenGlazingEvidenceGapKind
  status: 'open'
  systemId: string
  fieldIds: readonly string[]
  fieldSequences: readonly number[]
  jointIds: readonly string[]
  occurrenceCount: number
  glazingThicknessMm: number | null
  beadProfileCode: string | null
  baseProfileCode: string | null
  reasonBg: string
  requiredEvidenceBg: string
  automaticGeometryAllowed: false
  machineReady: false
}>

export type SystemDrivenGlazingEvidenceReviewState =
  | 'human-input-required'
  | 'evidence-required'
  | 'reference-candidate'

export type SystemDrivenGlazingEvidenceReviewItemReadModel = Readonly<{
  id: string
  version: typeof ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION
  gapId: string
  gapKind: SystemDrivenGlazingEvidenceGapKind
  reviewState: SystemDrivenGlazingEvidenceReviewState
  occurrenceCount: number
  fieldSequences: readonly number[]
  glazingThicknessMm: number | null
  beadProfileCode: string | null
  baseProfileCode: string | null
  candidateSourceId: string | null
  candidateSourceLabelBg: string | null
  candidateSourceUrl: string | null
  candidateSourceOpenUrl: string | null
  candidateSourcePage: number | null
  candidateSourcePdfViewerPage: number | null
  candidateSourceSection: string | null
  candidateSourceLocatorBg: string | null
  candidateSourceVerifiedLocatorBg: string | null
  candidateSummaryBg: string | null
  acceptedEvidenceStatus: 'none' | 'reviewed'
  candidateEvidenceId: string | null
  reviewConfirmationId: string | null
  reviewedByLabel: string | null
  reviewedAt: string | null
  requiredReviewBg: string
  rulePromotionAllowed: false
  automaticGeometryAllowed: false
  machineReady: false
}>

export type SystemDrivenJointLibraryReadModel = Readonly<{
  key: string
  boundaryLabelBg: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  sashProfileCode: string
  occurrenceJointIds: readonly string[]
  occurrenceCount: number
  fieldSequences: readonly number[]
  edges: readonly Edge[]
  systemRuleStatus: 'available' | 'missing'
  systemRuleSourceLabelBg: string | null
  exactGeometryStatus: 'verified' | 'missing'
  noteBg: string
}>

export type SystemDrivenLayoutField = Readonly<{
  id: string
  sequence: number
  fieldType: 'fixed' | 'operable' | null
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}>

export type SystemDrivenLayoutDivider = Readonly<{
  id: string
  axis: 'vertical' | 'horizontal'
  positionMm: number
  startMm: number
  endMm: number
  schematicFaceMm: number
  systemVisibleFaceMm: number | null
  systemVisibleFaceReviewed: boolean
}>

export type SystemDrivenModuleLayoutReadModel = Readonly<{
  widthMm: number
  heightMm: number
  schematicFrameFaceMm: number
  systemFrameVisibleFaceMm: number | null
  systemFrameVisibleFaceReviewed: boolean
  fields: readonly SystemDrivenLayoutField[]
  dividers: readonly SystemDrivenLayoutDivider[]
  angledDividerCount: number
}>

export type SystemDrivenModuleReadModel = Readonly<{
  version: typeof SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION
  moduleId: string | null
  moduleSequence: number | null
  productType: 'window' | 'door' | null
  systemId: string | null
  systemLabel: string
  constructionReady: boolean
  profileResolutionReady: boolean
  layout: SystemDrivenModuleLayoutReadModel | null
  components: readonly SystemDrivenComponentReadModel[]
  joints: readonly SystemDrivenJointReadModel[]
  boundaryCoverage: readonly SystemDrivenBoundaryCoverageReadModel[]
  fieldGlazingContexts: readonly SystemDrivenFieldGlazingContextReadModel[]
  jointGlazingLinks: readonly SystemDrivenJointGlazingLinkReadModel[]
  jointGlazingEvidence: readonly SystemDrivenJointGlazingEvidenceReadModel[]
  glazingEvidenceGaps: readonly SystemDrivenGlazingEvidenceGapReadModel[]
  glazingEvidenceReviewItems: readonly SystemDrivenGlazingEvidenceReviewItemReadModel[]
  jointLibrary: readonly SystemDrivenJointLibraryReadModel[]
  resolvedComponentCount: number
  requiredComponentCount: number
  verifiedJointCount: number
  requiredJointCount: number
  uniqueJointTypeCount: number
  systemRuleJointCount: number
  systemRuleJointTypeCount: number
  expectedBoundaryCount: number
  resolvedBoundaryCount: number
  technicalReadyBoundaryCount: number
  blockedBoundaryCount: number
  boundaryCoverageComplete: boolean
  glazingFieldCount: number
  glazingInputCompleteCount: number
  glazingMissingInputCount: number
  glazingInvalidInputCount: number
  glazingUnconfirmedCompatibilityCount: number
  jointGlazingLinkCount: number
  jointGlazingLinkedCount: number
  jointGlazingBlockedCount: number
  jointGlazingUnconfirmedCount: number
  glazingEvidenceCount: number
  glazingEvidenceCatalogueSupportedCount: number
  glazingEvidenceCompatibilityReviewedCount: number
  glazingEvidencePlacementReviewedCount: number
  glazingEvidenceBlockedCount: number
  glazingEvidenceOpenGapCount: number
  glazingEvidenceReviewCandidateCount: number
  glazingEvidenceReviewedCount: number
  machineReady: false
}>

export type ProductModuleConnectionQuestion = Readonly<{
  id: string
  fromModuleId: string
  fromModuleSequence: number
  toModuleId: string
  toModuleSequence: number
  status: 'boundary-not-defined'
  noteBg: string
}>

export type SystemDrivenProductReadModel = Readonly<{
  version: typeof SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION
  modules: readonly SystemDrivenModuleReadModel[]
  moduleConnectionQuestions: readonly ProductModuleConnectionQuestion[]
  machineReady: false
}>

function findProfile(system: ProfileSystemCatalogEntry, code: string | null | undefined): ProfileDefinition | null {
  if (!code) return null
  const groups: readonly (readonly ProfileDefinition[])[] = [
    system.mainProfiles,
    system.glassBeads,
    system.additionalProfiles,
    system.gaskets,
    system.panelsAndSills,
  ]
  for (const group of groups) {
    const profile = group.find((entry) => entry.code === code)
    if (profile) return profile
  }
  return null
}

function visibleFace(systemId: string | null, profileCode: string | null): { valueMm: number | null; reviewed: boolean } {
  if (!systemId || !profileCode) return { valueMm: null, reviewed: false }
  const semantics = getProfileDimensionalSemantics(systemId, profileCode)
  if (!semantics?.visibleFace || semantics.visibleFace.source !== 'human-confirmed') {
    return { valueMm: null, reviewed: false }
  }
  return { valueMm: semantics.visibleFace.valueMm, reviewed: true }
}

function component(args: {
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  kind: SystemDrivenComponentKind
  targetId: string
  targetLabelBg: string
  profileCode: string | null
  required: boolean
  reinforcementTargetKey?: string
  glazingThicknessMm?: number | null
}): SystemDrivenComponentReadModel {
  const profile = findProfile(args.system, args.profileCode)
  const face = visibleFace(args.system.id, args.profileCode)
  const reinforcement = args.reinforcementTargetKey
    ? args.resolution.reinforcements[args.reinforcementTargetKey] ?? null
    : null
  const glazingThicknessMm = args.glazingThicknessMm ?? null
  const glazingRule = args.kind === 'glass-bead'
    ? getSystemGlazingConstructionRule({ systemId: args.system.id, nominalThicknessMm: glazingThicknessMm })
    : null
  const systemRecommendedProfileCode = glazingRule?.glazingBeadProfileCode ?? null
  const systemRecommendationStatus = args.kind !== 'glass-bead'
    ? 'not-applicable'
    : !glazingRule
      ? 'no-rule'
      : !args.profileCode
        ? 'rule-available'
        : args.profileCode === systemRecommendedProfileCode
          ? 'matched'
          : 'different'

  return {
    id: `${args.kind}:${args.targetId}`,
    kind: args.kind,
    targetId: args.targetId,
    targetLabelBg: args.targetLabelBg,
    profileCode: args.profileCode,
    profileRole: profile?.role ?? null,
    profileLabelBg: profile?.labelBg ?? null,
    visibleFaceMm: face.valueMm,
    visibleFaceReviewed: face.reviewed,
    reinforcementCode: reinforcement?.reinforcementCode ?? null,
    reinforcementThicknessMm: reinforcement?.thicknessMm ?? null,
    glazingThicknessMm,
    systemRecommendedProfileCode,
    systemRecommendationStatus,
    systemRuleSourceLabelBg: glazingRule?.source.labelBg ?? null,
    status: !args.required ? 'not-required' : args.profileCode ? 'resolved' : 'missing-profile',
  }
}

type ResolvedBoundarySupport =
  | { kind: 'frame'; id: 'frame' }
  | { kind: 'divider'; id: string; orientation: SystemDividerOrientation }

const EPSILON_MM = 0.25

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON_MM
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > EPSILON_MM
}

function findSupportForEdge(args: {
  field: ResolvedConstructionField
  edge: Edge
  construction: ConstructionModel
  dividers: readonly ResolvedConstructionDivider[]
}): ResolvedBoundarySupport | null {
  const { field, edge, construction, dividers } = args
  if (field.polygon) return null
  const interior = getFrameInteriorBounds(construction)
  const left = field.bounds.xMm
  const right = field.bounds.xMm + field.bounds.widthMm
  const top = field.bounds.yMm
  const bottom = field.bounds.yMm + field.bounds.heightMm

  if (edge === 'left' && nearlyEqual(left, interior.xMm)) return { kind: 'frame', id: 'frame' }
  if (edge === 'right' && nearlyEqual(right, interior.xMm + interior.widthMm)) return { kind: 'frame', id: 'frame' }
  if (edge === 'top' && nearlyEqual(top, interior.yMm)) return { kind: 'frame', id: 'frame' }
  if (edge === 'bottom' && nearlyEqual(bottom, interior.yMm + interior.heightMm)) return { kind: 'frame', id: 'frame' }

  for (const divider of dividers) {
    if (edge === 'left' || edge === 'right') {
      if (divider.axis !== 'vertical') continue
      if (!rangesOverlap(top, bottom, divider.startMm, divider.endMm)) continue
      const edgeCoordinate = edge === 'left' ? left : right
      const dividerBoundary = edge === 'left'
        ? divider.positionMm + divider.thicknessMm
        : divider.positionMm
      if (nearlyEqual(edgeCoordinate, dividerBoundary)) return { kind: 'divider', id: divider.id, orientation: 'vertical' }
    } else {
      if (divider.axis !== 'horizontal') continue
      if (!rangesOverlap(left, right, divider.startMm, divider.endMm)) continue
      const edgeCoordinate = edge === 'top' ? top : bottom
      const dividerBoundary = edge === 'top'
        ? divider.positionMm + divider.thicknessMm
        : divider.positionMm
      if (nearlyEqual(edgeCoordinate, dividerBoundary)) return { kind: 'divider', id: divider.id, orientation: 'horizontal' }
    }
  }

  return null
}

function buildJoint(args: {
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  productType: 'window' | 'door' | null
  field: ResolvedConstructionField
  edge: Edge
  support: ResolvedBoundarySupport
}): SystemDrivenJointReadModel {
  const { system, resolution, productType, field, edge, support } = args
  const supportAssignment = support.kind === 'frame'
    ? resolution.frame
    : resolution.dividers[support.id] ?? null
  const sashAssignment = resolution.fieldSashes[field.id] ?? null
  const supportProfileCode = supportAssignment?.profileCode ?? null
  const sashProfileCode = sashAssignment?.profileCode ?? null
  const supportProfile = findProfile(system, supportProfileCode)
  const sashProfile = findProfile(system, sashProfileCode)
  const supportFace = visibleFace(system.id, supportProfileCode)
  const sashFace = visibleFace(system.id, sashProfileCode)
  const boundaryRole: SystemDrivenBoundaryRole = support.kind === 'frame' ? 'frame-sash' : 'divider-sash'
  const boundaryLabelBg = support.kind === 'frame' ? 'Каса ↔ Крило' : 'Делител ↔ Крило'
  const supportRoleValid = support.kind === 'frame'
    ? supportProfile?.role === 'frame'
    : supportProfile?.role === 'mullion'
  const sashRoleValid = sashProfile?.role === 'sash' || sashProfile?.role === 'door-sash'
  const roleResolutionStatus = !supportProfileCode || !sashProfileCode
    ? 'missing-profile'
    : supportRoleValid && sashRoleValid
      ? 'resolved'
      : 'role-mismatch'
  const jointKind: ProfileJointKind = support.kind === 'frame' ? 'frame-sash' : 'mullion-sash'
  const evidenceRule = roleResolutionStatus === 'resolved' && supportProfileCode && sashProfileCode
    ? getProfileJointEvidenceRule({
        systemId: system.id,
        jointKind,
        supportProfileCode,
        sashProfileCode,
      })
    : undefined
  const evidenceRecord = roleResolutionStatus === 'resolved' && supportProfileCode && sashProfileCode
    ? getJointAssemblyEvidenceRecord({
        systemId: system.id,
        jointKind,
        supportProfileCode,
        sashProfileCode,
      })
    : undefined
  const reviewed = isJointAssemblyEvidenceReviewed(evidenceRecord)
  const systemRule = roleResolutionStatus === 'resolved'
    ? resolveSystemBoundaryRule({
        systemId: system.id,
        productType,
        jointKind,
        supportProfileCode,
        sashProfileCode,
        frameProfileCode: resolution.frame?.profileCode ?? null,
        edge,
        supportOrientation: support.kind === 'divider' ? support.orientation : null,
      })
    : null
  const libraryKey = roleResolutionStatus === 'resolved' && supportProfileCode && sashProfileCode
    ? `${system.id}:${jointKind}:${supportProfileCode}:${sashProfileCode}`
    : null
  const evidenceStatus = roleResolutionStatus === 'missing-profile'
    ? 'missing-profile'
    : roleResolutionStatus === 'role-mismatch'
      ? 'invalid-role'
      : reviewed
        ? 'verified'
        : 'missing-evidence'

  return {
    id: `${field.id}:${edge}:${support.kind}:${support.id}`,
    systemId: system.id,
    fieldId: field.id,
    fieldSequence: field.sequence,
    edge,
    supportKind: support.kind,
    supportId: support.id,
    supportLabelBg: support.kind === 'frame' ? 'Каса' : 'Делител',
    boundaryRole,
    boundaryLabelBg,
    jointKind,
    supportProfileCode,
    supportProfileRole: supportProfile?.role ?? null,
    supportVisibleFaceMm: supportFace.valueMm,
    supportVisibleFaceReviewed: supportFace.reviewed,
    sashProfileCode,
    sashProfileRole: sashProfile?.role ?? null,
    sashVisibleFaceMm: sashFace.valueMm,
    sashVisibleFaceReviewed: sashFace.reviewed,
    roleResolutionStatus,
    systemRuleStatus: systemRule ? 'available' : 'missing',
    systemRule,
    libraryKey,
    evidenceStatus,
    geometryStatus: reviewed ? 'available' : 'locked',
    noteBg: evidenceStatus === 'missing-profile'
      ? 'Първо трябва да са избрани реалните профили на двете страни на границата.'
      : evidenceStatus === 'invalid-role'
        ? 'Профилите са избрани, но каталожните им роли не съвпадат с конструктивната граница. FacadeFlow не допуска сглобка, докато ролите не бъдат коригирани.'
        : reviewed
          ? 'Има проверено доказателство за точната двойка профили и възелът може да се визуализира като потвърдена сглобка.'
          : systemRule
            ? `${systemRule.noteBg} Точната монтажна геометрия остава заключена до проверено доказателство.`
            : evidenceRule?.noteBg ?? 'Ролите и профилите са определени, но точната монтажна геометрия на тази двойка още не е доказана.',
  }
}

function boundaryCoverageFromJoint(joint: SystemDrivenJointReadModel): SystemDrivenBoundaryCoverageReadModel {
  const base = {
    id: `boundary:${joint.fieldId}:${joint.edge}`,
    version: ASSEMBLY_BOUNDARY_COVERAGE_VERSION,
    fieldId: joint.fieldId,
    fieldSequence: joint.fieldSequence,
    edge: joint.edge,
    jointId: joint.id,
    supportKind: joint.supportKind,
    supportId: joint.supportId,
    supportLabelBg: joint.supportLabelBg,
    supportProfileCode: joint.supportProfileCode,
    sashProfileCode: joint.sashProfileCode,
  } as const

  if (joint.roleResolutionStatus === 'missing-profile') {
    return {
      ...base,
      status: 'missing-profile',
      technicalSectionStatus: 'not-applicable',
      systemRuleStatus: 'not-applicable',
      noteBg: 'Границата е намерена, но липсва реален профилен избор за опората или крилото.',
    }
  }

  if (joint.roleResolutionStatus === 'role-mismatch') {
    return {
      ...base,
      status: 'invalid-role',
      technicalSectionStatus: 'not-applicable',
      systemRuleStatus: 'not-applicable',
      noteBg: 'Границата е намерена, но избраните каталожни роли не съвпадат с конструктивната роля.',
    }
  }

  const supportSection = getTechnicalProfileSection(joint.systemId, joint.supportProfileCode)
  const sashSection = getTechnicalProfileSection(joint.systemId, joint.sashProfileCode)
  if (!supportSection || !sashSection) {
    const missing = [
      !supportSection ? joint.supportProfileCode : null,
      !sashSection ? joint.sashProfileCode : null,
    ].filter((value): value is string => Boolean(value))
    return {
      ...base,
      status: 'missing-technical-section',
      technicalSectionStatus: 'missing',
      systemRuleStatus: joint.systemRuleStatus,
      noteBg: `Няма проверено техническо сечение за ${missing.join(' + ') || 'един от профилите'}. FacadeFlow не създава заместителна геометрия.`,
    }
  }

  if (joint.systemRuleStatus !== 'available') {
    return {
      ...base,
      status: 'missing-system-rule',
      technicalSectionStatus: 'resolved',
      systemRuleStatus: 'missing',
      noteBg: 'Техническите сечения са налични, но за тази двойка и страна няма системно конструктивно правило.',
    }
  }

  return {
    ...base,
    status: 'resolved',
    technicalSectionStatus: 'resolved',
    systemRuleStatus: 'available',
    noteBg: 'Границата, реалните профили, техническите сечения и системното правило са разрешени за системен преглед.',
  }
}

function unresolvedBoundaryCoverage(
  field: ResolvedConstructionField,
  edge: Edge,
): SystemDrivenBoundaryCoverageReadModel {
  return {
    id: `boundary:${field.id}:${edge}`,
    version: ASSEMBLY_BOUNDARY_COVERAGE_VERSION,
    fieldId: field.id,
    fieldSequence: field.sequence,
    edge,
    status: 'support-unresolved',
    jointId: null,
    supportKind: null,
    supportId: null,
    supportLabelBg: null,
    supportProfileCode: null,
    sashProfileCode: null,
    technicalSectionStatus: 'not-applicable',
    systemRuleStatus: 'not-applicable',
    noteBg: 'FacadeFlow очаква граница на отваряемото ПОЛЕ, но не може да я свърже безопасно с каса или прав делител. Границата остава блокирана.',
  }
}


function buildFieldGlazingContext(args: {
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
  offerDefaultGlazingId: string | null
  field: ResolvedConstructionField
}): SystemDrivenFieldGlazingContextReadModel | null {
  const { system, resolution, offerDefaultGlazingId, field } = args
  if (field.fieldType === null) return null

  const humanThicknessMm = getFieldHumanGlazingThicknessMm(resolution, field.id)
  const effectiveSpecification = getEffectiveFieldGlazingSpecification(resolution, offerDefaultGlazingId, field.id)
  const glazingThicknessMm = humanThicknessMm ?? effectiveSpecification.thicknessMm
  const glazingThicknessSource = humanThicknessMm !== null ? 'human-field' : effectiveSpecification.source
  const structuralContext = getFieldGlazingBeadResolutionContext(resolution, field)
  const glazingBeadProfileCode = resolution.fieldGlazingBeads[field.id]?.profileCode ?? null
  const compatibility = evaluateGlazingBeadCompatibility(
    system,
    glazingThicknessMm,
    glazingBeadProfileCode,
    structuralContext,
  )
  const inputStatus = compatibility.status === 'invalid'
    ? 'invalid'
    : compatibility.status === 'missing-data'
      ? 'missing'
      : 'complete'

  return {
    id: `field-glazing:${field.id}`,
    version: ASSEMBLY_FIELD_GLAZING_CONTEXT_VERSION,
    fieldId: field.id,
    fieldSequence: field.sequence,
    fieldType: field.fieldType,
    glazingThicknessMm,
    glazingThicknessSource,
    baseProfileCode: structuralContext.baseProfileCode ?? null,
    baseProfileRole: structuralContext.baseProfileRole ?? null,
    glazingBeadProfileCode,
    inputStatus,
    compatibilityStatus: compatibility.status,
    compatibilityCode: compatibility.code,
    noteBg: compatibility.noteBg,
    exactGlazingInsetKnown: false,
  }
}

function buildJointGlazingLink(
  joint: SystemDrivenJointReadModel,
  fieldContext: SystemDrivenFieldGlazingContextReadModel | null,
): SystemDrivenJointGlazingLinkReadModel {
  const base = {
    id: `joint-glazing:${joint.id}`,
    version: ASSEMBLY_JOINT_GLAZING_LINK_VERSION,
    jointId: joint.id,
    fieldId: joint.fieldId,
    fieldSequence: joint.fieldSequence,
    edge: joint.edge,
    fieldGlazingContextId: fieldContext?.id ?? null,
    glazingThicknessMm: fieldContext?.glazingThicknessMm ?? null,
    glazingBeadProfileCode: fieldContext?.glazingBeadProfileCode ?? null,
    baseProfileCode: fieldContext?.baseProfileCode ?? null,
    jointSashProfileCode: joint.sashProfileCode,
    baseProfileMatchesJoint: fieldContext && fieldContext.baseProfileCode && joint.sashProfileCode
      ? fieldContext.baseProfileCode === joint.sashProfileCode
      : null,
    inputStatus: fieldContext?.inputStatus ?? 'missing-context' as const,
    compatibilityStatus: fieldContext?.compatibilityStatus ?? null,
    compatibilityCode: fieldContext?.compatibilityCode ?? null,
    exactGlazingInsetKnown: false as const,
    exactGlazingSeatKnown: false as const,
    exactGlassCutDimensionsKnown: false as const,
  }

  if (!fieldContext) {
    return {
      ...base,
      linkStatus: 'missing-field-context',
      noteBg: 'Възелът е разрешен като профилна граница, но няма FIELD glazing context. Остъкляването не се свързва и не се измисля.',
    }
  }

  if (!fieldContext.baseProfileCode || !joint.sashProfileCode || fieldContext.baseProfileCode !== joint.sashProfileCode) {
    return {
      ...base,
      linkStatus: 'base-profile-mismatch',
      noteBg: `FIELD glazing base ${fieldContext.baseProfileCode ?? '—'} не съвпада с профила на крилото във възела ${joint.sashProfileCode ?? '—'}. Връзката е блокирана.`,
    }
  }

  if (fieldContext.inputStatus === 'invalid') {
    return {
      ...base,
      linkStatus: 'invalid-input',
      noteBg: 'FIELD glazing context е свързан с правилното крило, но входът е невалиден. Не се създава glazing geometry.',
    }
  }

  if (fieldContext.inputStatus === 'missing') {
    return {
      ...base,
      linkStatus: 'missing-input',
      noteBg: 'FIELD glazing context е свързан с правилното крило, но липсва дебелина и/или стъклодържател.',
    }
  }

  if (fieldContext.compatibilityStatus === 'valid') {
    return {
      ...base,
      linkStatus: 'linked-confirmed',
      noteBg: 'FIELD glazing context е свързан към конкретния възел и bead-to-base съвместимостта е потвърдена от наличното правило.',
    }
  }

  return {
    ...base,
    linkStatus: 'linked-unconfirmed',
    noteBg: 'FIELD glazing context е свързан към конкретния възел чрез същия sash профил. Bead-to-base съвместимостта остава за проверка; монтажна позиция не се извежда.',
  }
}

function buildJointGlazingEvidenceStatus(
  system: ProfileSystemCatalogEntry,
  link: SystemDrivenJointGlazingLinkReadModel,
): SystemDrivenJointGlazingEvidenceReadModel {
  const linked = link.linkStatus === 'linked-confirmed' || link.linkStatus === 'linked-unconfirmed'
  const catalogueResolution = resolveGlazingEvidenceContext(system, link.glazingThicknessMm)
  const selectedCandidate = linked && link.glazingBeadProfileCode
    ? catalogueResolution.candidates.find((candidate) => candidate.beadCode === link.glazingBeadProfileCode) ?? null
    : null
  const catalogueThicknessEvidenceStatus = !linked
    ? 'not-applicable' as const
    : selectedCandidate
      ? 'supported' as const
      : 'missing' as const
  const beadToBaseEvidenceStatus = link.compatibilityStatus === 'valid'
    ? 'reviewed' as const
    : link.compatibilityStatus === 'unconfirmed'
      ? 'unconfirmed' as const
      : link.compatibilityStatus === 'invalid'
        ? 'invalid' as const
        : 'missing' as const

  const evidenceTier: SystemDrivenGlazingEvidenceTier = !linked
    ? 'blocked'
    : beadToBaseEvidenceStatus === 'reviewed'
      ? 'compatibility-reviewed'
      : catalogueThicknessEvidenceStatus === 'supported'
        ? 'catalogue-supported'
        : 'input-context'

  const catalogueEvidenceSourceLabel = selectedCandidate
    ? `${selectedCandidate.evidence.documentTitle} · стр. ${selectedCandidate.evidence.page} · ${selectedCandidate.evidence.section}`
    : null

  let noteBg: string
  if (!linked) {
    noteBg = `Glazing evidence gate е блокиран от 01D linkage: ${link.linkStatus}. Не се повишава ниво на знание.`
  } else if (beadToBaseEvidenceStatus === 'reviewed') {
    noteBg = 'Входният контекст и bead-to-base съвместимостта са доказани. Монтажната позиция, glazing inset, seat и glass cut остават отделно недоказани.'
  } else if (catalogueThicknessEvidenceStatus === 'supported') {
    noteBg = `Каталогът доказва ${link.glazingBeadProfileCode} за ${link.glazingThicknessMm} mm като номинална bead/thickness връзка. Това НЕ доказва съвместимост с base профила или позиция в разреза.`
  } else {
    noteBg = 'FIELD glazing context е наличен, но няма каталогово доказателство за избрания bead/thickness чифт. Не се извежда конструктивна съвместимост.'
  }

  return {
    id: `joint-glazing-evidence:${link.jointId}`,
    version: ASSEMBLY_GLAZING_EVIDENCE_STATUS_VERSION,
    jointId: link.jointId,
    fieldId: link.fieldId,
    fieldSequence: link.fieldSequence,
    edge: link.edge,
    jointGlazingLinkId: link.id,
    evidenceTier,
    inputContextStatus: link.inputStatus,
    selectedBeadProfileCode: link.glazingBeadProfileCode,
    glazingThicknessMm: link.glazingThicknessMm,
    catalogueThicknessEvidenceStatus,
    catalogueEvidenceSourceLabel,
    beadToBaseEvidenceStatus,
    placementEvidenceStatus: 'unknown',
    glassCutEvidenceStatus: 'unknown',
    automaticGeometryAllowed: false,
    machineReady: false,
    noteBg,
  }
}

function buildGlazingEvidenceGaps(args: {
  systemId: string
  fieldGlazingContexts: readonly SystemDrivenFieldGlazingContextReadModel[]
  jointGlazingLinks: readonly SystemDrivenJointGlazingLinkReadModel[]
  jointGlazingEvidence: readonly SystemDrivenJointGlazingEvidenceReadModel[]
}): readonly SystemDrivenGlazingEvidenceGapReadModel[] {
  const gaps = new Map<string, {
    kind: SystemDrivenGlazingEvidenceGapKind
    fieldIds: Set<string>
    fieldSequences: Set<number>
    jointIds: Set<string>
    glazingThicknessMm: number | null
    beadProfileCode: string | null
    baseProfileCode: string | null
    reasonBg: string
    requiredEvidenceBg: string
  }>()

  const add = (key: string, data: {
    kind: SystemDrivenGlazingEvidenceGapKind
    fieldId?: string | null
    fieldSequence?: number | null
    jointId?: string | null
    glazingThicknessMm: number | null
    beadProfileCode: string | null
    baseProfileCode: string | null
    reasonBg: string
    requiredEvidenceBg: string
  }) => {
    let gap = gaps.get(key)
    if (!gap) {
      gap = {
        kind: data.kind,
        fieldIds: new Set(),
        fieldSequences: new Set(),
        jointIds: new Set(),
        glazingThicknessMm: data.glazingThicknessMm,
        beadProfileCode: data.beadProfileCode,
        baseProfileCode: data.baseProfileCode,
        reasonBg: data.reasonBg,
        requiredEvidenceBg: data.requiredEvidenceBg,
      }
      gaps.set(key, gap)
    }
    if (data.fieldId) gap.fieldIds.add(data.fieldId)
    if (data.fieldSequence !== null && data.fieldSequence !== undefined) gap.fieldSequences.add(data.fieldSequence)
    if (data.jointId) gap.jointIds.add(data.jointId)
  }

  for (const context of args.fieldGlazingContexts) {
    if (context.inputStatus === 'complete') continue
    add(`field-input:${context.fieldId}`, {
      kind: 'field-input',
      fieldId: context.fieldId,
      fieldSequence: context.fieldSequence,
      glazingThicknessMm: context.glazingThicknessMm,
      beadProfileCode: context.glazingBeadProfileCode,
      baseProfileCode: context.baseProfileCode,
      reasonBg: context.inputStatus === 'invalid'
        ? `ПОЛЕ ${context.fieldSequence} има невалиден glazing input.`
        : `ПОЛЕ ${context.fieldSequence} няма пълен glazing input.`,
      requiredEvidenceBg: 'Попълни човешки контролирания вход: дебелина, базов профил и стъклодържател. Това не е автоматичен избор.',
    })
  }

  const linkByJointId = new Map(args.jointGlazingLinks.map((link) => [link.jointId, link]))
  for (const evidence of args.jointGlazingEvidence) {
    const link = linkByJointId.get(evidence.jointId)
    if (!link) continue
    const shared = {
      fieldId: evidence.fieldId,
      fieldSequence: evidence.fieldSequence,
      jointId: evidence.jointId,
      glazingThicknessMm: evidence.glazingThicknessMm,
      beadProfileCode: evidence.selectedBeadProfileCode,
      baseProfileCode: link.baseProfileCode,
    }

    if (evidence.catalogueThicknessEvidenceStatus === 'missing') {
      add(`catalogue:${evidence.selectedBeadProfileCode ?? 'none'}:${evidence.glazingThicknessMm ?? 'none'}`, {
        kind: 'catalogue-bead-thickness',
        ...shared,
        reasonBg: `Липсва каталогово доказателство за bead ${evidence.selectedBeadProfileCode ?? '—'} и ${evidence.glazingThicknessMm ?? '—'} mm.`,
        requiredEvidenceBg: 'Нужен е source-bound каталогов запис, който директно свързва конкретния bead с номиналната дебелина.',
      })
    }

    if (evidence.beadToBaseEvidenceStatus === 'unconfirmed') {
      add(`compatibility:${evidence.selectedBeadProfileCode ?? 'none'}:${link.baseProfileCode ?? 'none'}`, {
        kind: 'bead-base-compatibility',
        ...shared,
        reasonBg: `Каталоговият bead/thickness match не доказва ${evidence.selectedBeadProfileCode ?? '—'} ↔ ${link.baseProfileCode ?? '—'}.`,
        requiredEvidenceBg: 'Нужно е reviewed правило или техническо доказателство, което изрично свързва стъклодържателя с базовия профил.',
      })
    }

    if (evidence.placementEvidenceStatus === 'unknown') {
      add(`placement:${link.baseProfileCode ?? 'none'}:${evidence.selectedBeadProfileCode ?? 'none'}:${evidence.glazingThicknessMm ?? 'none'}`, {
        kind: 'placement-evidence',
        ...shared,
        reasonBg: 'Glazing inset / seat / bead placement не са доказани за този профилен контекст.',
        requiredEvidenceBg: 'Нужно е reviewed техническо сечение или измерено правило за точната позиция в разреза. Без него не се рисува автоматична glazing geometry.',
      })
    }

    if (evidence.glassCutEvidenceStatus === 'unknown') {
      add(`glass-cut:${link.baseProfileCode ?? 'none'}:${evidence.selectedBeadProfileCode ?? 'none'}:${evidence.glazingThicknessMm ?? 'none'}`, {
        kind: 'glass-cut-rule',
        ...shared,
        reasonBg: 'Няма reviewed правило, което превръща геометрията на ПОЛЕТО в размер за рязане на стъклопакета.',
        requiredEvidenceBg: 'Нужна е отделна reviewed формула/корекция с доказан обхват. Референтна стойност сама по себе си не отключва glass cut.',
      })
    }
  }

  return [...gaps.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, gap]) => ({
      id: `glazing-gap:${key}`,
      version: ASSEMBLY_GLAZING_EVIDENCE_GAP_VERSION,
      kind: gap.kind,
      status: 'open' as const,
      systemId: args.systemId,
      fieldIds: [...gap.fieldIds],
      fieldSequences: [...gap.fieldSequences].sort((a, b) => a - b),
      jointIds: [...gap.jointIds],
      occurrenceCount: gap.jointIds.size > 0 ? gap.jointIds.size : gap.fieldIds.size,
      glazingThicknessMm: gap.glazingThicknessMm,
      beadProfileCode: gap.beadProfileCode,
      baseProfileCode: gap.baseProfileCode,
      reasonBg: gap.reasonBg,
      requiredEvidenceBg: gap.requiredEvidenceBg,
      automaticGeometryAllowed: false as const,
      machineReady: false as const,
    }))
}

function findHumanReviewedSectionCandidate(args: {
  snapshot: ProjectSnapshot | null
  moduleId: string | null
  candidateId: string
  gapKind: 'bead-base-compatibility' | 'placement-evidence'
}): { evidenceId: string | null; confirmationId: string | null; reviewerLabel: string | null; reviewedAt: string | null } {
  if (!args.snapshot || !args.moduleId) return { evidenceId: null, confirmationId: null, reviewerLabel: null, reviewedAt: null }
  const predicate = args.gapKind === 'bead-base-compatibility'
    ? 'official-sectional-bead-base-pairing'
    : 'official-sectional-bead-placement'
  const evidence = Object.values(args.snapshot.assurance.currentEvidenceByStatementKey)
    .map((id) => args.snapshot!.assurance.evidenceById[id])
    .find((entry) => entry
      && entry.statement.predicate === predicate
      && entry.statement.scope.kind === 'module'
      && entry.statement.scope.moduleId === args.moduleId
      && entry.statement.scope.target.kind === 'module'
      && entry.statement.parameters.sourceCandidateId === args.candidateId)
  if (!evidence) return { evidenceId: null, confirmationId: null, reviewerLabel: null, reviewedAt: null }
  const assessment = assessStatement(args.snapshot, evidence.id)
  const confirmations = assessment.authority.humanConfirmationIds
    .map((id) => args.snapshot!.assurance.confirmationsById[id])
    .filter((entry) => entry?.intent === 'technical-review-attestation')
    .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
  const confirmation = confirmations[0] ?? null
  return {
    evidenceId: evidence.id,
    confirmationId: confirmation?.id ?? null,
    reviewerLabel: confirmation?.actor.label ?? null,
    reviewedAt: confirmation?.confirmedAt ?? null,
  }
}

function buildGlazingEvidenceReviewItems(args: {
  systemId: string
  gaps: readonly SystemDrivenGlazingEvidenceGapReadModel[]
  snapshot?: ProjectSnapshot | null
  moduleId?: string | null
}): readonly SystemDrivenGlazingEvidenceReviewItemReadModel[] {
  return args.gaps.map((gap) => {
    const glazingRule = gap.glazingThicknessMm !== null
      ? getSystemGlazingConstructionRule({ systemId: args.systemId, nominalThicknessMm: gap.glazingThicknessMm })
      : null

    if (gap.kind === 'field-input') {
      return {
        id: `glazing-review:${gap.id}`,
        version: ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION,
        gapId: gap.id,
        gapKind: gap.kind,
        reviewState: 'human-input-required' as const,
        occurrenceCount: gap.occurrenceCount,
        fieldSequences: gap.fieldSequences,
        glazingThicknessMm: gap.glazingThicknessMm,
        beadProfileCode: gap.beadProfileCode,
        baseProfileCode: gap.baseProfileCode,
        candidateSourceId: null,
        candidateSourceLabelBg: null,
        candidateSourceUrl: null,
        candidateSourceOpenUrl: null,
        candidateSourcePage: null,
        candidateSourcePdfViewerPage: null,
        candidateSourceSection: null,
        candidateSourceLocatorBg: null,
        candidateSourceVerifiedLocatorBg: null,
        candidateSummaryBg: null,
        acceptedEvidenceStatus: 'none' as const,
        candidateEvidenceId: null,
        reviewConfirmationId: null,
        reviewedByLabel: null,
        reviewedAt: null,
        requiredReviewBg: 'Това е липсващ човешки вход, не липсващо системно правило. Попълва се от оператора и не може да се затвори автоматично.',
        rulePromotionAllowed: false as const,
        automaticGeometryAllowed: false as const,
        machineReady: false as const,
      }
    }

    if (gap.kind === 'glass-cut-rule' && glazingRule) {
      return {
        id: `glazing-review:${gap.id}`,
        version: ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION,
        gapId: gap.id,
        gapKind: gap.kind,
        reviewState: 'reference-candidate' as const,
        occurrenceCount: gap.occurrenceCount,
        fieldSequences: gap.fieldSequences,
        glazingThicknessMm: gap.glazingThicknessMm,
        beadProfileCode: gap.beadProfileCode,
        baseProfileCode: gap.baseProfileCode,
        candidateSourceId: glazingRule.id,
        candidateSourceLabelBg: glazingRule.source.labelBg,
        candidateSourceUrl: null,
        candidateSourceOpenUrl: null,
        candidateSourcePage: null,
        candidateSourcePdfViewerPage: null,
        candidateSourceSection: glazingRule.source.dataset,
        candidateSourceLocatorBg: `${glazingRule.glazingBeadProfileCode} · ${glazingRule.nominalThicknessMm} mm · ${glazingRule.referenceWidthCorrectionMm}/${glazingRule.referenceHeightCorrectionMm}`,
        candidateSourceVerifiedLocatorBg: null,
        candidateSummaryBg: `Има референтна корекция ${glazingRule.referenceWidthCorrectionMm} / ${glazingRule.referenceHeightCorrectionMm} mm за ${glazingRule.nominalThicknessMm} mm, но тя не е reviewed glass-cut формула и няма доказан обхват.`,
        acceptedEvidenceStatus: 'none' as const,
        candidateEvidenceId: null,
        reviewConfirmationId: null,
        reviewedByLabel: null,
        reviewedAt: null,
        requiredReviewBg: 'Нужен е human-reviewed източник, който потвърждава формулата, посоките, референтната база и обхвата. До тогава 12/12 остава само кандидат.',
        rulePromotionAllowed: false as const,
        automaticGeometryAllowed: false as const,
        machineReady: false as const,
      }
    }

    const acquiredCandidate = (gap.kind === 'bead-base-compatibility' || gap.kind === 'placement-evidence')
      ? findPrelude60SectionalEvidenceCandidate({
        systemId: args.systemId,
        kind: gap.kind,
        baseProfileCode: gap.baseProfileCode,
        beadCode: gap.beadProfileCode,
        glazingThicknessMm: gap.glazingThicknessMm,
      })
      : undefined

    if (acquiredCandidate) {
      const humanReview = findHumanReviewedSectionCandidate({
        snapshot: args.snapshot ?? null,
        moduleId: args.moduleId ?? null,
        candidateId: acquiredCandidate.id,
        gapKind: gap.kind as 'bead-base-compatibility' | 'placement-evidence',
      })
      return {
        id: `glazing-review:${gap.id}`,
        version: ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION,
        gapId: gap.id,
        gapKind: gap.kind,
        reviewState: 'reference-candidate' as const,
        occurrenceCount: gap.occurrenceCount,
        fieldSequences: gap.fieldSequences,
        glazingThicknessMm: gap.glazingThicknessMm,
        beadProfileCode: gap.beadProfileCode,
        baseProfileCode: gap.baseProfileCode,
        candidateSourceId: acquiredCandidate.id,
        candidateSourceLabelBg: acquiredCandidate.sourceLabelBg,
        candidateSourceUrl: acquiredCandidate.sourceUrl,
        candidateSourceOpenUrl: acquiredCandidate.sourceOpenUrl,
        candidateSourcePage: acquiredCandidate.sourcePage,
        candidateSourcePdfViewerPage: acquiredCandidate.sourcePdfViewerPage,
        candidateSourceSection: acquiredCandidate.sourceSection,
        candidateSourceLocatorBg: acquiredCandidate.sourceLocatorBg,
        candidateSourceVerifiedLocatorBg: acquiredCandidate.sourceVerifiedLocatorBg,
        candidateSummaryBg: acquiredCandidate.candidateSummaryBg,
        acceptedEvidenceStatus: humanReview.confirmationId ? 'reviewed' as const : 'none' as const,
        candidateEvidenceId: humanReview.evidenceId,
        reviewConfirmationId: humanReview.confirmationId,
        reviewedByLabel: humanReview.reviewerLabel,
        reviewedAt: humanReview.reviewedAt,
        requiredReviewBg: gap.kind === 'bead-base-compatibility'
          ? 'Намерена е официална source-bound техническа скица с точните кодове 482.05 + 482.15 при 24 mm. Нужен е explicit human review преди да се приеме доказателството за тази конфигурация.'
          : 'Намерена е официална размерена техническа скица scale 1:1. Нужен е human review на идентичността, размерната база, посоката и обхвата преди да се приеме placement evidence.',
        rulePromotionAllowed: false as const,
        automaticGeometryAllowed: false as const,
        machineReady: false as const,
      }
    }

    const requiredReviewBg = gap.kind === 'bead-base-compatibility'
      ? 'Няма qualified source-bound кандидат, който изрично доказва тази bead ↔ base двойка. Нужна е reviewed каталогова/техническа скица или измерено правило.'
      : gap.kind === 'placement-evidence'
        ? 'Няма qualified reviewed кандидат за inset / seat / bead placement в този профилен контекст. Нужна е техническа скица с доказана идентичност и размерна база.'
        : 'Няма достатъчен source-bound кандидат за това доказателство. Нужен е human review преди създаване на правило.'

    return {
      id: `glazing-review:${gap.id}`,
      version: ASSEMBLY_GLAZING_EVIDENCE_REVIEW_GATE_VERSION,
      gapId: gap.id,
      gapKind: gap.kind,
      reviewState: 'evidence-required' as const,
      occurrenceCount: gap.occurrenceCount,
      fieldSequences: gap.fieldSequences,
      glazingThicknessMm: gap.glazingThicknessMm,
      beadProfileCode: gap.beadProfileCode,
      baseProfileCode: gap.baseProfileCode,
      candidateSourceId: null,
      candidateSourceLabelBg: null,
      candidateSourceUrl: null,
      candidateSourceOpenUrl: null,
      candidateSourcePage: null,
      candidateSourcePdfViewerPage: null,
      candidateSourceSection: null,
      candidateSourceLocatorBg: null,
      candidateSourceVerifiedLocatorBg: null,
      candidateSummaryBg: null,
      acceptedEvidenceStatus: 'none' as const,
      candidateEvidenceId: null,
      reviewConfirmationId: null,
      reviewedByLabel: null,
      reviewedAt: null,
      requiredReviewBg,
      rulePromotionAllowed: false as const,
      automaticGeometryAllowed: false as const,
      machineReady: false as const,
    }
  })
}

function buildJointLibrary(joints: readonly SystemDrivenJointReadModel[]): readonly SystemDrivenJointLibraryReadModel[] {
  const groups = new Map<string, SystemDrivenJointReadModel[]>()
  for (const joint of joints) {
    if (!joint.libraryKey || !joint.supportProfileCode || !joint.sashProfileCode) continue
    const group = groups.get(joint.libraryKey) ?? []
    group.push(joint)
    groups.set(joint.libraryKey, group)
  }

  return [...groups.entries()].map(([key, occurrences]): SystemDrivenJointLibraryReadModel => {
    const first = occurrences[0]
    const anyRule = occurrences.find((entry) => entry.systemRule)?.systemRule ?? null
    const exactGeometryVerified = occurrences.some((entry) => entry.evidenceStatus === 'verified')
    return {
      key,
      boundaryLabelBg: first.boundaryLabelBg,
      jointKind: first.jointKind,
      supportProfileCode: first.supportProfileCode!,
      sashProfileCode: first.sashProfileCode!,
      occurrenceJointIds: occurrences.map((entry) => entry.id),
      occurrenceCount: occurrences.length,
      fieldSequences: [...new Set(occurrences.map((entry) => entry.fieldSequence))].sort((a, b) => a - b),
      edges: [...new Set(occurrences.map((entry) => entry.edge))],
      systemRuleStatus: anyRule ? 'available' : 'missing',
      systemRuleSourceLabelBg: anyRule?.source.labelBg ?? null,
      exactGeometryStatus: exactGeometryVerified ? 'verified' : 'missing',
      noteBg: anyRule
        ? 'Един системен тип възел се използва на всички съответстващи граници. Ориентацията на конкретната граница определя коя странична корекция се прилага.'
        : 'Двойката профили е разпозната, но за нея още няма системно конструктивно правило в библиотеката.',
    }
  }).sort((a, b) => a.boundaryLabelBg.localeCompare(b.boundaryLabelBg, 'bg'))
}

export function buildSystemDrivenModuleReadModel(args: {
  moduleId?: string | null
  moduleSequence?: number | null
  productType: 'window' | 'door' | null
  system: ProfileSystemCatalogEntry | null
  construction: ConstructionModel | null
  resolution: ModuleProfileResolution | null
  offerDefaultGlazingId?: string | null
  assuranceSnapshot?: ProjectSnapshot | null
}): SystemDrivenModuleReadModel {
  const { moduleId = null, moduleSequence = null, productType, system, construction, resolution, offerDefaultGlazingId = null, assuranceSnapshot = null } = args
  if (!system || !construction || !resolution || resolution.profileSystemId !== system.id) {
    return {
      version: SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION,
      moduleId,
      moduleSequence,
      productType,
      systemId: system?.id ?? resolution?.profileSystemId ?? null,
      systemLabel: system ? `${system.manufacturer} ${system.name}` : 'Не е избрана система',
      constructionReady: Boolean(construction),
      profileResolutionReady: Boolean(system && resolution && resolution.profileSystemId === system.id),
      layout: null,
      components: [],
      joints: [],
      boundaryCoverage: [],
      fieldGlazingContexts: [],
      jointGlazingLinks: [],
      jointGlazingEvidence: [],
      glazingEvidenceGaps: [],
      glazingEvidenceReviewItems: [],
      jointLibrary: [],
      resolvedComponentCount: 0,
      requiredComponentCount: 0,
      verifiedJointCount: 0,
      requiredJointCount: 0,
      uniqueJointTypeCount: 0,
      systemRuleJointCount: 0,
      systemRuleJointTypeCount: 0,
      expectedBoundaryCount: 0,
      resolvedBoundaryCount: 0,
      technicalReadyBoundaryCount: 0,
      blockedBoundaryCount: 0,
      boundaryCoverageComplete: true,
      glazingFieldCount: 0,
      glazingInputCompleteCount: 0,
      glazingMissingInputCount: 0,
      glazingInvalidInputCount: 0,
      glazingUnconfirmedCompatibilityCount: 0,
      jointGlazingLinkCount: 0,
      jointGlazingLinkedCount: 0,
      jointGlazingBlockedCount: 0,
      jointGlazingUnconfirmedCount: 0,
      glazingEvidenceCount: 0,
      glazingEvidenceCatalogueSupportedCount: 0,
      glazingEvidenceCompatibilityReviewedCount: 0,
      glazingEvidencePlacementReviewedCount: 0,
      glazingEvidenceBlockedCount: 0,
      glazingEvidenceOpenGapCount: 0,
      glazingEvidenceReviewCandidateCount: 0,
      glazingEvidenceReviewedCount: 0,
      machineReady: false,
    }
  }

  const topology = resolveConstructionTopology(construction)
  const frameProfileCode = resolution.frame?.profileCode ?? null
  const frameFace = visibleFace(system.id, frameProfileCode)
  const layout: SystemDrivenModuleLayoutReadModel = {
    widthMm: construction.frame.widthMm,
    heightMm: construction.frame.heightMm,
    schematicFrameFaceMm: Number(construction.frameFaceMm) > 0 ? Number(construction.frameFaceMm) : 60,
    systemFrameVisibleFaceMm: frameFace.valueMm,
    systemFrameVisibleFaceReviewed: frameFace.reviewed,
    fields: topology.fields.map((field) => ({
      id: field.id,
      sequence: field.sequence,
      fieldType: field.fieldType,
      xMm: field.bounds.xMm,
      yMm: field.bounds.yMm,
      widthMm: field.bounds.widthMm,
      heightMm: field.bounds.heightMm,
    })),
    dividers: topology.dividers.map((divider) => {
      const profileCode = resolution.dividers[divider.id]?.profileCode ?? null
      const dividerFace = visibleFace(system.id, profileCode)
      return {
        id: divider.id,
        axis: divider.axis,
        positionMm: divider.positionMm,
        startMm: divider.startMm,
        endMm: divider.endMm,
        schematicFaceMm: divider.thicknessMm,
        systemVisibleFaceMm: dividerFace.valueMm,
        systemVisibleFaceReviewed: dividerFace.reviewed,
      }
    }),
    angledDividerCount: topology.angledDividers.length,
  }
  const components: SystemDrivenComponentReadModel[] = []
  components.push(component({
    system,
    resolution,
    kind: 'frame',
    targetId: 'frame',
    targetLabelBg: 'Каса',
    profileCode: resolution.frame?.profileCode ?? null,
    required: true,
    reinforcementTargetKey: getReinforcementTargetKey({ kind: 'frame', id: 'frame' }),
  }))

  for (const divider of [...topology.dividers, ...topology.angledDividers]) {
    components.push(component({
      system,
      resolution,
      kind: 'divider',
      targetId: divider.id,
      targetLabelBg: `Делител ${divider.id}`,
      profileCode: resolution.dividers[divider.id]?.profileCode ?? null,
      required: true,
      reinforcementTargetKey: getReinforcementTargetKey({ kind: 'divider', id: divider.id }),
    }))
  }

  for (const field of topology.fields) {
    const sashRequired = field.fieldType === 'operable'
    components.push(component({
      system,
      resolution,
      kind: 'sash',
      targetId: field.id,
      targetLabelBg: `Крило · ПОЛЕ ${field.sequence}`,
      profileCode: resolution.fieldSashes[field.id]?.profileCode ?? null,
      required: sashRequired,
      reinforcementTargetKey: getReinforcementTargetKey({ kind: 'field-sash', id: field.id }),
    }))

    const beadRequired = field.fieldType !== null
    const glazingThicknessMm = getEffectiveFieldGlazingThicknessMm(resolution, offerDefaultGlazingId, field.id)
    components.push(component({
      system,
      resolution,
      kind: 'glass-bead',
      targetId: field.id,
      targetLabelBg: `Стъклодържател · ПОЛЕ ${field.sequence}`,
      profileCode: resolution.fieldGlazingBeads[field.id]?.profileCode ?? null,
      required: beadRequired,
      glazingThicknessMm,
    }))
  }

  const fieldGlazingContexts = topology.fields
    .map((field) => buildFieldGlazingContext({ system, resolution, offerDefaultGlazingId, field }))
    .filter((entry): entry is SystemDrivenFieldGlazingContextReadModel => entry !== null)

  const joints: SystemDrivenJointReadModel[] = []
  const boundaryCoverage: SystemDrivenBoundaryCoverageReadModel[] = []
  for (const field of topology.fields) {
    if (field.fieldType !== 'operable') continue
    for (const edge of ['left', 'right', 'top', 'bottom'] as const) {
      const support = findSupportForEdge({
        field,
        edge,
        construction,
        dividers: topology.dividers,
      })
      if (!support) {
        boundaryCoverage.push(unresolvedBoundaryCoverage(field, edge))
        continue
      }
      const joint = buildJoint({ system, resolution, productType, field, edge, support })
      joints.push(joint)
      boundaryCoverage.push(boundaryCoverageFromJoint(joint))
    }
  }

  const fieldGlazingContextByFieldId = new Map(fieldGlazingContexts.map((entry) => [entry.fieldId, entry] as const))
  const jointGlazingLinks = joints.map((joint) => buildJointGlazingLink(
    joint,
    fieldGlazingContextByFieldId.get(joint.fieldId) ?? null,
  ))
  const jointGlazingEvidence = jointGlazingLinks.map((link) => buildJointGlazingEvidenceStatus(system, link))
  const glazingEvidenceGaps = buildGlazingEvidenceGaps({
    systemId: system.id,
    fieldGlazingContexts,
    jointGlazingLinks,
    jointGlazingEvidence,
  })
  const glazingEvidenceReviewItems = buildGlazingEvidenceReviewItems({
    systemId: system.id,
    gaps: glazingEvidenceGaps,
    snapshot: assuranceSnapshot,
    moduleId,
  })

  const expectedBoundaryCount = boundaryCoverage.length
  const resolvedBoundaryCount = boundaryCoverage.filter((entry) => entry.jointId !== null).length
  const technicalReadyBoundaryCount = boundaryCoverage.filter((entry) => entry.status === 'resolved').length
  const blockedBoundaryCount = expectedBoundaryCount - technicalReadyBoundaryCount
  const requiredComponents = components.filter((entry) => entry.status !== 'not-required')
  const jointLibrary = buildJointLibrary(joints)
  return {
    version: SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION,
    moduleId,
    moduleSequence,
    productType,
    systemId: system.id,
    systemLabel: `${system.manufacturer} ${system.name}`,
    constructionReady: true,
    profileResolutionReady: true,
    layout,
    components,
    joints,
    boundaryCoverage,
    fieldGlazingContexts,
    jointGlazingLinks,
    jointGlazingEvidence,
    glazingEvidenceGaps,
    glazingEvidenceReviewItems,
    jointLibrary,
    resolvedComponentCount: requiredComponents.filter((entry) => entry.status === 'resolved').length,
    requiredComponentCount: requiredComponents.length,
    verifiedJointCount: joints.filter((joint) => joint.evidenceStatus === 'verified').length,
    requiredJointCount: joints.length,
    uniqueJointTypeCount: jointLibrary.length,
    systemRuleJointCount: joints.filter((joint) => joint.systemRuleStatus === 'available').length,
    systemRuleJointTypeCount: jointLibrary.filter((entry) => entry.systemRuleStatus === 'available').length,
    expectedBoundaryCount,
    resolvedBoundaryCount,
    technicalReadyBoundaryCount,
    blockedBoundaryCount,
    boundaryCoverageComplete: technicalReadyBoundaryCount === expectedBoundaryCount,
    glazingFieldCount: fieldGlazingContexts.length,
    glazingInputCompleteCount: fieldGlazingContexts.filter((entry) => entry.inputStatus === 'complete').length,
    glazingMissingInputCount: fieldGlazingContexts.filter((entry) => entry.inputStatus === 'missing').length,
    glazingInvalidInputCount: fieldGlazingContexts.filter((entry) => entry.inputStatus === 'invalid').length,
    glazingUnconfirmedCompatibilityCount: fieldGlazingContexts.filter((entry) => entry.compatibilityStatus === 'unconfirmed').length,
    jointGlazingLinkCount: jointGlazingLinks.length,
    jointGlazingLinkedCount: jointGlazingLinks.filter((entry) => entry.linkStatus === 'linked-confirmed' || entry.linkStatus === 'linked-unconfirmed').length,
    jointGlazingBlockedCount: jointGlazingLinks.filter((entry) => entry.linkStatus !== 'linked-confirmed' && entry.linkStatus !== 'linked-unconfirmed').length,
    jointGlazingUnconfirmedCount: jointGlazingLinks.filter((entry) => entry.linkStatus === 'linked-unconfirmed').length,
    glazingEvidenceCount: jointGlazingEvidence.length,
    glazingEvidenceCatalogueSupportedCount: jointGlazingEvidence.filter((entry) => entry.catalogueThicknessEvidenceStatus === 'supported').length,
    glazingEvidenceCompatibilityReviewedCount: jointGlazingEvidence.filter((entry) => entry.beadToBaseEvidenceStatus === 'reviewed').length,
    glazingEvidencePlacementReviewedCount: jointGlazingEvidence.filter((entry) => entry.placementEvidenceStatus === 'reviewed').length,
    glazingEvidenceBlockedCount: jointGlazingEvidence.filter((entry) => entry.evidenceTier === 'blocked').length,
    glazingEvidenceOpenGapCount: glazingEvidenceGaps.length,
    glazingEvidenceReviewCandidateCount: glazingEvidenceReviewItems.filter((entry) => entry.reviewState === 'reference-candidate').length,
    glazingEvidenceReviewedCount: glazingEvidenceReviewItems.filter((entry) => entry.acceptedEvidenceStatus !== 'none').length,
    machineReady: false,
  }
}

function getModuleSystemAndProductType(snapshot: ProjectSnapshot, moduleId: string): {
  system: ProfileSystemCatalogEntry | null
  productType: 'window' | 'door' | null
  offerDefaultGlazingId: string | null
} {
  const module = snapshot.modulesById[moduleId]
  if (!module) return { system: null, productType: null, offerDefaultGlazingId: null }
  if (module.definition.kind === 'free') {
    return {
      system: getProfileSystemById(module.definition.profileSystemId) ?? null,
      productType: module.definition.productType,
      offerDefaultGlazingId: null,
    }
  }
  return {
    system: getProfileSystemById(module.definition.draft.inheritedDefaults.profileSystemId) ?? null,
    productType: module.definition.draft.productType,
    offerDefaultGlazingId: module.definition.draft.inheritedDefaults.glazingId || null,
  }
}

export function buildSystemDrivenModuleReadModelFromSnapshot(
  snapshot: ProjectSnapshot,
  moduleId: string,
): SystemDrivenModuleReadModel {
  const module = snapshot.modulesById[moduleId] ?? null
  const context = getModuleSystemAndProductType(snapshot, moduleId)
  const construction = snapshot.constructionDraftsByModuleId[moduleId]?.topology ?? null
  const resolution = snapshot.profileResolutionsByModuleId[moduleId] ?? null
  return buildSystemDrivenModuleReadModel({
    moduleId,
    moduleSequence: module?.sequence ?? null,
    productType: context.productType,
    system: context.system,
    construction,
    resolution,
    offerDefaultGlazingId: context.offerDefaultGlazingId,
    assuranceSnapshot: snapshot,
  })
}

export function buildSystemDrivenProductReadModel(
  snapshot: ProjectSnapshot,
  scopeModuleId?: string | null,
): SystemDrivenProductReadModel {
  const scopeOfferId = scopeModuleId ? snapshot.modulesById[scopeModuleId]?.offerId ?? null : null
  const modules = Object.values(snapshot.modulesById)
    .filter((module) => scopeOfferId === null || module.offerId === scopeOfferId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((module) => buildSystemDrivenModuleReadModelFromSnapshot(snapshot, module.id))

  const moduleConnectionQuestions: ProductModuleConnectionQuestion[] = []
  for (let index = 0; index < modules.length - 1; index += 1) {
    const current = modules[index]
    const next = modules[index + 1]
    if (!current.moduleId || !next.moduleId || current.moduleSequence === null || next.moduleSequence === null) continue
    moduleConnectionQuestions.push({
      id: `${current.moduleId}->${next.moduleId}`,
      fromModuleId: current.moduleId,
      fromModuleSequence: current.moduleSequence,
      toModuleId: next.moduleId,
      toModuleSequence: next.moduleSequence,
      status: 'boundary-not-defined',
      noteBg: 'Последователността на модулите в проекта не доказва физическа връзка. Преди да се търси сглобка, FacadeFlow трябва да знае коя страна на единия модул се свързва с коя страна на другия.',
    })
  }

  return {
    version: SYSTEM_DRIVEN_PRODUCT_MODEL_VERSION,
    modules,
    moduleConnectionQuestions,
    machineReady: false,
  }
}
