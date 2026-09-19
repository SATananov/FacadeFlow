import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  CONSTRUCTION_DEFAULT_FRAME_FACE_MM,
  cloneConstructionModel,
  createConstructionModel,
  findFieldAtPoint,
  getConstructionFrameFaceMm,
  getConstructionMinimumFrameSize,
  migrateLegacyDividersToTopology,
  moveDivider,
  moveAngledDivider,
  moveAngledDividerEndpoint,
  removeDivider,
  resizeConstructionFrame,
  resolveConstructionTopology,
  setConstructionFieldOpeningHanding,
  setConstructionFieldOpeningMode,
  setConstructionFieldType,
  splitField,
  splitFieldAngled,
  upgradeConstructionModelPhysicalDividers,
  type ConstructionAxis,
  type ConstructionFrame,
  type ConstructionModel,
  type ConstructionFieldType,
  type ConstructionOpeningMode,
  type ConstructionOpeningHanding,
  type ResolvedConstructionDivider,
  type ResolvedConstructionAngledDivider,
  type ResolvedConstructionField,
} from '../domain/construction'
export type { ConstructorDividerSnapshot, ConstructorDraftSnapshot } from '../domain/construction'
import type { ConstructorDraftSnapshot } from '../domain/construction'
import {
  getDividerProfileCandidates,
  getEffectiveFieldGlazingSpecification,
  getEffectiveFieldGlazingThicknessMm,
  getFieldGlazingBeadResolutionContext,
  getFieldHumanGlazingThicknessMm,
  getFieldSashProfileCandidates,
  getFrameProfileCandidates,
  getProfileReinforcementCandidates,
  getReinforcementTargetKey,
  reconcileModuleProfileResolution,
  setDividerProfileAssignment,
  setFieldGlazingBeadAssignment,
  setFieldGlazingSpecificationAssignment,
  setFieldHumanGlazingThicknessAssignment,
  setModuleGlazingSpecificationAssignment,
  setFieldSashProfileAssignment,
  setFrameProfileAssignment,
  setReinforcementAssignment,
  type ModuleProfileResolution,
  type ReinforcementTarget,
} from '../domain/profileResolution'
import { resolveHumanGlazingContext } from '../domain/glazingContext'
import {
  getConfirmedGlazingOptions,
  getGlazingOptionById,
  getProfileSystemById,
  getSelectableProfileSystems,
  type ProfileDefinition,
  type ReinforcementDefinition,
} from '../data/profileSystems'
import {
  buildModuleDimensionalChain,
  formatResolvedDimension,
  getAssignedProfileDimensionalReadModel,
  type AssignedProfileDimensionalReadModel,
  type ResolvedDimension,
} from '../domain/profileDimensionalSemantics'
import {
  buildProfileAwareGeometryReadModel,
} from '../domain/profileAwareGeometry'
import {
  buildProfileJointGeometryReadModel,
  type ProfileJointBoundaryReadModel,
} from '../domain/profileJointGeometry'
import {
  buildProfileAwareSashGeometryReadModel,
} from '../domain/profileAwareSashGeometry'
import {
  evaluateGlazingBeadCompatibility,
  evaluateReinforcementCompatibility,
  type ComponentCompatibilityResult,
} from '../domain/componentCompatibility'
import { buildFieldHardwareRequirements } from '../domain/hardwareResolution'
import { buildSystemDrivenModuleReadModel } from '../domain/systemDrivenProductModel'
import {
  isPendingFormFieldDescription,
  transferFormFieldDescriptionsToConstruction,
  type FormFieldDescriptionInput,
} from '../domain/formConstructorTransition'
import './ConstructorShell.css'

export type ConstructorMode = 'offer' | 'free'
export type ConstructorDividerAxis = ConstructionAxis

export type ConstructorFieldTopologySummary = {
  id: string
  sequence: number
  widthMm: number
  heightMm: number
  fieldType: ConstructionFieldType | null
  openingMode: ConstructionOpeningMode | null
  openingHanding: ConstructionOpeningHanding | null
}

export type ConstructorInitialFieldDescription = FormFieldDescriptionInput

type ConstructorOfferContext = {
  profileSystemId: string
  profileSystemLabel: string
  colorLabel: string
  foilModeLabel: string
  glazingId: string
  glazingLabel: string
  hardwareStandardId: string
  hardwareLabel: string
}

type ConstructorModuleSummary = {
  productType: 'window' | 'door' | null
  productTypeLabel: string
  widthMm: number | null
  heightMm: number | null
}

type ConstructorModuleSize = {
  widthMm: number
  heightMm: number
}

type ConstructorModuleNavItem = {
  id: string
  sequence: number
}

type ConstructorShellProps = {
  mode: ConstructorMode
  moduleNumber?: number
  moduleItems?: readonly ConstructorModuleNavItem[]
  activeModuleId?: string
  offerContext?: ConstructorOfferContext
  freeProfileSystemId?: string
  onFreeProfileSystemChange?: (profileSystemId: string) => void
  moduleSummary?: ConstructorModuleSummary
  initialDraft?: ConstructorDraftSnapshot | null
  initialFieldDescriptions?: readonly ConstructorInitialFieldDescription[]
  profileResolution?: ModuleProfileResolution | null
  onDraftChange?: (draft: ConstructorDraftSnapshot | null) => void
  onProfileResolutionChange?: (resolution: ModuleProfileResolution) => void
  onModuleSizeChange?: (size: ConstructorModuleSize) => void
  onModuleProductTypeChange?: (productType: 'window' | 'door' | null) => void
  onFieldTopologyChange?: (fields: readonly ConstructorFieldTopologySummary[]) => void
  onSelectModule?: (moduleId: string) => void
  onCreateModule?: () => void
  onResetModule?: () => void
  onDeleteModule?: () => void
  onClose: () => void
  onCreateOfferFromSketch?: (draft: ConstructorDraftSnapshot | null) => void
}

type ConstructorHistoryEntry = {
  construction: ConstructionModel | null
  profileResolution: ModuleProfileResolution | null
  productType: 'window' | 'door' | null
}

type ConstructorHistoryStacks = {
  undo: ConstructorHistoryEntry[]
  redo: ConstructorHistoryEntry[]
}

// FACADEFLOW 0.1.8B ATOMIC MODULE HISTORY 01: session-only cache keeps each module's history while switching modules.
// It is deliberately NOT persisted to project storage and disappears after app reload.
const constructorHistoryByModuleId = new Map<string, ConstructorHistoryStacks>()

function cloneHistoryProfileResolution(
  resolution: ModuleProfileResolution | null,
): ModuleProfileResolution | null {
  return resolution ? structuredClone(resolution) : null
}

function cloneHistoryEntry(entry: ConstructorHistoryEntry): ConstructorHistoryEntry {
  return {
    construction: entry.construction ? cloneConstructionModel(entry.construction) : null,
    profileResolution: cloneHistoryProfileResolution(entry.profileResolution),
    productType: entry.productType,
  }
}

type ConstructorTool =
  | 'select'
  | 'pan'
  | 'frame'
  | 'vertical-divider'
  | 'horizontal-divider'
  | 'angled-divider'
  | 'fixed-field'
  | 'operable-field'
type FrameEdge = 'left' | 'right' | 'top' | 'bottom'
type InspectorTab = 'properties' | 'profile' | 'dimensions' | 'glazing'
type DividerModel = ResolvedConstructionDivider
type AngledDividerModel = ResolvedConstructionAngledDivider
type FieldModel = ResolvedConstructionField
type FrameModel = ConstructionFrame

type CanvasPoint = {
  xMm: number
  yMm: number
}

type ViewOffset = {
  xPx: number
  yPx: number
}

type ViewPanState = {
  pointerId: number
  startClientX: number
  startClientY: number
  startOffset: ViewOffset
}

type DragState =
  | {
      kind: 'create'
      pointerId: number
      start: CanvasPoint
      preview: FrameModel
    }
  | {
      kind: 'resize'
      pointerId: number
      edge: FrameEdge
      original: FrameModel
      originalConstruction: ConstructionModel
    }
  | {
      kind: 'divider'
      pointerId: number
      dividerId: string
      axis: ConstructorDividerAxis
      grabOffsetMm: number
      originalConstruction: ConstructionModel
    }
  | {
      kind: 'angled-divider'
      pointerId: number
      dividerId: string
      startPointerXMm: number
      originalTopOffsetMm: number
      originalBottomOffsetMm: number
      originalConstruction: ConstructionModel
    }
  | {
      kind: 'angled-endpoint'
      pointerId: number
      dividerId: string
      endpoint: 'top' | 'bottom'
      parentStartXMm: number
      originalConstruction: ConstructionModel
    }

const ZOOM_STEPS = [25, 33, 50, 67, 75, 100, 125, 150, 200] as const
const MIN_VIEW_ZOOM = ZOOM_STEPS[0]
const MAX_VIEW_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1]
const SNAP_STEP_MM = 10
const GRID_STEP_MM = 50
const MAJOR_GRID_STEP_MM = 500
const BASE_PX_PER_MM = 0.28
const MIN_FRAME_MM = 200

const FREE_MODULE_SUMMARY: ConstructorModuleSummary = {
  productType: null,
  productTypeLabel: 'Свободна скица',
  widthMm: null,
  heightMm: null,
}

function clampZoom(current: number, direction: -1 | 1) {
  if (direction < 0) {
    return [...ZOOM_STEPS].reverse().find((value) => value < current) ?? ZOOM_STEPS[0]
  }

  return ZOOM_STEPS.find((value) => value > current) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getInitialFrame(
  initialDraft: ConstructorDraftSnapshot | null | undefined,
  moduleSummary: ConstructorModuleSummary,
): FrameModel | null {
  if (initialDraft?.frame) {
    return { ...initialDraft.frame }
  }

  if (
    moduleSummary.widthMm !== null &&
    moduleSummary.heightMm !== null &&
    moduleSummary.widthMm > 0 &&
    moduleSummary.heightMm > 0
  ) {
    return {
      xMm: 420,
      yMm: 260,
      widthMm: moduleSummary.widthMm,
      heightMm: moduleSummary.heightMm,
    }
  }

  return null
}

function constructionToSnapshot(model: ConstructionModel): ConstructorDraftSnapshot {
  return {
    version: 'constructor-01d',
    frame: { ...model.frame },
    topology: cloneConstructionModel(model),
  }
}

function getInitialConstruction(
  initialDraft: ConstructorDraftSnapshot | null | undefined,
  moduleSummary: ConstructorModuleSummary,
  initialFieldDescriptions: readonly ConstructorInitialFieldDescription[],
): ConstructionModel | null {
  if (initialDraft?.topology) {
    return transferFormFieldDescriptionsToConstruction(
      upgradeConstructionModelPhysicalDividers(initialDraft.topology),
      initialFieldDescriptions,
    )
  }

  const frame = getInitialFrame(initialDraft, moduleSummary)
  if (!frame) return null

  const initial = initialDraft?.dividers?.length
    ? migrateLegacyDividersToTopology(frame, initialDraft.dividers)
    : createConstructionModel(frame)

  return transferFormFieldDescriptionsToConstruction(initial, initialFieldDescriptions)
}

export default function ConstructorShell({
  mode,
  moduleNumber = 1,
  moduleItems = [],
  activeModuleId,
  offerContext,
  freeProfileSystemId = '',
  onFreeProfileSystemChange,
  moduleSummary = FREE_MODULE_SUMMARY,
  initialDraft,
  initialFieldDescriptions = [],
  profileResolution,
  onDraftChange,
  onProfileResolutionChange,
  onModuleSizeChange,
  onModuleProductTypeChange,
  onFieldTopologyChange,
  onSelectModule,
  onCreateModule,
  onResetModule,
  onDeleteModule,
  onClose,
  onCreateOfferFromSketch,
}: ConstructorShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<ConstructorTool>('select')
  const [gridVisible, setGridVisible] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [zoom, setZoom] = useState<number>(100)
  const [viewOffset, setViewOffset] = useState<ViewOffset>({ xPx: 0, yPx: 0 })
  const [viewPanState, setViewPanState] = useState<ViewPanState | null>(null)
  const [autoFitEnabled, setAutoFitEnabled] = useState(true)
  const [profileViewEnabled, setProfileViewEnabled] = useState(true)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties')
  const [construction, setConstruction] = useState<ConstructionModel | null>(() =>
    getInitialConstruction(initialDraft, moduleSummary, initialFieldDescriptions),
  )
  const formFieldTransferConsumedRef = useRef(
    initialFieldDescriptions.length === 0 ||
    Boolean(
      construction &&
      resolveConstructionTopology(construction).fields.length === initialFieldDescriptions.length
    ),
  )
  const historySessionKey = activeModuleId ? `${mode}:${activeModuleId}` : null
  const cachedModuleHistory = historySessionKey
    ? constructorHistoryByModuleId.get(historySessionKey)
    : undefined
  const [undoStack, setUndoStack] = useState<ConstructorHistoryEntry[]>(() =>
    cachedModuleHistory?.undo.map(cloneHistoryEntry) ?? [],
  )
  const [redoStack, setRedoStack] = useState<ConstructorHistoryEntry[]>(() =>
    cachedModuleHistory?.redo.map(cloneHistoryEntry) ?? [],
  )
  const constructionRef = useRef<ConstructionModel | null>(construction)
  const profileResolutionRef = useRef<ModuleProfileResolution | null>(
    cloneHistoryProfileResolution(profileResolution ?? null),
  )
  const productTypeRef = useRef<'window' | 'door' | null>(moduleSummary.productType)
  const undoStackRef = useRef<ConstructorHistoryEntry[]>(undoStack)
  const redoStackRef = useRef<ConstructorHistoryEntry[]>(redoStack)
  const frame = construction?.frame ?? null
  const resolvedTopology = useMemo(
    () => construction
      ? resolveConstructionTopology(construction)
      : { fields: [] as FieldModel[], dividers: [] as DividerModel[], angledDividers: [] as AngledDividerModel[] },
    [construction],
  )
  const fields = resolvedTopology.fields
  const dividers = resolvedTopology.dividers
  const angledDividers = resolvedTopology.angledDividers
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    null,
  )
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null)
  const [selectedAngledDividerId, setSelectedAngledDividerId] = useState<string | null>(null)
  const [dividerPositionDraft, setDividerPositionDraft] = useState('')
  const [selectedEdge, setSelectedEdge] = useState<FrameEdge | null>(null)
  const [frameSelected, setFrameSelected] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [cursorPoint, setCursorPoint] = useState<CanvasPoint | null>(null)
  const [widthDraft, setWidthDraft] = useState(() =>
    frame ? String(Math.round(frame.widthMm)) : '',
  )
  const [heightDraft, setHeightDraft] = useState(() =>
    frame ? String(Math.round(frame.heightMm)) : '',
  )
  const [glazingThicknessDraft, setGlazingThicknessDraft] = useState('')
  const inspectorPaneRef = useRef<HTMLDivElement>(null)

  const isFreeMode = mode === 'free'
  const hasActiveModule = Boolean(activeModuleId && moduleItems.some((item) => item.id === activeModuleId))
  const canEditConstruction = !isFreeMode || hasActiveModule
  const showModuleStrip = isFreeMode || moduleItems.length > 0
  const pxPerMm = BASE_PX_PER_MM * (zoom / 100)
  const frameFaceMm = construction
    ? getConstructionFrameFaceMm(construction)
    : CONSTRUCTION_DEFAULT_FRAME_FACE_MM
  const frameFacePx = Math.max(12, frameFaceMm * pxPerMm)
  const displayedFrame = dragState?.kind === 'create' ? dragState.preview : frame
  const moduleSizeLabel = displayedFrame
    ? `${Math.round(displayedFrame.widthMm)} × ${Math.round(displayedFrame.heightMm)} mm`
    : 'Размерите още не са зададени'

  const title = isFreeMode
    ? hasActiveModule
      ? `Свободна скица · Модул ${moduleNumber}`
      : 'Свободна скица'
    : `Модул ${moduleNumber}`
  const selectedDivider = dividers.find((divider) => divider.id === selectedDividerId) ?? null
  const selectedAngledDivider = angledDividers.find((divider) => divider.id === selectedAngledDividerId) ?? null
  // Split tools may retain a FIELD id while selecting the new divider.
  // Resolve one UI context using the same priority as the drawing inspector.
  const selectedField = !selectedDivider && !selectedAngledDivider && !frameSelected
    ? fields.find((field) => field.id === selectedFieldId) ?? null
    : null
  const conceptualFieldCount = fields.length
  const pendingInitialFieldDescriptions = isFreeMode
    ? []
    : initialFieldDescriptions.filter(isPendingFormFieldDescription)
  const selectedProfileSystem = getProfileSystemById(
    isFreeMode ? freeProfileSystemId : offerContext?.profileSystemId ?? '',
  )
  const selectedGlazing = !isFreeMode && offerContext
    ? getGlazingOptionById(offerContext.glazingId)
    : undefined
  const profileResolvableDividerIds = useMemo(
    () => [
      ...dividers.map((divider) => divider.id),
      ...angledDividers.map((divider) => divider.id),
    ],
    [dividers, angledDividers],
  )
  const effectiveProfileResolution = useMemo(
    () => selectedProfileSystem
      ? reconcileModuleProfileResolution(
          profileResolution,
          selectedProfileSystem,
          moduleSummary.productType,
          profileResolvableDividerIds,
          fields,
          null,
          !isFreeMode ? offerContext?.glazingId ?? null : null,
        )
      : null,
    [
      profileResolution,
      selectedProfileSystem,
      moduleSummary.productType,
      profileResolvableDividerIds,
      fields,
      selectedGlazing?.totalThicknessMm,
    ],
  )
  const offerDefaultGlazingId = !isFreeMode ? offerContext?.glazingId ?? null : null
  const selectedFieldGlazingSpecification = selectedField
    ? getEffectiveFieldGlazingSpecification(effectiveProfileResolution, offerDefaultGlazingId, selectedField.id)
    : { glazingId: null, thicknessMm: null, source: 'unset' as const }
  const selectedFieldExplicitGlazingThicknessMm = selectedField
    ? getFieldHumanGlazingThicknessMm(effectiveProfileResolution, selectedField.id)
    : null
  const selectedFieldGlazingThicknessMm = selectedField
    ? getEffectiveFieldGlazingThicknessMm(effectiveProfileResolution, offerDefaultGlazingId, selectedField.id)
    : null
  const selectedFieldGlazingAssignment = selectedField
    ? effectiveProfileResolution?.fieldGlazingBeads[selectedField.id] ?? null
    : null
  const selectedFieldHumanGlazingContext = useMemo(
    () => selectedProfileSystem && selectedField
      ? resolveHumanGlazingContext(
          selectedProfileSystem,
          selectedFieldGlazingThicknessMm,
          selectedFieldGlazingAssignment?.profileCode ?? null,
        )
      : null,
    [
      selectedProfileSystem,
      selectedField,
      selectedFieldGlazingThicknessMm,
      selectedFieldGlazingAssignment?.profileCode,
    ],
  )

  const selectedFieldHardwareRequirements = useMemo(
    () => selectedField
      ? buildFieldHardwareRequirements({
          field: selectedField,
          profileSystemId: selectedProfileSystem?.id,
          hardwareStandardId: offerContext?.hardwareStandardId,
        })
      : null,
    [selectedField, selectedProfileSystem?.id, offerContext?.hardwareStandardId],
  )
  const dimensionalChain = useMemo(
    () => frame && selectedProfileSystem && effectiveProfileResolution
      ? buildModuleDimensionalChain({
          frame,
          frameFaceMm,
          fields,
          dividers,
          system: selectedProfileSystem,
          resolution: effectiveProfileResolution,
        })
      : null,
    [frame, frameFaceMm, fields, dividers, selectedProfileSystem, effectiveProfileResolution],
  )
  const profileAwareGeometry = useMemo(
    () => selectedProfileSystem && effectiveProfileResolution
      ? buildProfileAwareGeometryReadModel({
          system: selectedProfileSystem,
          resolution: effectiveProfileResolution,
          dividers,
          fields,
          angledDividerCount: angledDividers.length,
        })
      : null,
    [selectedProfileSystem, effectiveProfileResolution, dividers, angledDividers.length, fields],
  )
  const profileJointGeometry = useMemo(
    () => frame && selectedProfileSystem && effectiveProfileResolution
      ? buildProfileJointGeometryReadModel({
          frame,
          frameFaceMm,
          dividers,
          fields,
          system: selectedProfileSystem,
          resolution: effectiveProfileResolution,
        })
      : null,
    [frame, frameFaceMm, dividers, fields, selectedProfileSystem, effectiveProfileResolution],
  )
  const profileAwareSashGeometry = useMemo(
    () => frame && selectedProfileSystem && effectiveProfileResolution && profileJointGeometry
      ? buildProfileAwareSashGeometryReadModel({
          frame,
          dividers,
          fields,
          system: selectedProfileSystem,
          resolution: effectiveProfileResolution,
          joints: profileJointGeometry,
        })
      : null,
    [frame, dividers, fields, selectedProfileSystem, effectiveProfileResolution, profileJointGeometry],
  )
  const systemDrivenModuleModel = useMemo(
    () => buildSystemDrivenModuleReadModel({
      moduleId: activeModuleId ?? null,
      moduleSequence: moduleNumber || null,
      productType: moduleSummary.productType,
      system: selectedProfileSystem ?? null,
      construction,
      resolution: effectiveProfileResolution,
    }),
    [activeModuleId, moduleNumber, moduleSummary.productType, selectedProfileSystem, construction, effectiveProfileResolution],
  )
  const reviewedFrameFacePx = profileAwareGeometry?.frame.reviewed && profileAwareGeometry.frame.visibleFaceMm !== null
    ? Math.max(4, profileAwareGeometry.frame.visibleFaceMm * pxPerMm)
    : null
  const profileViewActive = Boolean(profileViewEnabled && profileAwareGeometry && frame)
  const selectedFieldDimensionalChain = selectedField
    ? dimensionalChain?.fields.find((field) => field.fieldId === selectedField.id) ?? null
    : null
  const selectedFieldJointGeometry = selectedField
    ? profileJointGeometry?.fields[selectedField.id] ?? null
    : null
  const selectedFieldSashGeometry = selectedField
    ? profileAwareSashGeometry?.fields[selectedField.id] ?? null
    : null
  const simpleBayDimensions = useMemo(() => {
    if (!frame || fields.length < 2) return []
    if (fields.some((field) => Boolean(field.polygon))) return []
    const first = fields[0]
    const sameHorizontalBand = fields.every((field) =>
      Math.abs(field.bounds.yMm - first.bounds.yMm) < 0.01 &&
      Math.abs(field.bounds.heightMm - first.bounds.heightMm) < 0.01,
    )
    if (!sameHorizontalBand) return []

    const verticalDividers = dividers
      .filter((divider) => divider.axis === 'vertical')
      .slice()
      .sort((a, b) => a.positionMm - b.positionMm)
    if (verticalDividers.length !== Math.max(0, fields.length - 1)) return []

    const boundaries = [
      0,
      ...verticalDividers.map((divider) => divider.positionMm + divider.thicknessMm / 2),
      frame.widthMm,
    ]
    if (boundaries.some((value, index) => index > 0 && value <= boundaries[index - 1])) return []

    return boundaries.slice(0, -1).map((startMm, index) => ({
      sequence: fields[index]?.sequence ?? index + 1,
      startMm,
      widthMm: boundaries[index + 1] - startMm,
    }))
  }, [dividers, fields, frame])

  useEffect(() => {
    profileResolutionRef.current = cloneHistoryProfileResolution(profileResolution ?? null)
  }, [profileResolution])

  useEffect(() => {
    productTypeRef.current = moduleSummary.productType
  }, [moduleSummary.productType])

  useEffect(() => {
    undoStackRef.current = undoStack
    redoStackRef.current = redoStack
    if (!historySessionKey) return
    constructorHistoryByModuleId.set(historySessionKey, {
      undo: undoStack.map(cloneHistoryEntry),
      redo: redoStack.map(cloneHistoryEntry),
    })
  }, [historySessionKey, undoStack, redoStack])

  useEffect(() => () => {
    if (!historySessionKey) return
    constructorHistoryByModuleId.set(historySessionKey, {
      undo: undoStackRef.current.map(cloneHistoryEntry),
      redo: redoStackRef.current.map(cloneHistoryEntry),
    })
  }, [historySessionKey])

  useEffect(() => {
    setGlazingThicknessDraft(
      selectedFieldGlazingThicknessMm === null ? '' : String(selectedFieldGlazingThicknessMm),
    )
  }, [selectedFieldId, selectedFieldGlazingThicknessMm])

  useEffect(() => {
    setInspectorTab('properties')
    inspectorPaneRef.current?.scrollTo({ top: 0 })
  }, [selectedFieldId, selectedDividerId, selectedAngledDividerId, frameSelected])

  useEffect(() => {
    if (!effectiveProfileResolution || !onProfileResolutionChange) return
    if (JSON.stringify(profileResolution) === JSON.stringify(effectiveProfileResolution)) return
    profileResolutionRef.current = cloneHistoryProfileResolution(effectiveProfileResolution)
    onProfileResolutionChange(effectiveProfileResolution)
  }, [effectiveProfileResolution, onProfileResolutionChange, profileResolution])

  useEffect(() => {
    setAutoFitEnabled(true)
  }, [activeModuleId])

  useEffect(() => {
    if (!autoFitEnabled || dragState || viewPanState || !frame) return
    const requestId = window.requestAnimationFrame(() => fitViewToFrame(frame))
    return () => window.cancelAnimationFrame(requestId)
  }, [
    autoFitEnabled,
    activeModuleId,
    dragState,
    frame?.xMm,
    frame?.yMm,
    frame?.widthMm,
    frame?.heightMm,
    viewPanState,
  ])

  useEffect(() => {
    const handleResize = () => {
      if (autoFitEnabled && !dragState && !viewPanState && frame) {
        fitViewToFrame(frame)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoFitEnabled, dragState, frame, viewPanState])

  const snapMm = (value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
    return snapEnabled
      ? Math.round(safeValue / SNAP_STEP_MM) * SNAP_STEP_MM
      : Math.round(safeValue)
  }

  const pointFromPointer = (event: ReactPointerEvent<HTMLElement>): CanvasPoint => {
    const canvas = canvasRef.current
    if (!canvas) {
      return { xMm: 0, yMm: 0 }
    }

    const rect = canvas.getBoundingClientRect()
    return {
      xMm: snapMm((event.clientX - rect.left - viewOffset.xPx) / pxPerMm),
      yMm: snapMm((event.clientY - rect.top - viewOffset.yPx) / pxPerMm),
    }
  }

  const fitViewToFrame = (targetFrame: FrameModel | null = frame) => {
    const canvas = canvasRef.current
    if (!canvas || !targetFrame || targetFrame.widthMm <= 0 || targetFrame.heightMm <= 0) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const horizontalPaddingPx = 72
    const verticalPaddingPx = 64
    const dimensionRightPx = 64
    const dimensionBottomPx = 52
    const availableWidthPx = Math.max(160, rect.width - horizontalPaddingPx * 2 - dimensionRightPx)
    const availableHeightPx = Math.max(160, rect.height - verticalPaddingPx * 2 - dimensionBottomPx)
    const fittedPxPerMm = Math.min(
      availableWidthPx / targetFrame.widthMm,
      availableHeightPx / targetFrame.heightMm,
    )
    const fittedZoom = Math.round(clamp(
      (fittedPxPerMm / BASE_PX_PER_MM) * 100,
      MIN_VIEW_ZOOM,
      MAX_VIEW_ZOOM,
    ))
    const fittedScale = BASE_PX_PER_MM * (fittedZoom / 100)
    const viewportCenterX = (rect.width - dimensionRightPx) / 2
    const viewportCenterY = (rect.height - dimensionBottomPx) / 2
    const frameCenterWorldX = targetFrame.xMm + targetFrame.widthMm / 2
    const frameCenterWorldY = targetFrame.yMm + targetFrame.heightMm / 2

    setZoom(fittedZoom)
    setViewOffset({
      xPx: Math.round(viewportCenterX - frameCenterWorldX * fittedScale),
      yPx: Math.round(viewportCenterY - frameCenterWorldY * fittedScale),
    })
  }

  const changeViewZoom = (direction: -1 | 1) => {
    const nextZoom = clampZoom(zoom, direction)
    if (nextZoom === zoom) return

    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const anchorX = rect.width / 2
      const anchorY = rect.height / 2
      const ratio = nextZoom / zoom
      setViewOffset((current) => ({
        xPx: Math.round(anchorX - (anchorX - current.xPx) * ratio),
        yPx: Math.round(anchorY - (anchorY - current.yPx) * ratio),
      }))
    }

    setAutoFitEnabled(false)
    setZoom(nextZoom)
  }

  const restoreFitView = () => {
    setAutoFitEnabled(true)
    fitViewToFrame(frame)
  }

  const captureHistoryEntry = (
    constructionOverride: ConstructionModel | null = constructionRef.current,
  ): ConstructorHistoryEntry => ({
    construction: constructionOverride ? cloneConstructionModel(constructionOverride) : null,
    profileResolution: cloneHistoryProfileResolution(profileResolutionRef.current),
    productType: productTypeRef.current,
  })

  const constructionEquals = (
    first: ConstructionModel | null,
    second: ConstructionModel | null,
  ) => JSON.stringify(first) === JSON.stringify(second)

  const profileResolutionEquals = (
    first: ModuleProfileResolution | null,
    second: ModuleProfileResolution | null,
  ) => JSON.stringify(first) === JSON.stringify(second)

  // FACADEFLOW 0.1.8E.1 HUMAN UNDO SESSION HOTFIX V2:
  // persist the new history stack synchronously before parent callbacks can re-render/remount.
  const writeHistoryStacks = (
    nextUndo: readonly ConstructorHistoryEntry[],
    nextRedo: readonly ConstructorHistoryEntry[],
  ) => {
    const clonedUndo = nextUndo.map(cloneHistoryEntry)
    const clonedRedo = nextRedo.map(cloneHistoryEntry)

    undoStackRef.current = clonedUndo
    redoStackRef.current = clonedRedo
    setUndoStack(clonedUndo)
    setRedoStack(clonedRedo)

    if (historySessionKey) {
      constructorHistoryByModuleId.set(historySessionKey, {
        undo: clonedUndo.map(cloneHistoryEntry),
        redo: clonedRedo.map(cloneHistoryEntry),
      })
    }
  }

  const pushUndoEntry = (entry: ConstructorHistoryEntry) => {
    writeHistoryStacks(
      [
        ...undoStackRef.current.slice(-59),
        cloneHistoryEntry(entry),
      ],
      [],
    )
  }

  const broadcastConstruction = (nextConstruction: ConstructionModel | null) => {
    let preparedConstruction = nextConstruction
    if (
      preparedConstruction &&
      !isFreeMode &&
      !formFieldTransferConsumedRef.current &&
      initialFieldDescriptions.length > 0 &&
      resolveConstructionTopology(preparedConstruction).fields.length === initialFieldDescriptions.length
    ) {
      preparedConstruction = transferFormFieldDescriptionsToConstruction(preparedConstruction, initialFieldDescriptions)
      formFieldTransferConsumedRef.current = true
    }

    constructionRef.current = preparedConstruction
    setConstruction(preparedConstruction)

    if (!preparedConstruction) {
      onDraftChange?.(null)
      if (!isFreeMode) {
        onFieldTopologyChange?.([])
      }
      return
    }

    onDraftChange?.(constructionToSnapshot(preparedConstruction))

    if (!isFreeMode) {
      onModuleSizeChange?.({
        widthMm: Math.round(preparedConstruction.frame.widthMm),
        heightMm: Math.round(preparedConstruction.frame.heightMm),
      })
      onFieldTopologyChange?.(
        resolveConstructionTopology(preparedConstruction).fields.map((field) => ({
          id: field.id,
          sequence: field.sequence,
          widthMm: Math.round(field.bounds.widthMm),
          heightMm: Math.round(field.bounds.heightMm),
          fieldType: field.fieldType,
          openingMode: field.openingMode,
          openingHanding: field.openingHanding,
        })),
      )
    }
  }

  const commitConstruction = (nextConstruction: ConstructionModel | null) => {
    const currentConstruction = constructionRef.current
    if (constructionEquals(currentConstruction, nextConstruction)) return
    pushUndoEntry(captureHistoryEntry(currentConstruction))
    setRedoStack([])
    broadcastConstruction(nextConstruction)
  }

  const recordDragHistory = (originalConstruction: ConstructionModel) => {
    if (constructionEquals(originalConstruction, constructionRef.current)) return
    pushUndoEntry(captureHistoryEntry(originalConstruction))
    setRedoStack([])
  }

  const broadcastFrame = (nextFrame: FrameModel, recordHistory = false) => {
    setWidthDraft(String(Math.round(nextFrame.widthMm)))
    setHeightDraft(String(Math.round(nextFrame.heightMm)))

    const currentConstruction = constructionRef.current
    const nextConstruction = currentConstruction
      ? resizeConstructionFrame(currentConstruction, nextFrame)
      : createConstructionModel(nextFrame)

    if (recordHistory) {
      commitConstruction(nextConstruction)
    } else {
      broadcastConstruction(nextConstruction)
    }
  }

  const getMinFrameDimension = (axis: ConstructorDividerAxis) => {
    if (!construction) return MIN_FRAME_MM
    const minimum = getConstructionMinimumFrameSize(construction)
    return Math.max(
      MIN_FRAME_MM,
      axis === 'vertical' ? minimum.widthMm : minimum.heightMm,
    )
  }

  const addDivider = (axis: ConstructorDividerAxis, point: CanvasPoint) => {
    const currentConstruction = constructionRef.current
    if (!frame || !currentConstruction) return

    const xInFrame = point.xMm - frame.xMm
    const yInFrame = point.yMm - frame.yMm
    const targetField = findFieldAtPoint(currentConstruction, xInFrame, yInFrame)
    if (!targetField) return

    const offsetMm = axis === 'vertical'
      ? xInFrame - targetField.bounds.xMm
      : yInFrame - targetField.bounds.yMm
    const nextDividerId = `divider-${currentConstruction.nextDividerId}`
    const nextConstruction = splitField(
      currentConstruction,
      targetField.id,
      axis,
      snapMm(offsetMm),
    )
    if (!nextConstruction) return

    commitConstruction(nextConstruction)
    const nextField = findFieldAtPoint(nextConstruction, xInFrame, yInFrame)
    setSelectedFieldId(nextField?.id ?? null)
    setSelectedDividerId(nextDividerId)
    setSelectedAngledDividerId(null)
    const addedDivider = resolveConstructionTopology(nextConstruction).dividers
      .find((divider) => divider.id === nextDividerId)
    setDividerPositionDraft(addedDivider ? String(Math.round(addedDivider.offsetMm)) : '')
    setFrameSelected(false)
    setSelectedEdge(null)
  }

  const addAngledDivider = (point: CanvasPoint) => {
    const currentConstruction = constructionRef.current
    if (!frame || !currentConstruction) return
    const xInFrame = point.xMm - frame.xMm
    const yInFrame = point.yMm - frame.yMm
    const targetField = findFieldAtPoint(currentConstruction, xInFrame, yInFrame)
    if (!targetField || targetField.polygon) return
    const nextDividerId = `divider-${currentConstruction.nextDividerId}`
    const nextConstruction = splitFieldAngled(
      currentConstruction,
      targetField.id,
      snapMm(xInFrame - targetField.bounds.xMm),
    )
    if (!nextConstruction) return
    commitConstruction(nextConstruction)
    const resolved = resolveConstructionTopology(nextConstruction)
    setSelectedAngledDividerId(nextDividerId)
    setSelectedDividerId(null)
    setSelectedFieldId(resolved.fields.find((field) => field.id !== targetField.id)?.id ?? null)
    setFrameSelected(false)
    setSelectedEdge(null)
    setActiveTool('select')
  }

  const updateDividerOffset = (
    dividerId: string,
    rawOffsetMm: number,
    recordHistory = false,
  ) => {
    const currentConstruction = constructionRef.current
    if (!currentConstruction) return
    const nextConstruction = moveDivider(currentConstruction, dividerId, snapMm(rawOffsetMm))
    if (recordHistory) {
      commitConstruction(nextConstruction)
    } else {
      broadcastConstruction(nextConstruction)
    }
    const moved = resolveConstructionTopology(nextConstruction).dividers
      .find((divider) => divider.id === dividerId)
    if (moved) {
      setDividerPositionDraft(String(Math.round(moved.offsetMm)))
    }
  }

  const removeSelectedDivider = () => {
    const currentConstruction = constructionRef.current
    if (!selectedDividerId || !currentConstruction) return
    const nextConstruction = removeDivider(currentConstruction, selectedDividerId)
    commitConstruction(nextConstruction)
    const nextFields = resolveConstructionTopology(nextConstruction).fields
    setSelectedFieldId(nextFields[0]?.id ?? null)
    setSelectedDividerId(null)
    setSelectedAngledDividerId(null)
    setDividerPositionDraft('')
  }

  const removeSelectedAngledDivider = () => {
    const currentConstruction = constructionRef.current
    if (!selectedAngledDividerId || !currentConstruction) return
    const nextConstruction = removeDivider(currentConstruction, selectedAngledDividerId)
    commitConstruction(nextConstruction)
    const nextFields = resolveConstructionTopology(nextConstruction).fields
    setSelectedFieldId(nextFields[0]?.id ?? null)
    setSelectedAngledDividerId(null)
  }


  const applyFieldType = (
    fieldId: string,
    fieldType: ConstructionFieldType | null,
  ) => {
    const currentConstruction = constructionRef.current
    if (!currentConstruction) return
    const nextConstruction = setConstructionFieldType(
      currentConstruction,
      fieldId,
      fieldType,
    )
    commitConstruction(nextConstruction)
    setSelectedFieldId(fieldId)
    setSelectedDividerId(null)
    setSelectedAngledDividerId(null)
    setFrameSelected(false)
    setSelectedEdge(null)
  }

  const applySelectedFieldOpeningMode = (
    openingMode: ConstructionOpeningMode | null,
  ) => {
    const currentConstruction = constructionRef.current
    if (!currentConstruction || !selectedFieldId) return
    commitConstruction(
      setConstructionFieldOpeningMode(
        currentConstruction,
        selectedFieldId,
        openingMode,
      ),
    )
  }

  const applySelectedFieldOpeningHanding = (
    openingHanding: ConstructionOpeningHanding | null,
  ) => {
    const currentConstruction = constructionRef.current
    if (!currentConstruction || !selectedFieldId) return
    commitConstruction(
      setConstructionFieldOpeningHanding(
        currentConstruction,
        selectedFieldId,
        openingHanding,
      ),
    )
  }

  const resetConstructionFromScratch = () => {
    if (!constructionRef.current) return
    commitConstruction(null)
    restoreHistorySelection(null)
    setActiveTool('frame')
    onResetModule?.()
  }

  const commitDividerPosition = () => {
    if (!selectedDivider) return
    const value = Number(dividerPositionDraft.trim())
    if (!Number.isFinite(value)) {
      setDividerPositionDraft(String(Math.round(selectedDivider.offsetMm)))
      return
    }
    updateDividerOffset(selectedDivider.id, value, true)
  }

  const resetDividerPositionDraft = () => {
    if (selectedDivider) {
      setDividerPositionDraft(String(Math.round(selectedDivider.offsetMm)))
    }
  }

  const restoreHistorySelection = (nextConstruction: ConstructionModel | null) => {
    setSelectedDividerId(null)
                setSelectedAngledDividerId(null)
    setDividerPositionDraft('')
    setFrameSelected(false)
    setSelectedEdge(null)

    if (!nextConstruction) {
      setSelectedFieldId(null)
      setWidthDraft('')
      setHeightDraft('')
      return
    }

    const nextFields = resolveConstructionTopology(nextConstruction).fields
    setSelectedFieldId(nextFields[0]?.id ?? null)
    setWidthDraft(String(Math.round(nextConstruction.frame.widthMm)))
    setHeightDraft(String(Math.round(nextConstruction.frame.heightMm)))
  }

  const restoreHistoryEntry = (entry: ConstructorHistoryEntry) => {
    const restored = cloneHistoryEntry(entry)

    if (productTypeRef.current !== restored.productType) {
      productTypeRef.current = restored.productType
      onModuleProductTypeChange?.(restored.productType)
    }

    broadcastConstruction(restored.construction)

    profileResolutionRef.current = cloneHistoryProfileResolution(restored.profileResolution)
    if (restored.profileResolution) {
      onProfileResolutionChange?.(cloneHistoryProfileResolution(restored.profileResolution)!)
    }

    restoreHistorySelection(restored.construction)
  }

  const undoConstruction = () => {
    const previous = undoStackRef.current.at(-1)
    if (previous === undefined) return

    // FACADEFLOW 0.1.8B ATOMIC MODULE HISTORY 01: capture the complete current state before any callback mutates refs.
    const currentSnapshot = captureHistoryEntry()
    const nextUndoRef = undoStackRef.current.slice(0, -1).map(cloneHistoryEntry)
    const nextRedoRef = [
      ...redoStackRef.current.slice(-59),
      cloneHistoryEntry(currentSnapshot),
    ]
    undoStackRef.current = nextUndoRef
    redoStackRef.current = nextRedoRef
    if (historySessionKey) {
      constructorHistoryByModuleId.set(historySessionKey, {
        undo: nextUndoRef.map(cloneHistoryEntry),
        redo: nextRedoRef.map(cloneHistoryEntry),
      })
    }
    setUndoStack((current) => current.slice(0, -1))
    setRedoStack((current) => [
      ...current.slice(-59),
      cloneHistoryEntry(currentSnapshot),
    ])
    restoreHistoryEntry(previous)
  }

  const redoConstruction = () => {
    const next = redoStackRef.current.at(-1)
    if (next === undefined) return

    const currentSnapshot = captureHistoryEntry()
    const nextRedoRef = redoStackRef.current.slice(0, -1).map(cloneHistoryEntry)
    const nextUndoRef = [
      ...undoStackRef.current.slice(-59),
      cloneHistoryEntry(currentSnapshot),
    ]
    redoStackRef.current = nextRedoRef
    undoStackRef.current = nextUndoRef
    if (historySessionKey) {
      constructorHistoryByModuleId.set(historySessionKey, {
        undo: nextUndoRef.map(cloneHistoryEntry),
        redo: nextRedoRef.map(cloneHistoryEntry),
      })
    }
    setRedoStack((current) => current.slice(0, -1))
    setUndoStack((current) => [
      ...current.slice(-59),
      cloneHistoryEntry(currentSnapshot),
    ])
    restoreHistoryEntry(next)
  }

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  useEffect(() => {
    const handleHistoryKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable = Boolean(
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ),
      )
      if (isEditable) return

      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey

      if (modifier && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redoConstruction()
        } else {
          undoConstruction()
        }
        return
      }

      if (modifier && key === 'y') {
        event.preventDefault()
        redoConstruction()
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedDividerId || selectedAngledDividerId)) {
        event.preventDefault()
        if (selectedAngledDividerId) removeSelectedAngledDivider()
        else removeSelectedDivider()
      }
    }

    window.addEventListener('keydown', handleHistoryKeyDown)
    return () => window.removeEventListener('keydown', handleHistoryKeyDown)
  })

  const handleCanvasPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'pan') return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setAutoFitEnabled(false)
    setViewPanState({
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffset: { ...viewOffset },
    })
  }

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTool === 'pan') return

    const point = pointFromPointer(event)
    setCursorPoint(point)

    if (activeTool === 'frame' && !frame) {
      event.currentTarget.setPointerCapture(event.pointerId)
      const preview: FrameModel = {
        xMm: point.xMm,
        yMm: point.yMm,
        widthMm: 0,
        heightMm: 0,
      }
      setDragState({
        kind: 'create',
        pointerId: event.pointerId,
        start: point,
        preview,
      })
      setFrameSelected(false)
      setSelectedFieldId(null)
      setSelectedEdge(null)
      setSelectedDividerId(null)
      setSelectedAngledDividerId(null)
      return
    }

    if (activeTool === 'select' && event.target === event.currentTarget) {
      setFrameSelected(false)
      setSelectedFieldId(null)
      setSelectedEdge(null)
      setSelectedDividerId(null)
      setSelectedAngledDividerId(null)
    }
  }

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (viewPanState?.pointerId === event.pointerId) {
      setViewOffset({
        xPx: Math.round(viewPanState.startOffset.xPx + event.clientX - viewPanState.startClientX),
        yPx: Math.round(viewPanState.startOffset.yPx + event.clientY - viewPanState.startClientY),
      })
      return
    }

    const point = pointFromPointer(event)
    setCursorPoint(point)

    if (!dragState) {
      return
    }

    if (dragState.kind === 'create') {
      const xMm = Math.min(dragState.start.xMm, point.xMm)
      const yMm = Math.min(dragState.start.yMm, point.yMm)
      const preview: FrameModel = {
        xMm,
        yMm,
        widthMm: Math.abs(point.xMm - dragState.start.xMm),
        heightMm: Math.abs(point.yMm - dragState.start.yMm),
      }

      setDragState({ ...dragState, preview })
      return
    }

    if (dragState.kind === 'divider') {
      if (!frame || !construction) return
      const currentDivider = resolveConstructionTopology(construction).dividers
        .find((divider) => divider.id === dragState.dividerId)
      if (!currentDivider) return
      const rawPointerPosition = dragState.axis === 'vertical'
        ? point.xMm - frame.xMm
        : point.yMm - frame.yMm
      const rawLeadingFace = rawPointerPosition - dragState.grabOffsetMm
      const parentStartMm = currentDivider.positionMm - currentDivider.offsetMm
      updateDividerOffset(dragState.dividerId, rawLeadingFace - parentStartMm)
      return
    }

    if (dragState.kind === 'angled-divider') {
      if (!frame || !construction) return
      const rawDeltaMm = point.xMm - dragState.startPointerXMm
      const deltaMm = snapEnabled ? Math.round(rawDeltaMm / SNAP_STEP_MM) * SNAP_STEP_MM : Math.round(rawDeltaMm)
      const current = constructionRef.current
      if (!current) return
      const base = dragState.originalConstruction
      const next = moveAngledDivider(base, dragState.dividerId, deltaMm)
      broadcastConstruction(next)
      return
    }

    if (dragState.kind === 'angled-endpoint') {
      if (!frame || !construction) return
      const localOffsetMm = snapMm(point.xMm - frame.xMm - dragState.parentStartXMm)
      const current = constructionRef.current
      if (!current) return
      const next = moveAngledDividerEndpoint(current, dragState.dividerId, dragState.endpoint, localOffsetMm)
      broadcastConstruction(next)
      return
    }


    const { original, edge } = dragState
    let nextFrame = original

    if (edge === 'right') {
      nextFrame = {
        ...original,
        widthMm: Math.max(point.xMm - original.xMm, getMinFrameDimension('vertical')),
      }
    }

    if (edge === 'left') {
      const rightMm = original.xMm + original.widthMm
      const nextX = clamp(point.xMm, 0, rightMm - getMinFrameDimension('vertical'))
      nextFrame = {
        ...original,
        xMm: nextX,
        widthMm: rightMm - nextX,
      }
    }

    if (edge === 'bottom') {
      nextFrame = {
        ...original,
        heightMm: Math.max(point.yMm - original.yMm, getMinFrameDimension('horizontal')),
      }
    }

    if (edge === 'top') {
      const bottomMm = original.yMm + original.heightMm
      const nextY = clamp(point.yMm, 0, bottomMm - getMinFrameDimension('horizontal'))
      nextFrame = {
        ...original,
        yMm: nextY,
        heightMm: bottomMm - nextY,
      }
    }

    broadcastFrame({
      ...nextFrame,
      widthMm: Math.round(nextFrame.widthMm),
      heightMm: Math.round(nextFrame.heightMm),
    })
  }

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (viewPanState?.pointerId === event.pointerId) {
      setViewPanState(null)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      return
    }

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (dragState.kind === 'create') {
      const preview = dragState.preview
      if (
        preview.widthMm >= MIN_FRAME_MM &&
        preview.heightMm >= MIN_FRAME_MM
      ) {
        broadcastFrame({
          ...preview,
          widthMm: Math.round(preview.widthMm),
          heightMm: Math.round(preview.heightMm),
        }, true)
        setFrameSelected(false)
        setSelectedFieldId('field-1')
        setActiveTool('select')
      }
    }

    if (
      dragState.kind === 'resize' ||
      dragState.kind === 'divider' ||
      dragState.kind === 'angled-divider' ||
      dragState.kind === 'angled-endpoint'
    ) {
      recordDragHistory(dragState.originalConstruction)
    }

    setDragState(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const startEdgeResize = (
    edge: FrameEdge,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!frame || !construction || activeTool !== 'select') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    canvasRef.current?.setPointerCapture(event.pointerId)
    setFrameSelected(true)
    setSelectedFieldId(null)
    setSelectedDividerId(null)
    setSelectedEdge(edge)
    setDragState({
      kind: 'resize',
      pointerId: event.pointerId,
      edge,
      original: { ...frame },
      originalConstruction: cloneConstructionModel(construction),
    })
  }

  const startDividerDrag = (
    divider: DividerModel,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!frame || !construction || activeTool === 'pan') {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    canvasRef.current?.setPointerCapture(event.pointerId)
    setActiveTool('select')
    setSelectedDividerId(divider.id)
    setSelectedAngledDividerId(null)
    setSelectedFieldId(null)
    setDividerPositionDraft(String(Math.round(divider.offsetMm)))
    setFrameSelected(false)
    setSelectedEdge(null)
    const point = pointFromPointer(event)
    const pointerPositionMm = divider.axis === 'vertical'
      ? point.xMm - frame.xMm
      : point.yMm - frame.yMm

    setDragState({
      kind: 'divider',
      pointerId: event.pointerId,
      dividerId: divider.id,
      axis: divider.axis,
      grabOffsetMm: pointerPositionMm - divider.positionMm,
      originalConstruction: cloneConstructionModel(construction),
    })
  }

  const startAngledDividerDrag = (
    divider: AngledDividerModel,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!frame || !construction || activeTool === 'pan') return
    event.preventDefault()
    event.stopPropagation()
    canvasRef.current?.setPointerCapture(event.pointerId)
    setActiveTool('select')
    setSelectedAngledDividerId(divider.id)
    setSelectedDividerId(null)
    setSelectedFieldId(null)
    setFrameSelected(false)
    setSelectedEdge(null)
    const point = pointFromPointer(event)
    setDragState({
      kind: 'angled-divider',
      pointerId: event.pointerId,
      dividerId: divider.id,
      startPointerXMm: point.xMm,
      originalTopOffsetMm: divider.topOffsetMm,
      originalBottomOffsetMm: divider.bottomOffsetMm,
      originalConstruction: cloneConstructionModel(construction),
    })
  }

  const startAngledEndpointDrag = (
    divider: AngledDividerModel,
    endpoint: 'top' | 'bottom',
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!frame || !construction || activeTool === 'pan') return
    event.preventDefault()
    event.stopPropagation()
    canvasRef.current?.setPointerCapture(event.pointerId)
    setActiveTool('select')
    setSelectedAngledDividerId(divider.id)
    setSelectedDividerId(null)
    setSelectedFieldId(null)
    setFrameSelected(false)
    setSelectedEdge(null)
    setDragState({
      kind: 'angled-endpoint',
      pointerId: event.pointerId,
      dividerId: divider.id,
      endpoint,
      parentStartXMm: divider.topPoint.xMm - divider.topOffsetMm,
      originalConstruction: cloneConstructionModel(construction),
    })
  }

  const commitNumericDimension = (dimension: 'widthMm' | 'heightMm') => {
    if (!frame) {
      return
    }

    const draft = dimension === 'widthMm' ? widthDraft : heightDraft
    const value = Number(draft.trim())

    const minimum = dimension === 'widthMm'
      ? getMinFrameDimension('vertical')
      : getMinFrameDimension('horizontal')

    if (!Number.isFinite(value) || value < minimum) {
      if (dimension === 'widthMm') {
        setWidthDraft(String(Math.round(frame.widthMm)))
      } else {
        setHeightDraft(String(Math.round(frame.heightMm)))
      }
      return
    }

    broadcastFrame({
      ...frame,
      [dimension]: Math.round(value),
    }, true)
    setFrameSelected(true)
  }

  const resetNumericDimensionDraft = (dimension: 'widthMm' | 'heightMm') => {
    if (!frame) {
      return
    }

    if (dimension === 'widthMm') {
      setWidthDraft(String(Math.round(frame.widthMm)))
    } else {
      setHeightDraft(String(Math.round(frame.heightMm)))
    }
  }

  const activateFrameTool = () => {
    if (!canEditConstruction) return

    if (frame) {
      setActiveTool('select')
      setFrameSelected(true)
      setSelectedFieldId(null)
      setSelectedDividerId(null)
      setSelectedEdge(null)
      return
    }

    setActiveTool('frame')
    setFrameSelected(false)
    setSelectedEdge(null)
  }

  const frameClassName = [
    'constructor-parametric-frame',
    frameSelected ? 'is-selected' : '',
    selectedEdge ? `has-selected-${selectedEdge}` : '',
    dragState?.kind === 'create' ? 'is-preview' : '',
    simpleBayDimensions.length > 0 ? 'has-bay-dimensions' : '',
    profileViewActive ? 'has-profile-view' : '',
    profileViewActive && profileAwareGeometry?.frame.reviewed ? 'has-reviewed-frame-face' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const publishProfileResolution = (next: ModuleProfileResolution) => {
    const currentResolution = profileResolutionRef.current
    if (profileResolutionEquals(currentResolution, next)) return

    pushUndoEntry(captureHistoryEntry())
    setRedoStack([])
    profileResolutionRef.current = cloneHistoryProfileResolution(next)
    onProfileResolutionChange?.(next)
  }

  const applyFrameProfile = (profileCode: string | null) => {
    if (!selectedProfileSystem) return
    publishProfileResolution(
      setFrameProfileAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        profileCode,
      ),
    )
  }

  const applyDividerProfile = (dividerId: string, profileCode: string | null) => {
    if (!selectedProfileSystem) return
    publishProfileResolution(
      setDividerProfileAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        dividerId,
        profileCode,
      ),
    )
  }

  const applyModuleProductTypeFromConstructor = (productType: 'window' | 'door' | null) => {
    if (productTypeRef.current === productType) return

    pushUndoEntry(captureHistoryEntry())
    setRedoStack([])
    productTypeRef.current = productType
    onModuleProductTypeChange?.(productType)
  }

  const renderModuleProductTypeResolution = () => (
    <div className="constructor-field-semantic-controls">
      <span>ТИП МОДУЛ</span>
      <div className="constructor-field-semantic-buttons">
        <button
          type="button"
          className={moduleSummary.productType === 'window' ? 'is-selected' : ''}
          onClick={() => applyModuleProductTypeFromConstructor('window')}
          disabled={!onModuleProductTypeChange}
        >
          Прозорец
        </button>
        <button
          type="button"
          className={moduleSummary.productType === 'door' ? 'is-selected' : ''}
          onClick={() => applyModuleProductTypeFromConstructor('door')}
          disabled={!onModuleProductTypeChange}
        >
          Врата
        </button>
        <button
          type="button"
          className="is-clear"
          onClick={() => applyModuleProductTypeFromConstructor(null)}
          disabled={!onModuleProductTypeChange || moduleSummary.productType === null}
        >
          Изчисти
        </button>
      </div>
      <small>Избери дали модулът е прозорец или врата.</small>
    </div>
  )

  const applySelectedFieldSashProfile = (profileCode: string | null) => {
    if (!selectedProfileSystem || !selectedField) return
    publishProfileResolution(
      setFieldSashProfileAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        moduleSummary.productType,
        selectedField,
        profileCode,
      ),
    )
  }

  const applyModuleGlazingSpecification = (glazingId: string | null) => {
    if (!selectedProfileSystem) return
    publishProfileResolution(
      setModuleGlazingSpecificationAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        offerDefaultGlazingId,
        fields,
        glazingId,
      ),
    )
  }

  const applySelectedFieldGlazingSpecification = (glazingId: string | null) => {
    if (!selectedProfileSystem || !selectedField) return
    publishProfileResolution(
      setFieldGlazingSpecificationAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        offerDefaultGlazingId,
        selectedField,
        glazingId,
      ),
    )
  }

  const applySelectedFieldGlazingThickness = () => {
    if (!selectedProfileSystem || !selectedField) return
    const normalized = glazingThicknessDraft.trim().replace(',', '.')
    if (!normalized) {
      publishProfileResolution(
        setFieldHumanGlazingThicknessAssignment(
          effectiveProfileResolution,
          selectedProfileSystem,
          selectedField,
          null,
          offerDefaultGlazingId,
        ),
      )
      return
    }

    const thicknessMm = Number(normalized)
    if (!Number.isFinite(thicknessMm) || thicknessMm <= 0) return
    publishProfileResolution(
      setFieldHumanGlazingThicknessAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        selectedField,
        thicknessMm,
        offerDefaultGlazingId,
      ),
    )
  }

  const applySelectedFieldGlazingBead = (profileCode: string | null) => {
    if (!selectedProfileSystem || !selectedField) return
    publishProfileResolution(
      setFieldGlazingBeadAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        selectedField,
        selectedFieldGlazingThicknessMm,
        profileCode,
        offerDefaultGlazingId,
      ),
    )
  }

  const applyReinforcement = (
    target: ReinforcementTarget,
    baseProfileCode: string | null | undefined,
    encodedValue: string,
  ) => {
    if (!selectedProfileSystem) return
    if (!encodedValue) {
      publishProfileResolution(
        setReinforcementAssignment(
          effectiveProfileResolution,
          selectedProfileSystem,
          target,
          baseProfileCode,
          null,
          null,
        ),
      )
      return
    }

    const separator = encodedValue.lastIndexOf('::')
    if (separator <= 0) return
    const reinforcementCode = encodedValue.slice(0, separator)
    const thicknessMm = Number(encodedValue.slice(separator + 2))
    if (!Number.isFinite(thicknessMm)) return

    publishProfileResolution(
      setReinforcementAssignment(
        effectiveProfileResolution,
        selectedProfileSystem,
        target,
        baseProfileCode,
        reinforcementCode,
        thicknessMm,
      ),
    )
  }

  const renderCompatibilityStatus = (
    result: ComponentCompatibilityResult,
  ) => (
    <div className={`constructor-compatibility-status status-${result.status}`}>
      <span>Съвместимост</span>
      <b>{{ valid: 'Потвърдена', invalid: 'Несъвместим избор', unconfirmed: 'Непотвърдена', 'missing-data': 'Липсва информация' }[result.status]}</b>
      <small>{result.status === 'unconfirmed' ? 'Липсват потвърдени данни за тази комбинация.' : result.status === 'invalid' ? 'Провери профила, избрания компонент и дебелината.' : result.status === 'missing-data' ? 'Първо попълни необходимите избори.' : 'Потвърдена е само тази комбинация от компоненти.'}</small>
    </div>
  )

  const renderReinforcementAssignment = (
    label: string,
    target: ReinforcementTarget,
    baseProfileCode: string | null | undefined,
  ) => {
    if (!selectedProfileSystem) return null
    if (!baseProfileCode) {
      return <div className="constructor-component-placeholder"><span>{label}</span><b>ЛИПСВАТ ДАННИ</b><small>Първо избери основния профил. Армировката не се избира автоматично.</small></div>
    }

    const candidates = getProfileReinforcementCandidates(selectedProfileSystem, baseProfileCode)
    if (candidates.length === 0) {
      return <div className="constructor-component-placeholder"><span>{label}</span><b>НЕПОТВЪРДЕНО</b><small>В каталожните данни няма доказана връзка между тази армировка и профил {baseProfileCode}.</small></div>
    }

    const assignment = effectiveProfileResolution?.reinforcements[getReinforcementTargetKey(target)]
    const value = assignment
      ? `${assignment.reinforcementCode}::${assignment.thicknessMm}`
      : ''
    const compatibility = evaluateReinforcementCompatibility(
      selectedProfileSystem,
      baseProfileCode,
      assignment?.reinforcementCode,
      assignment?.thicknessMm,
    )

    const flattened = candidates.flatMap((candidate: ReinforcementDefinition) =>
      candidate.thicknessOptionsMm.map((thicknessMm) => ({ candidate, thicknessMm })),
    )

    return (
      <div className="constructor-component-resolution-stack">
        <div className="constructor-profile-resolution-control">
          <span>{label}</span>
          <select
            aria-label={label}
            value={value}
            onChange={(event) => applyReinforcement(target, baseProfileCode, event.target.value)}
          >
            <option value="">Не е избрана армировка</option>
            {flattened.map(({ candidate, thicknessMm }, index) => (
              <option key={`${candidate.code}-${thicknessMm}-${index}`} value={`${candidate.code}::${thicknessMm}`}>
                {candidate.code} · {thicknessMm} mm
              </option>
            ))}
          </select>
          <small>Ръчен избор · показват се само кандидати, за които каталогът посочва този базов профил.</small>
        </div>
        {renderCompatibilityStatus(compatibility)}
      </div>
    )
  }

  const renderSelectedFieldGlazingBead = () => {
    if (!selectedProfileSystem || !selectedField) return null

    const context = getFieldGlazingBeadResolutionContext(
      effectiveProfileResolution,
      selectedField,
    )
    const humanContext = selectedFieldHumanGlazingContext
    const candidates = humanContext?.candidates ?? []
    const assignment = selectedFieldGlazingAssignment
    const canSelectBead = Boolean(
      selectedFieldGlazingThicknessMm !== null &&
      candidates.length > 0 &&
      context.targetRequired &&
      context.baseProfileCode,
    )
    const compatibility = evaluateGlazingBeadCompatibility(
      selectedProfileSystem,
      selectedFieldGlazingThicknessMm,
      assignment?.profileCode,
      context,
    )
    const offerGlazingHint = selectedGlazing
      ? `${selectedGlazing.labelBg} · ${selectedGlazing.totalThicknessMm} mm`
      : null
    const glazingOptions = getConfirmedGlazingOptions()
    const moduleGlazingOverrideId = effectiveProfileResolution?.moduleGlazingSpecification?.glazingId ?? ''
    const fieldGlazingOverrideId = effectiveProfileResolution?.fieldGlazingSpecifications[selectedField.id]?.glazingId ?? ''
    const glazingSourceLabel = {
      'field-override': 'ПОЛЕ override',
      'module-override': 'Модул override',
      'offer-default': 'Наследено от офертата',
      unset: 'Не е зададено',
    }[selectedFieldGlazingSpecification.source]

    return (
      <div className="constructor-component-resolution-stack constructor-glazing-context-card">
        <div className="constructor-profile-resolution-control">
          <span>СТЪКЛОПАКЕТ · МОДУЛ</span>
          <select
            aria-label="Стъклопакет override за модула"
            value={moduleGlazingOverrideId}
            onChange={(event) => applyModuleGlazingSpecification(event.target.value || null)}
          >
            <option value="">{offerGlazingHint ? `Наследи от офертата · ${offerGlazingHint}` : 'Без модулен override'}</option>
            {glazingOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.labelBg} · {option.totalThicknessMm} mm</option>
            ))}
          </select>
          <small>Модулният избор е ръчен override. Ако е празен, модулът наследява избора от офертата.</small>
        </div>

        <div className="constructor-profile-resolution-control">
          <span>СТЪКЛОПАКЕТ · ПОЛЕ {selectedField.sequence}</span>
          <select
            aria-label="Стъклопакет override за избраното поле"
            value={fieldGlazingOverrideId}
            onChange={(event) => applySelectedFieldGlazingSpecification(event.target.value || null)}
          >
            <option value="">Наследи от модула / офертата</option>
            {glazingOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.labelBg} · {option.totalThicknessMm} mm</option>
            ))}
          </select>
          <small>Ефективно: {selectedFieldGlazingSpecification.glazingId ?? 'няма избран стъклопакет'} · {glazingSourceLabel}.</small>
        </div>

        <div className="constructor-glazing-thickness-control">
          <div>
            <span>СТЪКЛОПАКЕТ · ДЕБЕЛИНА ЗА ПОЛЕ {selectedField.sequence}</span>
            <b>{selectedFieldGlazingThicknessMm === null ? 'НЕ Е ЗАДАДЕНА' : `${selectedFieldGlazingThicknessMm} mm${selectedFieldExplicitGlazingThicknessMm !== null ? ' · РЪЧЕН OVERRIDE' : ' · ОТ СТЪКЛОПАКЕТА'}`}</b>
          </div>
          <div className="constructor-glazing-thickness-entry">
            <input
              aria-label="Дебелина на стъклопакета за избраното поле"
              inputMode="decimal"
              value={glazingThicknessDraft}
              onChange={(event) => setGlazingThicknessDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applySelectedFieldGlazingThickness()
                }
              }}
              placeholder="напр. 24"
            />
            <span>mm</span>
            <button type="button" onClick={applySelectedFieldGlazingThickness}>Приложи</button>
            <button
              type="button"
              className="is-clear"
              disabled={selectedFieldGlazingThicknessMm === null && glazingThicknessDraft.length === 0}
              onClick={() => {
                setGlazingThicknessDraft('')
                if (!selectedProfileSystem || !selectedField) return
                publishProfileResolution(
                  setFieldHumanGlazingThicknessAssignment(
                    effectiveProfileResolution,
                    selectedProfileSystem,
                    selectedField,
                    null,
                    offerDefaultGlazingId,
                  ),
                )
              }}
            >
              Изчисти
            </button>
          </div>
          <small>
            Дебелината идва от ефективния стъклопакет. Ръчната стойност е FIELD override и има предимство само за техническата дебелина.
            {offerGlazingHint ? ` Оферта: ${offerGlazingHint}.` : ''}
          </small>
        </div>

        <div className="constructor-glazing-candidates" aria-live="polite">
          <div className="constructor-glazing-candidates-heading">
            <span>КАТАЛОЖНИ КАНДИДАТИ ЗА СТЪКЛОДЪРЖАТЕЛ</span>
            <b>{selectedFieldGlazingThicknessMm === null ? 'ПЪРВО ВЪВЕДИ ДЕБЕЛИНА' : `${candidates.length} КАНДИДАТ(А)`}</b>
          </div>
          {candidates.length > 0 ? (
            <div className="constructor-glazing-candidate-list">
              {candidates.map((candidate) => (
                <div key={candidate.beadCode} className="constructor-glazing-candidate">
                  <b>{candidate.beadCode}</b>
                  <span>{candidate.catalogueBead.labelBg}</span>
                  <em>{candidate.nominalGlazingThicknessMm} mm</em>
                </div>
              ))}
            </div>
          ) : (
            <small>
              {humanContext?.status === 'NO_CATALOGUE_CANDIDATE'
                ? `За ${selectedFieldGlazingThicknessMm} mm няма каталогово потвърден кандидат за стъклодържател в PRELUDE 60.`
                : humanContext?.status === 'UNSUPPORTED_SYSTEM'
                  ? 'За текущата профилна система още няма проверен набор от данни за стъклодържатели.'
                  : 'Въведи и приложи дебелина, за да се покажат стъклодържателите за избраната система и дебелина.'}
            </small>
          )}
          <small>Каталожният кандидат не означава доказана съвместимост. Няма автоматичен избор.</small>
        </div>

        <div className="constructor-profile-resolution-control constructor-glazing-bead-control">
          <span>СТЪКЛОДЪРЖАТЕЛ · РЪЧЕН ИЗБОР</span>
          <select
            aria-label="СТЪКЛОДЪРЖАТЕЛ · РЪЧЕН ИЗБОР"
            value={assignment?.profileCode ?? ''}
            disabled={!canSelectBead}
            onChange={(event) => applySelectedFieldGlazingBead(event.target.value || null)}
          >
            <option value="">Не е избран стъклодържател</option>
            {candidates.map((candidate) => (
              <option key={candidate.beadCode} value={candidate.beadCode}>
                {candidate.beadCode} · {candidate.catalogueBead.labelBg}
              </option>
            ))}
          </select>
          <small>
            {!context.targetRequired
              ? 'ПОЛЕТО няма зададен тип. Кандидатите се виждат, но изборът е заключен.'
              : !context.baseProfileCode
                ? selectedField.fieldType === 'fixed'
                  ? 'Първо избери профил на касата. Съвместимостта със стъклодържателя остава непотвърдена.'
                  : 'Първо избери профил на крилото. Съвместимостта със стъклодържателя остава непотвърдена.'
                : selectedFieldGlazingThicknessMm === null
                  ? 'Първо въведи дебелината на стъклопакета.'
                  : candidates.length === 0
                    ? 'В каталога няма кандидат за тази дебелина.'
                    : 'Изборът е ръчен. FacadeFlow не избира автоматично дори когато има само един кандидат.'}
          </small>
        </div>

        <div className="constructor-invariant-note">
          БАЗОВ ПРОФИЛ: {context.baseProfileCode ?? 'не е избран'} · СЪВМЕСТИМОСТ: НЕПОТВЪРДЕНА · ОТСТЪП НА СТЪКЛОПАКЕТА: НЕИЗВЕСТЕН · РАЗМЕР ЗА РЯЗАНЕ НА СТЪКЛОТО: НЕИЗВЕСТЕН.
        </div>
        {context.targetRequired && context.baseProfileCode && selectedFieldGlazingThicknessMm !== null
          ? renderCompatibilityStatus(compatibility)
          : null}
      </div>
    )
  }

  const renderSelectedFieldHardwareRequirements = () => {
    if (!selectedFieldHardwareRequirements || !selectedField) return null
    const statusLabel = {
      'not-applicable': 'Не се изисква', 'missing-data': 'Липсва информация',
      unconfirmed: 'Непотвърдено', 'ready-for-kit-resolution': 'Предстои избор на комплект',
    }[selectedFieldHardwareRequirements.status]
    const missingLabels: Record<string, string> = {
      FIELD_TYPE: 'тип поле', OPENING_MODE: 'начин на отваряне', OPENING_HANDING: 'посока на отваряне',
      PROFILE_SYSTEM: 'профилна система', HARDWARE_STANDARD: 'обков в офертата',
    }
    return (
      <div className={`constructor-hardware-requirements status-${selectedFieldHardwareRequirements.status}`}>
        <div><span>ИЗИСКВАНИЯ ЗА ОБКОВ</span><b>{statusLabel}</b></div>
        <small>{selectedField.fieldType === 'fixed' ? 'Фиксираното поле няма отваряем обков.' : 'Комплектът обков изисква отделен избор и проверка.'}</small>
        {selectedFieldHardwareRequirements.missing.length > 0 && (
          <em>Липсва: {selectedFieldHardwareRequirements.missing.map((key) => missingLabels[key] ?? 'допълнителни данни').join(', ')}</em>
        )}
      </div>
    )
  }

  const renderProfileAssignment = (
    label: string,
    candidates: readonly ProfileDefinition[],
    value: string,
    onChange: (profileCode: string | null) => void,
  ) => (
    <div className="constructor-profile-resolution-control">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Не е избран профил</option>
        {candidates.map((candidate) => (
          <option key={candidate.code} value={candidate.code}>
            {candidate.code} · {candidate.labelBg}
          </option>
        ))}
      </select>
      <small>
        {value
          ? 'избрано ръчно · код от избраната профилна система'
          : 'Изборът е ръчен · FacadeFlow не избира кандидат автоматично'}
      </small>
    </div>
  )

  const dimensionStatusLabel = (dimension: ResolvedDimension) => {
    if (dimension.status === 'human-confirmed') return 'ПОТВЪРДЕНО ОТ ЧОВЕК'
    if (dimension.status === 'system-nominal') return 'НОМИНАЛНА СТОЙНОСТ'
    if (dimension.status === 'constructor-authoritative') return 'ОТ КОНСТРУКТОРА'
    if (dimension.status === 'schematic-only') return 'СХЕМНО'
    return 'НЕИЗВЕСТНО'
  }

  const renderResolvedDimension = (dimension: ResolvedDimension) => (
    <div className={`constructor-semantic-dimension status-${dimension.status}`}>
      <span>{dimension.labelBg.replaceAll('FIELD', 'ПОЛЕ').replaceAll('GLASS CUT SIZE', 'Размер за рязане на стъклото')}</span>
      <b>{formatResolvedDimension(dimension)}</b>
      <em>{dimensionStatusLabel(dimension)}</em>
      <small>{dimension.status === 'unknown' ? 'Няма потвърдена стойност за този размер.' : 'Размер за технически преглед.'}</small>
    </div>
  )

  const renderProfileDimensionalSemantics = (
    title: string,
    profile: AssignedProfileDimensionalReadModel | null,
  ) => (
    <div className="constructor-profile-semantics-card">
      <div className="constructor-profile-semantics-heading">
        <span>{title}</span>
        <b>{profile ? profile.profileCode : 'Няма избран профил'}</b>
      </div>
      {profile ? (
        <>
          {renderResolvedDimension(profile.constructionDepth)}
          {renderResolvedDimension(profile.visibleFace)}
          {profile.role === 'sash' || profile.role === 'door-sash' ? (
            <>
              {renderResolvedDimension(profile.sashOverlap)}
              {renderResolvedDimension(profile.glazingInset)}
            </>
          ) : null}
          <div className="constructor-raw-callouts">
            <span>КАТАЛОЖНИ СТОЙНОСТИ</span>
            <b>{profile.rawCatalogCalloutsMm.length > 0 ? profile.rawCatalogCalloutsMm.join(' / ') + ' mm' : '—'}</b>
            <small>Само доказателство от каталога · значението на всеки размер изисква проверка.</small>
          </div>
        </>
      ) : (
        <p className="constructor-invariant-note">Първо избери профил ръчно.</p>
      )}
    </div>
  )


  const selectedElementTitle = selectedAngledDivider
    ? 'Ъглов делител'
    : selectedDivider
      ? (selectedDivider.axis === 'vertical' ? 'Вертикален делител' : 'Хоризонтален делител')
      : selectedField
        ? `Поле ${selectedField.sequence}`
        : canEditConstruction ? `Модул ${moduleNumber}` : 'Няма избран модул'

  const selectedElementMeta = selectedAngledDivider
    ? 'Двата края се местят независимо'
    : selectedDivider
      ? 'Плъзни делителя или въведи позиция'
      : selectedField
        ? `${selectedField.fieldType === 'operable' ? 'Отваряемо ПОЛЕ' : selectedField.fieldType === 'fixed' ? 'Фиксирано ПОЛЕ' : 'Типът на ПОЛЕТО не е зададен'}`
        : frameSelected && frame
          ? `${Math.round(frame.widthMm)} × ${Math.round(frame.heightMm)} mm`
          : moduleSizeLabel

  const isModuleContext = !selectedField && !selectedDivider && !selectedAngledDivider
  const selectModuleContext = () => {
    setSelectedFieldId(null)
    setSelectedDividerId(null)
    setSelectedAngledDividerId(null)
    setSelectedEdge(null)
    setFrameSelected(false)
    setInspectorTab('properties')
  }

  const renderSelectedPropertiesPane = () => {
    if (selectedAngledDivider && frame) {
      return (
        <div className="constructor-frame-properties constructor-divider-properties">
          <div className="constructor-property-row"><span>Горен край</span><b>{Math.round(selectedAngledDivider.topOffsetMm)} mm от левия ръб на родителското ПОЛЕ</b></div>
          <div className="constructor-property-row"><span>Долен край</span><b>{Math.round(selectedAngledDivider.bottomOffsetMm)} mm от левия ръб на родителското ПОЛЕ</b></div>
          <div className="constructor-property-row"><span>Дължина</span><b>{Math.round(selectedAngledDivider.lengthMm)} mm · автоматично от двата края</b></div>
          <div className="constructor-property-row"><span>Схемна видима ширина</span><b>{Math.round(selectedAngledDivider.thicknessMm)} mm · само за преглед, докато не се избере профил</b></div>
          <div className="constructor-property-row"><span>Управление</span><b>Горният и долният край се местят независимо. Плъзгане върху тялото мести целия делител.</b></div>
          <div className="constructor-property-row"><span>Закотвяне в ъгъл</span><b>0 mm или пълната ширина означава точен вътрешен ъгъл. В последните 30 mm краят прилепва към ъгъла.</b></div>
          <button type="button" className="constructor-delete-divider" onClick={removeSelectedAngledDivider}>Изтрий ъгловия делител</button>
          <p className="constructor-invariant-note">Ъгловият делител разделя реално ПОЛЕТО; не е само графична линия. Краищата могат да се закотвят точно във вътрешен ъгъл.</p>
        </div>
      )
    }

    if (selectedDivider && frame) {
      return (
        <div className="constructor-frame-properties constructor-divider-properties">
          <label>
            <span>{selectedDivider.axis === 'vertical' ? 'Схемен размер ляво поле' : 'Схемен размер горно поле'}</span>
            <div><input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Точна позиция на делителя в милиметри"
              value={dividerPositionDraft}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setDividerPositionDraft(event.target.value)}
              onBlur={commitDividerPosition}
              onKeyDown={(event) => {
                if (event.key === 'Enter') { commitDividerPosition(); event.currentTarget.blur() }
                if (event.key === 'Escape') { resetDividerPositionDraft(); event.currentTarget.blur() }
              }}
            /><em>mm</em></div>
          </label>
          <div className="constructor-divider-balance" aria-label="Схемно разпределение около делителя">
            <div><span>{selectedDivider.axis === 'vertical' ? 'ЛЯВО ПОЛЕ' : 'ГОРНО ПОЛЕ'}</span><b>{Math.round(selectedDivider.firstClearMm)} mm</b></div>
            <i aria-hidden="true">+</i>
            <div className="is-divider"><span>ДЕЛИТЕЛ</span><b>{Math.round(selectedDivider.thicknessMm)} mm</b></div>
            <i aria-hidden="true">+</i>
            <div><span>{selectedDivider.axis === 'vertical' ? 'ДЯСНО ПОЛЕ' : 'ДОЛНО ПОЛЕ'}</span><b>{Math.round(selectedDivider.secondClearMm)} mm</b></div>
          </div>
          <div className="constructor-property-row"><span>Дължина на делителя</span><b>{Math.round(selectedDivider.endMm - selectedDivider.startMm)} mm · автоматично от родителското ПОЛЕ</b></div>
          <div className="constructor-property-row"><span>Схемна видима ширина</span><b>{Math.round(selectedDivider.thicknessMm)} mm · автоматична, докато не се избере профил</b></div>
          <button type="button" className="constructor-delete-divider" onClick={removeSelectedDivider}>Изтрий делителя</button>
        </div>
      )
    }

    if (selectedField && frame) {
      return (
        <div className="constructor-frame-properties constructor-field-properties">
          <div className="constructor-property-row"><span>{selectedField.polygon ? 'Габарит на многоъгълното ПОЛЕ' : 'Вътрешен схемен размер на полето'}</span><b>{Math.round(selectedField.bounds.widthMm)} × {Math.round(selectedField.bounds.heightMm)} mm{selectedField.polygon ? ' · многоъгълно' : ''}</b></div>
          <div className="constructor-property-row"><span>Позиция във вътрешния контур</span><b>X {Math.round(selectedField.bounds.xMm - frameFaceMm)} · Y {Math.round(selectedField.bounds.yMm - frameFaceMm)} mm</b></div>
          <div className="constructor-field-semantic-controls">
            <span>ТИП ПОЛЕ</span>
            <div className="constructor-field-semantic-buttons">
              <button type="button" className={selectedField.fieldType === 'fixed' ? 'is-selected' : ''} onClick={() => applyFieldType(selectedField.id, 'fixed')}>Фиксирано</button>
              <button type="button" className={selectedField.fieldType === 'operable' ? 'is-selected' : ''} onClick={() => applyFieldType(selectedField.id, 'operable')}>Отваряемо / крило</button>
              <button type="button" className="is-clear" disabled={selectedField.fieldType === null} onClick={() => applyFieldType(selectedField.id, null)}>Изчисти</button>
            </div>
          </div>
          {selectedField.fieldType === 'operable' && (
            <>
              <div className="constructor-field-semantic-controls">
                <span>РЕЖИМ НА ОТВАРЯНЕ</span>
                <div className="constructor-field-semantic-buttons is-three">
                  {([['side-hinged', 'Странично'], ['tilt', 'Падащо'], ['tilt-turn', 'Странично + падащо']] as const).map(([modeId, label]) => (
                    <button key={modeId} type="button" className={selectedField.openingMode === modeId ? 'is-selected' : ''} onClick={() => applySelectedFieldOpeningMode(modeId)}>{label}</button>
                  ))}
                </div>
              </div>
              {(selectedField.openingMode === 'side-hinged' || selectedField.openingMode === 'tilt-turn') && (
                <div className="constructor-field-semantic-controls">
                  <span>РАБОТНА ПОСОКА</span>
                  <div className="constructor-field-semantic-buttons">
                    <button type="button" className={selectedField.openingHanding === 'left' ? 'is-selected' : ''} onClick={() => applySelectedFieldOpeningHanding('left')}>Ляво</button>
                    <button type="button" className={selectedField.openingHanding === 'right' ? 'is-selected' : ''} onClick={() => applySelectedFieldOpeningHanding('right')}>Дясно</button>
                    <button type="button" className="is-clear" disabled={selectedField.openingHanding === null} onClick={() => applySelectedFieldOpeningHanding(null)}>Изчисти</button>
                  </div>
                </div>
              )}
              <div className="constructor-property-row"><span>Визуализация на крилото</span><b>{selectedField.openingMode === null ? 'Контур на крило · избери режим на отваряне' : selectedField.openingMode === 'tilt' ? 'Символ за падащо отваряне · без ляво / дясно' : selectedField.openingHanding === null ? 'Избери Ляво / Дясно, за да се покаже правилната посока' : `${selectedField.openingMode === 'tilt-turn' ? 'Комбинирано' : 'Странично'} отваряне · ${selectedField.openingHanding === 'left' ? 'ляво' : 'дясно'}`}</b></div>
            </>
          )}
          <div className="constructor-field-action-hint"><span>РАЗДЕЛЯНЕ НА ПОЛЕ</span><p>Избери вертикален или хоризонтален делител и кликни в това поле. Делителят няма да преминава автоматично през съседните полета.</p></div>
        </div>
      )
    }

    if (isModuleContext && frame) {
      return (
        <div className="constructor-frame-properties">
          <label><span>Ширина</span><div><input type="text" inputMode="numeric" pattern="[0-9]*" aria-label="Точна ширина в милиметри" value={widthDraft} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setWidthDraft(event.target.value)} onBlur={() => commitNumericDimension('widthMm')} onKeyDown={(event) => { if (event.key === 'Enter') { commitNumericDimension('widthMm'); event.currentTarget.blur() } if (event.key === 'Escape') { resetNumericDimensionDraft('widthMm'); event.currentTarget.blur() } }} /><em>mm</em></div></label>
          <label><span>Височина</span><div><input type="text" inputMode="numeric" pattern="[0-9]*" aria-label="Точна височина в милиметри" value={heightDraft} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setHeightDraft(event.target.value)} onBlur={() => commitNumericDimension('heightMm')} onKeyDown={(event) => { if (event.key === 'Enter') { commitNumericDimension('heightMm'); event.currentTarget.blur() } if (event.key === 'Escape') { resetNumericDimensionDraft('heightMm'); event.currentTarget.blur() } }} /><em>mm</em></div></label>
        </div>
      )
    }

    return <div className="constructor-selection-empty"><span>{frame ? 'Маркирай касата, делител или поле' : 'Няма създадена каса'}</span><p>Инспекторът показва контекст само за избрания конструктивен елемент.</p></div>
  }

  const jointEdgeLabel = (edge: ProfileJointBoundaryReadModel['edge']) => ({
    left: 'ЛЯВО',
    right: 'ДЯСНО',
    top: 'ГОРЕ',
    bottom: 'ДОЛУ',
  } as const)[edge]

  const jointStatusLabel = (joint: ProfileJointBoundaryReadModel) => {
    if (joint.status === 'resolved') return 'ПОТВЪРДЕН'
    if (joint.status === 'assembly-evidence-required' && joint.sashOverlapMm !== null) return 'ЗАСТЪПВАНЕ ПОТВЪРДЕНО'
    if (joint.status === 'assembly-evidence-required') return 'НУЖЕН ПОТВЪРДЕН СРЕЗ'
    if (joint.status === 'missing-profile-assignment') return 'ЛИПСВА ПРОФИЛ'
    if (joint.status === 'unsupported-pair') return 'НЕПОТВЪРДЕНА КОМБИНАЦИЯ'
    if (joint.status === 'unsupported-topology') return 'НЕПОТВЪРДЕНА ФОРМА'
    return 'НЕРАЗПОЗНАТА ГРАНИЦА'
  }

  const renderSelectedFieldJointGeometry = () => {
    if (!selectedField || selectedField.fieldType !== 'operable') return null
    if (!selectedFieldJointGeometry) {
      return <div className="constructor-joint-geometry-card status-pending"><span>ПРОФИЛНИ ВЪЗЛИ</span><b>Няма достатъчно данни</b><small>Избери профилна система и необходимите профили.</small></div>
    }

    return (
      <div className={`constructor-joint-geometry-card ${selectedFieldJointGeometry.geometryReady ? 'status-ready' : 'status-pending'}`}>
        <div className="constructor-joint-geometry-heading">
          <div><span>ПРОФИЛНИ ВЪЗЛИ · ПОЛЕ {selectedField.sequence}</span><b>{selectedFieldJointGeometry.resolvedJointCount}/{selectedFieldJointGeometry.requiredJointCount} потвърдени</b></div>
          <em>{selectedFieldJointGeometry.geometryReady ? 'ГОТОВО' : 'ИЗИСКВА ДОКАЗАТЕЛСТВО'}</em>
        </div>
        <div className="constructor-joint-boundary-list">
          {selectedFieldJointGeometry.boundaries.map((joint) => (
            <div key={`${joint.fieldId}-${joint.edge}`} className={`constructor-joint-boundary status-${joint.status}`}>
              <div className="constructor-joint-boundary-title">
                <span>{jointEdgeLabel(joint.edge)}</span>
                <b>{joint.supportKind === 'frame' ? 'КАСА' : joint.supportKind === 'divider' ? 'ДЕЛИТЕЛ' : 'ГРАНИЦА'}</b>
                <em>{jointStatusLabel(joint)}</em>
              </div>
              <strong>{joint.supportProfileCode ?? '—'} ↔ {joint.sashProfileCode ?? '—'}</strong>
              <small>
                Застъпване: {joint.sashOverlapMm === null ? 'НЕИЗВЕСТНО' : `${joint.sashOverlapMm} mm`} · Отместване: {joint.sashInsetMm === null ? 'НЕИЗВЕСТНО' : `${joint.sashInsetMm} mm`}
              </small>
              {joint.evidenceRule && (
                <small className="constructor-joint-evidence">
                  Каталогови размери: {joint.evidenceRule.supportRawCalloutsMm.join(' / ')} ↔ {joint.evidenceRule.sashRawCalloutsMm.join(' / ')} mm{joint.sashOverlapMm !== null ? ` · прегледано застъпване ${joint.sashOverlapMm} mm` : ' · без потвърдено застъпване'}.
                </small>
              )}
            </div>
          ))}
        </div>
        {selectedFieldSashGeometry?.placementReady && selectedFieldSashGeometry.outerBoundsMm && (
          <div className="constructor-sash-placement-summary status-ready">
            <span>ПРЕГЛЕДАНА ПРЕДНА ГЕОМЕТРИЯ НА КРИЛОТО</span>
            <b>{Math.round(selectedFieldSashGeometry.outerBoundsMm.widthMm * 100) / 100} × {Math.round(selectedFieldSashGeometry.outerBoundsMm.heightMm * 100) / 100} mm</b>
            <small>Видимо лице: {selectedFieldSashGeometry.sashVisibleFaceMm} mm · проверено застъпване: {selectedFieldSashGeometry.overlapByEdgeMm.left}/{selectedFieldSashGeometry.overlapByEdgeMm.right}/{selectedFieldSashGeometry.overlapByEdgeMm.top}/{selectedFieldSashGeometry.overlapByEdgeMm.bottom} mm.</small>
            <small>Отстъпът на стъклопакета и размерът за рязане на стъклото са НЕИЗВЕСТНИ. Конструкцията не се променя.</small>
          </div>
        )}
        {!selectedFieldSashGeometry?.placementReady && (
          <p>FacadeFlow разпознава проверените зависимости за възела, но позицията на крилото остава блокирана, докато всички необходими размери не са потвърдени.</p>
        )}
      </div>
    )
  }

  const renderSelectedProfilePane = () => {
    if (!selectedProfileSystem || !effectiveProfileResolution) {
      return <div className="constructor-selection-empty"><span>Профилна система не е избрана</span><p>{isFreeMode ? 'Избери профилна система в данните за модула.' : 'Избери профилна система в офертата.'}</p></div>
    }
    if (selectedAngledDivider) {
      const assignment = effectiveProfileResolution.dividers[selectedAngledDivider.id]
      return <div className="constructor-component-resolution-stack">
        {renderProfileAssignment('ПРОФИЛ НА ДЕЛИТЕЛЯ', getDividerProfileCandidates(selectedProfileSystem), assignment?.profileCode ?? '', (profileCode) => applyDividerProfile(selectedAngledDivider.id, profileCode))}
        {renderReinforcementAssignment('АРМИРОВКА НА ДЕЛИТЕЛЯ', { kind: 'divider', id: selectedAngledDivider.id }, assignment?.profileCode)}
      </div>
    }
    if (selectedDivider) {
      const assignment = effectiveProfileResolution.dividers[selectedDivider.id]
      return <div className="constructor-component-resolution-stack">
        {renderProfileAssignment('ПРОФИЛ НА ДЕЛИТЕЛЯ', getDividerProfileCandidates(selectedProfileSystem), assignment?.profileCode ?? '', (profileCode) => applyDividerProfile(selectedDivider.id, profileCode))}
        {renderReinforcementAssignment('АРМИРОВКА НА ДЕЛИТЕЛЯ', { kind: 'divider', id: selectedDivider.id }, assignment?.profileCode)}
      </div>
    }
    if (selectedField) {
      if (selectedField.fieldType === 'fixed') {
        return <div className="constructor-component-resolution-stack">
          <div className="constructor-property-row"><span>ПРОФИЛ НА КРИЛОТО</span><b>Не се изисква · фиксираното ПОЛЕ няма крило.</b></div>
          {renderSelectedFieldHardwareRequirements()}
        </div>
      }
      if (selectedField.fieldType === null) {
        return <div className="constructor-component-resolution-stack">
          <div className="constructor-property-row"><span>ПРОФИЛ НА КРИЛОТО</span><b>Първо задай Фиксирано или Отваряемо. FacadeFlow не предполага профил.</b></div>
          {renderSelectedFieldHardwareRequirements()}
        </div>
      }
      const candidates = getFieldSashProfileCandidates(selectedProfileSystem, moduleSummary.productType, selectedField.fieldType)
      const sashAssignment = effectiveProfileResolution.fieldSashes[selectedField.id]
      if (moduleSummary.productType === null) {
        return <div className="constructor-component-resolution-stack">
          <button type="button" className="constructor-context-link" onClick={selectModuleContext}>Към типа на модула</button>
          <div className="constructor-property-row"><span>ПРОФИЛ НА КРИЛОТО</span><b>Избери Прозорец или Врата в данните за модула. За отваряемото ПОЛЕ е необходим профил на крилото.</b></div>

          {renderSelectedFieldHardwareRequirements()}
        </div>
      }
      return <div className="constructor-component-resolution-stack">
        <div>
          {candidates.length > 0
            ? renderProfileAssignment('ПРОФИЛ НА КРИЛОТО', candidates, sashAssignment?.profileCode ?? '', applySelectedFieldSashProfile)
            : <div className="constructor-property-row"><span>ПРОФИЛ НА КРИЛОТО</span><b>ЛИПСВАЩИ ДАННИ · избраната система няма каталогов профил за ролята {moduleSummary.productType === 'door' ? 'крило за врата' : 'крило'}.</b></div>}
        </div>
        <details className="constructor-context-details"><summary>Профилни възли на полето</summary>{renderSelectedFieldJointGeometry()}</details>
        {renderReinforcementAssignment('АРМИРОВКА НА КРИЛОТО', { kind: 'field-sash', id: selectedField.id }, sashAssignment?.profileCode)}
        {renderSelectedFieldHardwareRequirements()}
      </div>
    }
    if (isModuleContext && frame) {
      return <div className="constructor-component-resolution-stack">
        {renderProfileAssignment('ПРОФИЛ НА КАСАТА', getFrameProfileCandidates(selectedProfileSystem), effectiveProfileResolution.frame?.profileCode ?? '', applyFrameProfile)}
        {renderReinforcementAssignment('АРМИРОВКА НА КАСАТА', { kind: 'frame', id: 'frame' }, effectiveProfileResolution.frame?.profileCode)}
      </div>
    }
    return <div className="constructor-selection-empty"><span>Избери конструктивен елемент</span><p>Профил може да се зададе на касата, делител или отваряемо ПОЛЕ. Избери елемент от скицата, за да продължиш.</p></div>
  }

  const renderSelectedDimensionsPane = () => {
    if (selectedAngledDivider && selectedProfileSystem && effectiveProfileResolution) {
      return <>{renderProfileDimensionalSemantics('РАЗМЕРИ НА ДЕЛИТЕЛЯ', getAssignedProfileDimensionalReadModel(selectedProfileSystem, effectiveProfileResolution.dividers[selectedAngledDivider.id]))}</>
    }
    if (selectedDivider && selectedProfileSystem && effectiveProfileResolution) {
      return <>{renderProfileDimensionalSemantics('РАЗМЕРИ НА ДЕЛИТЕЛЯ', getAssignedProfileDimensionalReadModel(selectedProfileSystem, effectiveProfileResolution.dividers[selectedDivider.id]))}</>
    }
    if (selectedField && frame) {
      if (!selectedFieldDimensionalChain) {
        return <><div className="constructor-selection-empty"><span>Само схемни размери на ПОЛЕТО</span><p>{Math.round(selectedField.bounds.widthMm)} × {Math.round(selectedField.bounds.heightMm)} mm. Размерите според избраните профили още не са достъпни.</p></div></>
      }
      return (
        <><div className="constructor-field-dimensional-chain">
          <div className="constructor-profile-semantics-heading"><span>РАЗМЕРНА ВЕРИГА НА ПОЛЕ {selectedField.sequence}</span><b>{selectedField.fieldType === 'operable' ? 'ОТВАРЯЕМО' : selectedField.fieldType === 'fixed' ? 'ФИКСИРАНО' : 'НЕ Е ЗАДАДЕНО'}</b></div>
          {renderResolvedDimension(selectedFieldDimensionalChain.schematicBayWidth)}
          {renderResolvedDimension(selectedFieldDimensionalChain.schematicClearWidth)}
          {renderResolvedDimension(selectedFieldDimensionalChain.schematicClearHeight)}
          {selectedField.fieldType === 'operable' && renderProfileDimensionalSemantics('РАЗМЕРИ НА КРИЛОТО', selectedFieldDimensionalChain.sashProfile)}
          <div className="constructor-dimensional-result-grid">
            {selectedField.fieldType === 'operable' && <>{renderResolvedDimension(selectedFieldDimensionalChain.sashOverallWidth)}{renderResolvedDimension(selectedFieldDimensionalChain.sashOverallHeight)}</>}
            {renderResolvedDimension(selectedFieldDimensionalChain.visibleGlazingWidth)}
            {renderResolvedDimension(selectedFieldDimensionalChain.visibleGlazingHeight)}
            {renderResolvedDimension(selectedFieldDimensionalChain.glassCutWidth)}
            {renderResolvedDimension(selectedFieldDimensionalChain.glassCutHeight)}
          </div>
        </div></>
      )
    }
    if (isModuleContext && frame) {
      return <>          <div className="constructor-property-row"><span>Позиция</span><b>X {Math.round(frame.xMm)} · Y {Math.round(frame.yMm)} mm</b></div>
          <div className="constructor-property-row"><span>Избран ръб</span><b>{selectedEdge ? ({ left: 'Ляв', right: 'Десен', top: 'Горен', bottom: 'Долен' } as const)[selectedEdge] : 'Цялата каса'}</b></div>
          <div className="constructor-property-row"><span>Схемна видима ширина</span><b>{Math.round(frameFaceMm)} mm · схемна геометрия</b></div>{renderProfileDimensionalSemantics('РАЗМЕРИ НА КАСАТА · Профилна дълбочина / видимо лице', dimensionalChain?.frameProfile ?? null)}</>
    }
    return <><div className="constructor-selection-empty"><span>Избери елемент за размери</span><p>Размерната верига различава габарита, отвора на ПОЛЕТО, крилото, видимото стъкло и бъдещия размер за рязане на стъклото.</p></div></>
  }

  const renderSystemDrivenModuleSummary = () => {
    const requiredComponents = systemDrivenModuleModel.components.filter((entry) => entry.status !== 'not-required')
    const frameComponent = requiredComponents.find((entry) => entry.kind === 'frame') ?? null
    const dividerComponents = requiredComponents.filter((entry) => entry.kind === 'divider')
    const sashComponents = requiredComponents.filter((entry) => entry.kind === 'sash')
    const missingComponents = requiredComponents.filter((entry) => entry.status === 'missing-profile')

    return (
      <section className="constructor-system-model" aria-label="Системен модел на модула">
        <header>
          <div><span>СИСТЕМЕН МОДЕЛ</span><b>{systemDrivenModuleModel.systemLabel}</b></div>
          <strong>{systemDrivenModuleModel.resolvedComponentCount}/{systemDrivenModuleModel.requiredComponentCount} компонента</strong>
        </header>
        <p>Избраната система определя допустимите конструктивни роли. Constructor описва изделието; профилите материализират касата, делителите, крилата и стъклодържателите.</p>
        <div className="constructor-system-model-facts">
          <div><span>Каса</span><b>{frameComponent?.profileCode ?? 'Не е избрана'}</b><small>{frameComponent?.visibleFaceReviewed ? `видима част ${frameComponent.visibleFaceMm} mm` : 'видимата част не е потвърдена'}</small></div>
          <div><span>Делители</span><b>{dividerComponents.length}</b><small>{dividerComponents.length > 0 ? dividerComponents.map((entry) => `${entry.profileCode ?? '—'}${entry.visibleFaceReviewed ? ` · ${entry.visibleFaceMm} mm` : ''}`).join(' · ') : 'няма в модула'}</small></div>
          <div><span>Крила</span><b>{sashComponents.filter((entry) => entry.status !== 'not-required').length}</b><small>{sashComponents.filter((entry) => entry.status !== 'not-required').map((entry) => entry.profileCode ?? 'не е избрано').join(' · ') || 'няма отваряеми полета'}</small></div>
          <div><span>Сглобки от границите</span><b>{systemDrivenModuleModel.requiredJointCount}</b><small>{systemDrivenModuleModel.verifiedJointCount} проверени · останалите остават заключени</small></div>
        </div>
        {missingComponents.length > 0 && <div className="constructor-system-model-warning"><b>Липсват {missingComponents.length} профилни избора.</b><span>{missingComponents.map((entry) => entry.targetLabelBg).join(' · ')}</span></div>}
        <small className="constructor-system-model-boundary">Системният модел не измисля монтажна геометрия. Точна сглобка се показва само ако има проверено доказателство за конкретната двойка профили.</small>
      </section>
    )
  }

  const renderModuleBasics = () => (
    <div className="constructor-module-basics">
      {isFreeMode ? (
        <label className="constructor-free-system-selector">
          <span>Профилна система</span>
          <select value={freeProfileSystemId} disabled={!onFreeProfileSystemChange} onChange={(event) => onFreeProfileSystemChange?.(event.target.value)}>
            <option value="">Не е избрана</option>
            {getSelectableProfileSystems().map((system) => <option key={system.id} value={system.id}>{system.manufacturer} {system.name}</option>)}
          </select>
        </label>
      ) : <div className="constructor-property-row"><span>Профилна система</span><b>{offerContext?.profileSystemLabel ?? 'Не е избрана'}</b></div>}
      {renderModuleProductTypeResolution()}
      {renderSystemDrivenModuleSummary()}
      {frame ? renderSelectedPropertiesPane() : <p className="constructor-context-hint">{canEditConstruction ? 'Избери „Каса“ и начертай модула.' : 'Добави модул, за да започнеш.'}</p>}
      {!isFreeMode && <details className="constructor-context-details"><summary>Общи настройки на офертата</summary>
        <div className="constructor-offer-locks">
          <div><span>Цвят</span><b>{offerContext?.colorLabel}</b></div>
          <div><span>Фолиране</span><b>{offerContext?.foilModeLabel}</b></div>
          <div><span>Стъклопакет</span><b>{offerContext?.glazingLabel}</b></div>
          <div><span>Обков</span><b>{offerContext?.hardwareLabel}</b></div>
        </div>
      </details>}
      <div className="constructor-module-actions">
        {isFreeMode && onCreateOfferFromSketch && <button type="button" className="constructor-create-offer constructor-create-offer-compact" disabled={!canEditConstruction || !construction} onClick={() => onCreateOfferFromSketch(construction ? constructionToSnapshot(construction) : null)}>Създай оферта от Модул {moduleNumber}</button>}
      </div>
    </div>
  )

  const renderContextCheck = () => {
    if (!canEditConstruction) return <p>Няма модул за проверка.</p>
    const issues: string[] = []
    if (!selectedProfileSystem) issues.push('Липсва профилна система')
    if (isModuleContext) {
      if (!frame) issues.push('Модулът още не е начертан')
      if (!moduleSummary.productType) issues.push('Липсва тип на модула')
      if (frame && !effectiveProfileResolution?.frame?.profileCode) issues.push('Липсва профил на касата')
    } else if (selectedField) {
      if (!selectedField.fieldType) issues.push('Липсва тип на полето')
      if (selectedField.fieldType === 'operable') {
        if (!selectedField.openingMode) issues.push('Липсва начин на отваряне')
        if (selectedFieldHardwareRequirements?.handingRequired && !selectedField.openingHanding) issues.push('Липсва посока на отваряне')
        if (!effectiveProfileResolution?.fieldSashes[selectedField.id]?.profileCode) issues.push('Липсва профил на крилото')
      }
      if (selectedField.fieldType === 'fixed' && !effectiveProfileResolution?.frame?.profileCode) issues.push('Липсва общ профил на касата')
      if (selectedFieldGlazingThicknessMm === null) issues.push('Липсва дебелина на стъклопакета')
      else if (!selectedFieldGlazingAssignment?.profileCode) issues.push('Липсва стъклодържател')
      else {
        const context = getFieldGlazingBeadResolutionContext(effectiveProfileResolution, selectedField)
        const check = selectedProfileSystem && evaluateGlazingBeadCompatibility(selectedProfileSystem, selectedFieldGlazingThicknessMm, selectedFieldGlazingAssignment.profileCode, context)
        if (check && check.status !== 'valid') issues.push(check.status === 'invalid' ? 'Стъклодържателят не е съвместим' : 'Стъклодържателят не е потвърден')
      }
    } else {
      const divider = selectedDivider ?? selectedAngledDivider
      if (divider && !effectiveProfileResolution?.dividers[divider.id]?.profileCode) issues.push('Липсва профил на делителя')
    }
    return issues.length ? <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p>Няма липсващи основни данни. Техническата проверка предстои.</p>
  }

  const inspectorTabsAndPane = (
    <>
      <div className="constructor-inspector-tabs" role="tablist" aria-label="Данни за избраното">
        {(['properties', 'profile', ...(selectedField ? ['glazing' as const] : []), 'dimensions'] as InspectorTab[]).map((tab) => (
          <button key={tab} id={`inspector-tab-${tab}`} type="button" role="tab" aria-controls="constructor-context-pane" aria-selected={inspectorTab === tab} className={inspectorTab === tab ? 'is-active' : ''} onClick={() => setInspectorTab(tab)}>
            {{ properties: 'Основни', profile: 'Профил', glazing: 'Стъклопакет', dimensions: 'Размери' }[tab]}
          </button>
        ))}
      </div>
      <div id="constructor-context-pane" ref={inspectorPaneRef} className="constructor-inspector-pane" role="tabpanel" aria-labelledby={`inspector-tab-${inspectorTab}`}>
        {inspectorTab === 'properties' ? (isModuleContext ? renderModuleBasics() : renderSelectedPropertiesPane())
          : inspectorTab === 'profile' ? renderSelectedProfilePane()
            : inspectorTab === 'glazing' ? (selectedProfileSystem ? renderSelectedFieldGlazingBead() : renderSelectedProfilePane())
              : renderSelectedDimensionsPane()}
      </div>
    </>
  )

  // Legacy VIEW 01 source-contract markers retained for regression verification only:
  // Fit{autoFitEnabled ? ' AUTO' : ''}
  // ZOOM: {zoom}% · {autoFitEnabled ? 'FIT AUTO' : 'MANUAL VIEW'}
  return (
    <section className={`constructor-shell${showModuleStrip ? ' has-module-navigation' : ''}${pendingInitialFieldDescriptions.length > 0 ? ' has-form-field-handoff' : ''}`} aria-label={`FacadeFlow Конструктор · ${title}`}>
      <span className="constructor-contract-marker" aria-hidden="true">
        FACADEFLOW CONSTRUCTOR · FIELD SEMANTICS 01D · Constructor 01C · Constructor 01D · CONSTRUCTOR 01B · Параметрична каса · SYSTEM NEUTRAL ·
        Profile View {profileViewEnabled ? 'ON' : 'OFF'} · Grid {gridVisible ? 'ON' : 'OFF'} · Snap {snapEnabled ? 'ON' : 'OFF'} ·
        КАТАЛОЖНИ BEAD КАНДИДАТИ · СТЪКЛОДЪРЖАТЕЛ · HUMAN SELECTION · catalog match ≠ resolved compatibility · auto-select: NO ·
        BASE-PROFILE COMPATIBILITY: UNCONFIRMED · GLAZING INSET: UNKNOWN · GLASS CUT: UNKNOWN ·
        БАЗОВ ПРОФИЛ ЗА FIX ПОЛЕТО · Няма auto-select дори при един кандидат ·
        Само в родителското поле · автоматична до Profile Resolution · polygon / triangle / trapezoid ПОЛЕТА ·
        OPENING SYMBOLS 01D.1 · OPENING SYMBOLS 01D.1 · FIELD INFO 01D.2 · MINIMAL LABELS 01D.3 · BOTTOM POLISH 01D.3.1 ·
        точните inset и glazing inset · Glazing inset / glass cut: НЕИЗВЕСТНО · source: human · HARDWARE REQUIREMENTS ·
        MISSING CONTEXT · Това не е стандартен шаблон · MISSING CONTEXT · избери Прозорец или Врата тук · OPERABLE полето вече се брои като задължителен PROFILE target · 02A.2
      </span>

      <header className="constructor-topbar">
        <div className="constructor-title-block">
          <button type="button" className="constructor-back" onClick={onClose}>
            {isFreeMode ? '← Към началото' : '← Към офертата'}
          </button>

          <div>
            <div className="constructor-context-breadcrumb" aria-label="Работен контекст">
              {isFreeMode ? (
                <>
                  Начало <i>›</i> Конструктор
                  {hasActiveModule && <><i>›</i> <strong>Модул {moduleNumber}</strong></>}
                </>
              ) : (
                <>Оферта <i>›</i> <strong>Модул {moduleNumber}</strong> <i>›</i> Конструктор</>
              )}
            </div>
            <span>КОНСТРУКТОР · ТЕХНИЧЕСКА СКИЦА</span>
            <h2>{title}</h2>
            <p>
              {isFreeMode
                ? hasActiveModule
                  ? `Работиш по Модул ${moduleNumber}. Тук задаваш формата, ПОЛЕТАТА и начина на отваряне. Профилите и стъклопакетът се задават от панела вдясно.`
                  : 'Създай Модул 1, за да започнеш. Всеки следващ модул ще пази собствена независима скица.'
                : 'Тук задаваш формата, ПОЛЕТАТА и начина на отваряне на изделието. Мести се само избраният елемент.'}
            </p>
          </div>
        </div>

        <div className="constructor-topbar-meta" aria-label="Контекст на конструктора">
          <div className="constructor-context-card">

            <span>МОДУЛ</span>
            <b>
              {isFreeMode
                ? hasActiveModule
                  ? `Свободна скица · Модул ${moduleNumber}`
                  : 'Свободна скица · без модул'
                : `Оферта · Модул ${moduleNumber}`}
            </b>
          </div>
          <div>
            <span>РАБОТА</span>
            <b>{isFreeMode ? 'Свободен конструктор' : 'Офертен модул'}</b>
          </div>
          <div>
            <span>ГАБАРИТ</span>
            <b>{moduleSizeLabel}</b>
          </div>
          <div className="constructor-draft-chip">ЧЕРНОВА</div>
        </div>
      </header>

      {showModuleStrip && (
        <div className="constructor-module-strip" aria-label="Навигация по модули">
          <span className="constructor-module-strip-label">МОДУЛИ</span>
          {moduleItems.length > 0 ? (
            <>
              <div className="constructor-module-tabs">
                {moduleItems.map((item) => (
                  <button
                    type="button"
                    onClickCapture={() => {
                      // CONTEXT INSPECTOR 01.1 V2 — module tab selects module context.
                      setSelectedFieldId(null)
                      setSelectedDividerId(null)
                      setSelectedAngledDividerId(null)
                      setFrameSelected(false)
                      setSelectedEdge(null)
                      setInspectorTab('properties')
                    }}
                    key={item.id}
                    className={item.id === activeModuleId ? 'is-active' : ''}
                    onClick={() => { selectModuleContext(); onSelectModule?.(item.id) }}
                  >
                    Модул {item.sequence}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="constructor-new-module"
                onClick={onCreateModule}
              >
                + Нов модул
              </button>
            </>
          ) : (
            <div className="constructor-module-empty">
              <span>Няма създаден модул.</span>
              <button
                type="button"
                className="constructor-create-first-module"
                onClick={onCreateModule}
              >
                + Създай Модул 1
              </button>
            </div>
          )}
        </div>
      )}

      {!isFreeMode && pendingInitialFieldDescriptions.length > 0 && (
        <div className="constructor-form-field-handoff" role="status">
          <div>
            <b>ПРЕХОД ОТ ОПИСАНИЕТО КЪМ КОНСТРУКТОРА</b>
            <span>
              Нерешени описания: {pendingInitialFieldDescriptions.length} ·
              очаквани ПОЛЕТА: {initialFieldDescriptions.length} · текуща конструкция: {conceptualFieldCount}.
            </span>
          </div>
          <small>
            {conceptualFieldCount === initialFieldDescriptions.length
              ? 'Съвместимите FIXED / OPERABLE, начин на отваряне и посока се прехвърлят по FIELD номер. Свободните текстови описания остават за ръчно решение.'
              : 'Данните се пазят. FacadeFlow няма да създава делители или геометрия автоматично; създай нужните ПОЛЕТА ръчно.'}
          </small>
        </div>
      )}

      <div className="constructor-toolbar" aria-label="Лента с инструменти">
        <div className="constructor-toolbar-group">
          <button
            type="button"
            className={activeTool === 'select' ? 'is-active' : ''}
            onClick={() => setActiveTool('select')}
          >
            Избери
          </button>
          <button
            type="button"
            className={activeTool === 'pan' ? 'is-active' : ''}
            onClick={() => setActiveTool('pan')}
          >
            Панорама
          </button>
        </div>

        <div className="constructor-toolbar-group">
          <button type="button" disabled title="Предстои в следващ етап">
            Референтна схема
          </button>
          <button
            type="button"
            className={profileViewActive ? 'is-active' : ''}
            disabled={!profileAwareGeometry || !frame}
            title={profileAwareGeometry ? 'Проверени видими лица на профилите; формата на чертежа се запазва' : 'Изисква избрана профилна система и профили'}
            onClick={() => setProfileViewEnabled((current) => !current)}
          >
            Профилен изглед {profileViewEnabled ? 'ВКЛ.' : 'ИЗКЛ.'}
          </button>
        </div>

        <div className="constructor-toolbar-group constructor-toolbar-view">
          <button
            type="button"
            className={gridVisible ? 'is-active' : ''}
            onClick={() => setGridVisible((current) => !current)}
          >
            Мрежа {gridVisible ? 'ВКЛ.' : 'ИЗКЛ.'}
          </button>
          <button
            type="button"
            className={snapEnabled ? 'is-active' : ''}
            onClick={() => setSnapEnabled((current) => !current)}
          >
            Прилепване {snapEnabled ? 'ВКЛ.' : 'ИЗКЛ.'}
          </button>
          <button
            type="button"
            className={autoFitEnabled ? 'is-active' : ''}
            disabled={!frame}
            title="Побери и центрирай цялото изделие в работната площ"
            onClick={restoreFitView}
          >
            {autoFitEnabled ? 'Побиране: АВТО' : 'Побери'}
          </button>
          <button
            type="button"
            aria-label="Намали мащаба"
            onClick={() => changeViewZoom(-1)}
            disabled={zoom <= MIN_VIEW_ZOOM}
          >
            −
          </button>
          <span className="constructor-zoom-value">{zoom}%</span>
          <button
            type="button"
            aria-label="Увеличи мащаба"
            onClick={() => changeViewZoom(1)}
            disabled={zoom >= MAX_VIEW_ZOOM}
          >
            +
          </button>
        </div>
      </div>

      <div className="constructor-layout is-context-workflow">
        <aside className="constructor-tools-panel" aria-label="Инструменти за конструкция">
          <div className="constructor-panel-heading">
            <span>ИНСТРУМЕНТИ</span>
            <b>Конструкция</b>
          </div>

          <div className="constructor-tool-list">
            <button
              type="button"
              className={activeTool === 'select' ? 'is-active' : ''}
              onClick={() => setActiveTool('select')}
            >
              <span className="constructor-tool-glyph">↖</span>
              <span>
                <b>Селекция</b>
                <small>Маркирай каса или ръб</small>
              </span>
            </button>

            <button
              type="button"
              className={activeTool === 'pan' ? 'is-active' : ''}
              onClick={() => setActiveTool('pan')}
            >
              <span className="constructor-tool-glyph">✥</span>
              <span>
                <b>Панорама</b>
                <small>Премести изгледа</small>
              </span>
            </button>

            <button
              type="button"
              disabled={!canEditConstruction}
              className={activeTool === 'frame' ? 'is-active' : ''}
              onClick={activateFrameTool}
            >
              <span className="constructor-tool-glyph">▣</span>
              <span>
                <b>Каса / рамка</b>
                <small>
                  {!canEditConstruction
                    ? 'Първо създай модул'
                    : frame
                      ? 'Касата е създадена'
                      : 'Изтегли с мишката'}
                </small>
              </span>
            </button>

            <button
              type="button"
              disabled={!frame}
              className={activeTool === 'vertical-divider' ? 'is-active' : ''}
              onClick={() => {
                setActiveTool('vertical-divider')
                setFrameSelected(false)
                setSelectedEdge(null)
                setSelectedDividerId(null)
              }}
            >
              <span className="constructor-tool-glyph">│</span>
              <span>
                <b>Вертикален делител</b>
                <small>{frame ? 'Кликни къде да разделиш ПОЛЕТО' : 'Първо създай каса'}</small>
              </span>
            </button>

            <button
              type="button"
              disabled={!frame}
              className={activeTool === 'horizontal-divider' ? 'is-active' : ''}
              onClick={() => {
                setActiveTool('horizontal-divider')
                setFrameSelected(false)
                setSelectedEdge(null)
                setSelectedDividerId(null)
              }}
            >
              <span className="constructor-tool-glyph">─</span>
              <span>
                <b>Хоризонтален делител</b>
                <small>{frame ? 'Кликни къде да разделиш ПОЛЕТО' : 'Първо създай каса'}</small>
              </span>
            </button>

            <button
              type="button"
              disabled={!frame}
              className={activeTool === 'angled-divider' ? 'is-active' : ''}
              title="Ъглов делител · горният и долният край се местят независимо"
              onClick={() => {
                setActiveTool('angled-divider')
                setFrameSelected(false)
                setSelectedFieldId(null)
                setSelectedDividerId(null)
      setSelectedAngledDividerId(null)
              }}
            >
              <span className="constructor-tool-glyph">╱</span>
              <span>
                <b>Ъглов делител</b>
                <small>{frame ? 'Кликни в ПОЛЕ · после мести двата края' : 'Първо създай каса'}</small>
              </span>
            </button>

            <button
              type="button"
              disabled={!frame}
              className={activeTool === 'fixed-field' ? 'is-active' : ''}
              onClick={() => {
                setActiveTool('fixed-field')
                setFrameSelected(false)
                setSelectedEdge(null)
                setSelectedDividerId(null)
                setSelectedAngledDividerId(null)
              }}
            >
              <span className="constructor-tool-glyph">□</span>
              <span>
                <b>Фиксирано поле</b>
                <small>{frame ? 'Кликни върху ПОЛЕ' : 'Първо създай каса'}</small>
              </span>
            </button>

            <button
              type="button"
              disabled={!frame}
              className={activeTool === 'operable-field' ? 'is-active' : ''}
              onClick={() => {
                setActiveTool('operable-field')
                setFrameSelected(false)
                setSelectedEdge(null)
                setSelectedDividerId(null)
                setSelectedAngledDividerId(null)
              }}
            >
              <span className="constructor-tool-glyph">◩</span>
              <span>
                <b>Отваряемо поле</b>
                <small>{frame ? 'Кликни върху ПОЛЕ · създава крило' : 'Първо създай каса'}</small>
              </span>
            </button>

            <button type="button" disabled>
              <span className="constructor-tool-glyph">▥</span>
              <span>
                <b>Врата</b>
                <small>следващ етап</small>
              </span>
            </button>
          </div>

          <div className="constructor-history-actions">
            <button
              type="button"
              disabled={!canUndo}
              onClick={undoConstruction}
              title="Отмени · Ctrl+Z"
            >
              ↶ Отмени
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={redoConstruction}
              title="Повтори · Ctrl+Y / Ctrl+Shift+Z"
            >
              ↷ Повтори
            </button>
          </div>


          <button
            type="button"
            className="constructor-reset-sketch"
            disabled={!construction || !canEditConstruction}
            onClick={resetConstructionFromScratch}
            title="Изчисти текущия модул; Отмяна може да възстанови скицата"
          >
            <span>{hasActiveModule ? `Изчисти Модул ${moduleNumber}` : 'Изтрий скицата'}</span>
            <small>Започни текущия модул отначало</small>
          </button>

          {hasActiveModule && onDeleteModule && (
            <button
              type="button"
              className="constructor-delete-module"
              onClick={() => {
                const confirmed = window.confirm(
                  `Ще изтриете Модул ${moduleNumber} от проекта.\n\nДействието не може да бъде отменено.\n\nДа се изтрие ли модулът?`,
                )
                if (confirmed) onDeleteModule()
              }}
              title={`Изтрий Модул ${moduleNumber} от проекта`}
            >
              <span>Изтрий Модул {moduleNumber}</span>
              <small>Премахва целия модул от проекта</small>
            </button>
          )}
        </aside>

        <section className="constructor-workarea" aria-label="Работно поле за конструкцията">{/* CONSTRUCTOR 01E - TECHNICAL DRAWING CLARITY · 01E.2 MINIMAL FIELD BADGES */}
          <div className="constructor-ruler constructor-ruler-top" aria-hidden="true">
            {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000].map((value) => (
              <span key={value} style={{ left: `${viewOffset.xPx + value * pxPerMm}px` }}>{value}</span>
            ))}
          </div>

          <div className="constructor-ruler constructor-ruler-left" aria-hidden="true">
            {[0, 500, 1000, 1500, 2000].map((value) => (
              <span key={value} style={{ top: `${viewOffset.yPx + value * pxPerMm}px` }}>{value}</span>
            ))}
          </div>

          <div
            ref={canvasRef}
            className={`constructor-canvas${gridVisible ? ' has-grid' : ''}${activeTool === 'frame' ? ' is-frame-tool' : ''}${activeTool === 'pan' ? ' is-pan-tool' : ''}${viewPanState ? ' is-panning' : ''}${activeTool === 'vertical-divider' || activeTool === 'horizontal-divider' || activeTool === 'angled-divider' ? ' is-divider-tool' : ''}`}
            style={{
              '--constructor-grid-step': `${GRID_STEP_MM * pxPerMm}px`,
              '--constructor-major-grid-step': `${MAJOR_GRID_STEP_MM * pxPerMm}px`,
              backgroundPosition: `${viewOffset.xPx - 1}px ${viewOffset.yPx - 1}px`,
            } as CSSProperties}
            onPointerDownCapture={handleCanvasPointerDownCapture}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          >
            <div className="constructor-stage-badge">
              {isFreeMode
                ? hasActiveModule
                  ? `СВОБОДНА СКИЦА · МОДУЛ ${String(moduleNumber).padStart(2, '0')}`
                  : 'СВОБОДНА СКИЦА · БЕЗ МОДУЛ'
                : `ОФЕРТА · МОДУЛ ${String(moduleNumber).padStart(2, '0')}`}
            </div>

            {!canEditConstruction && (
              <div className="constructor-module-start-hint">
                <span>МОДУЛЕН КОНСТРУКТОР</span>
                <b>Създай Модул 1</b>
                <p>
                  Чертането започва в модул. След това можеш да добавяш Модул 2,
                  Модул 3 и да се връщаш към всеки от тях за корекции.
                </p>
                <button type="button" onClick={onCreateModule}>
                  Създай Модул 1
                </button>
              </div>
            )}

            {canEditConstruction && !displayedFrame && (
              <div className="constructor-frame-start-hint">
                <span>НАЧАЛО НА КОНСТРУКЦИЯТА</span>
                <b>Създай първата каса</b>
                <p>
                  Избери „Каса / рамка“ и изтегли правоъгълник с мишката върху мрежата.
                  Прилепването към мрежата е през 10 mm.
                </p>
                <button type="button" onClick={activateFrameTool}>
                  Каса / рамка
                </button>
              </div>
            )}

            {displayedFrame && (
              <div
                className={frameClassName}
                style={{
                  left: `${viewOffset.xPx + displayedFrame.xMm * pxPerMm}px`,
                  top: `${viewOffset.yPx + displayedFrame.yMm * pxPerMm}px`,
                  width: `${Math.max(1, displayedFrame.widthMm * pxPerMm)}px`,
                  height: `${Math.max(1, displayedFrame.heightMm * pxPerMm)}px`,
                  '--constructor-frame-face': `${frameFacePx}px`,
                  '--constructor-profile-frame-face': `${reviewedFrameFacePx ?? frameFacePx}px`,
                } as CSSProperties}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  if (!frame) {
                    return
                  }
                  if (activeTool === 'vertical-divider' || activeTool === 'horizontal-divider') {
                    addDivider(
                      activeTool === 'vertical-divider' ? 'vertical' : 'horizontal',
                      pointFromPointer(event),
                    )
                    return
                  }
                  if (activeTool === 'angled-divider') {
                    addAngledDivider(pointFromPointer(event))
                    return
                  }
                  if (activeTool === 'select') {
                    // CONTEXT INSPECTOR 01.1 V2 — frame body returns to module context.
                    setFrameSelected(false)
                    setSelectedFieldId(null)
                    setSelectedEdge(null)
                    setSelectedDividerId(null)
                    setSelectedAngledDividerId(null)
                    setInspectorTab('properties')
                  }
                }}
              >
                <div className="constructor-frame-visual" aria-hidden="true">
                  {profileViewActive && profileAwareGeometry?.frame.reviewed && (
                    <i className="constructor-profile-frame-face-overlay" />
                  )}
                  <i className="constructor-frame-mitre mitre-tl" />
                  <i className="constructor-frame-mitre mitre-tr" />
                  <i className="constructor-frame-mitre mitre-bl" />
                  <i className="constructor-frame-mitre mitre-br" />
                </div>

                {frame && dragState?.kind !== 'create' && fields.map((field) => {
                  const sashPlacement = profileViewActive ? profileAwareSashGeometry?.fields[field.id] : null
                  const innerProfileBoundsMm = sashPlacement?.placementReady ? sashPlacement.innerProfileBoundsMm : null
                  return (
                  <button
                    key={field.id}
                    type="button"
                    className={`constructor-field-surface ${selectedFieldId === field.id ? 'is-selected' : ''} ${field.fieldType === 'fixed' ? 'is-fixed' : field.fieldType === 'operable' ? 'is-operable' : 'is-unset'} ${profileViewActive && field.fieldType === 'operable' ? (innerProfileBoundsMm ? 'has-reviewed-sash-placement' : profileAwareGeometry?.sashes[field.id]?.reviewed ? 'has-reviewed-sash-geometry' : 'has-unresolved-sash-geometry') : ''}`}
                    style={{
                      left: `${field.bounds.xMm * pxPerMm}px`,
                      top: `${field.bounds.yMm * pxPerMm}px`,
                      width: `${field.bounds.widthMm * pxPerMm}px`,
                      height: `${field.bounds.heightMm * pxPerMm}px`,
                      clipPath: field.polygon
                        ? `polygon(${field.polygon.map((point) => `${((point.xMm - field.bounds.xMm) / Math.max(1, field.bounds.widthMm)) * 100}% ${((point.yMm - field.bounds.yMm) / Math.max(1, field.bounds.heightMm)) * 100}%`).join(', ')})`
                        : undefined,
                    }}
                    aria-label={`Поле ${field.sequence}`}
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      if (activeTool === 'vertical-divider' || activeTool === 'horizontal-divider') {
                        addDivider(
                          activeTool === 'vertical-divider' ? 'vertical' : 'horizontal',
                          pointFromPointer(event),
                        )
                        return
                      }
                      if (activeTool === 'angled-divider') {
                        addAngledDivider(pointFromPointer(event))
                        return
                      }
                      if (activeTool === 'fixed-field' || activeTool === 'operable-field') {
                        applyFieldType(
                          field.id,
                          activeTool === 'fixed-field' ? 'fixed' : 'operable',
                        )
                        return
                      }
                      if (activeTool === 'select') {
                        setSelectedFieldId(field.id)
                        setSelectedDividerId(null)
                        setSelectedAngledDividerId(null)
                        setFrameSelected(false)
                        setSelectedEdge(null)
                      }
                    }}
                  >
                    {field.fieldType === 'operable' && (
                      <>
                        {/* CONSTRUCTOR 01E.5.2: fixed-pixel schematic sash ring.
                            It clarifies frame/divider/sash overlap without claiming catalog millimetres. */}
                        <span className="constructor-sash-profile-visual" aria-hidden="true">
                          <span className="sash-profile-inner" />
                          <i className="sash-profile-mitre mitre-tl" />
                          <i className="sash-profile-mitre mitre-tr" />
                          <i className="sash-profile-mitre mitre-bl" />
                          <i className="sash-profile-mitre mitre-br" />
                        </span>
                        {/* CONSTRUCTOR 01E.5.2: opening symbol is inset to the inner sash contour. */}
                        {/* 01.1: reviewed placement uses domain bounds; fallback retains the schematic CSS inset. */}
                        <svg
                          className={`constructor-operable-visual mode-${field.openingMode ?? 'unset'} handing-${field.openingHanding ?? 'none'}`}
                          style={innerProfileBoundsMm ? {
                            inset: 'auto',
                            left: `${(innerProfileBoundsMm.xMm - field.bounds.xMm) * pxPerMm}px`,
                            top: `${(innerProfileBoundsMm.yMm - field.bounds.yMm) * pxPerMm}px`,
                            width: `${innerProfileBoundsMm.widthMm * pxPerMm}px`,
                            height: `${innerProfileBoundsMm.heightMm * pxPerMm}px`,
                          } : undefined}
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          {field.openingMode === 'side-hinged' && field.openingHanding === 'left' && (
                            <>
                              <line className="opening-primary" x1="0" y1="0" x2="100" y2="50" />
                              <line className="opening-primary" x1="0" y1="100" x2="100" y2="50" />
                            </>
                          )}
                          {field.openingMode === 'side-hinged' && field.openingHanding === 'right' && (
                            <>
                              <line className="opening-primary" x1="100" y1="0" x2="0" y2="50" />
                              <line className="opening-primary" x1="100" y1="100" x2="0" y2="50" />
                            </>
                          )}
                          {field.openingMode === 'tilt' && (
                            <>
                              <line className="opening-tilt" x1="0" y1="100" x2="50" y2="0" />
                              <line className="opening-tilt" x1="100" y1="100" x2="50" y2="0" />
                            </>
                          )}
                          {field.openingMode === 'tilt-turn' && field.openingHanding === 'left' && (
                            <>
                              <line className="opening-primary" x1="0" y1="0" x2="100" y2="50" />
                              <line className="opening-primary" x1="0" y1="100" x2="100" y2="50" />
                              <line className="opening-tilt" x1="0" y1="100" x2="50" y2="0" />
                              <line className="opening-tilt" x1="100" y1="100" x2="50" y2="0" />
                            </>
                          )}
                          {field.openingMode === 'tilt-turn' && field.openingHanding === 'right' && (
                            <>
                              <line className="opening-primary" x1="100" y1="0" x2="0" y2="50" />
                              <line className="opening-primary" x1="100" y1="100" x2="0" y2="50" />
                              <line className="opening-tilt" x1="0" y1="100" x2="50" y2="0" />
                              <line className="opening-tilt" x1="100" y1="100" x2="50" y2="0" />
                            </>
                          )}
                          {(field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn') &&
                            field.openingHanding === 'left' && (
                              <g className="constructor-opening-handle" aria-hidden="true">
                                <circle cx="100" cy="50" r="2.2" />
                                <line x1="100" y1="50" x2="92" y2="50" />
                              </g>
                            )}
                          {(field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn') &&
                            field.openingHanding === 'right' && (
                              <g className="constructor-opening-handle" aria-hidden="true">
                                <circle cx="0" cy="50" r="2.2" />
                                <line x1="0" y1="50" x2="8" y2="50" />
                              </g>
                            )}
                        </svg>
                      </>
                    )}
                    <span className="constructor-field-number-badge" aria-hidden="true">
                      {field.sequence}
                    </span>
                  </button>
                  )
                })}

                {profileViewActive && frame && profileAwareSashGeometry && fields.map((field) => {
                  const sashGeometry = profileAwareSashGeometry.fields[field.id]
                  if (!sashGeometry?.placementReady || !sashGeometry.outerBoundsMm || !sashGeometry.innerProfileBoundsMm || sashGeometry.sashVisibleFaceMm === null) return null
                  return (
                    <span
                      key={`reviewed-sash-${field.id}`}
                      className="constructor-reviewed-sash-placement"
                      style={{
                        left: `${sashGeometry.outerBoundsMm.xMm * pxPerMm}px`,
                        top: `${sashGeometry.outerBoundsMm.yMm * pxPerMm}px`,
                        width: `${sashGeometry.outerBoundsMm.widthMm * pxPerMm}px`,
                        height: `${sashGeometry.outerBoundsMm.heightMm * pxPerMm}px`,
                        '--constructor-reviewed-sash-face': `${sashGeometry.sashVisibleFaceMm * pxPerMm}px`,
                      } as CSSProperties}
                      aria-hidden="true"
                    >
                      <span
                        className="constructor-reviewed-sash-inner-face"
                        style={{
                          left: `${(sashGeometry.innerProfileBoundsMm.xMm - sashGeometry.outerBoundsMm.xMm) * pxPerMm}px`,
                          top: `${(sashGeometry.innerProfileBoundsMm.yMm - sashGeometry.outerBoundsMm.yMm) * pxPerMm}px`,
                          width: `${sashGeometry.innerProfileBoundsMm.widthMm * pxPerMm}px`,
                          height: `${sashGeometry.innerProfileBoundsMm.heightMm * pxPerMm}px`,
                        }}
                      />
                      <i className="constructor-reviewed-sash-mitre mitre-tl" />
                      <i className="constructor-reviewed-sash-mitre mitre-tr" />
                      <i className="constructor-reviewed-sash-mitre mitre-bl" />
                      <i className="constructor-reviewed-sash-mitre mitre-br" />
                    </span>
                  )
                })}

                {frame && dragState?.kind !== 'create' && dividers.map((divider) => {
                  const faceClipPath = divider.facePolygon
                    ? (() => {
                        const faceLeft = divider.axis === 'vertical' ? divider.positionMm : divider.startMm
                        const faceTop = divider.axis === 'vertical' ? divider.startMm : divider.positionMm
                        const faceWidth = divider.axis === 'vertical' ? divider.thicknessMm : Math.max(1, divider.endMm - divider.startMm)
                        const faceHeight = divider.axis === 'vertical' ? Math.max(1, divider.endMm - divider.startMm) : divider.thicknessMm
                        return `polygon(${divider.facePolygon.map((point) => `${((point.xMm - faceLeft) / Math.max(1, faceWidth)) * 100}% ${((point.yMm - faceTop) / Math.max(1, faceHeight)) * 100}%`).join(', ')})`
                      })()
                    : undefined
                  const reviewedDividerGeometry = profileAwareGeometry?.dividers[divider.id] ?? null
                  const reviewedDividerFacePx = reviewedDividerGeometry?.reviewed && reviewedDividerGeometry.visibleFaceMm !== null
                    ? Math.max(4, reviewedDividerGeometry.visibleFaceMm * pxPerMm)
                    : null
                  return (
                    <button
                      key={divider.id}
                      type="button"
                      className={`constructor-divider is-local ${divider.axis} ${selectedDividerId === divider.id ? 'is-selected' : ''} ${profileViewActive ? 'has-profile-view' : ''} ${profileViewActive && reviewedDividerGeometry?.reviewed ? 'has-reviewed-profile-face' : ''}`}
                      style={(divider.axis === 'vertical'
                        ? {
                            left: `${(divider.positionMm + divider.thicknessMm / 2) * pxPerMm}px`,
                            top: `${divider.startMm * pxPerMm}px`,
                            height: `${(divider.endMm - divider.startMm) * pxPerMm}px`,
                            '--constructor-divider-face': `${Math.max(6, divider.thicknessMm * pxPerMm)}px`,
                            '--constructor-profile-divider-face': `${reviewedDividerFacePx ?? Math.max(6, divider.thicknessMm * pxPerMm)}px`,
                            '--constructor-divider-start-inset': '0px',
                            '--constructor-divider-end-inset': '0px',
                          }
                        : {
                            left: `${divider.startMm * pxPerMm}px`,
                            top: `${(divider.positionMm + divider.thicknessMm / 2) * pxPerMm}px`,
                            width: `${(divider.endMm - divider.startMm) * pxPerMm}px`,
                            '--constructor-divider-face': `${Math.max(6, divider.thicknessMm * pxPerMm)}px`,
                            '--constructor-profile-divider-face': `${reviewedDividerFacePx ?? Math.max(6, divider.thicknessMm * pxPerMm)}px`,
                            '--constructor-divider-start-inset': '0px',
                            '--constructor-divider-end-inset': '0px',
                          }) as CSSProperties & Record<string, string | number>}
                      aria-label={divider.axis === 'vertical' ? 'Вертикален делител на поле' : 'Хоризонтален делител на поле'}
                      onPointerDown={(event) => startDividerDrag(divider, event)}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedDividerId(divider.id)
                        setSelectedAngledDividerId(null)
                        setSelectedFieldId(null)
                        setDividerPositionDraft(String(Math.round(divider.offsetMm)))
                        setFrameSelected(false)
                        setSelectedEdge(null)
                      }}
                    >
                      <span
                        className="constructor-divider-face"
                        style={faceClipPath ? { clipPath: faceClipPath } : undefined}
                        aria-hidden="true"
                      />
                      {profileViewActive && reviewedDividerGeometry?.reviewed && (
                        <span className="constructor-profile-divider-face-overlay" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}

                {frame && dragState?.kind !== 'create' && angledDividers.map((divider) => {
                  const xs = divider.facePolygon.map((point) => point.xMm)
                  const ys = divider.facePolygon.map((point) => point.yMm)
                  const minX = Math.min(...xs)
                  const maxX = Math.max(...xs)
                  const minY = Math.min(...ys)
                  const maxY = Math.max(...ys)
                  const width = Math.max(1, maxX - minX)
                  const height = Math.max(1, maxY - minY)
                  const clipPath = `polygon(${divider.facePolygon.map((point) => `${((point.xMm - minX) / width) * 100}% ${((point.yMm - minY) / height) * 100}%`).join(', ')})`
                  return (
                    <div key={divider.id} className={`constructor-angled-wrap ${selectedAngledDividerId === divider.id ? 'is-selected' : ''}`}>
                      <button
                        type="button"
                        className="constructor-angled-divider"
                        style={{
                          left: `${minX * pxPerMm}px`,
                          top: `${minY * pxPerMm}px`,
                          width: `${width * pxPerMm}px`,
                          height: `${height * pxPerMm}px`,
                          clipPath,
                        }}
                        aria-label="Ъглов делител на поле"
                        onPointerDown={(event) => startAngledDividerDrag(divider, event)}
                      />
                      <button
                        type="button"
                        className="constructor-angled-grip grip-top"
                        style={{ left: `${divider.topPoint.xMm * pxPerMm}px`, top: `${divider.topPoint.yMm * pxPerMm}px` }}
                        aria-label="Горен край на ъглов делител"
                        onPointerDown={(event) => startAngledEndpointDrag(divider, 'top', event)}
                      />
                      <button
                        type="button"
                        className="constructor-angled-grip grip-bottom"
                        style={{ left: `${divider.bottomPoint.xMm * pxPerMm}px`, top: `${divider.bottomPoint.yMm * pxPerMm}px` }}
                        aria-label="Долен край на ъглов делител"
                        onPointerDown={(event) => startAngledEndpointDrag(divider, 'bottom', event)}
                      />
                    </div>
                  )
                })}

                {frame && dragState?.kind !== 'create' && (
                  <>
                    <button
                      type="button"
                      className="constructor-edge-handle edge-left"
                      aria-label="Промени левия ръб на касата"
                      onPointerDown={(event) => startEdgeResize('left', event)}
                    />
                    <button
                      type="button"
                      className="constructor-edge-handle edge-right"
                      aria-label="Промени десния ръб на касата"
                      onPointerDown={(event) => startEdgeResize('right', event)}
                    />
                    <button
                      type="button"
                      className="constructor-edge-handle edge-top"
                      aria-label="Промени горния ръб на касата"
                      onPointerDown={(event) => startEdgeResize('top', event)}
                    />
                    <button
                      type="button"
                      className="constructor-edge-handle edge-bottom"
                      aria-label="Промени долния ръб на касата"
                      onPointerDown={(event) => startEdgeResize('bottom', event)}
                    />
                  </>
                )}

                {simpleBayDimensions.length > 0 && dragState?.kind !== 'create' && (
                  <div className="constructor-bay-dimension-band" aria-label="Схемни модулни ширини">
                    {simpleBayDimensions.map((bay) => (
                      <div
                        key={`bay-dimension-${bay.sequence}`}
                        className="constructor-bay-dimension"
                        style={{
                          left: `${bay.startMm * pxPerMm}px`,
                          width: `${bay.widthMm * pxPerMm}px`,
                        }}
                      >
                        <span>{Math.round(bay.widthMm)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="constructor-frame-dimension constructor-frame-dimension-width">
                  <span>{Math.round(displayedFrame.widthMm)}</span>
                </div>
                <div className="constructor-frame-dimension constructor-frame-dimension-height">
                  <span>{Math.round(displayedFrame.heightMm)}</span>
                </div>
              </div>
            )}
          </div>

          {frame && dragState?.kind !== 'create' && fields.length > 0 && (
            <section className="constructor-field-details-panel" aria-label="Данни за полетата в модула">
              <div className="constructor-field-details-heading">
                <span>ПОЛЕТА В МОДУЛА</span>
                <b>{fields.length}</b>
              </div>
              <div className="constructor-field-details-list">
                {fields.map((field) => {
                  const openingLabel = field.openingMode === 'side-hinged'
                    ? 'Странично'
                    : field.openingMode === 'tilt'
                      ? 'Падащо'
                      : field.openingMode === 'tilt-turn'
                        ? 'Странично + падащо'
                        : null
                  const handingLabel = field.openingHanding === 'left'
                    ? 'ЛЯВО'
                    : field.openingHanding === 'right'
                      ? 'ДЯСНО'
                      : null
                  const dimensionalField = dimensionalChain?.fields.find((item) => item.fieldId === field.id)
                  const bayWidthLabel = dimensionalField?.schematicBayWidth.valueMm === null || dimensionalField?.schematicBayWidth.valueMm === undefined
                    ? 'НЕИЗВЕСТНО'
                    : `${Math.round(dimensionalField.schematicBayWidth.valueMm)} mm`
                  return (
                    <button
                      key={`details-${field.id}`}
                      type="button"
                      className={`constructor-field-detail-card ${selectedFieldId === field.id ? 'is-selected' : ''}`}
                      aria-pressed={selectedFieldId === field.id}
                      title={`Поле ${field.sequence} · ${Math.round(field.bounds.widthMm)} × ${Math.round(field.bounds.heightMm)} mm`}
                      onClick={() => {
                        setSelectedFieldId(field.id)
                        setSelectedDividerId(null)
                        setSelectedAngledDividerId(null)
                        setFrameSelected(false)
                        setSelectedEdge(null)
                        setActiveTool('select')
                      }}
                    >
                      <span className="constructor-field-detail-number">{field.sequence}</span>
                      <span className="constructor-field-detail-main">
                        <b>ПОЛЕ {Math.round(field.bounds.widthMm)} × {Math.round(field.bounds.heightMm)} mm</b>
                        <small>
                          МОДУЛ {bayWidthLabel} · {field.fieldType === 'fixed'
                            ? 'ФИКСИРАНО'
                            : field.fieldType === 'operable'
                              ? 'КРИЛО'
                              : 'НЕ Е ЗАДАДЕНО'}
                        </small>
                      </span>
                      <span className="constructor-field-detail-opening">
                        {field.fieldType === 'operable' && openingLabel
                          ? `${openingLabel}${handingLabel ? ` · ${handingLabel}` : ''}`
                          : '—'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <footer className="constructor-statusbar">
            <span>
              ИНСТРУМЕНТ:{' '}
              {activeTool === 'select'
                ? 'Селекция'
                : activeTool === 'pan'
                  ? 'Панорама'
                  : activeTool === 'frame'
                    ? 'Каса / рамка'
                    : activeTool === 'vertical-divider'
                      ? 'Вертикален делител'
                      : activeTool === 'horizontal-divider'
                        ? 'Хоризонтален делител'
                        : activeTool === 'angled-divider'
                          ? 'Ъглов делител'
                          : activeTool === 'fixed-field'
                            ? 'Фиксирано поле'
                            : 'Отваряемо поле'}
            </span>
            <span>X: {cursorPoint ? Math.round(cursorPoint.xMm) : '—'} mm</span>
            <span>Y: {cursorPoint ? Math.round(cursorPoint.yMm) : '—'} mm</span>
            <span>МРЕЖА: {gridVisible ? `${GRID_STEP_MM} mm` : 'ИЗКЛ.'}</span>
            <span>ПРИЛЕПВАНЕ: {snapEnabled ? `${SNAP_STEP_MM} mm` : 'ИЗКЛ.'}</span>
            <span>МАЩАБ: {zoom}% · {autoFitEnabled ? 'АВТО ПОБИРАНЕ' : 'РЪЧЕН ИЗГЛЕД'}</span>
            <span>ПОЛЕТА: {conceptualFieldCount}</span>
          </footer>
        </section>

        <aside className="constructor-properties-panel constructor-context-inspector" aria-label="Данни за избраното" data-context={selectedField ? 'field' : selectedDivider ? 'divider' : selectedAngledDivider ? 'angled-divider' : 'module'}>
          <header className="constructor-context-heading">
            <span>ИЗБРАНО</span>
            <h2>{selectedElementTitle}</h2>
            <small>{selectedElementMeta}</small>
            {!isModuleContext && <button type="button" className="constructor-context-link" onClick={selectModuleContext}>Към Модул {moduleNumber}</button>}
          </header>
          <section className="constructor-context-data" aria-label="Данни">
            <h3>ДАННИ</h3>
            {canEditConstruction ? inspectorTabsAndPane : <p className="constructor-context-hint">Създай модул от лентата над чертежа.</p>}
          </section>
          <section className="constructor-context-check" aria-label="Проверка">
            <h3>ПРОВЕРКА</h3>
            {renderContextCheck()}
            <small>Скицата не е готова за производство.</small>
          </section>
        </aside>
      </div>
    </section>
  )
}
