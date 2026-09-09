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

type ConstructorOfferContext = {
  profileSystemLabel: string
  colorLabel: string
  foilModeLabel: string
  glazingLabel: string
  hardwareLabel: string
}

type ConstructorModuleSummary = {
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
  moduleSummary?: ConstructorModuleSummary
  initialDraft?: ConstructorDraftSnapshot | null
  onDraftChange?: (draft: ConstructorDraftSnapshot | null) => void
  onModuleSizeChange?: (size: ConstructorModuleSize) => void
  onFieldTopologyChange?: (fields: readonly ConstructorFieldTopologySummary[]) => void
  onSelectModule?: (moduleId: string) => void
  onCreateModule?: () => void
  onResetModule?: () => void
  onClose: () => void
  onCreateOfferFromSketch?: (draft: ConstructorDraftSnapshot | null) => void
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

type DividerModel = ResolvedConstructionDivider
type AngledDividerModel = ResolvedConstructionAngledDivider
type FieldModel = ResolvedConstructionField
type FrameModel = ConstructionFrame

type CanvasPoint = {
  xMm: number
  yMm: number
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

const ZOOM_STEPS = [75, 100, 125, 150] as const
const SNAP_STEP_MM = 10
const GRID_STEP_MM = 50
const MAJOR_GRID_STEP_MM = 500
const BASE_PX_PER_MM = 0.28
const MIN_FRAME_MM = 200
const MAX_WORLD_MM = 5000

const FREE_MODULE_SUMMARY: ConstructorModuleSummary = {
  productTypeLabel: 'Свободна скица',
  widthMm: null,
  heightMm: null,
}

function clampZoom(current: number, direction: -1 | 1) {
  const currentIndex = ZOOM_STEPS.findIndex((value) => value === current)
  const safeIndex = currentIndex >= 0 ? currentIndex : 1
  const nextIndex = Math.min(
    ZOOM_STEPS.length - 1,
    Math.max(0, safeIndex + direction),
  )

  return ZOOM_STEPS[nextIndex]
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
): ConstructionModel | null {
  if (initialDraft?.topology) {
    return upgradeConstructionModelPhysicalDividers(initialDraft.topology)
  }

  const frame = getInitialFrame(initialDraft, moduleSummary)
  if (!frame) return null

  if (initialDraft?.dividers?.length) {
    return migrateLegacyDividersToTopology(frame, initialDraft.dividers)
  }

  return createConstructionModel(frame)
}

export default function ConstructorShell({
  mode,
  moduleNumber = 1,
  moduleItems = [],
  activeModuleId,
  offerContext,
  moduleSummary = FREE_MODULE_SUMMARY,
  initialDraft,
  onDraftChange,
  onModuleSizeChange,
  onFieldTopologyChange,
  onSelectModule,
  onCreateModule,
  onResetModule,
  onClose,
  onCreateOfferFromSketch,
}: ConstructorShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<ConstructorTool>('select')
  const [gridVisible, setGridVisible] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [zoom, setZoom] = useState<number>(100)
  const [construction, setConstruction] = useState<ConstructionModel | null>(() =>
    getInitialConstruction(initialDraft, moduleSummary),
  )
  const [undoStack, setUndoStack] = useState<Array<ConstructionModel | null>>([])
  const [redoStack, setRedoStack] = useState<Array<ConstructionModel | null>>([])
  const constructionRef = useRef<ConstructionModel | null>(construction)
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
    fields[0]?.id ?? null,
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
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null
  const selectedDivider = dividers.find((divider) => divider.id === selectedDividerId) ?? null
  const selectedAngledDivider = angledDividers.find((divider) => divider.id === selectedAngledDividerId) ?? null
  const conceptualFieldCount = fields.length

  const snapMm = (value: number) => {
    const safeValue = clamp(value, 0, MAX_WORLD_MM)
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
      xMm: snapMm((event.clientX - rect.left) / pxPerMm),
      yMm: snapMm((event.clientY - rect.top) / pxPerMm),
    }
  }

  const cloneHistoryEntry = (entry: ConstructionModel | null) =>
    entry ? cloneConstructionModel(entry) : null

  const constructionEquals = (
    first: ConstructionModel | null,
    second: ConstructionModel | null,
  ) => JSON.stringify(first) === JSON.stringify(second)

  const pushUndoEntry = (entry: ConstructionModel | null) => {
    setUndoStack((current) => [
      ...current.slice(-59),
      cloneHistoryEntry(entry),
    ])
  }

  const broadcastConstruction = (nextConstruction: ConstructionModel | null) => {
    constructionRef.current = nextConstruction
    setConstruction(nextConstruction)

    if (!nextConstruction) {
      onDraftChange?.(null)
      if (!isFreeMode) {
        onFieldTopologyChange?.([])
      }
      return
    }

    onDraftChange?.(constructionToSnapshot(nextConstruction))

    if (!isFreeMode) {
      onModuleSizeChange?.({
        widthMm: Math.round(nextConstruction.frame.widthMm),
        heightMm: Math.round(nextConstruction.frame.heightMm),
      })
      onFieldTopologyChange?.(
        resolveConstructionTopology(nextConstruction).fields.map((field) => ({
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
    pushUndoEntry(currentConstruction)
    setRedoStack([])
    broadcastConstruction(nextConstruction)
  }

  const recordDragHistory = (originalConstruction: ConstructionModel) => {
    if (constructionEquals(originalConstruction, constructionRef.current)) return
    pushUndoEntry(originalConstruction)
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

  const undoConstruction = () => {
    const previous = undoStack.at(-1)
    if (previous === undefined) return

    setUndoStack((current) => current.slice(0, -1))
    setRedoStack((current) => [
      ...current.slice(-59),
      cloneHistoryEntry(constructionRef.current),
    ])
    const restored = cloneHistoryEntry(previous)
    broadcastConstruction(restored)
    restoreHistorySelection(restored)
  }

  const redoConstruction = () => {
    const next = redoStack.at(-1)
    if (next === undefined) return

    setRedoStack((current) => current.slice(0, -1))
    setUndoStack((current) => [
      ...current.slice(-59),
      cloneHistoryEntry(constructionRef.current),
    ])
    const restored = cloneHistoryEntry(next)
    broadcastConstruction(restored)
    restoreHistorySelection(restored)
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

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
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
        widthMm: clamp(point.xMm - original.xMm, getMinFrameDimension('vertical'), MAX_WORLD_MM),
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
        heightMm: clamp(point.yMm - original.yMm, getMinFrameDimension('horizontal'), MAX_WORLD_MM),
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
    if (!frame || !construction) {
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
    if (!frame || !construction) return
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
    if (!frame || !construction) return
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
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={`constructor-shell${showModuleStrip ? ' has-module-navigation' : ''}`} aria-label={`FacadeFlow Constructor · ${title}`}>
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
            <span>FACADEFLOW CONSTRUCTOR · FIELD SEMANTICS 01D · OPENING SYMBOLS 01D.1 · MINIMAL LABELS 01D.3 · BOTTOM POLISH 01D.3.1</span>
            <h2>{title}</h2>
            <p>
              {isFreeMode
                ? hasActiveModule
                  ? `Работиш по Модул ${moduleNumber}. Всеки модул пази собствена параметрична скица; система може да бъде приложена по-късно.`
                  : 'Създай Модул 1, за да започнеш. Всеки следващ модул ще пази собствена независима скица.'
                : 'Параметрична каса с истински вътрешни ПОЛЕТА. Всеки делител пази собствената си позиция; мести се само избраният елемент.'}
            </p>
          </div>
        </div>

        <div className="constructor-topbar-meta" aria-label="Контекст на конструктора">
          <div className="constructor-context-card">
            <span>КОНТЕКСТ</span>
            <b>
              {isFreeMode
                ? hasActiveModule
                  ? `Свободна скица · Модул ${moduleNumber}`
                  : 'Свободна скица · без модул'
                : `Оферта · Модул ${moduleNumber}`}
            </b>
          </div>
          <div>
            <span>РЕЖИМ</span>
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
                    key={item.id}
                    className={item.id === activeModuleId ? 'is-active' : ''}
                    onClick={() => onSelectModule?.(item.id)}
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
          <button type="button" disabled title="Ще бъде активирано в Constructor 01F">
            Референтна схема
          </button>
        </div>

        <div className="constructor-toolbar-group constructor-toolbar-view">
          <button
            type="button"
            className={gridVisible ? 'is-active' : ''}
            onClick={() => setGridVisible((current) => !current)}
          >
            Grid {gridVisible ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={snapEnabled ? 'is-active' : ''}
            onClick={() => setSnapEnabled((current) => !current)}
          >
            Snap {snapEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            aria-label="Намали мащаба"
            onClick={() => setZoom((current) => clampZoom(current, -1))}
            disabled={zoom === ZOOM_STEPS[0]}
          >
            −
          </button>
          <span className="constructor-zoom-value">{zoom}%</span>
          <button
            type="button"
            aria-label="Увеличи мащаба"
            onClick={() => setZoom((current) => clampZoom(current, 1))}
            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          >
            +
          </button>
        </div>
      </div>

      <div className="constructor-layout">
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
              title="Polygon FIELD topology · независим горен и долен край"
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
                <small>{frame ? 'Кликни върху ПОЛЕ · създава логическо крило' : 'Първо създай каса'}</small>
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
              title="Undo · Ctrl+Z"
            >
              ↶ Undo
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={redoConstruction}
              title="Redo · Ctrl+Y / Ctrl+Shift+Z"
            >
              ↷ Redo
            </button>
          </div>


          <button
            type="button"
            className="constructor-reset-sketch"
            disabled={!construction || !canEditConstruction}
            onClick={resetConstructionFromScratch}
            title="Изчисти текущия модул; Undo може да възстанови скицата"
          >
            <span>{hasActiveModule ? `Изчисти Модул ${moduleNumber}` : 'Изтрий скицата'}</span>
            <small>Започни текущия модул отначало</small>
          </button>
        </aside>

        <section className="constructor-workarea" aria-label="CAD работно поле">
          <div className="constructor-ruler constructor-ruler-top" aria-hidden="true">
            {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000].map((value) => (
              <span key={value} style={{ left: `${value * pxPerMm}px` }}>{value}</span>
            ))}
          </div>

          <div className="constructor-ruler constructor-ruler-left" aria-hidden="true">
            {[0, 500, 1000, 1500, 2000].map((value) => (
              <span key={value} style={{ top: `${value * pxPerMm}px` }}>{value}</span>
            ))}
          </div>

          <div
            ref={canvasRef}
            className={`constructor-canvas${gridVisible ? ' has-grid' : ''}${activeTool === 'frame' ? ' is-frame-tool' : ''}${activeTool === 'vertical-divider' || activeTool === 'horizontal-divider' || activeTool === 'angled-divider' ? ' is-divider-tool' : ''}`}
            style={{
              '--constructor-grid-step': `${GRID_STEP_MM * pxPerMm}px`,
              '--constructor-major-grid-step': `${MAJOR_GRID_STEP_MM * pxPerMm}px`,
            } as CSSProperties}
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
                <span>CONSTRUCTOR 01B</span>
                <b>Създай първата каса</b>
                <p>
                  Избери „Каса / рамка“ и изтегли правоъгълник с мишката върху мрежата.
                  Snap работи през 10 mm.
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
                  left: `${displayedFrame.xMm * pxPerMm}px`,
                  top: `${displayedFrame.yMm * pxPerMm}px`,
                  width: `${Math.max(1, displayedFrame.widthMm * pxPerMm)}px`,
                  height: `${Math.max(1, displayedFrame.heightMm * pxPerMm)}px`,
                  '--constructor-frame-face': `${frameFacePx}px`,
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
                    setFrameSelected(true)
                    setSelectedFieldId(null)
                    setSelectedEdge(null)
                    setSelectedDividerId(null)
                    setSelectedAngledDividerId(null)
                  }
                }}
              >
                <div className="constructor-frame-visual" aria-hidden="true">
                  <i className="constructor-frame-mitre mitre-tl" />
                  <i className="constructor-frame-mitre mitre-tr" />
                  <i className="constructor-frame-mitre mitre-bl" />
                  <i className="constructor-frame-mitre mitre-br" />
                </div>

                {frame && dragState?.kind !== 'create' && fields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    className={`constructor-field-surface ${selectedFieldId === field.id ? 'is-selected' : ''} ${field.fieldType === 'fixed' ? 'is-fixed' : field.fieldType === 'operable' ? 'is-operable' : 'is-unset'}`}
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
                      <svg
                        className={`constructor-operable-visual mode-${field.openingMode ?? 'unset'} handing-${field.openingHanding ?? 'none'}`}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <rect x="3" y="3" width="94" height="94" rx="1.5" />
                        {field.openingMode === 'side-hinged' && field.openingHanding === 'left' && (
                          <>
                            <line className="opening-primary" x1="7" y1="7" x2="93" y2="50" />
                            <line className="opening-primary" x1="7" y1="93" x2="93" y2="50" />
                          </>
                        )}
                        {field.openingMode === 'side-hinged' && field.openingHanding === 'right' && (
                          <>
                            <line className="opening-primary" x1="93" y1="7" x2="7" y2="50" />
                            <line className="opening-primary" x1="93" y1="93" x2="7" y2="50" />
                          </>
                        )}
                        {field.openingMode === 'tilt' && (
                          <>
                            <line className="opening-tilt" x1="7" y1="93" x2="50" y2="7" />
                            <line className="opening-tilt" x1="93" y1="93" x2="50" y2="7" />
                          </>
                        )}
                        {field.openingMode === 'tilt-turn' && field.openingHanding === 'left' && (
                          <>
                            <line className="opening-primary" x1="7" y1="7" x2="93" y2="50" />
                            <line className="opening-primary" x1="7" y1="93" x2="93" y2="50" />
                            <line className="opening-tilt" x1="7" y1="93" x2="50" y2="7" />
                            <line className="opening-tilt" x1="93" y1="93" x2="50" y2="7" />
                          </>
                        )}
                        {field.openingMode === 'tilt-turn' && field.openingHanding === 'right' && (
                          <>
                            <line className="opening-primary" x1="93" y1="7" x2="7" y2="50" />
                            <line className="opening-primary" x1="93" y1="93" x2="7" y2="50" />
                            <line className="opening-tilt" x1="7" y1="93" x2="50" y2="7" />
                            <line className="opening-tilt" x1="93" y1="93" x2="50" y2="7" />
                          </>
                        )}
                        {(field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn') &&
                          field.openingHanding === 'left' && (
                            <g className="constructor-opening-handle" aria-hidden="true">
                              <circle cx="93" cy="50" r="2.2" />
                              <line x1="91" y1="50" x2="84" y2="50" />
                            </g>
                          )}
                        {(field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn') &&
                          field.openingHanding === 'right' && (
                            <g className="constructor-opening-handle" aria-hidden="true">
                              <circle cx="7" cy="50" r="2.2" />
                              <line x1="9" y1="50" x2="16" y2="50" />
                            </g>
                          )}
                      </svg>
                    )}
                    <span className="constructor-field-number-badge" aria-hidden="true">
                      {field.sequence}
                    </span>
                  </button>
                ))}

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
                  return (
                    <button
                      key={divider.id}
                      type="button"
                      className={`constructor-divider is-local ${divider.axis} ${selectedDividerId === divider.id ? 'is-selected' : ''}`}
                      style={(divider.axis === 'vertical'
                        ? {
                            left: `${(divider.positionMm + divider.thicknessMm / 2) * pxPerMm}px`,
                            top: `${divider.startMm * pxPerMm}px`,
                            height: `${(divider.endMm - divider.startMm) * pxPerMm}px`,
                            '--constructor-divider-face': `${Math.max(6, divider.thicknessMm * pxPerMm)}px`,
                            '--constructor-divider-start-inset': '0px',
                            '--constructor-divider-end-inset': '0px',
                          }
                        : {
                            left: `${divider.startMm * pxPerMm}px`,
                            top: `${(divider.positionMm + divider.thicknessMm / 2) * pxPerMm}px`,
                            width: `${(divider.endMm - divider.startMm) * pxPerMm}px`,
                            '--constructor-divider-face': `${Math.max(6, divider.thicknessMm * pxPerMm)}px`,
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

                <div className="constructor-frame-dimension constructor-frame-dimension-width">
                  <span>{Math.round(displayedFrame.widthMm)} mm</span>
                </div>
                <div className="constructor-frame-dimension constructor-frame-dimension-height">
                  <span>{Math.round(displayedFrame.heightMm)} mm</span>
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
                        <b>{Math.round(field.bounds.widthMm)} × {Math.round(field.bounds.heightMm)} mm</b>
                        <small>
                          {field.fieldType === 'fixed'
                            ? 'FIX'
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
            <span>GRID: {gridVisible ? `${GRID_STEP_MM} mm` : 'OFF'}</span>
            <span>SNAP: {snapEnabled ? `${SNAP_STEP_MM} mm` : 'OFF'}</span>
            <span>ZOOM: {zoom}%</span>
            <span>ПОЛЕТА: {conceptualFieldCount}</span>
          </footer>
        </section>

        <aside className="constructor-properties-panel" aria-label="Свойства и настройки">
          {isFreeMode ? (
            <section className="constructor-properties-section constructor-free-context">
              <div className="constructor-panel-heading">
                <span>
                  {hasActiveModule
                    ? `МОДУЛ ${String(moduleNumber).padStart(2, '0')}`
                    : 'СВОБОДНА СКИЦА'}
                </span>
                <b>
                  {hasActiveModule
                    ? `Свободна скица · Модул ${moduleNumber}`
                    : 'Без модул · без оферта и без заключена система'}
                </b>
              </div>

              <div className="constructor-free-settings">
                <div><span>Профилна система</span><b>Не е избрана</b><em>◇</em></div>
                <div><span>Цвят</span><b>Не е избран</b><em>◇</em></div>
                <div><span>Фолиране</span><b>Не е избрано</b><em>◇</em></div>
                <div><span>Стъклопакет</span><b>Не е избран</b><em>◇</em></div>
                <div><span>Обков</span><b>Не е избран</b><em>◇</em></div>
              </div>

              <p className="constructor-invariant-note">
                В свободен режим пазим конструктивния замисъл. Профилната система
                се избира по-късно и не се предполага автоматично.
              </p>

              {onCreateOfferFromSketch && (
                <button
                  type="button"
                  className="constructor-create-offer"
                  disabled={!canEditConstruction || !construction}
                  onClick={() => onCreateOfferFromSketch(construction ? constructionToSnapshot(construction) : null)}
                >
                  {hasActiveModule
                    ? `Създай оферта от Модул ${moduleNumber}`
                    : 'Създай оферта от тази скица'}
                </button>
              )}
            </section>
          ) : (
            <section className="constructor-properties-section">
              <div className="constructor-panel-heading">
                <span>ОФЕРТА</span>
                <b>Заключени общи настройки</b>
              </div>

              <div className="constructor-offer-locks">
                <div><span>Профилна система</span><b>{offerContext?.profileSystemLabel}</b><em>🔒</em></div>
                <div><span>Цвят</span><b>{offerContext?.colorLabel}</b><em>🔒</em></div>
                <div><span>Фолиране</span><b>{offerContext?.foilModeLabel}</b><em>🔒</em></div>
                <div><span>Стъклопакет</span><b>{offerContext?.glazingLabel}</b><em>🔒</em></div>
                <div><span>Обков</span><b>{offerContext?.hardwareLabel}</b><em>🔒</em></div>
              </div>

              <p className="constructor-invariant-note">
                Тези стойности важат за всички модули в тази оферта и не се променят
                от Конструктора.
              </p>
            </section>
          )}

          <section className="constructor-properties-section">
            <div className="constructor-panel-heading">
              <span>СВОЙСТВА</span>
              <b>{selectedAngledDivider
                ? 'Ъглов делител'
                : selectedDivider
                  ? (selectedDivider.axis === 'vertical' ? 'Вертикален делител' : 'Хоризонтален делител')
                  : selectedField
                  ? `Поле ${selectedField.sequence}`
                  : frameSelected && frame
                    ? 'Каса / рамка'
                    : 'Избран елемент'}</b>
            </div>

            {selectedAngledDivider && frame ? (
              <div className="constructor-frame-properties constructor-divider-properties">
                <div className="constructor-property-row">
                  <span>Горен край</span>
                  <b>{Math.round(selectedAngledDivider.topOffsetMm)} mm от левия ръб на родителското ПОЛЕ</b>
                </div>
                <div className="constructor-property-row">
                  <span>Долен край</span>
                  <b>{Math.round(selectedAngledDivider.bottomOffsetMm)} mm от левия ръб на родителското ПОЛЕ</b>
                </div>
                <div className="constructor-property-row">
                  <span>Дължина</span>
                  <b>{Math.round(selectedAngledDivider.lengthMm)} mm · автоматично от двата края</b>
                </div>
                <div className="constructor-property-row">
                  <span>Схемна видима ширина</span>
                  <b>{Math.round(selectedAngledDivider.thicknessMm)} mm · read-only до Profile Resolution</b>
                </div>
                <div className="constructor-property-row">
                  <span>Управление</span>
                  <b>Горен grip и долен grip се местят независимо · drag върху тялото мести целия делител</b>
                </div>
                <div className="constructor-property-row">
                  <span>Закотвяне в ъгъл</span>
                  <b>0 mm / пълна ширина = точен вътрешен ъгъл · snap в последните 30 mm</b>
                </div>
                <div className="constructor-property-row">
                  <span>FIELD topology</span>
                  <b>Двете страни са реални polygon / triangle / trapezoid ПОЛЕТА</b>
                </div>
                <button type="button" className="constructor-delete-divider" onClick={removeSelectedAngledDivider}>
                  Изтрий ъгловия делител
                </button>
                <p className="constructor-invariant-note">
                  Ъгловият делител е конструктивен split, не CAD линия. Краищата могат да се закотвят точно във вътрешен ъгъл; при ъгъл FIELD topology допуска triangle ПОЛЕ.
                </p>
              </div>
            ) : selectedDivider && frame ? (
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
                      if (event.key === 'Enter') {
                        commitDividerPosition()
                        event.currentTarget.blur()
                      }
                      if (event.key === 'Escape') {
                        resetDividerPositionDraft()
                        event.currentTarget.blur()
                      }
                    }}
                  /><em>mm</em></div>
                </label>
                <div
                  className="constructor-divider-balance"
                  aria-label="Схемно разпределение около делителя"
                >
                  <div>
                    <span>{selectedDivider.axis === 'vertical' ? 'ЛЯВО ПОЛЕ' : 'ГОРНО ПОЛЕ'}</span>
                    <b>{Math.round(selectedDivider.firstClearMm)} mm</b>
                  </div>
                  <i aria-hidden="true">+</i>
                  <div className="is-divider">
                    <span>ДЕЛИТЕЛ</span>
                    <b>{Math.round(selectedDivider.thicknessMm)} mm</b>
                  </div>
                  <i aria-hidden="true">+</i>
                  <div>
                    <span>{selectedDivider.axis === 'vertical' ? 'ДЯСНО ПОЛЕ' : 'ДОЛНО ПОЛЕ'}</span>
                    <b>{Math.round(selectedDivider.secondClearMm)} mm</b>
                  </div>
                </div>
                <div className="constructor-property-row">
                  <span>Ориентация</span>
                  <b>{selectedDivider.axis === 'vertical' ? 'Вертикален' : 'Хоризонтален'}</b>
                </div>
                <div className="constructor-property-row">
                  <span>Дължина на делителя</span>
                  <b>{Math.round(selectedDivider.endMm - selectedDivider.startMm)} mm · автоматично от родителското ПОЛЕ</b>
                </div>
                <div className="constructor-property-row">
                  <span>Схемна видима ширина</span>
                  <b>{Math.round(selectedDivider.thicknessMm)} mm · автоматична до Profile Resolution</b>
                </div>
                <div className="constructor-property-row">
                  <span>Управление с мишка</span>
                  <b>Променя се само положението на делителя</b>
                </div>
                <div className="constructor-property-row">
                  <span>Профил</span>
                  <b>Не е определен · ширината по-късно идва от Profile Data</b>
                </div>
                <div className="constructor-property-row">
                  <span>Геометрична логика</span>
                  <b>ПОЛЕ + {Math.round(selectedDivider.thicknessMm)} mm делител + ПОЛЕ</b>
                </div>
                <div className="constructor-property-row">
                  <span>Обхват</span>
                  <b>Само в родителското поле · FIELD topology</b>
                </div>
                <div className="constructor-property-row">
                  <span>ПОЛЕТА в модула</span>
                  <b>{conceptualFieldCount}</b>
                </div>
                <button
                  type="button"
                  className="constructor-delete-divider"
                  onClick={removeSelectedDivider}
                >
                  Изтрий делителя
                </button>
                <p className="constructor-invariant-note">
                  Drag върху делителя променя само положението му. Дължината следва автоматично родителското ПОЛЕ. Ширината е read-only схемна стойност до Profile Resolution и по-късно ще идва от реалния профил.
                </p>
              </div>
            ) : selectedField && frame ? (
              <div className="constructor-frame-properties constructor-field-properties">
                <div className="constructor-property-row">
                  <span>Идентификатор</span>
                  <b>{selectedField.id}</b>
                </div>
                <div className="constructor-property-row">
                  <span>{selectedField.polygon ? 'Габарит на polygon ПОЛЕТО' : 'Вътрешен схемен размер на полето'}</span>
                  <b>{Math.round(selectedField.bounds.widthMm)} × {Math.round(selectedField.bounds.heightMm)} mm{selectedField.polygon ? ' · polygon' : ''}</b>
                </div>
                <div className="constructor-property-row">
                  <span>Позиция във вътрешния контур</span>
                  <b>X {Math.round(selectedField.bounds.xMm - frameFaceMm)} · Y {Math.round(selectedField.bounds.yMm - frameFaceMm)} mm</b>
                </div>
                <div className="constructor-property-row">
                  <span>Тип поле</span>
                  <b>
                    {selectedField.fieldType === 'fixed'
                      ? 'Фиксирано · FIX'
                      : selectedField.fieldType === 'operable'
                        ? 'Отваряемо · логическо крило'
                        : 'Не е зададен'}
                  </b>
                </div>

                <div className="constructor-field-semantic-controls">
                  <span>ТИП ПОЛЕ</span>
                  <div className="constructor-field-semantic-buttons">
                    <button
                      type="button"
                      className={selectedField.fieldType === 'fixed' ? 'is-selected' : ''}
                      onClick={() => applyFieldType(selectedField.id, 'fixed')}
                    >
                      Фиксирано
                    </button>
                    <button
                      type="button"
                      className={selectedField.fieldType === 'operable' ? 'is-selected' : ''}
                      onClick={() => applyFieldType(selectedField.id, 'operable')}
                    >
                      Отваряемо / крило
                    </button>
                    <button
                      type="button"
                      className="is-clear"
                      disabled={selectedField.fieldType === null}
                      onClick={() => applyFieldType(selectedField.id, null)}
                    >
                      Изчисти
                    </button>
                  </div>
                </div>

                {selectedField.fieldType === 'operable' && (
                  <>
                    <div className="constructor-field-semantic-controls">
                      <span>РЕЖИМ НА ОТВАРЯНЕ</span>
                      <div className="constructor-field-semantic-buttons is-three">
                        {([
                          ['side-hinged', 'Странично'],
                          ['tilt', 'Падащо'],
                          ['tilt-turn', 'Странично + падащо'],
                        ] as const).map(([modeId, label]) => (
                          <button
                            key={modeId}
                            type="button"
                            className={selectedField.openingMode === modeId ? 'is-selected' : ''}
                            onClick={() => applySelectedFieldOpeningMode(modeId)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(selectedField.openingMode === 'side-hinged' ||
                      selectedField.openingMode === 'tilt-turn') && (
                      <div className="constructor-field-semantic-controls">
                        <span>РАБОТНА ПОСОКА</span>
                        <div className="constructor-field-semantic-buttons">
                          <button
                            type="button"
                            className={selectedField.openingHanding === 'left' ? 'is-selected' : ''}
                            onClick={() => applySelectedFieldOpeningHanding('left')}
                          >
                            Ляво
                          </button>
                          <button
                            type="button"
                            className={selectedField.openingHanding === 'right' ? 'is-selected' : ''}
                            onClick={() => applySelectedFieldOpeningHanding('right')}
                          >
                            Дясно
                          </button>
                          <button
                            type="button"
                            className="is-clear"
                            disabled={selectedField.openingHanding === null}
                            onClick={() => applySelectedFieldOpeningHanding(null)}
                          >
                            Изчисти
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="constructor-property-row">
                      <span>Визуализация на крилото</span>
                      <b>
                        {selectedField.openingMode === null
                          ? 'Контур на крило · избери режим на отваряне'
                          : selectedField.openingMode === 'tilt'
                            ? 'Падащ opening symbol · без ляво / дясно'
                            : selectedField.openingHanding === null
                              ? 'Избери Ляво / Дясно за огледален opening symbol'
                              : `${selectedField.openingMode === 'tilt-turn' ? 'Комбиниран' : 'Страничен'} ${selectedField.openingHanding === 'left' ? 'ляв' : 'десен'} opening symbol`}
                      </b>
                    </div>
                  </>
                )}

                <div className="constructor-field-action-hint">
                  <span>РАЗДЕЛЯНЕ НА ПОЛЕ</span>
                  <p>Избери вертикален или хоризонтален делител и кликни в това поле. Делителят няма да преминава автоматично през съседните полета.</p>
                </div>
                <p className="constructor-invariant-note">
                  FIX / отваряемо / режим / ляво-дясно са канонични FIELD семантики.
                  Opening symbol-ът следва работната конвенция на Конструктора и не избира профил, обков или машинна геометрия.
                </p>
              </div>
            ) : frameSelected && frame ? (
              <div className="constructor-frame-properties">
                <label>
                  <span>Ширина</span>
                  <div><input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Точна ширина в милиметри"
                    value={widthDraft}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setWidthDraft(event.target.value)}
                    onBlur={() => commitNumericDimension('widthMm')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitNumericDimension('widthMm')
                        event.currentTarget.blur()
                      }
                      if (event.key === 'Escape') {
                        resetNumericDimensionDraft('widthMm')
                        event.currentTarget.blur()
                      }
                    }}
                  /><em>mm</em></div>
                </label>
                <label>
                  <span>Височина</span>
                  <div><input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Точна височина в милиметри"
                    value={heightDraft}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setHeightDraft(event.target.value)}
                    onBlur={() => commitNumericDimension('heightMm')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        commitNumericDimension('heightMm')
                        event.currentTarget.blur()
                      }
                      if (event.key === 'Escape') {
                        resetNumericDimensionDraft('heightMm')
                        event.currentTarget.blur()
                      }
                    }}
                  /><em>mm</em></div>
                </label>

                <div className="constructor-property-row">
                  <span>Позиция</span>
                  <b>X {Math.round(frame.xMm)} · Y {Math.round(frame.yMm)} mm</b>
                </div>
                <div className="constructor-property-row">
                  <span>Избран ръб</span>
                  <b>{selectedEdge ? ({ left: 'Ляв', right: 'Десен', top: 'Горен', bottom: 'Долен' } as const)[selectedEdge] : 'Цялата каса'}</b>
                </div>
                <div className="constructor-property-row">
                  <span>Схемна видима ширина</span>
                  <b>{Math.round(frameFaceMm)} mm · преди Profile Resolution</b>
                </div>
                <div className="constructor-property-row">
                  <span>Профилна дълбочина</span>
                  <b>Не е определена без системна семантика</b>
                </div>

                <p className="constructor-invariant-note">
                  Drag на ръб променя габарита. За точен размер въведи число и натисни Enter или излез от полето.
                  В свободна скица не се измисля профилен код или производствена геометрия.
                </p>
              </div>
            ) : (
              <div className="constructor-selection-empty">
                <span>{frame ? 'Маркирай касата или неин ръб' : 'Няма създадена каса'}</span>
                <p>
                  Frame Interior 01C.3.2 поддържа параметрична каса, реални вътрешни ПОЛЕТА и локални физически делители.
                  Делителят се мести по позиция; дължината следва ПОЛЕТО, а ширината се определя схемно/от Profile Data.
                </p>
              </div>
            )}
          </section>

          <section className="constructor-properties-section constructor-safety-card">
            <span>ТЕХНИЧЕСКА ГРАНИЦА</span>
            <b>Конструктивна скица, не машинна геометрия</b>
            <p>
              Касата, ПОЛЕТАТА и локалните делители са параметрични. Крилата, FIX семантиката,
              отварянията, профилният resolver, срезовете и машинните данни още не се генерират.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}
