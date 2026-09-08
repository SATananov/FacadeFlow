import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './ConstructorShell.css'

export type ConstructorMode = 'offer' | 'free'

export type ConstructorDraftSnapshot = {
  version: 'constructor-01b'
  frame: {
    xMm: number
    yMm: number
    widthMm: number
    heightMm: number
  }
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

type ConstructorShellProps = {
  mode: ConstructorMode
  moduleNumber?: number
  offerContext?: ConstructorOfferContext
  moduleSummary?: ConstructorModuleSummary
  initialDraft?: ConstructorDraftSnapshot | null
  onDraftChange?: (draft: ConstructorDraftSnapshot | null) => void
  onModuleSizeChange?: (size: ConstructorModuleSize) => void
  onClose: () => void
  onCreateOfferFromSketch?: (draft: ConstructorDraftSnapshot | null) => void
}

type ConstructorTool = 'select' | 'pan' | 'frame'
type FrameEdge = 'left' | 'right' | 'top' | 'bottom'

type FrameModel = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

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

function frameToSnapshot(frame: FrameModel): ConstructorDraftSnapshot {
  return {
    version: 'constructor-01b',
    frame: { ...frame },
  }
}

export default function ConstructorShell({
  mode,
  moduleNumber = 1,
  offerContext,
  moduleSummary = FREE_MODULE_SUMMARY,
  initialDraft,
  onDraftChange,
  onModuleSizeChange,
  onClose,
  onCreateOfferFromSketch,
}: ConstructorShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<ConstructorTool>('select')
  const [gridVisible, setGridVisible] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [zoom, setZoom] = useState<number>(100)
  const [frame, setFrame] = useState<FrameModel | null>(() =>
    getInitialFrame(initialDraft, moduleSummary),
  )
  const [selectedEdge, setSelectedEdge] = useState<FrameEdge | null>(null)
  const [frameSelected, setFrameSelected] = useState(Boolean(frame))
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [cursorPoint, setCursorPoint] = useState<CanvasPoint | null>(null)
  const [widthDraft, setWidthDraft] = useState(() =>
    frame ? String(Math.round(frame.widthMm)) : '',
  )
  const [heightDraft, setHeightDraft] = useState(() =>
    frame ? String(Math.round(frame.heightMm)) : '',
  )

  const isFreeMode = mode === 'free'
  const pxPerMm = BASE_PX_PER_MM * (zoom / 100)
  const displayedFrame = dragState?.kind === 'create' ? dragState.preview : frame
  const moduleSizeLabel = displayedFrame
    ? `${Math.round(displayedFrame.widthMm)} × ${Math.round(displayedFrame.heightMm)} mm`
    : 'Размерите още не са зададени'

  const title = isFreeMode ? 'Свободна скица' : `Модул ${moduleNumber}`

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

  const broadcastFrame = (nextFrame: FrameModel) => {
    setFrame(nextFrame)
    setWidthDraft(String(Math.round(nextFrame.widthMm)))
    setHeightDraft(String(Math.round(nextFrame.heightMm)))

    if (isFreeMode) {
      onDraftChange?.(frameToSnapshot(nextFrame))
      return
    }

    onModuleSizeChange?.({
      widthMm: Math.round(nextFrame.widthMm),
      heightMm: Math.round(nextFrame.heightMm),
    })
  }

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
      setSelectedEdge(null)
      return
    }

    if (activeTool === 'select' && event.target === event.currentTarget) {
      setFrameSelected(false)
      setSelectedEdge(null)
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

    const { original, edge } = dragState
    let nextFrame = original

    if (edge === 'right') {
      nextFrame = {
        ...original,
        widthMm: clamp(point.xMm - original.xMm, MIN_FRAME_MM, MAX_WORLD_MM),
      }
    }

    if (edge === 'left') {
      const rightMm = original.xMm + original.widthMm
      const nextX = clamp(point.xMm, 0, rightMm - MIN_FRAME_MM)
      nextFrame = {
        ...original,
        xMm: nextX,
        widthMm: rightMm - nextX,
      }
    }

    if (edge === 'bottom') {
      nextFrame = {
        ...original,
        heightMm: clamp(point.yMm - original.yMm, MIN_FRAME_MM, MAX_WORLD_MM),
      }
    }

    if (edge === 'top') {
      const bottomMm = original.yMm + original.heightMm
      const nextY = clamp(point.yMm, 0, bottomMm - MIN_FRAME_MM)
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
        })
        setFrameSelected(true)
        setActiveTool('select')
      }
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
    if (!frame || activeTool !== 'select') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    canvasRef.current?.setPointerCapture(event.pointerId)
    setFrameSelected(true)
    setSelectedEdge(edge)
    setDragState({
      kind: 'resize',
      pointerId: event.pointerId,
      edge,
      original: { ...frame },
    })
  }

  const commitNumericDimension = (dimension: 'widthMm' | 'heightMm') => {
    if (!frame) {
      return
    }

    const draft = dimension === 'widthMm' ? widthDraft : heightDraft
    const value = Number(draft.trim())

    if (!Number.isFinite(value) || value < MIN_FRAME_MM) {
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
    })
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
    if (frame) {
      setActiveTool('select')
      setFrameSelected(true)
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
    <section className="constructor-shell" aria-label={`FacadeFlow Constructor · ${title}`}>
      <header className="constructor-topbar">
        <div className="constructor-title-block">
          <button type="button" className="constructor-back" onClick={onClose}>
            {isFreeMode ? '← Към началото' : '← Към офертата'}
          </button>

          <div>
            <div className="constructor-context-breadcrumb" aria-label="Работен контекст">
              {isFreeMode ? (
                <>Начало <i>›</i> Конструктор <i>›</i> <strong>Свободна скица</strong></>
              ) : (
                <>Оферта <i>›</i> <strong>Модул {moduleNumber}</strong> <i>›</i> Конструктор</>
              )}
            </div>
            <span>FACADEFLOW CONSTRUCTOR · CONSTRUCTOR 01B</span>
            <h2>{title}</h2>
            <p>
              {isFreeMode
                ? 'Свободна параметрична скица. Начертай касата с мишката; система може да бъде приложена по-късно.'
                : 'Параметрична каса с точни размери, селекция на ръбове и mouse resize.'}
            </p>
          </div>
        </div>

        <div className="constructor-topbar-meta" aria-label="Контекст на конструктора">
          <div className="constructor-context-card">
            <span>КОНТЕКСТ</span>
            <b>
              {isFreeMode
                ? 'Свободна скица · Модул —'
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
              className={activeTool === 'frame' ? 'is-active' : ''}
              onClick={activateFrameTool}
            >
              <span className="constructor-tool-glyph">▣</span>
              <span>
                <b>Каса / рамка</b>
                <small>{frame ? 'Касата е създадена' : 'Изтегли с мишката'}</small>
              </span>
            </button>

            <button type="button" disabled>
              <span className="constructor-tool-glyph">│</span>
              <span>
                <b>Вертикален делител</b>
                <small>Constructor 01C</small>
              </span>
            </button>

            <button type="button" disabled>
              <span className="constructor-tool-glyph">─</span>
              <span>
                <b>Хоризонтален делител</b>
                <small>Constructor 01C</small>
              </span>
            </button>

            <button type="button" disabled>
              <span className="constructor-tool-glyph">□</span>
              <span>
                <b>Фиксирано поле</b>
                <small>Constructor 01D</small>
              </span>
            </button>

            <button type="button" disabled>
              <span className="constructor-tool-glyph">◩</span>
              <span>
                <b>Отваряемо поле</b>
                <small>Constructor 01D</small>
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
            <button type="button" disabled>↶ Undo</button>
            <button type="button" disabled>↷ Redo</button>
          </div>
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
            className={`constructor-canvas${gridVisible ? ' has-grid' : ''}${activeTool === 'frame' ? ' is-frame-tool' : ''}`}
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
                ? 'СВОБОДНА СКИЦА · БЕЗ МОДУЛ'
                : `ОФЕРТА · МОДУЛ ${String(moduleNumber).padStart(2, '0')}`}
            </div>

            {!displayedFrame && (
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
                  '--constructor-frame-face': `${Math.max(12, 18 * (zoom / 100))}px`,
                } as CSSProperties}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  if (activeTool === 'select' && frame) {
                    setFrameSelected(true)
                    setSelectedEdge(null)
                  }
                }}
              >
                <div className="constructor-frame-visual" aria-hidden="true" />

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

          <footer className="constructor-statusbar">
            <span>
              ИНСТРУМЕНТ:{' '}
              {activeTool === 'select' ? 'Селекция' : activeTool === 'pan' ? 'Панорама' : 'Каса / рамка'}
            </span>
            <span>X: {cursorPoint ? Math.round(cursorPoint.xMm) : '—'} mm</span>
            <span>Y: {cursorPoint ? Math.round(cursorPoint.yMm) : '—'} mm</span>
            <span>GRID: {gridVisible ? `${GRID_STEP_MM} mm` : 'OFF'}</span>
            <span>SNAP: {snapEnabled ? `${SNAP_STEP_MM} mm` : 'OFF'}</span>
            <span>ZOOM: {zoom}%</span>
          </footer>
        </section>

        <aside className="constructor-properties-panel" aria-label="Свойства и настройки">
          {isFreeMode ? (
            <section className="constructor-properties-section constructor-free-context">
              <div className="constructor-panel-heading">
                <span>СВОБОДНА СКИЦА</span>
                <b>Без оферта и без заключена система</b>
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
                  onClick={() => onCreateOfferFromSketch(frame ? frameToSnapshot(frame) : null)}
                >
                  Създай оферта от тази скица
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
              <b>{frameSelected && frame ? 'Каса / рамка' : 'Избран елемент'}</b>
            </div>

            {frameSelected && frame ? (
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
                  <span>Видима ширина</span>
                  <b>Концептуална визуализация</b>
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
                  Constructor 01B поддържа параметрична каса, live размери и resize
                  през ляв, десен, горен и долен ръб.
                </p>
              </div>
            )}
          </section>

          <section className="constructor-properties-section constructor-safety-card">
            <span>ТЕХНИЧЕСКА ГРАНИЦА</span>
            <b>Конструктивна скица, не машинна геометрия</b>
            <p>
              Касата и габаритът са параметрични. Делители, крила, профилен избор,
              срезове и машинни данни още не се генерират.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}
