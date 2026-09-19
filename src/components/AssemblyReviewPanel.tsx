import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { ProjectSnapshot } from '../domain/project/projectModel'
import { deriveResolvedAssembly } from '../domain/assembly/resolveAssembly'
import { assessReadiness } from '../domain/assembly/assemblyReadiness'
import { selectAssemblyReview } from '../domain/assembly/assemblySelectors'
import {
  buildSystemDrivenModuleReadModelFromSnapshot,
  buildSystemDrivenProductReadModel,
  type SystemDrivenJointLibraryReadModel,
  type SystemDrivenJointReadModel,
  type SystemDrivenBoundaryCoverageReadModel,
  type SystemDrivenFieldGlazingContextReadModel,
  type SystemDrivenJointGlazingLinkReadModel,
  type SystemDrivenJointGlazingEvidenceReadModel,
  type SystemDrivenModuleReadModel,
} from '../domain/systemDrivenProductModel'
import { buildSystemJointVisualization } from '../domain/systemJointVisualization'
import {
  createDefaultCustomJointDraft,
  deleteCustomJointDraft,
  getCustomJointPuzzlePieces,
  readCustomJointLibrary,
  resolveJointKnowledgeStatus,
  saveCustomJointDraft,
  type CustomJointDraft,
  type CustomJointPuzzlePiece,
  type CustomJointWorkspacePose,
} from '../domain/customJointLibrary'
import { getTechnicalProfileSection, type TechnicalProfileSection } from '../data/profileSystems/technicalSections'
import { getOperatorWorkingProfileDimensions } from '../data/profileSystems/operatorWorkingDimensions'
import { getAssemblyGlazingSeatPresentationTemplate } from '../data/profileSystems/assemblyGlazingSeatTemplates'
import {
  getConfirmedGlazingOptions,
  getGlazingOptionById,
  getProfileSystemById,
  getProfileSystemFinishOptionById,
  getProfileSystemFoilModeById,
} from '../data/profileSystems'
import {
  getAssemblyTechnicalSectionGraphic,
  getCatalogueTechnicalSectionGraphic,
} from './assemblyTechnicalSectionGraphics'
import './AssemblyReviewPanel.css'

const EDGE_LABELS = {
  left: 'лява страна',
  right: 'дясна страна',
  top: 'горна страна',
  bottom: 'долна страна',
} as const

const COMPONENT_KIND_LABELS = {
  frame: 'Каса',
  divider: 'Делител',
  sash: 'Крило',
  'glass-bead': 'Стъклодържател',
} as const

const gateLabels = {
  ASSEMBLY_RESOLUTION: 'Сглобка',
  BOM: 'Материална спецификация',
  QUOTATION: 'Ценообразуване',
  GLASS_ORDER: 'Поръчка на стъклопакети',
  PRODUCTION_RELEASE: 'Производство',
  MACHINE_EXPORT: 'Машинен изход',
}

function moduleProductTypeLabel(model: SystemDrivenModuleReadModel): string {
  if (model.productType === 'window') return 'Прозорец'
  if (model.productType === 'door') return 'Врата'
  return 'Типът не е зададен'
}

function jointStatusLabel(joint: SystemDrivenJointReadModel): string {
  if (joint.evidenceStatus === 'verified') return 'ПРОВЕРЕНА СГЛОБКА'
  if (joint.evidenceStatus === 'missing-profile') return 'ЛИПСВАТ ПРОФИЛИ'
  if (joint.evidenceStatus === 'invalid-role') return 'НЕСЪВМЕСТИМА РОЛЯ'
  if (joint.systemRuleStatus === 'available') return 'СГЛОБКА · ЗА ПРОВЕРКА'
  return 'ЛИПСВА ДОКАЗАНА СГЛОБКА'
}

function jointStatusClass(joint: SystemDrivenJointReadModel): string {
  if (joint.evidenceStatus === 'verified') return 'is-verified'
  if (joint.evidenceStatus === 'missing-profile') return 'is-missing-profile'
  if (joint.evidenceStatus === 'invalid-role') return 'is-invalid-role'
  return 'is-missing-evidence'
}

function operatorJointStatusLabel(joint: SystemDrivenJointReadModel): string {
  if (joint.evidenceStatus === 'missing-profile') return 'ЛИПСВАТ ПРОФИЛИ'
  if (joint.evidenceStatus === 'invalid-role') return 'НЕСЪВМЕСТИМА РОЛЯ'
  if (joint.systemRuleStatus === 'available') return 'СИСТЕМНА СГЛОБКА'
  return 'ЛИПСВА СИСТЕМНО ПРАВИЛО'
}

function operatorJointStatusClass(joint: SystemDrivenJointReadModel): string {
  if (joint.evidenceStatus === 'missing-profile') return 'is-missing-profile'
  if (joint.evidenceStatus === 'invalid-role') return 'is-invalid-role'
  if (joint.systemRuleStatus === 'available') return 'is-verified'
  return 'is-missing-evidence'
}

function jointMarkerLabel(index: number): string {
  return `A${index + 1}`
}

function fieldTypeLabel(fieldType: 'fixed' | 'operable' | null): string {
  if (fieldType === 'operable') return 'ОТВАРЯЕМО'
  if (fieldType === 'fixed') return 'ФИКСИРАНО'
  return 'НЕЗАДАДЕНО'
}

function customDraftStatusLabel(draft: CustomJointDraft | null): string {
  return draft ? 'ИМА СОБСТВЕНА ЧЕРНОВА' : 'НЯМА ЧЕРНОВА'
}

// Historical FIX45.2 mapping contract markers. ASSEMBLY FUNCTIONALITY 01A
// resolves these through assemblyTechnicalSectionGraphics.ts instead of code
// conditionals inside the panel.
// if (profileCode === '482.21') return { src: mullion48221AssemblyImage
// if (profileCode === '482.05') return { src: sash48205AssemblyImage

// DIMENSIONED TECHNICAL NODE 01
// CLEAN TECHNICAL NODE 01
// FIX41 · SEPARATED PARTICIPANTS FINAL ASSEMBLY 01
// FIX43 · PROFILE RENDER NORMALIZATION + FACADEFLOW-NATIVE WORDING 01
function AutomaticSystemAssemblyView({ joint, fieldGlazingContext }: { joint: SystemDrivenJointReadModel; fieldGlazingContext: SystemDrivenFieldGlazingContextReadModel | null }) {
  const visualization = useMemo(() => buildSystemJointVisualization(joint), [joint])
  const supportTechnicalSection = getTechnicalProfileSection(joint.systemId, joint.supportProfileCode)
  const sashTechnicalSection = getTechnicalProfileSection(joint.systemId, joint.sashProfileCode)
  const supportGraphic = getAssemblyTechnicalSectionGraphic(supportTechnicalSection, joint.supportLabelBg)
  const sashGraphic = getAssemblyTechnicalSectionGraphic(sashTechnicalSection, 'Крило')
  const supportCatalogueGraphic = getCatalogueTechnicalSectionGraphic(supportTechnicalSection, joint.supportLabelBg)
  const sashCatalogueGraphic = getCatalogueTechnicalSectionGraphic(sashTechnicalSection, 'Крило')
  const supportWorkingDimensions = getOperatorWorkingProfileDimensions(joint.systemId, joint.supportProfileCode)
  const sashWorkingDimensions = getOperatorWorkingProfileDimensions(joint.systemId, joint.sashProfileCode)
  const systemCatalog = getProfileSystemById(joint.systemId)
  const glazingThicknessMm = fieldGlazingContext?.glazingThicknessMm ?? null
  const glazingBeadCode = fieldGlazingContext?.glazingBeadProfileCode ?? null
  const beadTechnicalSection = getTechnicalProfileSection(joint.systemId, glazingBeadCode)
  const beadCatalogueGraphic = getCatalogueTechnicalSectionGraphic(beadTechnicalSection, 'Стъклодържател')
  const beadAssemblyGraphic = getAssemblyTechnicalSectionGraphic(beadTechnicalSection, 'Стъклодържател')

  if (visualization.status !== 'available' || !visualization.support || !visualization.sash || !supportGraphic || !sashGraphic) {
    return (
      <section className="assembly-auto-section is-unavailable">
        <header>
          <div><span>АВТОМАТИЧНА СГЛОБКА</span><h3>Няма достатъчно системни данни за визуализация</h3></div>
          <strong>НЕ Е НАЛИЧНА</strong>
        </header>
        <p>{visualization.reasonBg ?? 'Липсват профили или системно правило.'}</p>
      </section>
    )
  }

  type ScreenPoint = Readonly<{ x: number; y: number }>
  type ScreenBox = Readonly<{ x: number; y: number; width: number; height: number }>

  const marginMm = 46
  const baseWidthMm = visualization.canonicalWidthMm
  const baseHeightMm = visualization.canonicalHeightMm
  const rotated = Math.abs(visualization.orientationRotationDeg) === 90
  const viewWidthMm = (rotated ? baseHeightMm : baseWidthMm) + marginMm * 2
  const viewHeightMm = (rotated ? baseWidthMm : baseHeightMm) + marginMm * 2
  const cx = viewWidthMm / 2
  const cy = viewHeightMm / 2
  const canonicalCx = baseWidthMm / 2
  const canonicalCy = baseHeightMm / 2

  const image = (
    src: string,
    x: number,
    y: number,
    width: number,
    height: number,
    className: string,
  ) => <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="none" className={className} />

  const rotatePoint = (x: number, y: number): ScreenPoint => {
    const radians = visualization.orientationRotationDeg * Math.PI / 180
    const dx = x - canonicalCx
    const dy = y - canonicalCy
    return {
      x: cx + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: cy + dx * Math.sin(radians) + dy * Math.cos(radians),
    }
  }

  const screenBox = (x: number, y: number, width: number, height: number): ScreenBox => {
    const points = [
      rotatePoint(x, y),
      rotatePoint(x + width, y),
      rotatePoint(x, y + height),
      rotatePoint(x + width, y + height),
    ]
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    const left = Math.min(...xs)
    const top = Math.min(...ys)
    return {
      x: left,
      y: top,
      width: Math.max(...xs) - left,
      height: Math.max(...ys) - top,
    }
  }

  const horizontalDimension = (
    x1: number,
    x2: number,
    objectY: number,
    dimensionY: number,
    label: string,
    key: string,
  ) => (
    <g key={key} className="assembly-auto-dimension is-catalog">
      <line x1={x1} x2={x1} y1={objectY} y2={dimensionY} className="assembly-auto-dimension-extension" />
      <line x1={x2} x2={x2} y1={objectY} y2={dimensionY} className="assembly-auto-dimension-extension" />
      <line x1={x1} x2={x2} y1={dimensionY} y2={dimensionY} className="assembly-auto-dimension-line" />
      <line x1={x1 - 1.7} x2={x1 + 1.7} y1={dimensionY + 1.7} y2={dimensionY - 1.7} className="assembly-auto-dimension-tick" />
      <line x1={x2 - 1.7} x2={x2 + 1.7} y1={dimensionY + 1.7} y2={dimensionY - 1.7} className="assembly-auto-dimension-tick" />
      <text x={(x1 + x2) / 2} y={dimensionY - 2.2} textAnchor="middle" className="assembly-auto-dimension-text">{label}</text>
    </g>
  )

  const verticalDimension = (
    y1: number,
    y2: number,
    objectX: number,
    dimensionX: number,
    label: string,
    key: string,
    side: 'left' | 'right',
  ) => {
    const textX = dimensionX + (side === 'left' ? -2.4 : 2.4)
    const textY = (y1 + y2) / 2
    return (
      <g key={key} className="assembly-auto-dimension is-catalog">
        <line x1={objectX} x2={dimensionX} y1={y1} y2={y1} className="assembly-auto-dimension-extension" />
        <line x1={objectX} x2={dimensionX} y1={y2} y2={y2} className="assembly-auto-dimension-extension" />
        <line x1={dimensionX} x2={dimensionX} y1={y1} y2={y2} className="assembly-auto-dimension-line" />
        <line x1={dimensionX - 1.7} x2={dimensionX + 1.7} y1={y1 - 1.7} y2={y1 + 1.7} className="assembly-auto-dimension-tick" />
        <line x1={dimensionX - 1.7} x2={dimensionX + 1.7} y1={y2 - 1.7} y2={y2 + 1.7} className="assembly-auto-dimension-tick" />
        <text x={textX} y={textY} textAnchor="middle" transform={`rotate(-90 ${textX} ${textY})`} className="assembly-auto-dimension-text">{label}</text>
      </g>
    )
  }

  const profileContourAnchorCandidates = (
    section: TechnicalProfileSection | null,
    x: number,
    y: number,
    width: number,
    height: number,
  ): ScreenPoint[] => {
    // FIX47 contour anchors are now carried by the registered technical section.
    // They remain annotation-only points and never become assembly coordinates.
    const normalized = section?.contourAnchors ?? [
      { xRatio: 0.50, yRatio: 0 },
      { xRatio: 1, yRatio: 0.50 },
      { xRatio: 0.50, yRatio: 1 },
      { xRatio: 0, yRatio: 0.50 },
    ]

    return normalized.map(({ xRatio, yRatio }) => rotatePoint(x + width * xRatio, y + height * yRatio))
  }

  const nearestContourAnchor = (candidates: ScreenPoint[], target: ScreenPoint, fallback: ScreenPoint): ScreenPoint => (
    candidates.reduce<ScreenPoint>((best, candidate) => {
      const bestDistance = (best.x - target.x) ** 2 + (best.y - target.y) ** 2
      const candidateDistance = (candidate.x - target.x) ** 2 + (candidate.y - target.y) ** 2
      return candidateDistance < bestDistance ? candidate : best
    }, candidates[0] ?? fallback)
  )

  const profileIdentityCallout = (
    box: ScreenBox,
    profileCode: string,
    roleLabel: string,
    key: string,
    lane: 'support' | 'sash',
    contourAnchors: ScreenPoint[],
  ) => {
    const labelWidth = 34
    const labelHeight = 10.5
    const gap = 5
    const canvasInset = 4
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    const fitsAbove = box.y - gap - labelHeight >= canvasInset
    const fitsBelow = box.y + box.height + gap + labelHeight <= viewHeightMm - canvasInset

    let anchor = { x: centerX, y: lane === 'support' ? box.y : box.y + box.height }
    let labelX = Math.min(
      viewWidthMm - labelWidth - canvasInset,
      Math.max(canvasInset, centerX - labelWidth / 2),
    )
    let labelY = lane === 'support'
      ? box.y - gap - labelHeight
      : box.y + box.height + gap
    let leaderX = labelX + labelWidth / 2
    let leaderY = lane === 'support' ? labelY + labelHeight : labelY

    // FIX46: identity uses the semantic profile edge and stays out of the
    // established catalogue-dimension lanes whenever the canvas has room.
    // Support dimensions occupy bottom + left; sash dimensions occupy top + right.
    if (lane === 'support' && !fitsAbove) {
      anchor = { x: box.x + box.width, y: centerY }
      labelX = Math.min(viewWidthMm - labelWidth - canvasInset, box.x + box.width + gap)
      labelY = Math.min(viewHeightMm - labelHeight - canvasInset, Math.max(canvasInset, centerY - labelHeight / 2))
      leaderX = labelX
      leaderY = labelY + labelHeight / 2
    } else if (lane === 'sash' && !fitsBelow) {
      anchor = { x: box.x, y: centerY }
      labelX = Math.max(canvasInset, box.x - labelWidth - gap)
      labelY = Math.min(viewHeightMm - labelHeight - canvasInset, Math.max(canvasInset, centerY - labelHeight / 2))
      leaderX = labelX + labelWidth
      leaderY = labelY + labelHeight / 2
    }

    anchor = nearestContourAnchor(contourAnchors, { x: leaderX, y: leaderY }, anchor)

    return (
      <g key={key} className="assembly-auto-profile-identity" aria-label={`${roleLabel} ${profileCode}`}>
        <line x1={anchor.x} y1={anchor.y} x2={leaderX} y2={leaderY} className="assembly-auto-profile-identity-leader" />
        <circle cx={anchor.x} cy={anchor.y} r="1.15" className="assembly-auto-profile-identity-anchor" />
        <rect x={labelX} y={labelY} width={labelWidth} height={labelHeight} rx="1.8" className="assembly-auto-profile-identity-box" />
        <text x={labelX + 3} y={labelY + 4.3} className="assembly-auto-profile-identity-code">{profileCode}</text>
        <text x={labelX + 3} y={labelY + 8.2} className="assembly-auto-profile-identity-role">{roleLabel}</text>
      </g>
    )
  }

  const supportBox = screenBox(
    visualization.canonicalSupportXmm,
    visualization.canonicalSupportYmm,
    visualization.support.depthMm,
    visualization.support.faceMm,
  )
  const sashBox = screenBox(
    visualization.canonicalSashXmm,
    visualization.canonicalSashYmm,
    visualization.sash.depthMm,
    visualization.sash.faceMm,
  )

  const supportHorizontalMm = rotated ? visualization.support.faceMm : visualization.support.depthMm
  const supportVerticalMm = rotated ? visualization.support.depthMm : visualization.support.faceMm
  const sashHorizontalMm = rotated ? visualization.sash.faceMm : visualization.sash.depthMm
  const sashVerticalMm = rotated ? visualization.sash.depthMm : visualization.sash.faceMm

  const supportCenter = { x: supportBox.x + supportBox.width / 2, y: supportBox.y + supportBox.height / 2 }
  const sashCenter = { x: sashBox.x + sashBox.width / 2, y: sashBox.y + sashBox.height / 2 }

  // ASSEMBLY MODEL 04B — TRUE SECTIONAL MATE + GLAZING AXIS.
  // 482.21/482.30 and 482.05 now follow the reviewed PRELUDE sectional mate:
  // 15.5 mm sash depth offset inside a 75.5 mm assembled envelope. The glazing
  // thickness is also drawn on that depth axis;
  // it is no longer represented as a 24 mm band across the profile face.
  // This remains presentation-only and MUST NOT feed glass cut, seat/inset or machining.
  const glazingReady = glazingThicknessMm !== null && glazingThicknessMm > 0
  const glazingSeatTemplate = getAssemblyGlazingSeatPresentationTemplate(
    joint.systemId,
    joint.sashProfileCode,
    glazingBeadCode,
    glazingThicknessMm,
  )
  const glazingPresentationReady = glazingReady && glazingSeatTemplate !== null

  const glazingHalfThicknessMm = glazingPresentationReady ? (glazingThicknessMm ?? 0) / 2 : 0
  const glazingLocalBaseCenter = glazingSeatTemplate ? {
    x: visualization.canonicalSashXmm + glazingSeatTemplate.glassDepthCenterFromSashStartMm,
    y: visualization.canonicalSashYmm + glazingSeatTemplate.glassFaceStartFromSashTopMm,
  } : { x: 0, y: 0 }
  const glazingLocalFarCenter = glazingSeatTemplate ? {
    x: glazingLocalBaseCenter.x,
    y: glazingLocalBaseCenter.y + glazingSeatTemplate.glassPresentationRunMm,
  } : { x: 0, y: 0 }
  const localGlassPolygon = glazingPresentationReady ? [
    { x: glazingLocalBaseCenter.x - glazingHalfThicknessMm, y: glazingLocalBaseCenter.y },
    { x: glazingLocalBaseCenter.x + glazingHalfThicknessMm, y: glazingLocalBaseCenter.y },
    { x: glazingLocalFarCenter.x + glazingHalfThicknessMm, y: glazingLocalFarCenter.y },
    { x: glazingLocalFarCenter.x - glazingHalfThicknessMm, y: glazingLocalFarCenter.y },
  ] : []

  const glassPaneOffsetMm = glazingHalfThicknessMm * 0.58
  const glassPaneALocalStart = { x: glazingLocalBaseCenter.x - glassPaneOffsetMm, y: glazingLocalBaseCenter.y }
  const glassPaneALocalEnd = { x: glazingLocalFarCenter.x - glassPaneOffsetMm, y: glazingLocalFarCenter.y }
  const glassPaneBLocalStart = { x: glazingLocalBaseCenter.x + glassPaneOffsetMm, y: glazingLocalBaseCenter.y }
  const glassPaneBLocalEnd = { x: glazingLocalFarCenter.x + glassPaneOffsetMm, y: glazingLocalFarCenter.y }

  // Dimension the real input value (24 mm) across the system-depth axis.
  const glazingDimensionLocalCenter = {
    x: glazingLocalFarCenter.x,
    y: glazingLocalFarCenter.y - 5,
  }
  const glazingDimensionALocal = {
    x: glazingDimensionLocalCenter.x - glazingHalfThicknessMm,
    y: glazingDimensionLocalCenter.y,
  }
  const glazingDimensionBLocal = {
    x: glazingDimensionLocalCenter.x + glazingHalfThicknessMm,
    y: glazingDimensionLocalCenter.y,
  }
  const glazingDimensionCenter = rotatePoint(glazingDimensionLocalCenter.x, glazingDimensionLocalCenter.y)
  const glazingDimensionA = rotatePoint(glazingDimensionALocal.x, glazingDimensionALocal.y)
  const glazingDimensionB = rotatePoint(glazingDimensionBLocal.x, glazingDimensionBLocal.y)
  const orientationRadians = visualization.orientationRotationDeg * Math.PI / 180
  const rotateVector = (x: number, y: number): ScreenPoint => ({
    x: x * Math.cos(orientationRadians) - y * Math.sin(orientationRadians),
    y: x * Math.sin(orientationRadians) + y * Math.cos(orientationRadians),
  })
  const glazingDimensionTickVector = rotateVector(0, 2)
  const glazingTextOffsetVector = rotateVector(0, -3)

  const beadCatalogueDepthMm = beadTechnicalSection?.catalogueDepthMm ?? 16.5
  const beadCatalogueFaceMm = beadTechnicalSection?.catalogueFaceMm ?? 28.5
  const beadScale = glazingSeatTemplate?.beadGraphicScale ?? 1
  const beadWidthMm = beadCatalogueDepthMm * beadScale
  const beadHeightMm = beadCatalogueFaceMm * beadScale
  const beadLocalCenter = glazingSeatTemplate ? {
    x: visualization.canonicalSashXmm + glazingSeatTemplate.beadCenterDepthFromSashStartMm,
    y: visualization.canonicalSashYmm + glazingSeatTemplate.beadCenterFaceFromSashTopMm,
  } : { x: 0, y: 0 }
  const beadLocalRotationDeg = glazingSeatTemplate?.beadLocalRotationDeg ?? 0
  const beadMirrorX = glazingSeatTemplate?.beadMirrorX ?? false
  const beadCenter = rotatePoint(beadLocalCenter.x, beadLocalCenter.y)
  const beadLocalRotationRad = beadLocalRotationDeg * Math.PI / 180
  const rotateBeadLocalPoint = (x: number, y: number): ScreenPoint => {
    const dx = x - beadLocalCenter.x
    const dy = y - beadLocalCenter.y
    const localRotated = {
      x: beadLocalCenter.x + dx * Math.cos(beadLocalRotationRad) - dy * Math.sin(beadLocalRotationRad),
      y: beadLocalCenter.y + dx * Math.sin(beadLocalRotationRad) + dy * Math.cos(beadLocalRotationRad),
    }
    return rotatePoint(localRotated.x, localRotated.y)
  }
  const beadInstalledCorners = glazingSeatTemplate ? [
    rotateBeadLocalPoint(beadLocalCenter.x - beadWidthMm / 2, beadLocalCenter.y - beadHeightMm / 2),
    rotateBeadLocalPoint(beadLocalCenter.x + beadWidthMm / 2, beadLocalCenter.y - beadHeightMm / 2),
    rotateBeadLocalPoint(beadLocalCenter.x - beadWidthMm / 2, beadLocalCenter.y + beadHeightMm / 2),
    rotateBeadLocalPoint(beadLocalCenter.x + beadWidthMm / 2, beadLocalCenter.y + beadHeightMm / 2),
  ] : []
  const beadScreenBox = beadInstalledCorners.length > 0 ? {
    x: Math.min(...beadInstalledCorners.map((point) => point.x)),
    y: Math.min(...beadInstalledCorners.map((point) => point.y)),
    width: Math.max(...beadInstalledCorners.map((point) => point.x)) - Math.min(...beadInstalledCorners.map((point) => point.x)),
    height: Math.max(...beadInstalledCorners.map((point) => point.y)) - Math.min(...beadInstalledCorners.map((point) => point.y)),
  } : { x: beadCenter.x, y: beadCenter.y, width: 0, height: 0 }
  const beadLabelPoint = {
    x: beadScreenBox.x + beadScreenBox.width / 2,
    y: beadScreenBox.y + beadScreenBox.height + 8,
  }

  const profileSeparationIsHorizontal = Math.abs(supportCenter.x - sashCenter.x) >= Math.abs(supportCenter.y - sashCenter.y)
  const supportVerticalSide: 'left' | 'right' = profileSeparationIsHorizontal
    ? (supportCenter.x <= sashCenter.x ? 'left' : 'right')
    : 'left'
  const sashVerticalSide: 'left' | 'right' = profileSeparationIsHorizontal
    ? (sashCenter.x <= supportCenter.x ? 'left' : 'right')
    : 'right'
  const supportHorizontalSide: 'above' | 'below' = !profileSeparationIsHorizontal
    ? (supportCenter.y <= sashCenter.y ? 'above' : 'below')
    : 'below'
  const sashHorizontalSide: 'above' | 'below' = !profileSeparationIsHorizontal
    ? (sashCenter.y <= supportCenter.y ? 'above' : 'below')
    : 'above'
  const supportVerticalObjectX = supportVerticalSide === 'left' ? supportBox.x : supportBox.x + supportBox.width
  const supportVerticalDimensionX = supportVerticalObjectX + (supportVerticalSide === 'left' ? -12 : 12)
  const sashVerticalObjectX = sashVerticalSide === 'left' ? sashBox.x : sashBox.x + sashBox.width
  const sashVerticalDimensionX = sashVerticalObjectX + (sashVerticalSide === 'left' ? -12 : 12)
  const supportHorizontalObjectY = supportHorizontalSide === 'above' ? supportBox.y : supportBox.y + supportBox.height
  const supportHorizontalDimensionY = supportHorizontalObjectY + (supportHorizontalSide === 'above' ? -12 : 12)
  const sashHorizontalObjectY = sashHorizontalSide === 'above' ? sashBox.y : sashBox.y + sashBox.height
  const sashHorizontalDimensionY = sashHorizontalObjectY + (sashHorizontalSide === 'above' ? -12 : 12)

  const supportContourAnchors = profileContourAnchorCandidates(
    supportTechnicalSection,
    visualization.canonicalSupportXmm,
    visualization.canonicalSupportYmm,
    visualization.support.depthMm,
    visualization.support.faceMm,
  )
  const sashContourAnchors = profileContourAnchorCandidates(
    sashTechnicalSection,
    visualization.canonicalSashXmm,
    visualization.canonicalSashYmm,
    visualization.sash.depthMm,
    visualization.sash.faceMm,
  )

  const correctionStart = rotatePoint(
    visualization.canonicalSupportXmm + visualization.support.depthMm,
    baseHeightMm / 2,
  )
  const correctionEnd = rotatePoint(
    visualization.canonicalSashXmm,
    baseHeightMm / 2,
  )
  const correctionMid = {
    x: (correctionStart.x + correctionEnd.x) / 2,
    y: (correctionStart.y + correctionEnd.y) / 2,
  }
  // FIX49: keep the 8.5 mm rule visible in the drawing without putting a
  // card over either profile. The text sits in the free lane immediately
  // above the participating sections, to the left of the system axis. The
  // reference endpoints and the correction value remain unchanged.
  const correctionAnnotationRightX = Math.max(38, correctionMid.x - 4)
  const correctionAnnotationY = Math.max(12, Math.min(supportBox.y, sashBox.y) - 13)
  const correctionLeaderLaneY = correctionAnnotationY + 2.5
  const correctionLeaderTarget = {
    x: correctionAnnotationRightX + 1.5,
    y: correctionLeaderLaneY,
  }
  const correctionLeaderKnee = {
    x: correctionMid.x,
    y: correctionLeaderLaneY,
  }

  const showSystemCorrectionInOperatorSketch = false

  return (
    <section className="assembly-auto-section">
      <header>
        <div>
          <span>ТЕХНИЧЕСКА СКИЦА НА СГЛОБКАТА</span>
          <h3>{systemCatalog?.name ?? joint.systemId} · {joint.supportProfileCode} + {joint.sashProfileCode}{glazingBeadCode ? ` + ${glazingBeadCode}` : ''}</h3>
          <p>FacadeFlow подрежда профилите в общата системна дълбочина и показва стъклопакета и стъклодържателя в локалната зона на крилото.</p>
        </div>
        <strong className={visualization.exactGeometryVerified ? 'is-verified' : 'is-reference'}>
          {visualization.exactGeometryVerified ? 'ПРОВЕРЕНА' : 'СИСТЕМНА СКИЦА'}
        </strong>
      </header>

      <section className="assembly-auto-participants-block">
        <div className="assembly-auto-participants-head">
          <div>
            <span>ПРОФИЛИ В СГЛОБКАТА</span>
            <h4>Участващи профили</h4>
            <p>Показваме отделните компоненти, а след тях — общата сглобка с остъкляването.</p>
          </div>
          <div className="assembly-auto-participants-context" aria-label="Контекст на възела">
            <span>ПОЛЕ {joint.fieldSequence}</span>
            <b>{EDGE_LABELS[joint.edge]}</b>
            <small>{joint.boundaryLabelBg}</small>
          </div>
        </div>

        <div className="assembly-auto-profile-strip assembly-auto-participant-grid" aria-label="Участващи каталожни профили">
          <article className="assembly-auto-participant-card">
            <div className="assembly-auto-profile-strip-image assembly-auto-participant-image">
              {supportCatalogueGraphic?.src && <img src={supportCatalogueGraphic.src} alt={`${joint.supportLabelBg} ${joint.supportProfileCode}`} />}
            </div>
            <div className="assembly-auto-participant-meta">
              <span>ОПОРЕН ПРОФИЛ · {joint.supportLabelBg.toUpperCase()}</span>
              <b>{joint.supportProfileCode}</b>
              <strong>{visualization.support.depthMm} × {visualization.support.faceMm} mm</strong>
              <small>каталожен детайл · отделен от крайната сглобка</small>
            </div>
          </article>

          <article className="assembly-auto-participant-card">
            <div className="assembly-auto-profile-strip-image assembly-auto-participant-image">
              {sashCatalogueGraphic?.src && <img src={sashCatalogueGraphic.src} alt={`Крило ${joint.sashProfileCode}`} />}
            </div>
            <div className="assembly-auto-participant-meta">
              <span>КРИЛО</span>
              <b>{joint.sashProfileCode}</b>
              <strong>{visualization.sash.depthMm} × {visualization.sash.faceMm} mm</strong>
              <small>каталожен детайл · отделен от крайната сглобка</small>
            </div>
          </article>

          <article className="assembly-auto-participant-card is-glazing">
            <div className="assembly-auto-participant-glass-icon" aria-hidden="true">
              <i /><i /><i />
            </div>
            <div className="assembly-auto-participant-meta">
              <span>СТЪКЛОПАКЕТ</span>
              <b>{glazingThicknessMm !== null ? `${glazingThicknessMm} mm` : 'НЕ Е ЗАДАДЕН'}</b>
              <strong>{fieldGlazingContext?.inputStatus === 'complete' ? 'ПАРАМЕТЪР НА ПОЛЕТО' : 'ИЗИСКВА ПАРАМЕТЪР'}</strong>
              <small>дебелината идва директно от текущото ПОЛЕ</small>
            </div>
          </article>

          <article className="assembly-auto-participant-card is-bead">
            <div className="assembly-auto-profile-strip-image assembly-auto-participant-image">
              {beadCatalogueGraphic?.src
                ? <img src={beadCatalogueGraphic.src} alt={`Стъклодържател ${glazingBeadCode ?? ''}`} />
                : <span className="assembly-auto-participant-placeholder">—</span>}
            </div>
            <div className="assembly-auto-participant-meta">
              <span>СТЪКЛОДЪРЖАТЕЛ</span>
              <b>{glazingBeadCode ?? 'НЕ Е ИЗБРАН'}</b>
              <strong>
                {beadTechnicalSection
                  ? `${beadTechnicalSection.catalogueFaceMm} × ${beadTechnicalSection.catalogueDepthMm} mm`
                  : (glazingThicknessMm !== null ? `за ${glazingThicknessMm} mm` : 'без glazing context')}
              </strong>
              <small>
                {glazingThicknessMm !== null
                  ? `официален каталожен детайл · за ${glazingThicknessMm} mm`
                  : 'каталожен компонент на избраната система'}
              </small>
            </div>
          </article>
        </div>
      </section>

      <div className="assembly-auto-final-assembly-head">
        <div>
          <span>КРАЙНА СГЛОБКА</span>
          <h4>{joint.supportProfileCode} + {joint.sashProfileCode}{glazingBeadCode ? ` + ${glazingBeadCode}` : ''}{glazingThicknessMm !== null ? ` · ${glazingThicknessMm} mm` : ''}</h4>
          <p>Профилната сглобка и зададеното остъкляване се четат заедно. Неизвестни производствени отстъпи не се добавят.</p>
        </div>
        <strong>{visualization.exactGeometryVerified ? 'ПРОВЕРЕНА ГЕОМЕТРИЯ' : 'СИСТЕМНА СКИЦА'}</strong>
      </div>

      <div className="assembly-auto-section-grid">
        <div className="assembly-auto-canvas-wrap">
          <div className="assembly-auto-canvas-badge">{EDGE_LABELS[joint.edge]}</div>
          <div className={`assembly-auto-orientation-glyph is-${joint.edge}`} aria-label={`Ориентация: ${EDGE_LABELS[joint.edge]}`}>
            <div className="assembly-auto-orientation-frame">
              <i className="is-top" />
              <i className="is-right" />
              <i className="is-bottom" />
              <i className="is-left" />
              <span>ПОЛЕ {joint.fieldSequence}</span>
            </div>
            <small>{EDGE_LABELS[joint.edge]}</small>
          </div>
          {visualization.supportVisibleFaceMm !== null && (
            <div className="assembly-auto-reviewed-chip">
              <span>Видима част · {joint.supportLabelBg}</span>
              <b>{visualization.supportVisibleFaceMm} mm</b>
            </div>
          )}
          <svg
            className="assembly-auto-canvas"
            viewBox={`0 0 ${viewWidthMm} ${viewHeightMm}`}
            role="img"
            aria-label={`Размерен технически възел ${joint.supportProfileCode} към ${joint.sashProfileCode}`}
          >
            <defs>
              <pattern id={`joint-grid-${joint.id.replace(/[^a-zA-Z0-9]/g, '-')}`} width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={viewWidthMm} height={viewHeightMm} className="assembly-auto-grid-bg" fill={`url(#joint-grid-${joint.id.replace(/[^a-zA-Z0-9]/g, '-')})`} />
            <g transform={`translate(${cx} ${cy}) rotate(${visualization.orientationRotationDeg}) translate(${-canonicalCx} ${-canonicalCy})`}>
              <rect
                x={visualization.canonicalSupportXmm}
                y={visualization.canonicalSupportYmm}
                width={visualization.support.depthMm}
                height={visualization.support.faceMm}
                className="assembly-auto-profile-box is-support"
              />
              <rect
                x={visualization.canonicalSashXmm}
                y={visualization.canonicalSashYmm}
                width={visualization.sash.depthMm}
                height={visualization.sash.faceMm}
                className="assembly-auto-profile-box is-sash"
              />
              {image(
                supportGraphic.src,
                visualization.canonicalSupportXmm,
                visualization.canonicalSupportYmm,
                visualization.support.depthMm,
                visualization.support.faceMm,
                'assembly-auto-profile-image is-support',
              )}
              {glazingPresentationReady && (
                <g className="assembly-auto-glazing-stack is-profile-composition" aria-label={`Стъклопакет ${glazingThicknessMm} mm${glazingBeadCode ? ` със стъклодържател ${glazingBeadCode}` : ''}`}>
                  <polygon
                    points={localGlassPolygon.map((point) => `${point.x},${point.y}`).join(' ')}
                    className="assembly-auto-glass-unit"
                  />
                  <line
                    x1={glassPaneALocalStart.x}
                    y1={glassPaneALocalStart.y}
                    x2={glassPaneALocalEnd.x}
                    y2={glassPaneALocalEnd.y}
                    className="assembly-auto-glass-pane-line"
                  />
                  <line
                    x1={glassPaneBLocalStart.x}
                    y1={glassPaneBLocalStart.y}
                    x2={glassPaneBLocalEnd.x}
                    y2={glassPaneBLocalEnd.y}
                    className="assembly-auto-glass-pane-line"
                  />
                  <line
                    x1={glazingLocalBaseCenter.x}
                    y1={glazingLocalBaseCenter.y}
                    x2={glazingLocalFarCenter.x}
                    y2={glazingLocalFarCenter.y}
                    className="assembly-auto-glass-centerline"
                  />
                </g>
              )}
              {image(
                sashGraphic.src,
                visualization.canonicalSashXmm,
                visualization.canonicalSashYmm,
                visualization.sash.depthMm,
                visualization.sash.faceMm,
                'assembly-auto-profile-image is-sash',
              )}
              {glazingPresentationReady && glazingBeadCode && beadAssemblyGraphic?.src && (
                <g
                  className="assembly-auto-bead-installed"
                  transform={`translate(${beadLocalCenter.x} ${beadLocalCenter.y}) rotate(${beadLocalRotationDeg})`}
                >
                  <g transform={beadMirrorX ? 'scale(-1 1)' : undefined}>
                    <image
                      href={beadAssemblyGraphic.src}
                      x={-beadWidthMm / 2}
                      y={-beadHeightMm / 2}
                      width={beadWidthMm}
                      height={beadHeightMm}
                      preserveAspectRatio="xMidYMid meet"
                      className="assembly-auto-bead-image"
                    />
                  </g>
                </g>
              )}
              <line
                x1={visualization.canonicalSashXmm}
                x2={visualization.canonicalSashXmm}
                y1={-7}
                y2={baseHeightMm + 7}
                className="assembly-auto-rule-axis"
              />
            </g>

            {glazingPresentationReady && (
              <g className="assembly-auto-glazing-annotations">
                <line
                  x1={glazingDimensionA.x}
                  y1={glazingDimensionA.y}
                  x2={glazingDimensionB.x}
                  y2={glazingDimensionB.y}
                  className="assembly-auto-glazing-dimension"
                />
                <line
                  x1={glazingDimensionA.x - glazingDimensionTickVector.x}
                  y1={glazingDimensionA.y - glazingDimensionTickVector.y}
                  x2={glazingDimensionA.x + glazingDimensionTickVector.x}
                  y2={glazingDimensionA.y + glazingDimensionTickVector.y}
                  className="assembly-auto-glazing-dimension"
                />
                <line
                  x1={glazingDimensionB.x - glazingDimensionTickVector.x}
                  y1={glazingDimensionB.y - glazingDimensionTickVector.y}
                  x2={glazingDimensionB.x + glazingDimensionTickVector.x}
                  y2={glazingDimensionB.y + glazingDimensionTickVector.y}
                  className="assembly-auto-glazing-dimension"
                />
                <text
                  x={glazingDimensionCenter.x + glazingTextOffsetVector.x}
                  y={glazingDimensionCenter.y + glazingTextOffsetVector.y}
                  textAnchor="middle"
                  className="assembly-auto-glazing-dimension-text"
                >{glazingThicknessMm} mm</text>
                {glazingBeadCode && (
                  <g className="assembly-auto-bead-callout">
                    <line x1={beadCenter.x} y1={beadCenter.y} x2={beadLabelPoint.x} y2={beadLabelPoint.y} />
                    <circle cx={beadCenter.x} cy={beadCenter.y} r="0.9" />
                    <text x={beadLabelPoint.x} y={beadLabelPoint.y - 1.5} textAnchor="middle">{glazingBeadCode}</text>
                    <text x={beadLabelPoint.x} y={beadLabelPoint.y + 2.4} textAnchor="middle">СТЪКЛОДЪРЖАТЕЛ</text>
                  </g>
                )}
              </g>
            )}

            {joint.supportProfileCode
              ? profileIdentityCallout(supportBox, joint.supportProfileCode, joint.supportLabelBg.toUpperCase(), 'support-identity', 'support', supportContourAnchors)
              : null}
            {joint.sashProfileCode
              ? profileIdentityCallout(sashBox, joint.sashProfileCode, 'КРИЛО', 'sash-identity', 'sash', sashContourAnchors)
              : null}

            {horizontalDimension(
              supportBox.x,
              supportBox.x + supportBox.width,
              supportHorizontalObjectY,
              supportHorizontalDimensionY,
              `${supportHorizontalMm} mm`,
              'support-horizontal',
            )}
            {verticalDimension(
              supportBox.y,
              supportBox.y + supportBox.height,
              supportVerticalObjectX,
              supportVerticalDimensionX,
              `${supportVerticalMm} mm`,
              'support-vertical',
              supportVerticalSide,
            )}
            {horizontalDimension(
              sashBox.x,
              sashBox.x + sashBox.width,
              sashHorizontalObjectY,
              sashHorizontalDimensionY,
              `${sashHorizontalMm} mm`,
              'sash-horizontal',
            )}
            {verticalDimension(
              sashBox.y,
              sashBox.y + sashBox.height,
              sashVerticalObjectX,
              sashVerticalDimensionX,
              `${sashVerticalMm} mm`,
              'sash-vertical',
              sashVerticalSide,
            )}

            {showSystemCorrectionInOperatorSketch && visualization.correctionMm !== null && (
              <g className="assembly-auto-reference-dimension">
                <line x1={correctionStart.x} y1={correctionStart.y} x2={correctionEnd.x} y2={correctionEnd.y} />
                <circle cx={correctionStart.x} cy={correctionStart.y} r="0.9" className="assembly-auto-reference-anchor" />
                <circle cx={correctionEnd.x} cy={correctionEnd.y} r="0.9" className="assembly-auto-reference-anchor" />
                <polyline
                  points={`${correctionMid.x},${correctionMid.y} ${correctionLeaderKnee.x},${correctionLeaderKnee.y} ${correctionLeaderTarget.x},${correctionLeaderTarget.y}`}
                  className="assembly-auto-reference-leader is-fix49"
                />
                <text
                  x={correctionAnnotationRightX}
                  y={correctionAnnotationY}
                  textAnchor="end"
                  className="assembly-auto-reference-value is-fix49"
                >{visualization.correctionMm} mm</text>
                <text
                  x={correctionAnnotationRightX}
                  y={correctionAnnotationY + 4}
                  textAnchor="end"
                  className="assembly-auto-reference-label is-fix49"
                >системна корекция</text>
              </g>
            )}
          </svg>

          <div className="assembly-auto-dimension-legend" aria-label="Работни размери">
            <span className="is-catalog">{joint.supportProfileCode} = {visualization.support.depthMm}×{visualization.support.faceMm} mm · {joint.sashProfileCode} = {visualization.sash.depthMm}×{visualization.sash.faceMm} mm</span>
            {supportWorkingDimensions && <span className="is-reviewed">{joint.supportProfileCode}: видимо {supportWorkingDimensions.visibleWidthMm} mm · общ/видим {supportWorkingDimensions.sectionHeightMm} − {supportWorkingDimensions.visibleWidthMm} = {supportWorkingDimensions.internalZoneTotalMm} mm</span>}
            {sashWorkingDimensions && <span className="is-reviewed">{joint.sashProfileCode}: видимо {sashWorkingDimensions.visibleWidthMm} mm · общ/видим {sashWorkingDimensions.sectionHeightMm} − {sashWorkingDimensions.visibleWidthMm} = {sashWorkingDimensions.internalZoneTotalMm} mm</span>}
            {visualization.presentationMateStatus === 'reviewed-sectional' && <span className="is-reviewed">секционна дълбочина {visualization.canonicalWidthMm} mm · отместване {visualization.presentationDepthOffsetMm} mm · визуално лицево застъпване {visualization.presentationFaceOverlapMm} mm (само за скицата)</span>}
            {glazingThicknessMm !== null && <span className="is-glazing">{glazingThicknessMm} mm стъклопакет{glazingBeadCode ? ` · държател ${glazingBeadCode}` : ''}</span>}
          </div>

          <div className="assembly-auto-canvas-caption">
            <b>Техническа скица на сглобката</b>
            <span>профили + зададен стъклопакет + стъклодържател · производствени размери само когато са налични като системно правило</span>
          </div>
        </div>

        <aside className="assembly-auto-facts is-compact">
          <section>
            <h4>Система и сглобка</h4>
            <dl>
              <div><dt>Система</dt><dd>{systemCatalog?.name ?? joint.systemId}</dd></div>
              <div><dt>Опорен профил</dt><dd>{joint.supportLabelBg} {joint.supportProfileCode}</dd></div>
              <div><dt>Крило</dt><dd>{joint.sashProfileCode}</dd></div>
              <div><dt>Страна</dt><dd>{EDGE_LABELS[joint.edge]}</dd></div>
              {visualization.presentationMateStatus === 'reviewed-sectional' && <div className="is-reviewed-row"><dt>Монтаж в скицата</dt><dd>{visualization.canonicalWidthMm} mm габарит · {visualization.presentationDepthOffsetMm} mm отместване · {visualization.presentationFaceOverlapMm} mm визуално застъпване</dd></div>}
            </dl>
          </section>

          <section className="is-glazing-section">
            <h4>Остъкляване</h4>
            <dl>
              <div><dt>Стъклопакет</dt><dd>{glazingThicknessMm !== null ? `${glazingThicknessMm} mm` : 'Не е зададен'}</dd></div>
              <div><dt>Стъклодържател</dt><dd>{glazingBeadCode ?? 'Не е избран'}</dd></div>
              <div><dt>Позиция</dt><dd>{glazingSeatTemplate ? 'по системна скица' : 'схематична'}</dd></div>
              <div><dt>Поле</dt><dd>ПОЛЕ {joint.fieldSequence}</dd></div>
            </dl>
            <p>{glazingSeatTemplate
              ? 'Стъклопакетът и държателят са позиционирани по прегледания секционен контекст: 24 mm е по оста на системната дълбочина. Точен glass cut / seat / inset не се извежда от тази визуализация.'
              : 'Показва се зададеният glazing context. Размер на стъклото и скрити монтажни отстъпи не се изчисляват без системно правило.'}</p>
          </section>

          <section>
            <h4>Работни размери</h4>
            <dl>
              <div><dt>{joint.supportProfileCode}</dt><dd>{visualization.support.depthMm} × {visualization.support.faceMm} mm</dd></div>
              {supportWorkingDimensions && <><div className="is-reviewed-row"><dt>Видима ширина</dt><dd>{supportWorkingDimensions.visibleWidthMm} mm</dd></div><div><dt>Разлика общ/видим</dt><dd>{supportWorkingDimensions.sectionHeightMm} − {supportWorkingDimensions.visibleWidthMm} = {supportWorkingDimensions.internalZoneTotalMm} mm</dd></div></>}
              <div><dt>{joint.sashProfileCode}</dt><dd>{visualization.sash.depthMm} × {visualization.sash.faceMm} mm</dd></div>
              {sashWorkingDimensions && <><div className="is-reviewed-row"><dt>Видима ширина</dt><dd>{sashWorkingDimensions.visibleWidthMm} mm</dd></div><div><dt>Разлика общ/видим</dt><dd>{sashWorkingDimensions.sectionHeightMm} − {sashWorkingDimensions.visibleWidthMm} = {sashWorkingDimensions.internalZoneTotalMm} mm</dd></div></>}
            </dl>
          </section>
        </aside>
      </div>

      <p className={`assembly-auto-boundary ${visualization.exactGeometryVerified ? 'is-verified' : ''}`}>
        <b>{visualization.exactGeometryVerified ? 'Проверена геометрия:' : 'Важно:'}</b>{' '}
        {visualization.exactGeometryVerified
          ? 'този профилен възел има отделно потвърдена точна монтажна геометрия.'
          : glazingSeatTemplate
            ? 'профилите са визуално сглобени по прегледания PRELUDE 60 секционен габарит, а стъклопакетът и стъклодържателят са седнати в локалната зона на крилото. Това не създава производствено застъпване, glass cut, seat/inset или машинна корекция.'
            : 'скицата показва избраните профили и остъкляването. Размер на стъклото, точен seat/inset и машинни корекции се добавят само когато системата ги има като работно правило.'}
      </p>
    </section>
  )
}

function SystemLogicStrip() {
  return (
    <div className="assembly-system-logic" aria-label="Логика на системния модел">
      <div><span>1</span><b>Система и параметри</b><small>Определят допустимите профили и компоненти.</small></div>
      <i>→</i>
      <div><span>2</span><b>Модул и ПОЛЕТА</b><small>Constructor определя формата и конструктивните граници.</small></div>
      <i>→</i>
      <div><span>3</span><b>Реални компоненти</b><small>Каса, делители, крила, стъклодържатели и армировки.</small></div>
      <i>→</i>
      <div><span>4</span><b>Правила и сглобки</b><small>Границата се свързва със системно правило и библиотечен тип възел.</small></div>
    </div>
  )
}

function boundaryCoverageStatusLabel(entry: SystemDrivenBoundaryCoverageReadModel): string {
  if (entry.status === 'resolved') return 'СИСТЕМЕН ПРЕГЛЕД'
  if (entry.status === 'support-unresolved') return 'НЕРАЗПОЗНАТА ГРАНИЦА'
  if (entry.status === 'missing-profile') return 'ЛИПСВА ПРОФИЛ'
  if (entry.status === 'invalid-role') return 'НЕСЪВМЕСТИМА РОЛЯ'
  if (entry.status === 'missing-technical-section') return 'НЯМА ТЕХНИЧЕСКО СЕЧЕНИЕ'
  return 'НЯМА СИСТЕМНО ПРАВИЛО'
}

function BoundaryCoveragePanel({
  model,
  onSelect,
}: {
  model: SystemDrivenModuleReadModel
  onSelect: (joint: SystemDrivenJointReadModel) => void
}) {
  const operableFields = model.layout?.fields.filter((field) => field.fieldType === 'operable') ?? []
  const coverageByField = operableFields.map((field) => ({
    field,
    entries: model.boundaryCoverage.filter((entry) => entry.fieldId === field.id),
  }))
  const jointById = new Map(model.joints.map((joint) => [joint.id, joint]))

  return (
    <section className="assembly-product-section assembly-boundary-coverage">
      <header>
        <div><span>ПОКРИТИЕ НА ГРАНИЦИТЕ · 01B</span><h3>{model.technicalReadyBoundaryCount}/{model.expectedBoundaryCount} граници имат системен технически преглед</h3></div>
        <small>Всяко отваряемо ПОЛЕ се проверява по четирите страни. Неразпозната граница, липсващ профил, сечение или правило остава видимо блокирано.</small>
      </header>

      {coverageByField.length === 0 ? (
        <p className="assembly-empty-state">Няма отваряемо ПОЛЕ, за което да е необходима сглобка каса/делител ↔ крило.</p>
      ) : (
        <div className="assembly-boundary-coverage-fields">
          {coverageByField.map(({ field, entries }) => (
            <article key={field.id} className="assembly-boundary-coverage-field">
              <header><b>ПОЛЕ {field.sequence}</b><span>{entries.filter((entry) => entry.status === 'resolved').length}/4 страни</span></header>
              <div className="assembly-boundary-coverage-grid">
                {(['left', 'right', 'top', 'bottom'] as const).map((edge) => {
                  const entry = entries.find((candidate) => candidate.edge === edge) ?? null
                  if (!entry) {
                    return (
                      <div key={edge} className="assembly-boundary-coverage-item is-blocked">
                        <span>{EDGE_LABELS[edge]}</span><b>ЛИПСВА ПРОВЕРКА</b><small>Очакваната страна не присъства в coverage read model.</small>
                      </div>
                    )
                  }
                  const joint = entry.jointId ? jointById.get(entry.jointId) ?? null : null
                  const content = (
                    <>
                      <span>{EDGE_LABELS[edge]}</span>
                      <b>{boundaryCoverageStatusLabel(entry)}</b>
                      <small>{entry.supportProfileCode ?? '—'}{entry.sashProfileCode ? ` ↔ ${entry.sashProfileCode}` : ''}</small>
                      {joint?.systemRule && <em>корекция {joint.systemRule.sashEdgeCorrectionMm} mm</em>}
                    </>
                  )
                  return joint ? (
                    <button
                      type="button"
                      key={edge}
                      className={`assembly-boundary-coverage-item is-${entry.status}`}
                      onClick={() => onSelect(joint)}
                      title={entry.noteBg}
                    >{content}</button>
                  ) : (
                    <div key={edge} className={`assembly-boundary-coverage-item is-${entry.status}`} title={entry.noteBg}>{content}</div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {model.blockedBoundaryCount > 0 ? (
        <p className="assembly-boundary-coverage-warning"><b>{model.blockedBoundaryCount} граници са блокирани.</b> FacadeFlow не ги пропуска и не създава заместителна геометрия.</p>
      ) : model.expectedBoundaryCount > 0 ? (
        <p className="assembly-boundary-coverage-ok"><b>Покрити са всички очаквани страни.</b> Това означава системен технически преглед, не производствено потвърждение.</p>
      ) : null}
    </section>
  )
}

function glazingThicknessSourceLabel(source: SystemDrivenFieldGlazingContextReadModel['glazingThicknessSource']): string {
  if (source === 'human-field') return 'човешки въведена стойност за ПОЛЕТО'
  if (source === 'field-override') return 'избран стъклопакет за ПОЛЕТО'
  if (source === 'module-override') return 'избран стъклопакет за модула'
  if (source === 'offer-default') return 'наследено от офертата'
  return 'не е зададено'
}

function glazingCompatibilityLabel(context: SystemDrivenFieldGlazingContextReadModel): string {
  if (context.inputStatus === 'invalid') return 'НЕВАЛИДЕН ВХОД'
  if (context.inputStatus === 'missing') return 'ЛИПСВА КОНТЕКСТ'
  if (context.compatibilityStatus === 'valid') return 'ПОТВЪРДЕНА СЪВМЕСТИМОСТ'
  return 'СЪВМЕСТИМОСТ ЗА ПРОВЕРКА'
}

function FieldGlazingContextPanel({ model }: { model: SystemDrivenModuleReadModel }) {
  return (
    <section className="assembly-product-section assembly-field-glazing-context">
      <header>
        <div><span>ОСТЪКЛЯВАНЕ ПО ПОЛЕТА · 01C</span><h3>{model.glazingInputCompleteCount}/{model.glazingFieldCount} ПОЛЕТА имат пълен входен контекст</h3></div>
        <small>Стъклопакетът и стъклодържателят се свързват с конкретното ПОЛЕ. Тук не се изчислява glazing inset и не се създава монтажна геометрия.</small>
      </header>
      {model.fieldGlazingContexts.length === 0 ? (
        <p className="assembly-empty-state">Няма FIXED или OPERABLE ПОЛЕ с остъкляващ контекст.</p>
      ) : (
        <div className="assembly-field-glazing-grid">
          {model.fieldGlazingContexts.map((context) => (
            <article key={context.fieldId} className={`assembly-field-glazing-card is-${context.inputStatus}`}>
              <header><b>ПОЛЕ {context.fieldSequence}</b><span>{context.fieldType === 'operable' ? 'ОТВАРЯЕМО' : 'FIXED'}</span></header>
              <div><span>Стъклопакет</span><b>{context.glazingThicknessMm !== null ? `${context.glazingThicknessMm} mm` : 'НЕ Е ЗАДАДЕН'}</b><small>{glazingThicknessSourceLabel(context.glazingThicknessSource)}</small></div>
              <div><span>Базов профил</span><b>{context.baseProfileCode ?? 'ЛИПСВА'}</b><small>{context.baseProfileRole ?? 'няма конструктивен контекст'}</small></div>
              <div><span>Стъклодържател</span><b>{context.glazingBeadProfileCode ?? 'НЕ Е ИЗБРАН'}</b><small>{glazingCompatibilityLabel(context)}</small></div>
              <p>{context.noteBg}</p>
            </article>
          ))}
        </div>
      )}
      <p className="assembly-field-glazing-boundary"><b>Граница на знание:</b> пълен входен контекст ≠ доказана bead-to-base съвместимост. Exact glazing inset / seat / glass cut dimensions остават UNKNOWN.</p>
    </section>
  )
}

function JointFieldGlazingContext({ context }: { context: SystemDrivenFieldGlazingContextReadModel | null }) {
  if (!context) return null
  return (
    <section className={`assembly-joint-glazing-context is-${context.inputStatus}`}>
      <header><span>КОНТЕКСТ НА ПОЛЕТО · 01C</span><b>ПОЛЕ {context.fieldSequence} · {context.fieldType === 'operable' ? 'ОТВАРЯЕМО' : 'FIXED'}</b></header>
      <div className="assembly-joint-glazing-context-grid">
        <div><span>Стъклопакет</span><b>{context.glazingThicknessMm !== null ? `${context.glazingThicknessMm} mm` : 'НЕ Е ЗАДАДЕН'}</b><small>{glazingThicknessSourceLabel(context.glazingThicknessSource)}</small></div>
        <div><span>Стъклодържател</span><b>{context.glazingBeadProfileCode ?? 'НЕ Е ИЗБРАН'}</b><small>{glazingCompatibilityLabel(context)}</small></div>
        <div><span>Базов профил</span><b>{context.baseProfileCode ?? 'ЛИПСВА'}</b><small>{context.baseProfileRole ?? '—'}</small></div>
        <div><span>Glazing inset</span><b>UNKNOWN</b><small>не се извежда от дебелина или bead code</small></div>
      </div>
      <p>{context.noteBg}</p>
    </section>
  )
}

function jointGlazingLinkLabel(link: SystemDrivenJointGlazingLinkReadModel): string {
  if (link.linkStatus === 'linked-confirmed') return 'СВЪРЗАНО · ПОТВЪРДЕНО'
  if (link.linkStatus === 'linked-unconfirmed') return 'СВЪРЗАНО · ЗА ПРОВЕРКА'
  if (link.linkStatus === 'base-profile-mismatch') return 'БЛОКИРАНО · BASE PROFILE MISMATCH'
  if (link.linkStatus === 'invalid-input') return 'БЛОКИРАНО · НЕВАЛИДЕН ВХОД'
  if (link.linkStatus === 'missing-input') return 'БЛОКИРАНО · ЛИПСВА ВХОД'
  return 'БЛОКИРАНО · ЛИПСВА FIELD CONTEXT'
}

function JointGlazingLinkagePanel({ model }: { model: SystemDrivenModuleReadModel }) {
  const operableContexts = model.fieldGlazingContexts.filter((context) => context.fieldType === 'operable')
  return (
    <section className="assembly-product-section assembly-joint-glazing-linkage">
      <header>
        <div><span>ОСТЪКЛЯВАНЕ КЪМ ВЪЗЛИТЕ · 01D</span><h3>{model.jointGlazingLinkedCount}/{model.jointGlazingLinkCount} граници са свързани с FIELD glazing context</h3></div>
        <small>01D свързва входния glazing context към точния профилен възел чрез ПОЛЕТО и sash профила. Не позиционира стъкло или стъклодържател в разреза.</small>
      </header>
      {operableContexts.length === 0 ? (
        <p className="assembly-empty-state">Няма отваряемо ПОЛЕ с профилни граници за glazing linkage.</p>
      ) : (
        <div className="assembly-joint-glazing-linkage-grid">
          {operableContexts.map((context) => {
            const links = model.jointGlazingLinks.filter((link) => link.fieldId === context.fieldId)
            const linked = links.filter((link) => link.linkStatus === 'linked-confirmed' || link.linkStatus === 'linked-unconfirmed').length
            const blocked = links.length - linked
            return (
              <article key={context.fieldId} className={`assembly-joint-glazing-linkage-card ${blocked > 0 ? 'is-blocked' : 'is-linked'}`}>
                <header><b>ПОЛЕ {context.fieldSequence}</b><span>{linked}/{links.length} ВЪЗЛА</span></header>
                <div><span>Стъклопакет</span><b>{context.glazingThicknessMm !== null ? `${context.glazingThicknessMm} mm` : 'НЕ Е ЗАДАДЕН'}</b></div>
                <div><span>Glazing base ↔ sash</span><b>{context.baseProfileCode ?? '—'} ↔ {links[0]?.jointSashProfileCode ?? '—'}</b><small>{links.length > 0 && links.every((link) => link.baseProfileMatchesJoint === true) ? 'СЪВПАДА ЗА ВСИЧКИ ГРАНИЦИ' : 'ИМА БЛОКИРАНА ВРЪЗКА'}</small></div>
                <div><span>Стъклодържател</span><b>{context.glazingBeadProfileCode ?? 'НЕ Е ИЗБРАН'}</b><small>{glazingCompatibilityLabel(context)}</small></div>
                <p>{blocked > 0 ? `${blocked} граници са блокирани и не получават glazing linkage.` : 'Всички профилни граници на ПОЛЕТО използват един и същ входен glazing context.'}</p>
              </article>
            )
          })}
        </div>
      )}
      <p className="assembly-joint-glazing-linkage-boundary"><b>Граница на знание:</b> linked FIELD context ≠ доказана позиция в сечението. Glazing inset / seat / bead placement / glass cut dimensions остават UNKNOWN.</p>
    </section>
  )
}

function JointGlazingLink({ link }: { link: SystemDrivenJointGlazingLinkReadModel | null }) {
  if (!link) return null
  const isLinked = link.linkStatus === 'linked-confirmed' || link.linkStatus === 'linked-unconfirmed'
  return (
    <section className={`assembly-joint-glazing-link is-${isLinked ? 'linked' : 'blocked'}`}>
      <header><span>GLAZING LINK КЪМ ВЪЗЕЛА · 01D</span><b>{jointGlazingLinkLabel(link)}</b></header>
      <div className="assembly-joint-glazing-link-grid">
        <div><span>ПОЛЕ → възел</span><b>ПОЛЕ {link.fieldSequence} → {EDGE_LABELS[link.edge]}</b><small>{link.fieldGlazingContextId ?? 'няма FIELD context'}</small></div>
        <div><span>Base profile ↔ sash</span><b>{link.baseProfileCode ?? '—'} ↔ {link.jointSashProfileCode ?? '—'}</b><small>{link.baseProfileMatchesJoint === true ? 'СЪВПАДА' : link.baseProfileMatchesJoint === false ? 'НЕ СЪВПАДА' : 'НЕ МОЖЕ ДА СЕ ПРОВЕРИ'}</small></div>
        <div><span>Стъклопакет / bead</span><b>{link.glazingThicknessMm !== null ? `${link.glazingThicknessMm} mm` : '—'} · {link.glazingBeadProfileCode ?? 'НЕ Е ИЗБРАН'}</b><small>{link.compatibilityStatus ?? 'липсва compatibility context'}</small></div>
        <div><span>Позиция в разреза</span><b>UNKNOWN</b><small>inset · seat · bead placement · glass cut</small></div>
      </div>
      <p>{link.noteBg}</p>
    </section>
  )
}

function glazingEvidenceTierLabel(evidence: SystemDrivenJointGlazingEvidenceReadModel): string {
  if (evidence.evidenceTier === 'placement-reviewed') return 'ПОЗИЦИЯТА Е ПРОВЕРЕНА'
  if (evidence.evidenceTier === 'compatibility-reviewed') return 'СЪВМЕСТИМОСТТА Е ПРОВЕРЕНА'
  if (evidence.evidenceTier === 'catalogue-supported') return 'КАТАЛОГОВО ПОДКРЕПЕНО'
  if (evidence.evidenceTier === 'input-context') return 'САМО ВХОДЕН КОНТЕКСТ'
  return 'БЛОКИРАНО'
}

function GlazingEvidenceStatusPanel({ model }: { model: SystemDrivenModuleReadModel }) {
  const operableContexts = model.fieldGlazingContexts.filter((context) => context.fieldType === 'operable')
  return (
    <section className="assembly-product-section assembly-glazing-evidence-status">
      <header>
        <div><span>ДОКАЗАТЕЛСТВА ЗА ОСТЪКЛЯВАНЕ · 01E</span><h3>{model.glazingEvidenceCatalogueSupportedCount}/{model.glazingEvidenceCount} възела имат каталогово доказателство за bead/thickness</h3></div>
        <small>01E разделя входните данни, каталожното доказателство, bead-to-base съвместимостта и монтажната позиция. По-високо ниво не се извежда от по-ниско.</small>
      </header>
      {operableContexts.length === 0 ? (
        <p className="assembly-empty-state">Няма отваряемо ПОЛЕ с glazing evidence status.</p>
      ) : (
        <div className="assembly-glazing-evidence-grid">
          {operableContexts.map((context) => {
            const evidence = model.jointGlazingEvidence.filter((entry) => entry.fieldId === context.fieldId)
            const catalogue = evidence.filter((entry) => entry.catalogueThicknessEvidenceStatus === 'supported').length
            const compatibility = evidence.filter((entry) => entry.beadToBaseEvidenceStatus === 'reviewed').length
            const placement = evidence.filter((entry) => entry.placementEvidenceStatus === 'reviewed').length
            const blocked = evidence.filter((entry) => entry.evidenceTier === 'blocked').length
            return (
              <article key={context.fieldId} className={`assembly-glazing-evidence-card ${blocked > 0 ? 'is-blocked' : 'is-evidence'}`}>
                <header><b>ПОЛЕ {context.fieldSequence}</b><span>{evidence.length} ВЪЗЛА</span></header>
                <div><span>Входен context</span><b>{context.inputStatus === 'complete' ? 'ПЪЛЕН' : context.inputStatus === 'missing' ? 'ЛИПСВА' : 'НЕВАЛИДЕН'}</b><small>{context.glazingThicknessMm !== null ? `${context.glazingThicknessMm} mm` : 'без дебелина'} · {context.glazingBeadProfileCode ?? 'без bead'}</small></div>
                <div><span>Каталог bead ↔ thickness</span><b>{catalogue}/{evidence.length}</b><small>доказва само номиналната връзка bead/thickness</small></div>
                <div><span>Bead ↔ base profile</span><b>{compatibility}/{evidence.length}</b><small>{compatibility === evidence.length && evidence.length > 0 ? 'REVIEWED' : 'НЕ Е ДОКАЗАНО'}</small></div>
                <div><span>Позиция / glass cut</span><b>{placement}/{evidence.length}</b><small>inset · seat · bead placement · cut остават UNKNOWN</small></div>
              </article>
            )
          })}
        </div>
      )}
      <p className="assembly-glazing-evidence-boundary"><b>Граница на знание:</b> каталогов bead/thickness match ≠ bead-to-base съвместимост ≠ монтажна позиция. AUTOMATIC GEOMETRY: NO · MACHINE READY: NO.</p>
    </section>
  )
}

function JointGlazingEvidence({ evidence }: { evidence: SystemDrivenJointGlazingEvidenceReadModel | null }) {
  if (!evidence) return null
  return (
    <section className={`assembly-joint-glazing-evidence is-${evidence.evidenceTier}`}>
      <header><span>GLAZING EVIDENCE КЪМ ВЪЗЕЛА · 01E</span><b>{glazingEvidenceTierLabel(evidence)}</b></header>
      <div className="assembly-joint-glazing-evidence-grid">
        <div><span>Входен context</span><b>{evidence.inputContextStatus.toUpperCase()}</b><small>{evidence.glazingThicknessMm !== null ? `${evidence.glazingThicknessMm} mm` : '—'} · {evidence.selectedBeadProfileCode ?? 'без bead'}</small></div>
        <div><span>Каталог bead ↔ thickness</span><b>{evidence.catalogueThicknessEvidenceStatus === 'supported' ? 'SUPPORTED' : evidence.catalogueThicknessEvidenceStatus.toUpperCase()}</b><small>{evidence.catalogueEvidenceSourceLabel ?? 'няма catalog evidence source'}</small></div>
        <div><span>Bead ↔ base profile</span><b>{evidence.beadToBaseEvidenceStatus.toUpperCase()}</b><small>отделно reviewed compatibility правило</small></div>
        <div><span>Позиция / glass cut</span><b>{evidence.placementEvidenceStatus.toUpperCase()} / {evidence.glassCutEvidenceStatus.toUpperCase()}</b><small>не се извежда от bead/thickness каталожен match</small></div>
      </div>
      <p>{evidence.noteBg}</p>
    </section>
  )
}

function glazingGapKindLabel(kind: SystemDrivenModuleReadModel['glazingEvidenceGaps'][number]['kind']): string {
  if (kind === 'field-input') return 'ВХОДНИ ДАННИ'
  if (kind === 'catalogue-bead-thickness') return 'КАТАЛОГОВО ДОКАЗАТЕЛСТВО'
  if (kind === 'bead-base-compatibility') return 'BEAD ↔ BASE REVIEW'
  if (kind === 'placement-evidence') return 'ПОЗИЦИЯ В СКИЦАТА'
  return 'GLASS CUT RULE'
}

function GlazingEvidenceGapPanel({ model }: { model: SystemDrivenModuleReadModel }) {
  return (
    <section className="assembly-product-section assembly-glazing-gap-registry">
      <header>
        <div><span>ЛИПСВАЩИ ДОКАЗАТЕЛСТВА · 01F</span><h3>{model.glazingEvidenceOpenGapCount} уникални отворени празнини</h3></div>
        <small>01F събира повтарящите се блокери по правило. Осем еднакви възела не се представят като осем различни неизвестни.</small>
      </header>
      {model.glazingEvidenceGaps.length === 0 ? (
        <p className="assembly-empty-state">Няма отворени glazing evidence gaps за този модул.</p>
      ) : (
        <div className="assembly-glazing-gap-grid">
          {model.glazingEvidenceGaps.map((gap) => (
            <article key={gap.id} className={`assembly-glazing-gap-card is-${gap.kind}`}>
              <header><b>{glazingGapKindLabel(gap.kind)}</b><span>{gap.occurrenceCount} {gap.jointIds.length > 0 ? 'ВЪЗЛА' : 'ПОЛЕТА'}</span></header>
              <div className="assembly-glazing-gap-facts">
                <span>ПОЛЕТА</span><b>{gap.fieldSequences.length > 0 ? gap.fieldSequences.join(', ') : '—'}</b>
                <span>Контекст</span><b>{gap.baseProfileCode ?? '—'} {gap.beadProfileCode ? `↔ ${gap.beadProfileCode}` : ''}{gap.glazingThicknessMm !== null ? ` · ${gap.glazingThicknessMm} mm` : ''}</b>
              </div>
              <p>{gap.reasonBg}</p>
              <small><b>Нужно доказателство:</b> {gap.requiredEvidenceBg}</small>
            </article>
          ))}
        </div>
      )}
      <p className="assembly-glazing-gap-boundary"><b>01F не попълва липсващото знание.</b> Той показва точно кое правило/доказателство липсва и колко реални възела блокира. AUTOMATIC GEOMETRY: NO · MACHINE READY: NO.</p>
    </section>
  )
}


function glazingReviewStateLabel(item: SystemDrivenModuleReadModel['glazingEvidenceReviewItems'][number]): string {
  if (item.acceptedEvidenceStatus === 'reviewed') return 'HUMAN REVIEW ЗАПИСАН'
  if (item.reviewState === 'reference-candidate') return 'ИМА РЕФЕРЕНТЕН КАНДИДАТ'
  if (item.reviewState === 'human-input-required') return 'ЧАКА ЧОВЕШКИ ВХОД'
  return 'ЧАКА ДОКАЗАТЕЛСТВО'
}

function GlazingEvidenceReviewGatePanel({ model }: { model: SystemDrivenModuleReadModel }) {
  return (
    <section className="assembly-product-section assembly-glazing-review-gate">
      <header>
        <div><span>ПРЕГЛЕД НА ДОКАЗАТЕЛСТВАТА · 01G</span><h3>{model.glazingEvidenceReviewCandidateCount}/{model.glazingEvidenceReviewItems.length} празнини имат референтен кандидат · {model.glazingEvidenceReviewedCount} reviewed</h3></div>
        <small>01G не приема автоматично кандидатите. Той разделя „има референция“ от „има human-reviewed правило“ и държи производствения gate затворен.</small>
      </header>
      {model.glazingEvidenceReviewItems.length === 0 ? (
        <p className="assembly-empty-state">Няма отворени evidence review items за този модул.</p>
      ) : (
        <div className="assembly-glazing-review-grid">
          {model.glazingEvidenceReviewItems.map((item) => (
            <article key={item.id} className={`assembly-glazing-review-card is-${item.reviewState}${item.acceptedEvidenceStatus === 'reviewed' ? ' is-human-reviewed' : ''}`}>
              <header><b>{glazingGapKindLabel(item.gapKind)}</b><span>{glazingReviewStateLabel(item)}</span></header>
              <div className="assembly-glazing-review-facts">
                <span>ПОЛЕТА</span><b>{item.fieldSequences.length > 0 ? item.fieldSequences.join(', ') : '—'}</b>
                <span>Блокира</span><b>{item.occurrenceCount} {item.occurrenceCount === 1 ? 'възел' : 'възела'}</b>
                <span>Контекст</span><b>{item.baseProfileCode ?? '—'} {item.beadProfileCode ? `↔ ${item.beadProfileCode}` : ''}{item.glazingThicknessMm !== null ? ` · ${item.glazingThicknessMm} mm` : ''}</b>
              </div>
              {item.candidateSourceLabelBg ? (
                <div className="assembly-glazing-review-candidate">
                  <span>Референтен кандидат</span>
                  <b>{item.candidateSourceLabelBg}</b>
                  {item.candidateSourceLocatorBg && <small><b>Локатор:</b> {item.candidateSourceLocatorBg}</small>}
                  {item.candidateSourceVerifiedLocatorBg && <small><b>Проверен локатор:</b> {item.candidateSourceVerifiedLocatorBg}</small>}
                  {item.candidateSourceSection && <small><b>Секция:</b> {item.candidateSourceSection}{item.candidateSourcePage !== null ? ` · отпечатана стр. ${item.candidateSourcePage}` : ''}{item.candidateSourcePdfViewerPage !== null ? ` · PDF viewer ${item.candidateSourcePdfViewerPage}/106` : ''}</small>}
                  <small>{item.candidateSummaryBg}</small>
                  {(item.candidateSourceOpenUrl ?? item.candidateSourceUrl) && <a className="assembly-evidence-source-link" href={item.candidateSourceOpenUrl ?? item.candidateSourceUrl ?? undefined} target="_blank" rel="noreferrer">Отвори официалната техническа скица · точна страница</a>}
                </div>
              ) : (
                <div className="assembly-glazing-review-candidate is-empty">
                  <span>Qualified кандидат</span>
                  <b>НЯМА</b>
                  <small>Не се използва по-слабо доказателство само за да се затвори празнината.</small>
                </div>
              )}
              <p>{item.requiredReviewBg}</p>
              {item.candidateEvidenceId && item.acceptedEvidenceStatus !== 'reviewed' && (
                <div className="assembly-evidence-review-instruction">
                  <b>EVIDENCE REVIEW · 01B</b>
                  <span>За изричен human review: запиши текущата ревизия, отвори „РЕВИЗИИ И ПРОВЕРКИ“, избери съответното „Официална скица…“ твърдение и го потвърди.</span>
                </div>
              )}
              <footer>
                <span>Прието доказателство</span>
                <b>{item.acceptedEvidenceStatus === 'reviewed' ? 'HUMAN-REVIEWED' : 'НЯМА'}</b>
                <small>{item.acceptedEvidenceStatus === 'reviewed'
                  ? `${item.reviewedByLabel ?? 'Локален оператор'} · ${item.reviewedAt ? new Date(item.reviewedAt).toLocaleString('bg-BG') : 'време неизвестно'} · human review ≠ production rule.`
                  : 'Правило не може да бъде повишено автоматично.'}</small>
              </footer>
            </article>
          ))}
        </div>
      )}
      <p className="assembly-evidence-acquisition-note"><b>EVIDENCE ACQUISITION · 01A:</b> официалните source-bound технически скици могат да запълнят review queue, но не затварят празнина без explicit human review.</p>
      <p className="assembly-evidence-review-note"><b>EVIDENCE REVIEW · 01B:</b> human review се записва през „РЕВИЗИИ И ПРОВЕРКИ“ към точната source-bound скица. Потвърждението не създава автоматично compatibility, placement или production правило.</p>
      <p className="assembly-glazing-review-boundary"><b>Review gate:</b> reference candidate ≠ reviewed evidence ≠ production rule. RULE PROMOTION: NO · AUTOMATIC GEOMETRY: NO · MACHINE READY: NO.</p>
    </section>
  )
}


function OperatorWorkflowSummary({ model }: { model: SystemDrivenModuleReadModel }) {
  const fields = model.layout?.fields ?? []
  const operableCount = fields.filter((field) => field.fieldType === 'operable').length
  const fixedCount = fields.filter((field) => field.fieldType === 'fixed').length
  const glazingThicknesses = Array.from(new Set(
    model.fieldGlazingContexts
      .map((context) => context.glazingThicknessMm)
      .filter((value): value is number => value !== null),
  ))
  const beadCodes = Array.from(new Set(
    model.fieldGlazingContexts
      .map((context) => context.glazingBeadProfileCode)
      .filter((value): value is string => Boolean(value)),
  ))

  return (
    <section className="assembly-operator-start">
      <header>
        <div><span>РАБОТЕН ПОТОК</span><h3>От изделието до техническата скица</h3></div>
        <strong>{model.systemLabel}</strong>
      </header>
      <div className="assembly-operator-steps" aria-label="Работен поток на FacadeFlow">
        <div><i>1</i><b>Конструкция</b><small>Размери · ПОЛЕТА · делители</small></div>
        <span>→</span>
        <div><i>2</i><b>Функция</b><small>FIXED / ОТВАРЯЕМО</small></div>
        <span>→</span>
        <div><i>3</i><b>Система и остъкляване</b><small>Профили · стъклопакет · държател</small></div>
        <span>→</span>
        <div><i>4</i><b>Сглобки</b><small>FacadeFlow показва техническата скица</small></div>
      </div>
      <div className="assembly-operator-summary-grid">
        <div><span>Модул</span><b>{model.moduleSequence ?? '—'} · {moduleProductTypeLabel(model)}</b><small>{fields.length} ПОЛЕТА · {operableCount} отваряеми · {fixedCount} FIXED</small></div>
        <div><span>Профилна система</span><b>{model.systemLabel}</b><small>профилите се вземат от избраната система</small></div>
        <div><span>Стъклопакет</span><b>{glazingThicknesses.length ? glazingThicknesses.map((value) => `${value} mm`).join(' · ') : 'Не е зададен'}</b><small>{beadCodes.length ? `държател ${beadCodes.join(' · ')}` : 'държателят не е избран'}</small></div>
        <div><span>Сглобки</span><b>{model.uniqueJointTypeCount} типа · {model.resolvedBoundaryCount} места</b><small>изведени автоматично от границите на ПОЛЕТАТА</small></div>
      </div>
    </section>
  )
}

function OperatorGlazingSummary({ model }: { model: SystemDrivenModuleReadModel }) {
  return (
    <section className="assembly-product-section assembly-operator-glazing">
      <header>
        <div><span>ОСТЪКЛЯВАНЕ</span><h3>Зададените параметри по ПОЛЕ</h3></div>
        <small>Това е операторският контекст, който влиза в сглобката.</small>
      </header>
      {model.fieldGlazingContexts.length === 0 ? (
        <p className="assembly-empty-state">Още няма ПОЛЕ със зададен стъклопакет.</p>
      ) : (
        <div className="assembly-operator-glazing-grid">
          {model.fieldGlazingContexts.map((context) => (
            <article key={context.fieldId} className={`is-${context.inputStatus}`}>
              <header><b>ПОЛЕ {context.fieldSequence}</b><span>{context.fieldType === 'operable' ? 'ОТВАРЯЕМО' : 'FIXED'}</span></header>
              <div><span>Стъклопакет</span><b>{context.glazingThicknessMm !== null ? `${context.glazingThicknessMm} mm` : '—'}</b></div>
              <div><span>Стъклодържател</span><b>{context.glazingBeadProfileCode ?? '—'}</b></div>
              <div><span>Базов профил</span><b>{context.baseProfileCode ?? '—'}</b></div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function OperatorJointChooser({ model, onSelect }: { model: SystemDrivenModuleReadModel; onSelect: (joint: SystemDrivenJointReadModel) => void }) {
  const firstJointForEntry = (entry: SystemDrivenJointLibraryReadModel): SystemDrivenJointReadModel | null => {
    const firstId = entry.occurrenceJointIds[0]
    return model.joints.find((joint) => joint.id === firstId) ?? null
  }

  return (
    <section className="assembly-product-section assembly-operator-joints">
      <header>
        <div><span>СГЛОБКИ / ТЕХНИЧЕСКИ СКИЦИ</span><h3>Избери сглобка</h3></div>
        <small>Еднаквата двойка профили се показва веднъж и се използва на всички съответни страни.</small>
      </header>
      {model.jointLibrary.length === 0 ? (
        <p className="assembly-empty-state">Няма сглобка за показване. Провери функциите на ПОЛЕТАТА и избраните профили.</p>
      ) : (
        <div className="assembly-operator-joint-grid">
          {model.jointLibrary.map((entry) => {
            const joint = firstJointForEntry(entry)
            return (
              <article key={entry.key}>
                <div className="assembly-operator-joint-title">
                  <span>{entry.boundaryLabelBg}</span>
                  <b>{entry.supportProfileCode} + {entry.sashProfileCode}</b>
                  <small>използва се на {entry.occurrenceCount} {entry.occurrenceCount === 1 ? 'място' : 'места'}</small>
                </div>
                <div className="assembly-operator-joint-state">
                  <span>{entry.systemRuleStatus === 'available' ? 'СИСТЕМНА СГЛОБКА' : 'ЛИПСВА СИСТЕМНО ПРАВИЛО'}</span>
                </div>
                <button type="button" disabled={!joint} onClick={() => joint && onSelect(joint)}>Отвори техническата скица</button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function OperatorJointParameters({ joint, context }: { joint: SystemDrivenJointReadModel; context: SystemDrivenFieldGlazingContextReadModel | null }) {
  const system = getProfileSystemById(joint.systemId)
  const support = getOperatorWorkingProfileDimensions(joint.systemId, joint.supportProfileCode)
  const sash = getOperatorWorkingProfileDimensions(joint.systemId, joint.sashProfileCode)

  return (
    <section className="assembly-operator-joint-parameters">
      <header><span>ПАРАМЕТРИ НА СГЛОБКАТА</span><b>{system?.name ?? joint.systemId}</b></header>
      <div className="assembly-operator-joint-parameter-grid">
        <div><span>Страна</span><b>ПОЛЕ {joint.fieldSequence} · {EDGE_LABELS[joint.edge]}</b><small>{joint.boundaryLabelBg}</small></div>
        <div><span>Опорен профил</span><b>{joint.supportProfileCode ?? '—'}</b><small>{support ? `${support.sectionHeightMm} mm общ · ${support.visibleWidthMm} mm видима · ${support.internalZoneTotalMm} mm вътрешна зона` : joint.supportLabelBg}</small></div>
        <div><span>Крило</span><b>{joint.sashProfileCode ?? '—'}</b><small>{sash ? `${sash.sectionHeightMm} mm общ · ${sash.visibleWidthMm} mm видима · ${sash.internalZoneTotalMm} mm вътрешна зона` : '—'}</small></div>
        <div><span>Стъклопакет</span><b>{context?.glazingThicknessMm !== null && context?.glazingThicknessMm !== undefined ? `${context.glazingThicknessMm} mm` : '—'}</b><small>стъклодържател {context?.glazingBeadProfileCode ?? '—'}</small></div>
        <div><span>Системна корекция</span><b>{joint.systemRule ? `${joint.systemRule.sashEdgeCorrectionMm} mm` : '—'}</b><small>за {EDGE_LABELS[joint.edge]}</small></div>
      </div>
      <p><b>Работна логика:</b> общ размер − видима ширина = вътрешна профилна зона. Тази разлика описва профила и не се приема автоматично за монтажно застъпване.</p>
    </section>
  )
}

function ModuleSystemSummary({ model }: { model: SystemDrivenModuleReadModel }) {
  const required = model.components.filter((component) => component.status !== 'not-required')
  const missing = required.filter((component) => component.status === 'missing-profile')

  return (
    <section className="assembly-system-summary">
      <header>
        <div><span>СИСТЕМА НА МОДУЛА</span><h3>{model.systemLabel}</h3></div>
        <strong>{moduleProductTypeLabel(model)}</strong>
      </header>
      <div className="assembly-system-summary-grid">
        <div><span>Компоненти</span><b>{model.resolvedComponentCount}/{model.requiredComponentCount}</b><small>реално избрани от системата</small></div>
        <div><span>Граници</span><b>{model.resolvedBoundaryCount}/{model.expectedBoundaryCount}</b><small>разпознати от topology на отваряемите ПОЛЕТА</small></div>
        <div><span>Типове възли</span><b>{model.uniqueJointTypeCount}</b><small>еднаквите двойки профили се използват повторно</small></div>
        <div><span>Техническо покритие</span><b>{model.technicalReadyBoundaryCount}/{model.expectedBoundaryCount}</b><small>проверено сечение + системно правило</small></div>
      </div>
      {missing.length > 0 && <p className="assembly-system-warning">Липсват профилни избори: {missing.map((component) => component.targetLabelBg).join(' · ')}</p>}
      {model.expectedBoundaryCount > 0 && <p className="assembly-system-rule-note">Системни правила: {model.systemRuleJointCount}/{model.expectedBoundaryCount} · точна монтажна геометрия: {model.verifiedJointCount}/{model.expectedBoundaryCount}. Системният преглед и производственото доказателство са отделни нива на знание.</p>}
    </section>
  )
}

function ComponentTable({ model }: { model: SystemDrivenModuleReadModel }) {
  const required = model.components.filter((component) => component.status !== 'not-required')
  return (
    <section className="assembly-product-section">
      <header><div><span>КОМПОНЕНТИ</span><h3>От какво е изграден Модул {model.moduleSequence ?? '—'}</h3></div><small>Ролята идва от системата; конкретният код идва от избора в дясното меню.</small></header>
      {required.length === 0 ? <p className="assembly-empty-state">Начертай модула и избери профилната система.</p> : (
        <div className="assembly-component-table" role="table" aria-label="Компоненти на модула">
          <div className="assembly-component-row is-head" role="row"><span>Елемент</span><span>Профил</span><span>Видима част</span><span>Армировка</span></div>
          {required.map((component) => (
            <div className={`assembly-component-row ${component.status === 'resolved' ? 'is-resolved' : 'is-missing'}`} role="row" key={component.id}>
              <span><b>{component.targetLabelBg}</b><small>{COMPONENT_KIND_LABELS[component.kind]}</small></span>
              <span>
                <b>{component.profileCode ?? 'Не е избран'}</b>
                <small>{component.profileLabelBg ?? '—'}</small>
                {component.kind === 'glass-bead' && component.glazingThicknessMm !== null && component.systemRecommendedProfileCode && (
                  <small className={`assembly-system-component-rule is-${component.systemRecommendationStatus}`}>
                    правило {component.glazingThicknessMm} mm → {component.systemRecommendedProfileCode}{component.systemRecommendationStatus === 'matched' ? ' · съвпада' : component.systemRecommendationStatus === 'different' ? ' · различен избор' : ' · налично'}
                  </small>
                )}
              </span>
              <span><b>{component.visibleFaceReviewed ? `${component.visibleFaceMm} mm` : 'НЕИЗВЕСТНА'}</b><small>{component.visibleFaceReviewed ? 'human-confirmed' : 'не се извежда от суровите числа'}</small></span>
              <span><b>{component.reinforcementCode ?? '—'}</b><small>{component.reinforcementThicknessMm !== null ? `${component.reinforcementThicknessMm} mm` : 'няма избрана'}</small></span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ModuleAssemblyMap({ model, onSelect }: { model: SystemDrivenModuleReadModel; onSelect: (joint: SystemDrivenJointReadModel) => void }) {
  const layout = model.layout
  if (!layout) {
    return <section className="assembly-product-section"><p className="assembly-empty-state">Няма конструктивна геометрия за картата на модула.</p></section>
  }

  const padding = Math.max(90, Math.round(Math.min(layout.widthMm, layout.heightMm) * 0.08))
  const viewWidth = layout.widthMm + padding * 2
  const viewHeight = layout.heightMm + padding * 2
  const frameFace = layout.systemFrameVisibleFaceReviewed && layout.systemFrameVisibleFaceMm !== null
    ? layout.systemFrameVisibleFaceMm
    : layout.schematicFrameFaceMm
  const frameFaceStatus = layout.systemFrameVisibleFaceReviewed ? 'потвърдена от системата' : 'схематична'
  const markerPoint = (joint: SystemDrivenJointReadModel): { x: number; y: number } | null => {
    const field = layout.fields.find((entry) => entry.id === joint.fieldId)
    if (!field) return null
    if (joint.edge === 'left') return { x: field.xMm, y: field.yMm + field.heightMm / 2 }
    if (joint.edge === 'right') return { x: field.xMm + field.widthMm, y: field.yMm + field.heightMm / 2 }
    if (joint.edge === 'top') return { x: field.xMm + field.widthMm / 2, y: field.yMm }
    return { x: field.xMm + field.widthMm / 2, y: field.yMm + field.heightMm }
  }
  const indexedJoints = model.joints.map((joint, index) => ({ joint, index }))
  const jointGroups = layout.fields
    .map((field) => ({
      field,
      joints: indexedJoints.filter(({ joint }) => joint.fieldId === field.id),
    }))
    .filter((group) => group.joints.length > 0)

  return (
    <section className="assembly-product-section assembly-map-section">
      <header>
        <div><span>КОНСТРУКТИВНА КАРТА</span><h3>Модул {model.moduleSequence ?? '—'} · профили и възли на едно място</h3></div>
        <small>Видимите части идват от избраната система. Всяка граница се разрешава до роля и конкретна двойка профили.</small>
      </header>
      <div className="assembly-map-layout">
        <div className="assembly-map-canvas">
          <svg viewBox={`${-padding} ${-padding} ${viewWidth} ${viewHeight}`} role="img" aria-label={`Конструктивна карта на Модул ${model.moduleSequence ?? ''}`}>
            <rect className="assembly-map-frame" x="0" y="0" width={layout.widthMm} height={layout.heightMm} rx="4" />
            <rect
              className="assembly-map-frame-inner"
              x={frameFace}
              y={frameFace}
              width={Math.max(0, layout.widthMm - frameFace * 2)}
              height={Math.max(0, layout.heightMm - frameFace * 2)}
            />

            {layout.dividers.map((divider) => {
              const face = divider.systemVisibleFaceReviewed && divider.systemVisibleFaceMm !== null
                ? divider.systemVisibleFaceMm
                : divider.schematicFaceMm
              const center = divider.positionMm + divider.schematicFaceMm / 2
              return divider.axis === 'vertical'
                ? <rect key={divider.id} className={`assembly-map-divider ${divider.systemVisibleFaceReviewed ? 'is-reviewed' : ''}`} x={center - face / 2} y={divider.startMm} width={face} height={Math.max(0, divider.endMm - divider.startMm)} />
                : <rect key={divider.id} className={`assembly-map-divider ${divider.systemVisibleFaceReviewed ? 'is-reviewed' : ''}`} x={divider.startMm} y={center - face / 2} width={Math.max(0, divider.endMm - divider.startMm)} height={face} />
            })}

            {layout.fields.map((field) => (
              <g key={field.id} className={`assembly-map-field is-${field.fieldType ?? 'unset'}`}>
                <rect x={field.xMm} y={field.yMm} width={field.widthMm} height={field.heightMm} />
                {field.fieldType === 'operable' && <>
                  <line x1={field.xMm} y1={field.yMm} x2={field.xMm + field.widthMm} y2={field.yMm + field.heightMm} />
                  <line x1={field.xMm + field.widthMm} y1={field.yMm} x2={field.xMm} y2={field.yMm + field.heightMm} />
                </>}
                <text x={field.xMm + field.widthMm / 2} y={field.yMm + field.heightMm / 2 - 12} textAnchor="middle">ПОЛЕ {field.sequence}</text>
                <text className="assembly-map-field-type" x={field.xMm + field.widthMm / 2} y={field.yMm + field.heightMm / 2 + 16} textAnchor="middle">{fieldTypeLabel(field.fieldType)}</text>
              </g>
            ))}

            {model.joints.map((joint, index) => {
              const point = markerPoint(joint)
              if (!point) return null
              const label = jointMarkerLabel(index)
              return (
                <g
                  key={joint.id}
                  className={`assembly-map-joint ${operatorJointStatusClass(joint)}`}
                  transform={`translate(${point.x} ${point.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label}: ${joint.supportLabelBg} ${joint.supportProfileCode ?? ''} към крило ${joint.sashProfileCode ?? ''}`}
                  onClick={() => onSelect(joint)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(joint)
                    }
                  }}
                >
                  <circle r="24" />
                  <text textAnchor="middle" dominantBaseline="central">{label}</text>
                </g>
              )
            })}
          </svg>
          <div className="assembly-map-dimensions">
            <span>{Math.round(layout.widthMm)} mm</span>
            <span>{Math.round(layout.heightMm)} mm</span>
          </div>
          <p className="assembly-map-face-note">Каса: {frameFace} mm видима част · {frameFaceStatus}{layout.angledDividerCount > 0 ? ` · ${layout.angledDividerCount} ъглов делител остава само в topology` : ''}</p>
        </div>

        <div className="assembly-map-joint-index" aria-label="Индекс на сглобките">
          <div className="assembly-map-joint-index-head"><b>{model.resolvedBoundaryCount}/{model.expectedBoundaryCount} разпознати граници</b><span>{model.technicalReadyBoundaryCount} системни прегледа</span></div>
          {jointGroups.length === 0 ? <p>Няма сглобки за показване.</p> : jointGroups.map(({ field, joints }) => (
            <section className="assembly-map-field-group" key={field.id}>
              <header><b>ПОЛЕ {field.sequence}</b><span>{fieldTypeLabel(field.fieldType)} · {joints.length} граници</span></header>
              {joints.map(({ joint, index }) => (
                <button type="button" key={joint.id} className={`assembly-map-joint-row ${operatorJointStatusClass(joint)}`} onClick={() => onSelect(joint)}>
                  <strong>{jointMarkerLabel(index)}</strong>
                  <span>
                    <b>{EDGE_LABELS[joint.edge]} · <em>{joint.boundaryLabelBg}</em></b>
                    <small>{joint.supportProfileCode ?? '—'} ↔ {joint.sashProfileCode ?? '—'}{joint.supportVisibleFaceReviewed && joint.supportVisibleFaceMm !== null ? ` · опора ${joint.supportVisibleFaceMm} mm видима част` : ''}</small>
                  </span>
                  <i>{joint.systemRuleStatus === 'available' ? '✓' : joint.evidenceStatus === 'invalid-role' ? '×' : '!'}</i>
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}


function JointLibrary({
  model,
  drafts,
  onSelect,
}: {
  model: SystemDrivenModuleReadModel
  drafts: Readonly<Record<string, CustomJointDraft>>
  onSelect: (joint: SystemDrivenJointReadModel) => void
}) {
  const markerForJointId = (jointId: string): string => {
    const index = model.joints.findIndex((joint) => joint.id === jointId)
    return index >= 0 ? jointMarkerLabel(index) : '—'
  }
  const firstJointForEntry = (entry: SystemDrivenJointLibraryReadModel): SystemDrivenJointReadModel | null => {
    const firstId = entry.occurrenceJointIds[0]
    return model.joints.find((joint) => joint.id === firstId) ?? null
  }

  return (
    <section className="assembly-product-section assembly-joint-library">
      <header>
        <div><span>БИБЛИОТЕКА НА ВЪЗЛИТЕ</span><h3>{model.uniqueJointTypeCount} типа за {model.resolvedBoundaryCount} разпознати граници</h3></div>
        <small>Един тип възел се използва повторно на всички съвпадащи граници; страната определя ориентацията и системната корекция.</small>
      </header>
      {model.jointLibrary.length === 0 ? <p className="assembly-empty-state">Още няма разрешени двойки профили за библиотеката.</p> : (
        <div className="assembly-joint-library-grid">
          {model.jointLibrary.map((entry, index) => {
            const firstJoint = firstJointForEntry(entry)
            const markers = entry.occurrenceJointIds.map(markerForJointId)
            const draft = drafts[entry.key] ?? null
            return (
              <article className={`assembly-joint-library-card ${entry.systemRuleStatus === 'available' ? 'has-rule' : 'no-rule'}`} key={entry.key}>
                <div className="assembly-joint-library-title">
                  <span>J{index + 1}</span>
                  <div><b>{entry.boundaryLabelBg}</b><strong>{entry.supportProfileCode} ↔ {entry.sashProfileCode}</strong></div>
                </div>
                <div className="assembly-joint-library-statuses">
                  <span className={entry.systemRuleStatus === 'available' ? 'is-ready' : 'is-missing'}>Системно правило: {entry.systemRuleStatus === 'available' ? 'ДА' : 'НЕ'}</span>
                  <span className={entry.exactGeometryStatus === 'verified' ? 'is-ready' : 'is-locked'}>Точен разрез: {entry.exactGeometryStatus === 'verified' ? 'ПРОВЕРЕН' : 'ЗАКЛЮЧЕН'}</span>
                  <span className={draft ? 'is-draft' : 'is-missing'}>Собствена сглобка: {draft ? 'ЧЕРНОВА' : 'НЯМА'}</span>
                </div>
                <p>{entry.noteBg}</p>
                <div className="assembly-joint-library-uses">
                  <span>Използва се на {entry.occurrenceCount} места</span>
                  <div>{markers.map((marker) => <b key={marker}>{marker}</b>)}</div>
                </div>
                {entry.systemRuleSourceLabelBg && <small className="assembly-joint-library-source">Източник на правило: {entry.systemRuleSourceLabelBg}</small>}
                {firstJoint && <button type="button" onClick={() => onSelect(firstJoint)}>Отвори типа възел</button>}
              </article>
            )
          })}
        </div>
      )}
      <p className="assembly-joint-library-boundary"><b>Важно:</b> системното правило може да води избора и размерните корекции, но не се приема за точна геометрия на сглобката без проверен разрез.</p>
    </section>
  )
}

function JointList({ model, onSelect }: { model: SystemDrivenModuleReadModel; onSelect: (joint: SystemDrivenJointReadModel) => void }) {
  return (
    <section className="assembly-product-section">
      <header><div><span>СГЛОБКИ ОТ КОНСТРУКЦИЯТА</span><h3>FacadeFlow ги извежда автоматично от границите</h3></div><small>Потребителят не маркира MATE точки и не въвежда DX/DY.</small></header>
      {model.joints.length === 0 ? <p className="assembly-empty-state">Няма открити възли. За сглобка каса/делител ↔ крило е необходимо отваряемо ПОЛЕ и избрани профили.</p> : (
        <div className="assembly-joint-list">
          {model.joints.map((joint) => (
            <button type="button" className={`assembly-joint-card ${jointStatusClass(joint)}`} key={joint.id} onClick={() => onSelect(joint)}>
              <div className="assembly-joint-card-main">
                <span>ПОЛЕ {joint.fieldSequence} · {EDGE_LABELS[joint.edge]}</span>
                <b>{joint.boundaryLabelBg} · {joint.supportProfileCode ?? '—'} ↔ {joint.sashProfileCode ?? '—'}</b>
                <small>{joint.noteBg}</small>
              </div>
              <strong>{jointStatusLabel(joint)}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}


function SystemConstructionRulePanel({ joint }: { joint: SystemDrivenJointReadModel }) {
  const rule = joint.systemRule
  if (!rule) {
    return (
      <section className="assembly-system-rule-panel is-missing">
        <header><span>СИСТЕМНО КОНСТРУКТИВНО ПРАВИЛО</span><b>Няма правило за тази двойка</b></header>
        <p>Ролите и профилите са известни, но FacadeFlow още няма референтно системно правило, което да описва корекциите на тази граница.</p>
      </section>
    )
  }

  return (
    <section className="assembly-system-rule-panel is-available">
      <header>
        <div><span>СИСТЕМНО КОНСТРУКТИВНО ПРАВИЛО</span><b>{rule.source.labelBg}</b></div>
        <strong>ПРИЛОЖЕНО</strong>
      </header>
      <div className="assembly-system-rule-grid">
        <div><span>Страна</span><b>{EDGE_LABELS[joint.edge]}</b><small>системната корекция се избира по тази страна</small></div>
        <div><span>Корекция на крилото</span><b>{rule.sashEdgeCorrectionMm} mm</b><small>референтен системен параметър, не overlap</small></div>
        <div><span>Rabbet режим</span><b>{rule.assemblyUseRabbet ? 'ДА' : 'НЕ'}</b><small>Assembly_Use_Rabbet</small></div>
        <div><span>Профилна добавка · крило</span><b>{rule.sashProfileAllowanceMm} mm</b><small>референтен Pl</small></div>
        <div><span>Корекция армировка · крило</span><b>{rule.sashReinforcementCorrectionMm} mm</b><small>референтен ReinfCorr</small></div>
        {joint.supportKind === 'divider' && <>
          <div><span>Ориентация на делителя</span><b>{rule.supportOrientation === 'vertical' ? 'ВЕРТИКАЛЕН' : rule.supportOrientation === 'horizontal' ? 'ХОРИЗОНТАЛЕН' : '—'}</b><small>изведена от topology</small></div>
          <div><span>Профилна добавка · делител</span><b>{rule.supportProfileAllowanceMm ?? '—'} mm</b><small>референтен Pl</small></div>
          <div><span>Корекция армировка · делител</span><b>{rule.supportReinforcementCorrectionMm ?? '—'} mm</b><small>референтен ReinfCorr</small></div>
          <div><span>Съединител</span><b>{rule.supportConnectorCode ?? '—'}</b><small>{rule.supportConnectorQuantity !== null ? `${rule.supportConnectorQuantity} бр. в референтното правило` : 'няма количество'}</small></div>
        </>}
      </div>
      <p><b>Граница на доверие:</b> тези параметри се използват като системна логика. Те не доказват X/Y/rotation, застъпване или точния профилен разрез и не отключват производство.</p>
    </section>
  )
}

function JointSourcePanel({
  joint,
  draft,
  onCreateDraft,
  onContinueDraft,
  onDeleteDraft,
}: {
  joint: SystemDrivenJointReadModel
  draft: CustomJointDraft | null
  onCreateDraft: () => void
  onContinueDraft: () => void
  onDeleteDraft: () => void
}) {
  const knowledgeStatus = resolveJointKnowledgeStatus({
    exactGeometryVerified: joint.evidenceStatus === 'verified',
    customDraft: draft,
  })

  return (
    <section className="assembly-joint-source-panel">
      <header>
        <div><span>ИЗТОЧНИК НА СГЛОБКАТА</span><b>Кой носи знанието за този тип възел</b></div>
        <strong className={`is-${knowledgeStatus}`}>{knowledgeStatus === 'factory-verified' ? 'ФАБРИЧНО ПРОВЕРЕНА' : knowledgeStatus === 'custom-draft' ? 'СОБСТВЕНА ЧЕРНОВА' : 'НЕОПРЕДЕЛЕНА'}</strong>
      </header>
      <div className="assembly-joint-source-grid">
        <div className={joint.evidenceStatus === 'verified' ? 'is-active' : ''}>
          <span>Фабрично проверена</span>
          <b>{joint.evidenceStatus === 'verified' ? 'НАЛИЧНА' : 'НЕ Е РЕГИСТРИРАНА'}</b>
          <small>Точен технически източник за конкретната двойка профили.</small>
        </div>
        <div>
          <span>Фирмено потвърдена</span>
          <b>НЕ Е РЕГИСТРИРАНА</b>
          <small>Ще изисква отделен експертен review; не се създава автоматично.</small>
        </div>
        <div className={draft ? 'is-active is-draft' : ''}>
          <span>Собствена чернова</span>
          <b>{customDraftStatusLabel(draft)}</b>
          <small>{draft ? `Запазена локално · ${new Date(draft.updatedAtIso).toLocaleString('bg-BG')}` : 'Може да се създаде от реалните профили на системата.'}</small>
        </div>
        <div className={!draft && joint.evidenceStatus !== 'verified' ? 'is-active is-undefined' : ''}>
          <span>Неопределена</span>
          <b>{!draft && joint.evidenceStatus !== 'verified' ? 'ТЕКУЩО СЪСТОЯНИЕ' : '—'}</b>
          <small>FacadeFlow не измисля монтажна геометрия.</small>
        </div>
      </div>
      <div className="assembly-joint-source-actions">
        {draft ? <>
          <button type="button" onClick={onContinueDraft}>Продължи собствената сглобка</button>
          <button type="button" className="is-secondary" onClick={onDeleteDraft}>Изтрий черновата</button>
        </> : joint.libraryKey && joint.supportProfileCode && joint.sashProfileCode ? (
          <button type="button" onClick={onCreateDraft}>Създай собствена сглобка</button>
        ) : (
          <button type="button" disabled>Първо избери реалните профили</button>
        )}
      </div>
      <p><b>Важно:</b> собствената чернова е визуално конструктивно предложение. Тя не става „проверена“ само защото е запазена и не отключва производство, BOM или машинен изход.</p>
    </section>
  )
}

type PuzzleHistorySnapshot = Readonly<{
  puzzlePieces: readonly CustomJointPuzzlePiece[]
  supportPose: CustomJointWorkspacePose
  sashPose: CustomJointWorkspacePose
  selectedPieceId: string
}>

type WorkspaceDragState = Readonly<{
  pieceId: string
  pointerId: number
  clientX: number
  clientY: number
  pose: CustomJointWorkspacePose
  svgWidth: number
  svgHeight: number
  historyBefore: PuzzleHistorySnapshot
}>

type PuzzleCatalogCategoryId =
  | 'used'
  | 'all'
  | 'frames'
  | 'sashes'
  | 'mullions'
  | 'doors'
  | 'beads'
  | 'additional'
  | 'gaskets'
  | 'panels-sills'
  | 'reinforcements'
  | 'accessories'
  | 'glazing'

type PuzzlePaletteItem = Readonly<{
  key: string
  pieceCode: string
  catalogCode: string
  category: Exclude<PuzzleCatalogCategoryId, 'used' | 'all'>
  labelBg: string
  roleLabelBg: string
  dimensionsLabel: string | null
  technicalProfileCode: string | null
  canPlace: boolean
  usedInCurrentContext: boolean
  sourceLabelBg: string
}>

type ManualAssemblyModuleContext = Readonly<{
  moduleSequence: number | null
  productTypeLabel: string
  systemId: string | null
  systemLabel: string
  colorLabel: string
  foilLabel: string
  glazingId: string | null
  glazingLabel: string
}>

const PUZZLE_WORKSPACE_UNITS_PER_MM = 2.2
const PUZZLE_GRID_STEP_MM = 5
const PUZZLE_MAJOR_GRID_MM = 25
const PUZZLE_GRID_STEP = PUZZLE_GRID_STEP_MM * PUZZLE_WORKSPACE_UNITS_PER_MM
const PUZZLE_MAJOR_GRID = PUZZLE_MAJOR_GRID_MM * PUZZLE_WORKSPACE_UNITS_PER_MM
const PUZZLE_CANVAS_WIDTH = 1000
const PUZZLE_CANVAS_HEIGHT = 620
const PUZZLE_ORIGIN_X = PUZZLE_CANVAS_WIDTH / 2
const PUZZLE_ORIGIN_Y = PUZZLE_CANVAS_HEIGHT / 2

function buildPuzzleAxisTicks(origin: number, extent: number): readonly number[] {
  const values = [origin]
  for (let value = origin + PUZZLE_MAJOR_GRID; value <= extent; value += PUZZLE_MAJOR_GRID) values.push(value)
  for (let value = origin - PUZZLE_MAJOR_GRID; value >= 0; value -= PUZZLE_MAJOR_GRID) values.push(value)
  return values.sort((a, b) => a - b)
}

const PUZZLE_X_MAJOR_TICKS = buildPuzzleAxisTicks(PUZZLE_ORIGIN_X, PUZZLE_CANVAS_WIDTH)
const PUZZLE_Y_MAJOR_TICKS = buildPuzzleAxisTicks(PUZZLE_ORIGIN_Y, PUZZLE_CANVAS_HEIGHT)

function formatPuzzleCoordinate(valueMm: number): string {
  if (Math.abs(valueMm) < 0.001) return '0'
  return `${valueMm > 0 ? '+' : ''}${Math.round(valueMm)}`
}

const PUZZLE_CATEGORIES: readonly Readonly<{ id: PuzzleCatalogCategoryId; label: string }>[] = [
  { id: 'used', label: 'В този възел' },
  { id: 'all', label: 'Всички' },
  { id: 'frames', label: 'Каси' },
  { id: 'sashes', label: 'Крила' },
  { id: 'mullions', label: 'Делители' },
  { id: 'doors', label: 'Врати' },
  { id: 'beads', label: 'Стъклодържатели' },
  { id: 'glazing', label: 'Стъклопакети' },
  { id: 'additional', label: 'Доп. профили' },
  { id: 'gaskets', label: 'Уплътнения' },
  { id: 'panels-sills', label: 'Панели / первази' },
  { id: 'reinforcements', label: 'Армировки' },
  { id: 'accessories', label: 'Аксесоари' },
]

function moduleContextFromSelection(
  module: ProjectSnapshot['modulesById'][string] | null,
  model: SystemDrivenModuleReadModel | null,
): ManualAssemblyModuleContext | null {
  if (!module || !model) return null
  const defaults = module.definition.kind === 'offer' ? module.definition.draft.inheritedDefaults : null
  const finish = defaults?.colorId
    ? getProfileSystemFinishOptionById(defaults.profileSystemId, defaults.colorId)
    : undefined
  const foil = defaults?.colorId && defaults.foilModeId
    ? getProfileSystemFoilModeById(defaults.profileSystemId, defaults.colorId, defaults.foilModeId)
    : undefined
  const glazing = defaults?.glazingId ? getGlazingOptionById(defaults.glazingId) : undefined
  return {
    moduleSequence: model.moduleSequence,
    productTypeLabel: moduleProductTypeLabel(model),
    systemId: model.systemId,
    systemLabel: model.systemLabel,
    colorLabel: finish?.labelBg ?? (defaults?.colorId ? defaults.colorId : 'Не е зададен'),
    foilLabel: foil?.labelBg ?? (defaults?.foilModeId ? defaults.foilModeId : 'Не е зададен'),
    glazingId: defaults?.glazingId ?? null,
    glazingLabel: glazing?.labelBg ?? (defaults?.glazingId ? defaults.glazingId : 'По ПОЛЕ'),
  }
}

function categoryForProfileRole(role: string): PuzzlePaletteItem['category'] {
  if (role === 'frame') return 'frames'
  if (role === 'sash' || role === 'overhung') return 'sashes'
  if (role === 'mullion') return 'mullions'
  if (role === 'door-sash') return 'doors'
  if (role === 'glass-bead') return 'beads'
  if (role === 'gasket') return 'gaskets'
  if (role === 'panel' || role === 'sill') return 'panels-sills'
  return 'additional'
}

function roleLabelBg(role: string): string {
  if (role === 'frame') return 'Каса'
  if (role === 'sash') return 'Крило'
  if (role === 'mullion') return 'Делител'
  if (role === 'door-sash') return 'Крило за врата'
  if (role === 'glass-bead') return 'Стъклодържател'
  if (role === 'gasket') return 'Уплътнение'
  if (role === 'panel') return 'Панел'
  if (role === 'sill') return 'Перваз'
  if (role === 'overhung') return 'Горен профил'
  return 'Допълнителен профил'
}

function glazingPieceCode(id: string, thicknessMm: number): string {
  return `glazing:${id}:${thicknessMm}`
}

function glazingThicknessFromPieceCode(pieceCode: string): number | null {
  if (!pieceCode.startsWith('glazing:')) return null
  const raw = Number(pieceCode.split(':').at(-1))
  return Number.isFinite(raw) && raw > 0 ? raw : null
}

function normalizePuzzleRotation(value: number): number {
  if (!Number.isFinite(value)) return 0
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180
  return Math.round(wrapped * 10) / 10
}

function CustomJointWorkspace({
  joint,
  fieldGlazingContext,
  moduleContext,
  initialDraft,
  onSaved,
  onClose,
}: {
  joint: SystemDrivenJointReadModel
  fieldGlazingContext: SystemDrivenFieldGlazingContextReadModel | null
  moduleContext: ManualAssemblyModuleContext | null
  initialDraft: CustomJointDraft | null
  onSaved: (draft: CustomJointDraft) => void
  onClose: () => void
}) {
  const libraryKey = joint.libraryKey ?? 'unresolved-joint'
  const supportProfileCode = joint.supportProfileCode ?? '—'
  const sashProfileCode = joint.sashProfileCode ?? '—'
  const systemCatalog = getProfileSystemById(joint.systemId)
  const pieceSequence = useRef(0)
  const currentGlazingThicknessMm = fieldGlazingContext?.glazingThicknessMm ?? null
  const currentGlazingPieceCode = currentGlazingThicknessMm
    ? glazingPieceCode('field', currentGlazingThicknessMm)
    : null

  const createInitial = (): CustomJointDraft => {
    if (initialDraft) return initialDraft
    const base = createDefaultCustomJointDraft({
      libraryKey,
      systemId: joint.systemRule?.systemId ?? libraryKey.split(':')[0] ?? 'unknown-system',
      jointKind: joint.jointKind,
      supportProfileCode,
      sashProfileCode,
    })
    return { ...base, puzzlePieces: [] }
  }

  const [draft, setDraft] = useState<CustomJointDraft>(createInitial)
  const [drag, setDrag] = useState<WorkspaceDragState | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<string>('')
  const draftRef = useRef(draft)
  const selectedPieceIdRef = useRef(selectedPieceId)
  const undoHistoryRef = useRef<PuzzleHistorySnapshot[]>([])
  const redoHistoryRef = useRef<PuzzleHistorySnapshot[]>([])
  draftRef.current = draft
  selectedPieceIdRef.current = selectedPieceId
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [category, setCategory] = useState<PuzzleCatalogCategoryId>('used')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [catalogCollapsed, setCatalogCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)

  const paletteItems = useMemo<readonly PuzzlePaletteItem[]>(() => {
    if (!systemCatalog) return []
    const usedCodes = new Set([joint.supportProfileCode, joint.sashProfileCode, fieldGlazingContext?.glazingBeadProfileCode].filter(Boolean))
    const items: PuzzlePaletteItem[] = []
    const addProfile = (profile: { code: string; role: string; labelBg: string; dimensions?: Readonly<{ calloutsMm: readonly number[] }>; evidence: Readonly<{ page: number }> }) => {
      const section = getTechnicalProfileSection(joint.systemId, profile.code)
      items.push({
        key: `profile:${profile.role}:${profile.code}`,
        pieceCode: profile.code,
        catalogCode: profile.code,
        category: categoryForProfileRole(profile.role),
        labelBg: profile.labelBg,
        roleLabelBg: roleLabelBg(profile.role),
        dimensionsLabel: profile.dimensions?.calloutsMm?.length ? `${profile.dimensions.calloutsMm.join(' × ')} mm` : null,
        technicalProfileCode: section ? profile.code : null,
        canPlace: Boolean(section),
        usedInCurrentContext: usedCodes.has(profile.code),
        sourceLabelBg: `Каталог · стр. ${profile.evidence.page}`,
      })
    }
    systemCatalog.mainProfiles.forEach(addProfile)
    systemCatalog.glassBeads.forEach(addProfile)
    systemCatalog.additionalProfiles.forEach(addProfile)
    systemCatalog.gaskets.forEach(addProfile)
    systemCatalog.panelsAndSills.forEach(addProfile)

    for (const reinforcement of systemCatalog.reinforcements) {
      items.push({
        key: `reinforcement:${reinforcement.code}`,
        pieceCode: `catalog:${reinforcement.code}`,
        catalogCode: reinforcement.code,
        category: 'reinforcements',
        labelBg: `Армировка ${reinforcement.code}`,
        roleLabelBg: 'Армировка',
        dimensionsLabel: reinforcement.dimensions?.calloutsMm?.length ? `${reinforcement.dimensions.calloutsMm.join(' × ')} mm` : reinforcement.thicknessOptionsMm.map((value) => `${value} mm`).join(' / '),
        technicalProfileCode: null,
        canPlace: false,
        usedInCurrentContext: false,
        sourceLabelBg: `Каталог · стр. ${reinforcement.evidence.page}`,
      })
    }
    for (const accessory of systemCatalog.accessories) {
      items.push({
        key: `accessory:${accessory.code}`,
        pieceCode: `catalog:${accessory.code}`,
        catalogCode: accessory.code,
        category: 'accessories',
        labelBg: accessory.labelBg,
        roleLabelBg: 'Аксесоар',
        dimensionsLabel: null,
        technicalProfileCode: null,
        canPlace: false,
        usedInCurrentContext: false,
        sourceLabelBg: `Каталог · стр. ${accessory.evidence.page}`,
      })
    }

    if (currentGlazingThicknessMm) {
      items.push({
        key: `glazing:field:${currentGlazingThicknessMm}`,
        pieceCode: glazingPieceCode('field', currentGlazingThicknessMm),
        catalogCode: `${currentGlazingThicknessMm} mm`,
        category: 'glazing',
        labelBg: `Стъклопакет на ПОЛЕ ${joint.fieldSequence}`,
        roleLabelBg: 'Текущо остъкляване',
        dimensionsLabel: `дебелина ${currentGlazingThicknessMm} mm`,
        technicalProfileCode: null,
        canPlace: true,
        usedInCurrentContext: true,
        sourceLabelBg: 'Избор от активния модул / ПОЛЕ',
      })
    }

    for (const glazing of getConfirmedGlazingOptions()) {
      const pieceCode = glazingPieceCode(glazing.id, glazing.totalThicknessMm)
      const selectedByModule = moduleContext?.glazingId === glazing.id
      if (currentGlazingPieceCode === pieceCode) continue
      items.push({
        key: `glazing:${glazing.id}`,
        pieceCode,
        catalogCode: glazing.labelBg,
        category: 'glazing',
        labelBg: glazing.descriptionBg,
        roleLabelBg: 'Стъклопакет',
        dimensionsLabel: `дебелина ${glazing.totalThicknessMm} mm`,
        technicalProfileCode: null,
        canPlace: true,
        usedInCurrentContext: selectedByModule,
        sourceLabelBg: 'Потвърден операторски избор',
      })
    }

    return items
  }, [systemCatalog, joint.systemId, joint.supportProfileCode, joint.sashProfileCode, joint.fieldSequence, fieldGlazingContext?.glazingBeadProfileCode, currentGlazingThicknessMm, currentGlazingPieceCode, moduleContext?.glazingId])

  const paletteItemByPieceCode = useMemo(() => new Map(paletteItems.map((item) => [item.pieceCode, item] as const)), [paletteItems])
  const filteredPaletteItems = useMemo(() => {
    const search = catalogSearch.trim().toLocaleLowerCase('bg')
    return paletteItems.filter((item) => {
      if (category === 'used' && !item.usedInCurrentContext) return false
      if (category !== 'used' && category !== 'all' && item.category !== category) return false
      if (!search) return true
      return `${item.catalogCode} ${item.labelBg} ${item.roleLabelBg}`.toLocaleLowerCase('bg').includes(search)
    })
  }, [paletteItems, category, catalogSearch])

  const pieces = getCustomJointPuzzlePieces(draft)
  const selectedPiece = pieces.find((piece) => piece.id === selectedPieceId) ?? pieces[0] ?? null

  const snap = (value: number, origin: number) => snapToGrid
    ? origin + Math.round((value - origin) / PUZZLE_GRID_STEP) * PUZZLE_GRID_STEP
    : value
  const snapX = (value: number) => snap(value, PUZZLE_ORIGIN_X)
  const snapY = (value: number) => snap(value, PUZZLE_ORIGIN_Y)
  const clampX = (value: number) => Math.max(22, Math.min(PUZZLE_CANVAS_WIDTH - 22, value))
  const clampY = (value: number) => Math.max(22, Math.min(PUZZLE_CANVAS_HEIGHT - 22, value))

  const makeHistorySnapshot = (sourceDraft = draftRef.current, selection = selectedPieceIdRef.current): PuzzleHistorySnapshot => ({
    puzzlePieces: [...getCustomJointPuzzlePieces(sourceDraft)],
    supportPose: sourceDraft.supportPose,
    sashPose: sourceDraft.sashPose,
    selectedPieceId: selection,
  })

  const pushUndoHistory = (snapshot: PuzzleHistorySnapshot) => {
    undoHistoryRef.current = [...undoHistoryRef.current, snapshot].slice(-100)
    redoHistoryRef.current = []
  }

  const restoreHistorySnapshot = (snapshot: PuzzleHistorySnapshot) => {
    const current = draftRef.current
    const nextDraft: CustomJointDraft = {
      ...current,
      puzzlePieces: snapshot.puzzlePieces,
      supportPose: snapshot.supportPose,
      sashPose: snapshot.sashPose,
    }
    const restoredSelection = snapshot.puzzlePieces.some((piece) => piece.id === snapshot.selectedPieceId)
      ? snapshot.selectedPieceId
      : snapshot.puzzlePieces[0]?.id ?? ''
    draftRef.current = nextDraft
    selectedPieceIdRef.current = restoredSelection
    setDraft(nextDraft)
    setSelectedPieceId(restoredSelection)
    setDrag(null)
    setSavedMessage('')
  }

  const undoPuzzle = () => {
    const previous = undoHistoryRef.current.at(-1)
    if (!previous) return
    undoHistoryRef.current = undoHistoryRef.current.slice(0, -1)
    redoHistoryRef.current = [...redoHistoryRef.current, makeHistorySnapshot()].slice(-100)
    restoreHistorySnapshot(previous)
  }

  const redoPuzzle = () => {
    const next = redoHistoryRef.current.at(-1)
    if (!next) return
    redoHistoryRef.current = redoHistoryRef.current.slice(0, -1)
    undoHistoryRef.current = [...undoHistoryRef.current, makeHistorySnapshot()].slice(-100)
    restoreHistorySnapshot(next)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      const command = event.ctrlKey || event.metaKey
      if (!command) return
      if (event.key.toLocaleLowerCase() === 'z' && event.shiftKey) {
        if (redoHistoryRef.current.length === 0) return
        event.preventDefault()
        redoPuzzle()
        return
      }
      if (event.key.toLocaleLowerCase() === 'z') {
        if (undoHistoryRef.current.length === 0) return
        event.preventDefault()
        undoPuzzle()
        return
      }
      if (event.key.toLocaleLowerCase() === 'y') {
        if (redoHistoryRef.current.length === 0) return
        event.preventDefault()
        redoPuzzle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const applyPieces = (
    nextPieces: readonly CustomJointPuzzlePiece[],
    options: Readonly<{ recordHistory?: boolean; selectedPieceId?: string }> = {},
  ) => {
    const current = draftRef.current
    if (options.recordHistory !== false) pushUndoHistory(makeHistorySnapshot(current))
    const supportPiece = nextPieces.find((piece) => piece.id === 'support')
    const sashPiece = nextPieces.find((piece) => piece.id === 'sash')
    const nextDraft: CustomJointDraft = {
      ...current,
      puzzlePieces: nextPieces,
      supportPose: supportPiece?.pose ?? current.supportPose,
      sashPose: sashPiece?.pose ?? current.sashPose,
    }
    draftRef.current = nextDraft
    setDraft(nextDraft)
    if (options.selectedPieceId !== undefined) {
      selectedPieceIdRef.current = options.selectedPieceId
      setSelectedPieceId(options.selectedPieceId)
    }
    setSavedMessage('')
  }

  const updatePieces = (
    updater: (items: readonly CustomJointPuzzlePiece[]) => readonly CustomJointPuzzlePiece[],
    recordHistory = true,
  ) => {
    const current = draftRef.current
    applyPieces(updater(getCustomJointPuzzlePieces(current)), { recordHistory })
  }

  const updatePiece = (
    pieceId: string,
    updater: (piece: CustomJointPuzzlePiece) => CustomJointPuzzlePiece,
    recordHistory = true,
  ) => {
    updatePieces((items) => items.map((piece) => piece.id === pieceId ? updater(piece) : piece), recordHistory)
  }

  const updatePiecePose = (
    pieceId: string,
    updater: (pose: CustomJointWorkspacePose) => CustomJointWorkspacePose,
    recordHistory = true,
  ) => {
    updatePiece(pieceId, (piece) => ({ ...piece, pose: updater(piece.pose) }), recordHistory)
  }

  const addPiece = (pieceCode: string, x = 500, y = 310) => {
    const paletteItem = paletteItemByPieceCode.get(pieceCode)
    if (!paletteItem?.canPlace) return
    const id = `puzzle:${pieceCode}:${Date.now()}:${++pieceSequence.current}`
    const piece: CustomJointPuzzlePiece = {
      id,
      profileCode: pieceCode,
      pose: { x: snapX(clampX(x)), y: snapY(clampY(y)), rotationDeg: 0 },
      flipX: false,
      locked: false,
    }
    const current = draftRef.current
    applyPieces([...getCustomJointPuzzlePieces(current), piece], { selectedPieceId: id })
  }

  const removePiece = (pieceId: string) => {
    const current = draftRef.current
    const nextPieces = getCustomJointPuzzlePieces(current).filter((piece) => piece.id !== pieceId)
    applyPieces(nextPieces, { selectedPieceId: nextPieces[0]?.id ?? '' })
  }

  const startDrag = (piece: CustomJointPuzzlePiece, event: ReactPointerEvent<SVGGElement>) => {
    if (piece.locked) {
      setSelectedPieceId(piece.id)
      return
    }
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelectedPieceId(piece.id)
    setDrag({
      pieceId: piece.id,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      pose: piece.pose,
      svgWidth: rect.width,
      svgHeight: rect.height,
      historyBefore: makeHistorySnapshot(draftRef.current, piece.id),
    })
  }

  const moveDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag || event.pointerId !== drag.pointerId || drag.svgWidth <= 0 || drag.svgHeight <= 0) return
    const dx = (event.clientX - drag.clientX) * 1000 / drag.svgWidth
    const dy = (event.clientY - drag.clientY) * 620 / drag.svgHeight
    updatePiecePose(drag.pieceId, () => ({
      ...drag.pose,
      x: snapX(clampX(drag.pose.x + dx)),
      y: snapY(clampY(drag.pose.y + dy)),
    }), false)
  }

  const finishDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return
    const currentPiece = getCustomJointPuzzlePieces(draftRef.current).find((piece) => piece.id === drag.pieceId)
    if (currentPiece && (currentPiece.pose.x !== drag.pose.x || currentPiece.pose.y !== drag.pose.y)) {
      pushUndoHistory(drag.historyBefore)
    }
    setDrag(null)
  }

  const handlePaletteDragStart = (item: PuzzlePaletteItem, event: ReactDragEvent<HTMLButtonElement>) => {
    if (!item.canPlace) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-facadeflow-profile', item.pieceCode)
    event.dataTransfer.setData('text/plain', item.pieceCode)
  }

  const handleCanvasDrop = (event: ReactDragEvent<SVGSVGElement>) => {
    event.preventDefault()
    const pieceCode = event.dataTransfer.getData('application/x-facadeflow-profile') || event.dataTransfer.getData('text/plain')
    if (!pieceCode) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = (event.clientX - rect.left) * 1000 / rect.width
    const y = (event.clientY - rect.top) * 620 / rect.height
    addPiece(pieceCode, x, y)
  }

  const save = () => {
    const saved = saveCustomJointDraft(draftRef.current)
    draftRef.current = saved
    setDraft(saved)
    setSavedMessage('Ръчната сглобка е запазена като CUSTOM DRAFT. Тя не променя автоматичната системна сглобка.')
    onSaved(saved)
  }

  const reset = () => {
    applyPieces([], { selectedPieceId: '' })
  }

  const renderProfile = (piece: CustomJointPuzzlePiece) => {
    const item = paletteItemByPieceCode.get(piece.profileCode)
    const selected = selectedPiece?.id === piece.id
    const dragging = drag?.pieceId === piece.id
    const glazingThicknessMm = glazingThicknessFromPieceCode(piece.profileCode)
    const section = glazingThicknessMm === null
      ? getTechnicalProfileSection(joint.systemId, item?.technicalProfileCode ?? piece.profileCode)
      : null
    const fallbackLabel = item?.labelBg ?? 'Профил'
    const graphic = section ? getAssemblyTechnicalSectionGraphic(section, fallbackLabel) : null
    const isGlassBead = section?.profileRole === 'glass-bead'
    const selectionAxisHalf = isGlassBead ? 5 : 10
    const physicalWidth = section ? section.catalogueDepthMm * PUZZLE_WORKSPACE_UNITS_PER_MM : glazingThicknessMm !== null ? glazingThicknessMm * PUZZLE_WORKSPACE_UNITS_PER_MM : 90
    const physicalHeight = section ? section.catalogueFaceMm * PUZZLE_WORKSPACE_UNITS_PER_MM : glazingThicknessMm !== null ? 105 * PUZZLE_WORKSPACE_UNITS_PER_MM : 72
    const boxWidth = physicalWidth + 16
    const boxHeight = physicalHeight + 16
    return (
      <g
        key={piece.id}
        className={`assembly-custom-profile assembly-puzzle-true-scale-object ${selected ? 'is-selected' : ''} ${dragging ? 'is-dragging' : ''} ${piece.locked ? 'is-locked' : ''} ${glazingThicknessMm !== null ? 'is-glazing' : ''}`}
        transform={`translate(${piece.pose.x} ${piece.pose.y}) rotate(${piece.pose.rotationDeg})`}
        onPointerDown={(event) => startDrag(piece, event)}
      >
        <rect className="assembly-puzzle-selection-box" x={-boxWidth / 2} y={-boxHeight / 2} width={boxWidth} height={boxHeight} rx="5" />
        <g transform={piece.flipX ? 'scale(-1 1)' : undefined}>
          {glazingThicknessMm !== null ? (
            <g className="assembly-puzzle-glazing-piece">
              <rect x={-physicalWidth / 2} y={-physicalHeight / 2} width={physicalWidth} height={physicalHeight} rx="2" />
              <line x1={-physicalWidth / 2 + 4} x2={-physicalWidth / 2 + 4} y1={-physicalHeight / 2 + 5} y2={physicalHeight / 2 - 5} />
              <line x1={physicalWidth / 2 - 4} x2={physicalWidth / 2 - 4} y1={-physicalHeight / 2 + 5} y2={physicalHeight / 2 - 5} />
              <text x="0" y="4">{glazingThicknessMm} mm</text>
            </g>
          ) : graphic?.src ? (
            <image className={`assembly-puzzle-profile-image ${isGlassBead ? 'is-glass-bead' : ''}`} href={graphic.src} x={-physicalWidth / 2} y={-physicalHeight / 2} width={physicalWidth} height={physicalHeight} preserveAspectRatio="none" />
          ) : (
            <g className="assembly-custom-profile-placeholder"><rect x="-45" y="-36" width="90" height="72" /><text x="0" y="5">{piece.profileCode}</text></g>
          )}
        </g>
        {selected && <><line className="assembly-puzzle-selection-axis" x1={-selectionAxisHalf} y1="0" x2={selectionAxisHalf} y2="0" /><line className="assembly-puzzle-selection-axis" x1="0" y1={-selectionAxisHalf} x2="0" y2={selectionAxisHalf} /></>}
        <text className="assembly-custom-profile-label" x="0" y={boxHeight / 2 + 16}>{item?.catalogCode ?? piece.profileCode}</text>
        {piece.locked && <text className="assembly-custom-profile-lock" x={boxWidth / 2 - 3} y={-boxHeight / 2 + 12}>LOCK</text>}
      </g>
    )
  }

  const poseControls = (piece: CustomJointPuzzlePiece) => {
    const item = paletteItemByPieceCode.get(piece.profileCode)
    const xMm = Math.round(((piece.pose.x - PUZZLE_ORIGIN_X) / PUZZLE_WORKSPACE_UNITS_PER_MM) * 10) / 10
    const yMm = Math.round(((PUZZLE_ORIGIN_Y - piece.pose.y) / PUZZLE_WORKSPACE_UNITS_PER_MM) * 10) / 10
    return (
      <div className="assembly-custom-pose-card is-selected-piece">
        <header><b>{item?.labelBg ?? 'Елемент'} · {item?.catalogCode ?? piece.profileCode}</b><span>работно X {xMm} mm · Y {yMm} mm · {piece.pose.rotationDeg}°</span></header>
        <div className="assembly-puzzle-move-controls">
          <span className="assembly-puzzle-control-label">ПРЕМЕСТИ · 5 mm</span>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, x: snapX(clampX(value.x - PUZZLE_GRID_STEP)) }))}>←</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, y: snapY(clampY(value.y - PUZZLE_GRID_STEP)) }))}>↑</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, y: snapY(clampY(value.y + PUZZLE_GRID_STEP)) }))}>↓</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, x: snapX(clampX(value.x + PUZZLE_GRID_STEP)) }))}>→</button>
        </div>
        <div className="assembly-puzzle-rotation-controls" aria-label="Прецизно завъртане на избрания елемент">
          <span className="assembly-puzzle-control-label">ЗАВЪРТИ</span>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg - 90) }))}>−90°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg - 5) }))}>−5°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg - 1) }))}>−1°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: 0 }))}>0°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg + 1) }))}>+1°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg + 5) }))}>+5°</button>
          <button type="button" disabled={piece.locked} onClick={() => updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(value.rotationDeg + 90) }))}>+90°</button>
          <label className="assembly-puzzle-angle-input">
            <span>Ъгъл</span>
            <input
              type="number"
              step="1"
              value={piece.pose.rotationDeg}
              disabled={piece.locked}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (Number.isFinite(next)) updatePiecePose(piece.id, (value) => ({ ...value, rotationDeg: normalizePuzzleRotation(next) }))
              }}
            />
            <em>°</em>
          </label>
        </div>
        <div className="assembly-custom-piece-actions">
          <button type="button" className="is-secondary" onClick={() => updatePiece(piece.id, (value) => ({ ...value, flipX: !value.flipX }))}>{piece.flipX ? 'Върни огледалото' : 'Огледално'}</button>
          <button type="button" className="is-secondary" onClick={() => updatePiece(piece.id, (value) => ({ ...value, locked: !value.locked }))}>{piece.locked ? 'Отключи' : 'Заключи'}</button>
          <button type="button" className="is-secondary is-danger" onClick={() => removePiece(piece.id)}>Премахни</button>
        </div>
      </div>
    )
  }

  if (!joint.libraryKey || !joint.supportProfileCode || !joint.sashProfileCode) return null

  return (
    <section className="assembly-custom-workspace assembly-manual-puzzle" data-manual-assembly-puzzle="01.2" data-visual-workbench-cleanup="01.2.1" data-coordinate-grid-hotfix="01.2.2" data-precision-rotation="01.3" data-undo-redo-history="01.3.1" data-empty-workspace="01.3.2">
      <header className="assembly-custom-workspace-head">
        <div>
          <span>РЪЧНА СГЛОБКА · ПЪЗЕЛ 01.3.2</span>
          <h3>{systemCatalog?.name ?? joint.systemId} · {joint.boundaryLabelBg} · {joint.supportProfileCode} ↔ {joint.sashProfileCode}</h3>
          <p>Работната среда наследява контекста от активния модул, но започва с празна работна площ. Ти избираш и добавяш всеки детайл от каталога вляво; FacadeFlow не поставя профили автоматично в ръчния пъзел.</p>
        </div>
        <button type="button" className="is-secondary" onClick={onClose}>Затвори ръчната сглобка</button>
      </header>

      <div className="assembly-puzzle-module-context" aria-label="Контекст от активния модул">
        <div><span>МОДУЛ</span><b>{moduleContext?.moduleSequence ?? '—'}</b></div>
        <div><span>ТИП</span><b>{moduleContext?.productTypeLabel ?? '—'}</b></div>
        <div><span>СИСТЕМА</span><b>{moduleContext?.systemLabel ?? systemCatalog?.name ?? joint.systemId}</b></div>
        <div><span>ЦВЯТ</span><b>{moduleContext?.colorLabel ?? 'Не е зададен'}</b><small>{moduleContext?.foilLabel ?? ''}</small></div>
        <div><span>КОНТЕКСТ</span><b>ПОЛЕ {joint.fieldSequence} · {EDGE_LABELS[joint.edge]}</b><small>{joint.boundaryLabelBg}</small></div>
        <div><span>ОСТЪКЛЯВАНЕ</span><b>{currentGlazingThicknessMm ?? '—'} mm</b><small>{moduleContext?.glazingLabel ?? 'По ПОЛЕ'}</small></div>
      </div>

      <div className="assembly-puzzle-toolbar">
        <div><b>{pieces.length}</b><span>елемента в работната площ</span></div>
        <div className="assembly-puzzle-history-actions" aria-label="Undo и Redo за ръчната сглобка">
          <b>ИСТОРИЯ</b>
          <span>добавяне · местене · въртене · огледало · lock · remove</span>
          <div>
            <button type="button" disabled={undoHistoryRef.current.length === 0} onClick={undoPuzzle} title="Отмени последната промяна · Ctrl+Z">↶ Отмени</button>
            <button type="button" disabled={redoHistoryRef.current.length === 0} onClick={redoPuzzle} title="Повтори промяната · Ctrl+Y / Ctrl+Shift+Z">↷ Повтори</button>
          </div>
        </div>
        <label><input type="checkbox" checked={snapToGrid} onChange={(event) => setSnapToGrid(event.target.checked)} /> Snap към {PUZZLE_GRID_STEP_MM} mm мрежа</label>
        <div><b>{joint.supportProfileCode} + {joint.sashProfileCode}</b><span>профили от текущата граница</span></div>
        <div><b>{fieldGlazingContext?.glazingBeadProfileCode ?? '—'}</b><span>избран стъклодържател</span></div>
      </div>

      <div className={`assembly-puzzle-layout ${catalogCollapsed ? 'is-palette-collapsed' : ''} ${inspectorCollapsed ? 'is-controls-collapsed' : ''}`}>
        <aside className={`assembly-puzzle-palette ${catalogCollapsed ? 'is-collapsed' : ''}`} aria-label="Пълен каталог на избраната система">
          <header className="assembly-puzzle-side-head">
            <div><span>ПЪЛЕН КАТАЛОГ НА СИСТЕМАТА</span><b>{systemCatalog?.name ?? joint.systemId}</b>{!catalogCollapsed && <small>Всички каталожни записи са видими. „Добави“ е активно само когато FacadeFlow има индивидуална техническа скица или реална дебелина на стъклопакета.</small>}</div>
            <button type="button" className="assembly-puzzle-collapse-button" onClick={() => setCatalogCollapsed((value) => !value)} title={catalogCollapsed ? 'Покажи каталога' : 'Скрий каталога'}>{catalogCollapsed ? '›' : '‹'}</button>
          </header>
          {!catalogCollapsed && <>
          <input className="assembly-puzzle-catalog-search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Търси код или име…" />
          <div className="assembly-puzzle-category-tabs" role="tablist" aria-label="Категории в системния каталог">
            {PUZZLE_CATEGORIES.map((entry) => {
              const count = entry.id === 'used'
                ? paletteItems.filter((item) => item.usedInCurrentContext).length
                : entry.id === 'all'
                  ? paletteItems.length
                  : paletteItems.filter((item) => item.category === entry.id).length
              return <button type="button" key={entry.id} className={category === entry.id ? 'is-active' : ''} onClick={() => setCategory(entry.id)}>{entry.label}<small>{count}</small></button>
            })}
          </div>
          <div className="assembly-puzzle-palette-list">
            {filteredPaletteItems.length === 0 ? <p className="assembly-puzzle-empty">Няма елементи в тази категория.</p> : filteredPaletteItems.map((item) => {
              const section = item.technicalProfileCode ? getTechnicalProfileSection(joint.systemId, item.technicalProfileCode) : null
              const graphic = section ? getCatalogueTechnicalSectionGraphic(section, item.labelBg) : null
              const glazingThicknessMm = glazingThicknessFromPieceCode(item.pieceCode)
              return (
                <button
                  type="button"
                  key={item.key}
                  className={`assembly-puzzle-palette-card ${item.usedInCurrentContext ? 'is-context-used' : ''} ${!item.canPlace ? 'is-catalog-only' : ''}`}
                  draggable={item.canPlace}
                  onDragStart={(event) => handlePaletteDragStart(item, event)}
                  onClick={() => item.canPlace && addPiece(item.pieceCode, 500 + (pieces.length % 3) * 35, 250 + (pieces.length % 4) * 35)}
                  title={item.canPlace ? `Добави ${item.catalogCode}` : `${item.catalogCode}: каталожният запис е наличен, но индивидуалната техническа скица още не е индексирана`}
                >
                  <span className="assembly-puzzle-palette-thumb">
                    {graphic?.src ? <img src={graphic.src} alt="" /> : glazingThicknessMm !== null ? <i className="is-glazing-thumb">{glazingThicknessMm}<small>mm</small></i> : <i>{item.catalogCode}</i>}
                  </span>
                  <span className="assembly-puzzle-palette-copy"><b>{item.catalogCode}</b><small>{item.labelBg}</small><em>{item.roleLabelBg}{item.dimensionsLabel ? ` · ${item.dimensionsLabel}` : ''}</em><i>{item.sourceLabelBg}</i></span>
                  <strong>{item.canPlace ? 'Добави' : 'Каталог'}</strong>
                </button>
              )
            })}
          </div>
          </>}
        </aside>

        <div className="assembly-custom-canvas-wrap assembly-puzzle-canvas-wrap">
          <div className="assembly-puzzle-scale-strip"><b>РАБОТНА МРЕЖА</b><span>{PUZZLE_GRID_STEP_MM} mm малка стъпка · {PUZZLE_MAJOR_GRID_MM} mm основна линия · 0,0 е центърът · X+ надясно · Y+ нагоре</span></div>
          <svg
            className="assembly-custom-canvas assembly-puzzle-canvas"
            viewBox="0 0 1000 620"
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }}
            onDrop={handleCanvasDrop}
            role="img"
            aria-label="Работна площ за ръчна сглобка тип пъзел с 5 mm мрежа"
          >
            <defs>
              <pattern id="manualPuzzleSmallGrid012" x={PUZZLE_ORIGIN_X} y={PUZZLE_ORIGIN_Y} width={PUZZLE_GRID_STEP} height={PUZZLE_GRID_STEP} patternUnits="userSpaceOnUse">
                <path className="assembly-puzzle-grid-small-line" d={`M ${PUZZLE_GRID_STEP} 0 L 0 0 0 ${PUZZLE_GRID_STEP}`} />
              </pattern>
              <pattern id="manualPuzzleMajorGrid012" x={PUZZLE_ORIGIN_X} y={PUZZLE_ORIGIN_Y} width={PUZZLE_MAJOR_GRID} height={PUZZLE_MAJOR_GRID} patternUnits="userSpaceOnUse">
                <rect width={PUZZLE_MAJOR_GRID} height={PUZZLE_MAJOR_GRID} fill="url(#manualPuzzleSmallGrid012)" />
                <path className="assembly-puzzle-grid-major-line" d={`M ${PUZZLE_MAJOR_GRID} 0 L 0 0 0 ${PUZZLE_MAJOR_GRID}`} />
              </pattern>
            </defs>
            <rect className="assembly-puzzle-grid-surface" width={PUZZLE_CANVAS_WIDTH} height={PUZZLE_CANVAS_HEIGHT} fill="url(#manualPuzzleMajorGrid012)" />
            <rect className="assembly-puzzle-ruler-band is-top" x="0" y="0" width={PUZZLE_CANVAS_WIDTH} height="22" />
            <rect className="assembly-puzzle-ruler-band is-left" x="0" y="0" width="34" height={PUZZLE_CANVAS_HEIGHT} />
            {PUZZLE_X_MAJOR_TICKS.map((x) => {
              const valueMm = (x - PUZZLE_ORIGIN_X) / PUZZLE_WORKSPACE_UNITS_PER_MM
              return <g key={`x-grid-${x}`} className="assembly-puzzle-coordinate-tick"><line x1={x} y1="0" x2={x} y2="7" /><text x={x} y="17">{formatPuzzleCoordinate(valueMm)}</text></g>
            })}
            {PUZZLE_Y_MAJOR_TICKS.map((y) => {
              const valueMm = (PUZZLE_ORIGIN_Y - y) / PUZZLE_WORKSPACE_UNITS_PER_MM
              return <g key={`y-grid-${y}`} className="assembly-puzzle-coordinate-tick is-y"><line x1="0" y1={y} x2="7" y2={y} /><text x="10" y={y + 2.5}>{formatPuzzleCoordinate(valueMm)}</text></g>
            })}
            <line className="assembly-custom-axis" x1={PUZZLE_ORIGIN_X} y1="0" x2={PUZZLE_ORIGIN_X} y2={PUZZLE_CANVAS_HEIGHT} />
            <line className="assembly-custom-axis" x1="0" y1={PUZZLE_ORIGIN_Y} x2={PUZZLE_CANVAS_WIDTH} y2={PUZZLE_ORIGIN_Y} />
            <circle className="assembly-puzzle-origin-dot" cx={PUZZLE_ORIGIN_X} cy={PUZZLE_ORIGIN_Y} r="3.2" />
            <text className="assembly-puzzle-origin-label" x={PUZZLE_ORIGIN_X + 8} y={PUZZLE_ORIGIN_Y - 8}>0,0</text>
            <text className="assembly-puzzle-axis-direction" x={PUZZLE_CANVAS_WIDTH - 24} y={PUZZLE_ORIGIN_Y - 8}>X+</text>
            <text className="assembly-puzzle-axis-direction" x={PUZZLE_ORIGIN_X + 8} y="34">Y+</text>
            {pieces.length === 0 && (
              <g className="assembly-puzzle-empty-workspace-hint">
                <text x={PUZZLE_ORIGIN_X} y={PUZZLE_ORIGIN_Y - 18}>Работната площ е празна</text>
                <text className="is-secondary" x={PUZZLE_ORIGIN_X} y={PUZZLE_ORIGIN_Y + 4}>Избери „Добави“ или плъзни детайл от каталога вляво</text>
              </g>
            )}
            {pieces.map(renderProfile)}
          </svg>
          <div className="assembly-custom-canvas-note"><b>Ръчна работна площ · CUSTOM DRAFT</b><span>Профилните габарити използват общ mm-мащаб; стъклопакетът е точен само по дебелина. Позициите и дължината на стъклото НЕ са производствени данни.</span></div>
        </div>

        <aside className={`assembly-custom-controls assembly-puzzle-controls ${inspectorCollapsed ? 'is-collapsed' : ''}`}>
          <header className="assembly-puzzle-controls-head assembly-puzzle-side-head">
            <div><span>ИЗБРАН ЕЛЕМЕНТ</span><b>{selectedPiece ? paletteItemByPieceCode.get(selectedPiece.profileCode)?.catalogCode ?? selectedPiece.profileCode : 'Няма'}</b></div>
            <button type="button" className="assembly-puzzle-collapse-button" onClick={() => setInspectorCollapsed((value) => !value)} title={inspectorCollapsed ? 'Покажи инспектора' : 'Скрий инспектора'}>{inspectorCollapsed ? '‹' : '›'}</button>
          </header>
          {!inspectorCollapsed && <>
          {selectedPiece ? poseControls(selectedPiece) : <p className="assembly-puzzle-empty">Избери елемент от работната площ.</p>}
          <label><span>Име на сглобката</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Източник / как е проверена</span><textarea value={draft.sourceNote} onChange={(event) => setDraft((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="Напр. физическа проба, технически чертеж от производител, специалист..." /></label>
          <label><span>Бележка</span><textarea value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Какво трябва да се провери при тази ръчна сглобка?" /></label>
          <div className="assembly-custom-controls-actions">
            <button type="button" onClick={save}>Запази черновата</button>
            <button type="button" className="is-secondary" onClick={reset}>Започни отначало</button>
          </div>
          {savedMessage && <p className="assembly-custom-saved">{savedMessage}</p>}
          <div className="assembly-custom-review-gate"><b>ЧОВЕШКА ПРОВЕРКА</b><p>Пъзелът наследява само контекста от активния модул. Работната площ започва празна и човекът избира всеки детайл. Каталожен запис без индексирана техническа скица се показва вляво, без FacadeFlow да измисля геометрия.</p></div>
          </>}
        </aside>
      </div>
    </section>
  )
}

function JointDetail({
  joint,
  fieldGlazingContext,
  moduleContext,
  jointGlazingLink,
  jointGlazingEvidence,
  draft,
  onBack,
  onDraftSaved,
  onDraftDeleted,
}: {
  joint: SystemDrivenJointReadModel
  fieldGlazingContext: SystemDrivenFieldGlazingContextReadModel | null
  moduleContext: ManualAssemblyModuleContext | null
  jointGlazingLink: SystemDrivenJointGlazingLinkReadModel | null
  jointGlazingEvidence: SystemDrivenJointGlazingEvidenceReadModel | null
  draft: CustomJointDraft | null
  onBack: () => void
  onDraftSaved: (draft: CustomJointDraft) => void
  onDraftDeleted: () => void
}) {
  const [customWorkspaceOpen, setCustomWorkspaceOpen] = useState(false)
  return (
    <section className="assembly-joint-detail">
      <button type="button" className="assembly-joint-back" onClick={onBack}>← Назад към всички сглобки</button>
      <header>
        <div><span>СГЛОБКА · ПОЛЕ {joint.fieldSequence} · {EDGE_LABELS[joint.edge]}</span><h3>{joint.boundaryLabelBg} · {joint.supportProfileCode ?? '—'} ↔ {joint.sashProfileCode ?? '—'}</h3></div>
        <strong className={operatorJointStatusClass(joint)}>{operatorJointStatusLabel(joint)}</strong>
      </header>

      <OperatorJointParameters joint={joint} context={fieldGlazingContext} />
      <AutomaticSystemAssemblyView joint={joint} fieldGlazingContext={fieldGlazingContext} />

      <section className="assembly-manual-puzzle-launcher">
        <div>
          <span>РЪЧНА СГЛОБКА</span>
          <b>Подреди профилите като пъзел</b>
          <small>Избираш профили от {getProfileSystemById(joint.systemId)?.name ?? joint.systemId}, влачиш ги, завърташ ги и запазваш човешка чернова.</small>
        </div>
        <button type="button" onClick={() => setCustomWorkspaceOpen((value) => !value)}>
          {customWorkspaceOpen ? 'Скрий ръчната сглобка' : draft ? 'Продължи ръчната сглобка' : 'Отвори ръчна сглобка · пъзел'}
        </button>
      </section>

      {customWorkspaceOpen && (
        <CustomJointWorkspace
          joint={joint}
          fieldGlazingContext={fieldGlazingContext}
          moduleContext={moduleContext}
          initialDraft={draft}
          onSaved={onDraftSaved}
          onClose={() => setCustomWorkspaceOpen(false)}
        />
      )}

      <details className="assembly-technical-admin">
        <summary>Техническа диагностика · за настройка на каталога</summary>
        <div className="assembly-technical-admin-content">
      <JointFieldGlazingContext context={fieldGlazingContext} />
      <JointGlazingLink link={jointGlazingLink} />
      <JointGlazingEvidence evidence={jointGlazingEvidence} />

      <details className="assembly-joint-detail-disclosure">
        <summary>Как FacadeFlow избра тази сглобка</summary>
        <div className="assembly-boundary-resolution" aria-label="Разрешаване на конструктивната граница">
          <div><span>1 · Геометрична страна</span><b>{EDGE_LABELS[joint.edge]}</b><small>от topology на ПОЛЕ {joint.fieldSequence}</small></div>
          <i>→</i>
          <div><span>2 · Конструктивна роля</span><b>{joint.boundaryLabelBg}</b><small>{joint.roleResolutionStatus === 'resolved' ? 'ролите съвпадат с каталога' : joint.roleResolutionStatus === 'role-mismatch' ? 'ролите не съвпадат' : 'чака профили'}</small></div>
          <i>→</i>
          <div><span>3 · Реални профили</span><b>{joint.supportProfileCode ?? '—'} ↔ {joint.sashProfileCode ?? '—'}</b><small>{joint.supportProfileRole ?? '—'} ↔ {joint.sashProfileRole ?? '—'}</small></div>
          <i>→</i>
          <div><span>4 · Сглобка</span><b>{jointStatusLabel(joint)}</b><small>{joint.geometryStatus === 'available' ? 'геометрията е налична' : 'показва се системен преглед'}</small></div>
        </div>
      </details>

      <details className="assembly-joint-detail-disclosure">
        <summary>Технически параметри на системното правило</summary>
        <SystemConstructionRulePanel joint={joint} />
      </details>

      <details className="assembly-joint-detail-disclosure">
        <summary>Източник и експертни инструменти</summary>
        <JointSourcePanel
          joint={joint}
          draft={draft}
          onCreateDraft={() => setCustomWorkspaceOpen(true)}
          onContinueDraft={() => setCustomWorkspaceOpen(true)}
          onDeleteDraft={() => {
            if (!joint.libraryKey) return
            deleteCustomJointDraft(joint.libraryKey)
            setCustomWorkspaceOpen(false)
            onDraftDeleted()
          }}
        />
      </details>

      <details className="assembly-joint-detail-disclosure assembly-joint-validation">
        <summary>Статус за производство и доказателства</summary>
        <div className="assembly-joint-validation-content">
          {joint.evidenceStatus === 'verified' ? (
            <div className="assembly-joint-confirmed">
              <b>Този възел има проверено доказателство за точната двойка профили.</b>
              <p>Потвърдената геометрия може да се използва от следващите readiness правила.</p>
            </div>
          ) : (
            <div className="assembly-joint-locked">
              <span>ПРОИЗВОДСТВЕНОТО ПОТВЪРЖДЕНИЕ ЛИПСВА</span>
              <b>{joint.noteBg}</b>
              <p>Системният преглед по-горе остава видим и работещ. За производствени размери е нужен точен технически чертеж, проверена физическа сглобка или потвърждение от специалист за тази конкретна двойка профили.</p>
            </div>
          )}

          <div className="assembly-joint-facts">
            <div><span>Опорен елемент</span><b>{joint.supportLabelBg}</b><small>{joint.supportProfileCode ?? 'профилът не е избран'} · роля {joint.supportProfileRole ?? '—'}</small></div>
            <div><span>Крило</span><b>{joint.sashProfileCode ?? 'Не е избрано'}</b><small>ПОЛЕ {joint.fieldSequence} · роля {joint.sashProfileRole ?? '—'}</small></div>
            <div><span>Граница</span><b>{EDGE_LABELS[joint.edge]}</b><small>изведена от topology на модула</small></div>
            <div><span>Монтажна геометрия</span><b>{joint.geometryStatus === 'available' ? 'НАЛИЧНА' : 'ЗА ПРОВЕРКА'}</b><small>системният преглед не е производствено потвърждение</small></div>
          </div>

          <p className="assembly-custom-joint-principle"><b>Граница на знание:</b> системният преглед, собствената чернова и фабрично провереният възел са отделни източници.</p>
        </div>
      </details>
        </div>
      </details>
    </section>
  )
}

function ModuleConnectionQuestions({ snapshot, moduleId }: { snapshot: ProjectSnapshot; moduleId: string }) {
  const product = useMemo(() => buildSystemDrivenProductReadModel(snapshot, moduleId), [snapshot, moduleId])
  return (
    <section className="assembly-product-section">
      <header><div><span>ВРЪЗКИ МЕЖДУ МОДУЛИТЕ</span><h3>Следващото ниво на изделието</h3></div><small>Преди сглобка трябва да е определена физическата граница между два модула.</small></header>
      {product.moduleConnectionQuestions.length === 0 ? <p className="assembly-empty-state">Изделието има само един модул или още няма модули за свързване.</p> : (
        <div className="assembly-module-connection-list">
          {product.moduleConnectionQuestions.map((connection) => (
            <article key={connection.id}>
              <div><span>Модул {connection.fromModuleSequence}</span><i>↔</i><span>Модул {connection.toModuleSequence}</span></div>
              <b>ГРАНИЦАТА НЕ Е ОПРЕДЕЛЕНА</b>
              <p>{connection.noteBg}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * AUTOMATIC SYSTEM ASSEMBLY VIEW 01
 * Legacy compatibility marker: АВТОМАТИЧНА СИСТЕМНА СГЛОБКА
 *
 * Assembly Review now shows the generated system assembly first. It keeps system-driven boundary resolution and adds an explicit
 * source layer plus a reusable local custom-draft workspace. Exact geometry
 * still stays evidence-gated; a saved draft never promotes itself to verified.
 *
 * The system-driven joint view remains read-only with respect to project topology. It derives boundary roles from topology,
 * resolves reusable joint types, applies reference-derived system rules when
 * available, and still fails closed for exact assembly geometry until reviewed
 * evidence exists.
 */
export function AssemblyReviewPanel({ snapshot, moduleId }: { snapshot: ProjectSnapshot; moduleId: string | null }) {
  const [open, setOpen] = useState(false)
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null)
  const [jointLibraryRevision, setJointLibraryRevision] = useState(0)
  const dialog = useRef<HTMLElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const activeModule = moduleId ? snapshot.modulesById[moduleId] ?? null : null
  const moduleModel = useMemo(
    () => moduleId ? buildSystemDrivenModuleReadModelFromSnapshot(snapshot, moduleId) : null,
    [snapshot, moduleId],
  )
  const manualAssemblyModuleContext = useMemo(
    () => moduleContextFromSelection(activeModule, moduleModel),
    [activeModule, moduleModel],
  )
  const technical = useMemo(() => {
    if (!open || !moduleId) return null
    const assembly = deriveResolvedAssembly(snapshot, moduleId)
    return { review: selectAssemblyReview(assembly), gates: assessReadiness(assembly, snapshot) }
  }, [open, snapshot, moduleId])
  const customJointLibrary = useMemo(() => readCustomJointLibrary(), [jointLibraryRevision, open])
  const selectedJoint = moduleModel?.joints.find((joint) => joint.id === selectedJointId) ?? null
  const selectedFieldGlazingContext = selectedJoint
    ? moduleModel?.fieldGlazingContexts.find((context) => context.fieldId === selectedJoint.fieldId) ?? null
    : null
  const selectedJointGlazingLink = selectedJoint
    ? moduleModel?.jointGlazingLinks.find((link) => link.jointId === selectedJoint.id) ?? null
    : null
  const selectedJointGlazingEvidence = selectedJoint
    ? moduleModel?.jointGlazingEvidence.find((entry) => entry.jointId === selectedJoint.id) ?? null
    : null
  const selectedJointDraft = selectedJoint?.libraryKey ? customJointLibrary.drafts[selectedJoint.libraryKey] ?? null : null

  useEffect(() => { setSelectedJointId(null) }, [moduleId])
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => dialog.current?.focus())
    return () => {
      window.cancelAnimationFrame(focusFrame)
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      launcher.current?.focus()
    }
  }, [open])

  return <>
    <button ref={launcher} type="button" className="assembly-review-launcher" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} aria-label="Преглед на сглобките">
      {activeModule ? `Сглобки · Модул ${activeModule.sequence}` : 'Сглобки'}
    </button>
    {open && createPortal(
      <div className="assembly-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <section ref={dialog} className="assembly-review-dialog assembly-product-dialog" role="dialog" aria-modal="true" aria-labelledby="assembly-review-title" tabIndex={-1} onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
        }}>
          <header className="assembly-product-dialog-head">
            <div><h2 id="assembly-review-title">{activeModule ? `Сглобки · Модул ${activeModule.sequence}` : 'Сглобки на изделието'}</h2><p>Конструкция → функция → система → остъкляване → техническа скица</p></div>
            <button type="button" onClick={() => setOpen(false)}>Затвори</button>
          </header>

          {!moduleModel ? <div className="assembly-product-empty"><b>Избери модул в Constructor.</b><p>FacadeFlow ще изведе компонентите и необходимите сглобки от реалната конструкция.</p></div> : selectedJoint ? (
            <JointDetail
              joint={selectedJoint}
              fieldGlazingContext={selectedFieldGlazingContext}
              moduleContext={manualAssemblyModuleContext}
              jointGlazingLink={selectedJointGlazingLink}
              jointGlazingEvidence={selectedJointGlazingEvidence}
              draft={selectedJointDraft}
              onBack={() => setSelectedJointId(null)}
              onDraftSaved={() => setJointLibraryRevision((value) => value + 1)}
              onDraftDeleted={() => setJointLibraryRevision((value) => value + 1)}
            />
          ) : (
            <div className="assembly-product-body is-operator-first">
              <OperatorWorkflowSummary model={moduleModel} />
              <ModuleAssemblyMap model={moduleModel} onSelect={(joint) => setSelectedJointId(joint.id)} />
              <OperatorGlazingSummary model={moduleModel} />
              <OperatorJointChooser model={moduleModel} onSelect={(joint) => setSelectedJointId(joint.id)} />

              <details className="assembly-technical-admin">
                <summary>Техническа администрация · каталози, проверки и диагностика</summary>
                <div className="assembly-technical-admin-content">
                  <SystemLogicStrip />
                  <ModuleSystemSummary model={moduleModel} />
                  <BoundaryCoveragePanel model={moduleModel} onSelect={(joint) => setSelectedJointId(joint.id)} />
                  <FieldGlazingContextPanel model={moduleModel} />
                  <JointGlazingLinkagePanel model={moduleModel} />
                  <GlazingEvidenceStatusPanel model={moduleModel} />
                  <GlazingEvidenceGapPanel model={moduleModel} />
                  <GlazingEvidenceReviewGatePanel model={moduleModel} />
                  <JointLibrary model={moduleModel} drafts={customJointLibrary.drafts} onSelect={(joint) => setSelectedJointId(joint.id)} />
                  <details className="assembly-product-disclosure">
                    <summary>Компоненти на модула · {moduleModel.resolvedComponentCount}/{moduleModel.requiredComponentCount} избрани</summary>
                    <ComponentTable model={moduleModel} />
                  </details>
                  <details className="assembly-product-disclosure">
                    <summary>Табличен списък на сглобките · {moduleModel.requiredJointCount}</summary>
                    <JointList model={moduleModel} onSelect={(joint) => setSelectedJointId(joint.id)} />
                  </details>
                  <ModuleConnectionQuestions snapshot={snapshot} moduleId={moduleModel.moduleId ?? moduleId!} />
                  {technical && <details className="assembly-review-checks assembly-product-technical">
                    <summary>Експертна техническа проверка · {technical.review.unresolved.length} неизпълнени изисквания</summary>
                    <div className="assembly-review-checks-content">
                      <p className="assembly-review-boundary">Тези проверки не променят конструкцията и не отключват производство.</p>
                      {technical.review.contextBlockers.map((blocker) => <div key={blocker.id} className="assembly-review-blocker"><b>{blocker.messageBg}</b><p>{blocker.nextStepBg}</p></div>)}
                      <h3>Готовност по дейности</h3>
                      <ul className="assembly-review-gates">{technical.gates.map((gate) => <li key={gate.gate}><span>{gateLabels[gate.gate]}</span><b>Блокирано</b><small>{gate.gate === 'ASSEMBLY_RESOLUTION' ? 'Изисква проверени сглобки за необходимите граници.' : 'По-късен етап.'}</small></li>)}</ul>
                    </div>
                  </details>}
                </div>
              </details>

              <p className="assembly-operator-principle"><b>FacadeFlow обслужва оператора:</b> задаваш конструкцията, функцията, системата и остъкляването; програмата извежда сглобките и техническите скици.</p>
            </div>
          )}
        </section>
      </div>,
      document.body,
    )}
  </>
}
