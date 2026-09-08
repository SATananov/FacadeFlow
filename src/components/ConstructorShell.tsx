import { useState, type CSSProperties } from 'react'
import './ConstructorShell.css'

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

type ConstructorShellProps = {
  moduleNumber: number
  offerContext: ConstructorOfferContext
  moduleSummary: ConstructorModuleSummary
  onClose: () => void
}

type ConstructorTool = 'select' | 'pan'

const ZOOM_STEPS = [75, 100, 125, 150] as const

function clampZoom(current: number, direction: -1 | 1) {
  const currentIndex = ZOOM_STEPS.findIndex((value) => value === current)
  const safeIndex = currentIndex >= 0 ? currentIndex : 1
  const nextIndex = Math.min(
    ZOOM_STEPS.length - 1,
    Math.max(0, safeIndex + direction),
  )

  return ZOOM_STEPS[nextIndex]
}

export default function ConstructorShell({
  moduleNumber,
  offerContext,
  moduleSummary,
  onClose,
}: ConstructorShellProps) {
  const [activeTool, setActiveTool] = useState<ConstructorTool>('select')
  const [gridVisible, setGridVisible] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [zoom, setZoom] = useState<number>(100)

  const moduleSizeLabel =
    moduleSummary.widthMm && moduleSummary.heightMm
      ? `${moduleSummary.widthMm} × ${moduleSummary.heightMm} mm`
      : 'Размерите още не са зададени'

  return (
    <section className="constructor-shell" aria-label={`Конструктор за Модул ${moduleNumber}`}>
      <header className="constructor-topbar">
        <div className="constructor-title-block">
          <button type="button" className="constructor-back" onClick={onClose}>
            ← Към офертата
          </button>

          <div>
            <span>FACADEFLOW CONSTRUCTOR · CONSTRUCTOR 01A</span>
            <h2>Модул {moduleNumber}</h2>
            <p>
              CAD-подобно работно пространство за визуално конструиране на изделието.
            </p>
          </div>
        </div>

        <div className="constructor-topbar-meta" aria-label="Контекст на модула">
          <div>
            <span>ТИП</span>
            <b>{moduleSummary.productTypeLabel}</b>
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
          <button
            type="button"
            disabled
            title="Ще бъде активирано в следващ етап"
          >
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
                <small>Маркирай елемент</small>
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

            <button type="button" disabled>
              <span className="constructor-tool-glyph">▣</span>
              <span>
                <b>Каса / рамка</b>
                <small>Constructor 01B</small>
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
            <span>0</span><span>500</span><span>1000</span><span>1500</span><span>2000</span>
          </div>

          <div className="constructor-ruler constructor-ruler-left" aria-hidden="true">
            <span>0</span><span>500</span><span>1000</span><span>1500</span>
          </div>

          <div
            className={`constructor-canvas${gridVisible ? ' has-grid' : ''}`}
            style={{
              '--constructor-grid-step': `${20 * (zoom / 100)}px`,
              '--constructor-major-grid-step': `${100 * (zoom / 100)}px`,
            } as CSSProperties}
          >
            <div
              className="constructor-empty-stage"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="constructor-empty-stage-frame" aria-hidden="true" />
              <span>МОДУЛ {String(moduleNumber).padStart(2, '0')}</span>
              <b>{moduleSizeLabel}</b>
              <p>
                Работното поле е готово. Параметричната каса, селекцията на линии,
                drag/resize и live размерите започват в Constructor 01B.
              </p>
            </div>
          </div>

          <footer className="constructor-statusbar">
            <span>ИНСТРУМЕНТ: {activeTool === 'select' ? 'Селекция' : 'Панорама'}</span>
            <span>X: — mm</span>
            <span>Y: — mm</span>
            <span>GRID: {gridVisible ? '10 mm' : 'OFF'}</span>
            <span>SNAP: {snapEnabled ? 'ON' : 'OFF'}</span>
            <span>ZOOM: {zoom}%</span>
          </footer>
        </section>

        <aside className="constructor-properties-panel" aria-label="Свойства и настройки">
          <section className="constructor-properties-section">
            <div className="constructor-panel-heading">
              <span>ОФЕРТА</span>
              <b>Заключени общи настройки</b>
            </div>

            <div className="constructor-offer-locks">
              <div><span>Профилна система</span><b>{offerContext.profileSystemLabel}</b><em>🔒</em></div>
              <div><span>Цвят</span><b>{offerContext.colorLabel}</b><em>🔒</em></div>
              <div><span>Фолиране</span><b>{offerContext.foilModeLabel}</b><em>🔒</em></div>
              <div><span>Стъклопакет</span><b>{offerContext.glazingLabel}</b><em>🔒</em></div>
              <div><span>Обков</span><b>{offerContext.hardwareLabel}</b><em>🔒</em></div>
            </div>

            <p className="constructor-invariant-note">
              Тези стойности важат за всички модули в тази оферта и не се променят
              от Конструктора.
            </p>
          </section>

          <section className="constructor-properties-section">
            <div className="constructor-panel-heading">
              <span>СВОЙСТВА</span>
              <b>Избран елемент</b>
            </div>

            <div className="constructor-selection-empty">
              <span>Няма избран елемент</span>
              <p>
                В Constructor 01B тук ще се показват размер, позиция, видима ширина,
                дълбочина и други свойства на маркираната геометрия.
              </p>
            </div>
          </section>

          <section className="constructor-properties-section constructor-boundary-card">
            <span>CONSTRUCTOR 01A</span>
            <b>Shell only</b>
            <p>
              Grid, панели и workspace са активни. Автоматична геометрия, профилен
              избор и машинни данни не се генерират.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}
