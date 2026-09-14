import { useEffect, useMemo, useRef, useState } from 'react'
import { useDrawingViewport } from './useDrawingViewport'
import { createPortal } from 'react-dom'
import type { ProjectSnapshot } from '../domain/project/projectModel'
import { resolveConstructionTopology } from '../domain/construction'
import { deriveResolvedAssembly } from '../domain/assembly/resolveAssembly'
import { assessReadiness } from '../domain/assembly/assemblyReadiness'
import { selectAssemblyReview } from '../domain/assembly/assemblySelectors'
import { getProfileJointEvidenceRule } from '../data/profileSystems/jointSemantics'
import {
  getPrelude60SectionVisualEvidence,
  PRELUDE60_CATALOG_PAGE_2_IMAGE_URL,
} from '../data/profileSystems/prelude60SectionVisualEvidence'
import './AssemblyReviewPanel.css'

const gateLabels = {
  ASSEMBLY_RESOLUTION: 'Разрешаване на сглобката', BOM: 'Материална спецификация', QUOTATION: 'Ценообразуване',
  GLASS_ORDER: 'Поръчка на стъклопакети', PRODUCTION_RELEASE: 'Разрешаване за производство', MACHINE_EXPORT: 'Машинен изход',
}

function ModuleAssemblyPreview({ snapshot, moduleId }: { snapshot: ProjectSnapshot; moduleId: string }) {
  const module = snapshot.modulesById[moduleId] ?? null
  const draft = snapshot.constructionDraftsByModuleId[moduleId] ?? null
  if (!module || !draft) {
    return <section className="assembly-module-preview is-empty">
      <div><span>СХЕМА НА МОДУЛА</span><b>Няма записана конструкция</b></div>
      <p>Начертай модула в Конструктора, за да се визуализират реалните му размери и разделяне.</p>
    </section>
  }

  const frame = draft.topology?.frame ?? draft.frame
  const topology = draft.topology ? resolveConstructionTopology(draft.topology) : null
  const fields = topology?.fields ?? []
  const dividers = topology?.dividers ?? []
  const angledDividers = topology?.angledDividers ?? []
  const widthMm = Math.max(1, frame.widthMm)
  const heightMm = Math.max(1, frame.heightMm)
  const viewWidth = 760
  const viewHeight = 430
  const padLeft = 58
  const padTop = 36
  const padRight = 92
  const padBottom = 72
  const scale = Math.min(
    (viewWidth - padLeft - padRight) / widthMm,
    (viewHeight - padTop - padBottom) / heightMm,
  )
  const drawingWidth = widthMm * scale
  const drawingHeight = heightMm * scale
  const originX = padLeft + ((viewWidth - padLeft - padRight) - drawingWidth) / 2
  const originY = padTop + ((viewHeight - padTop - padBottom) - drawingHeight) / 2
  const x = (mm: number) => originX + mm * scale
  const y = (mm: number) => originY + mm * scale

  return <section className="assembly-module-preview" aria-label={`Схема на Модул ${module.sequence}`}>
    <div className="assembly-module-preview-heading">
      <div><span>СХЕМА НА МОДУЛА</span><b>Модул {module.sequence}</b></div>
      <div className="assembly-module-preview-facts">
        <span><small>Размер</small><b>{Math.round(widthMm)} × {Math.round(heightMm)} mm</b></span>
        <span><small>Полета</small><b>{fields.length || 1}</b></span>
        <span><small>Делители</small><b>{dividers.length + angledDividers.length}</b></span>
      </div>
    </div>
    <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Модул ${module.sequence}, ${Math.round(widthMm)} на ${Math.round(heightMm)} милиметра`}>
      <rect className="assembly-preview-frame" x={originX} y={originY} width={drawingWidth} height={drawingHeight} />
      {fields.map((field) => {
        const cx = x(field.bounds.xMm + field.bounds.widthMm / 2)
        const cy = y(field.bounds.yMm + field.bounds.heightMm / 2)
        return <g key={field.id}>
          {field.polygon ? (
            <polygon className="assembly-preview-field" points={field.polygon.map((point) => `${x(point.xMm)},${y(point.yMm)}`).join(' ')} />
          ) : (
            <rect className="assembly-preview-field" x={x(field.bounds.xMm)} y={y(field.bounds.yMm)} width={field.bounds.widthMm * scale} height={field.bounds.heightMm * scale} />
          )}
          <circle className="assembly-preview-field-number" cx={cx} cy={cy} r="13" />
          <text className="assembly-preview-field-number-text" x={cx} y={cy + 4} textAnchor="middle">{field.sequence}</text>
        </g>
      })}
      {dividers.map((divider) => divider.axis === 'vertical' ? (
        <rect key={divider.id} className="assembly-preview-divider" x={x(divider.positionMm)} y={y(divider.startMm)} width={Math.max(2, divider.thicknessMm * scale)} height={(divider.endMm - divider.startMm) * scale} />
      ) : (
        <rect key={divider.id} className="assembly-preview-divider" x={x(divider.startMm)} y={y(divider.positionMm)} width={(divider.endMm - divider.startMm) * scale} height={Math.max(2, divider.thicknessMm * scale)} />
      ))}
      {angledDividers.map((divider) => (
        <polygon key={divider.id} className="assembly-preview-divider" points={divider.facePolygon.map((point) => `${x(point.xMm)},${y(point.yMm)}`).join(' ')} />
      ))}

      <line className="assembly-preview-dimension" x1={originX} y1={originY + drawingHeight + 34} x2={originX + drawingWidth} y2={originY + drawingHeight + 34} />
      <line className="assembly-preview-extension" x1={originX} y1={originY + drawingHeight + 22} x2={originX} y2={originY + drawingHeight + 45} />
      <line className="assembly-preview-extension" x1={originX + drawingWidth} y1={originY + drawingHeight + 22} x2={originX + drawingWidth} y2={originY + drawingHeight + 45} />
      <text className="assembly-preview-dimension-text" x={originX + drawingWidth / 2} y={originY + drawingHeight + 29} textAnchor="middle">{Math.round(widthMm)} mm</text>

      <line className="assembly-preview-dimension" x1={originX + drawingWidth + 38} y1={originY} x2={originX + drawingWidth + 38} y2={originY + drawingHeight} />
      <line className="assembly-preview-extension" x1={originX + drawingWidth + 26} y1={originY} x2={originX + drawingWidth + 49} y2={originY} />
      <line className="assembly-preview-extension" x1={originX + drawingWidth + 26} y1={originY + drawingHeight} x2={originX + drawingWidth + 49} y2={originY + drawingHeight} />
      <text className="assembly-preview-dimension-text is-vertical" x={originX + drawingWidth + 56} y={originY + drawingHeight / 2} textAnchor="middle" transform={`rotate(-90 ${originX + drawingWidth + 56} ${originY + drawingHeight / 2})`}>{Math.round(heightMm)} mm</text>
    </svg>
    <p>Схемен изглед от реалната чернова на модула. Размерите са въведените габарити и разделяния; това не е производствено сечение и не определя размери за рязане.</p>
  </section>
}

/* MODULE ASSEMBLY SECTIONS 01A V5 */
type ModuleSectionId = 'A' | 'B'


type SectionSourceTarget = Readonly<{ roleBg: string; profileCode: string | null; noteBg?: string }>

function ProfileSketchDialog({ section, entries, selectedIndex, sourceInitially, onClose }: {
  section: ModuleSectionId
  entries: { index: number; visual: NonNullable<ReturnType<typeof getPrelude60SectionVisualEvidence>> }[]
  selectedIndex: number | null
  sourceInitially: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [source, setSource] = useState(sourceInitially)
  const drawing = useDrawingViewport(source ? 'catalogue' : 'profiles')
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  // A native modal has its own top layer, outside the scaled assembly canvas.
  // Closing it restores the unchanged section and the native focus target.
  return createPortal(<dialog ref={dialog} className="assembly-profile-sheet-dialog" aria-labelledby="profile-sheet-title"
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose() }}>
    <header className="assembly-profile-sheet-header">
      <div><span>{source ? 'КАТАЛОЖЕН ИЗТОЧНИК' : 'КАТАЛОГОВИ СКИЦИ'}</span>
        <h3 id="profile-sheet-title">{source ? 'PRELUDE 60 · страница 2' : `Сечение ${section}–${section} · избрани профили`}</h3></div>
      <button type="button" onClick={onClose}>Затвори</button>
    </header>
    <div className="assembly-profile-sheet-toolbar" aria-label="Мащаб на скиците">
      <button type="button" aria-label="Намали скиците" onClick={() => drawing.setZoom(drawing.zoom - 10)}>−</button>
      <output>{drawing.zoom}%</output>
      <button type="button" aria-label="Увеличи скиците" onClick={() => drawing.setZoom(drawing.zoom + 10)}>+</button>
      <button type="button" onClick={drawing.fitToView}>Побери</button>
      <button type="button" onClick={() => drawing.setZoom(100)}>100%</button>
      <button type="button" onClick={() => setSource(value => !value)}>{source ? 'Назад към скиците' : 'Покажи източника'}</button>
    </div>
    <div ref={drawing.viewportRef} className="assembly-profile-sheet-canvas drawing-viewport" tabIndex={0} aria-label={source ? 'Работна площ за каталожния източник' : 'Работна площ за профилните скици'}>
      <div className="drawing-scroll-space" style={drawing.spaceStyle}>
        <div className="drawing-scaled-page" style={drawing.pageStyle}>
          <div ref={drawing.canvasRef} className={source ? 'assembly-catalogue-sheet' : 'assembly-profile-sheet-grid'} style={drawing.canvasStyle}>
            {source ? <img src={PRELUDE60_CATALOG_PAGE_2_IMAGE_URL} alt="Оригинален каталог PRELUDE 60, страница 2" />
              : entries.map(({ visual, index }) => <article className={`assembly-profile-sheet-card${index === selectedIndex ? ' is-active' : ''}`} key={`${visual.profileCode}-${index}`}>
                <header><span>{visual.roleBg}</span><b>{visual.profileCode}</b></header>
                <div className="assembly-profile-sheet-image-stage"><img src={visual.imageUrl} alt={`${visual.roleBg} ${visual.profileCode} — каталожно сечение`} /></div>
              </article>)}
          </div>
        </div>
      </div>
    </div>
  </dialog>, document.body)
}

function Prelude60SectionSourceViewer({
  snapshot,
  moduleId,
  section,
  fieldId,
  fieldType,
  dividerId,
}: {
  snapshot: ProjectSnapshot
  moduleId: string
  section: ModuleSectionId
  fieldId: string | null
  fieldType: 'fixed' | 'operable' | null
  dividerId: string | null
}) {
  const [showSourcePage, setShowSourcePage] = useState(false)
  const [focusedTargetIndex, setFocusedTargetIndex] = useState<number | null>(null)
  const resolution = snapshot.profileResolutionsByModuleId[moduleId] ?? null
  const frameCode = resolution?.frame?.profileCode ?? null
  const sashCode = fieldId ? resolution?.fieldSashes[fieldId]?.profileCode ?? null : null
  const dividerCode = dividerId ? resolution?.dividers[dividerId]?.profileCode ?? null : null

  const targets: SectionSourceTarget[] = section === 'A'
    ? [
        { roleBg: 'Каса', profileCode: frameCode },
        fieldType === 'operable'
          ? { roleBg: 'Крило', profileCode: sashCode }
          : { roleBg: 'Крило', profileCode: null, noteBg: fieldType === 'fixed' ? 'Не е приложимо за фиксирано поле.' : 'Първо избери тип на полето.' },
      ]
    : [
        { roleBg: 'Каса', profileCode: frameCode },
        { roleBg: 'Делител', profileCode: dividerCode, noteBg: dividerId ? undefined : 'Линията не пресича прав делител.' },
        ...(fieldType === 'operable' ? [{ roleBg: 'Крило', profileCode: sashCode }] : []),
      ]

  const frameSashRule = resolution?.profileSystemId === 'kmg-prelude-60' && frameCode && sashCode
    ? getProfileJointEvidenceRule({
        systemId: resolution.profileSystemId,
        jointKind: 'frame-sash',
        supportProfileCode: frameCode,
        sashProfileCode: sashCode,
      })
    : undefined
  const mullionSashRule = resolution?.profileSystemId === 'kmg-prelude-60' && dividerCode && sashCode
    ? getProfileJointEvidenceRule({
        systemId: resolution.profileSystemId,
        jointKind: 'mullion-sash',
        supportProfileCode: dividerCode,
        sashProfileCode: sashCode,
      })
    : undefined
  const reviewedRule = section === 'A' ? frameSashRule : mullionSashRule ?? frameSashRule
  const linkedCount = targets.filter((target) => getPrelude60SectionVisualEvidence(target.profileCode)).length
  const hasPreludeContext = resolution?.profileSystemId === 'kmg-prelude-60'
  const focusedEntries = targets.flatMap((target, index) => {
    const visual = hasPreludeContext ? getPrelude60SectionVisualEvidence(target.profileCode) : null
    return visual ? [{ target, index, visual }] : []
  })

  const openFocusedProfile = (index: number) => { setFocusedTargetIndex(index); setShowSourcePage(false) }

  return <div className="assembly-section-source-viewer">
    <div className="assembly-section-source-toolbar">
      <div>
        <span>КАТАЛОГОВИ СЕЧЕНИЯ</span>
        <b>{hasPreludeContext ? 'PRELUDE 60 · реални профилни рисунки' : 'Източникът не е свързан с PRELUDE 60'}</b>
        <small>{linkedCount} от {targets.length} позиции имат свързана каталогова рисунка.</small>
      </div>
      {hasPreludeContext && <button type="button" onClick={() => setShowSourcePage(true)}>Покажи източника</button>}
    </div>

    <div className="assembly-section-source-canvas">
      <div className="assembly-section-source-profiles">
        {targets.map((target, index) => {
          const visual = hasPreludeContext ? getPrelude60SectionVisualEvidence(target.profileCode) : null
          return <article className={`assembly-section-source-profile${visual ? ' is-linked' : ' is-missing'}`} key={`${target.roleBg}-${index}`}>
            <header><span>{target.roleBg}</span><b>{target.profileCode ?? 'Не е избран профил'}</b></header>
            {visual ? <>
              <button type="button" className="assembly-section-source-preview" onClick={() => openFocusedProfile(index)} aria-label={`Увеличи ${visual.roleBg} ${visual.profileCode}`}>
                <div className="assembly-section-source-image-wrap"><img src={visual.imageUrl} alt={`${visual.roleBg} ${visual.profileCode} — каталогово сечение`} /></div>
                <span>Увеличи профила</span>
              </button>
            </> : <div className="assembly-section-source-missing">
              <b>{target.noteBg ?? 'Липсва свързана каталогова рисунка за текущия избор.'}</b>
              <span>Не се замества с приблизителен или автоматично избран профил.</span>
            </div>}
          </article>
        })}
      </div>
    </div>

    {(focusedTargetIndex !== null || showSourcePage) && <ProfileSketchDialog
      section={section} entries={focusedEntries} selectedIndex={focusedTargetIndex}
      sourceInitially={showSourcePage} onClose={() => { setFocusedTargetIndex(null); setShowSourcePage(false) }}
    />}

    {reviewedRule?.sashOverlapMm !== null && reviewedRule?.sashOverlapMm !== undefined ? <div className="assembly-section-reviewed-fact">
      <b>Проверено само във фронтален изглед: {reviewedRule.sashOverlapMm} mm застъпване.</b>
      <span>Тази стойност не определя отстъпите и размерите за производство.</span>
    </div> : null}

    <div className="assembly-section-not-assembled">
      <b>Това още не е физически сглобен възел.</b>
      <span>Показват се оригиналните каталогови сечения на избраните компоненти. Точният им относителен монтаж, отстъпът на стъклопакета, уплътненията, производствените отстъпи и размерите за рязане остават блокирани до проверено правило за възела.</span>
    </div>

  </div>
}

function ModuleSectionSketches({ snapshot, moduleId, selectedSection, onSectionChange }: { snapshot: ProjectSnapshot; moduleId: string; selectedSection: ModuleSectionId | null; onSectionChange: (section: ModuleSectionId | null) => void }) {
  const module = snapshot.modulesById[moduleId] ?? null
  const draft = snapshot.constructionDraftsByModuleId[moduleId] ?? null
  if (!module || !draft) return null

  const frame = draft.topology?.frame ?? draft.frame
  const topology = draft.topology ? resolveConstructionTopology(draft.topology) : null
  const fields = topology?.fields ?? []
  const dividers = topology?.dividers ?? []
  const angledDividers = topology?.angledDividers ?? []
  const widthMm = Math.max(1, frame.widthMm)
  const heightMm = Math.max(1, frame.heightMm)
  const firstField = fields[0] ?? null
  const sectionAXMm = firstField
    ? firstField.bounds.xMm + firstField.bounds.widthMm / 2
    : widthMm / 2
  const sectionBYMm = heightMm / 2

  const viewWidth = 560
  const viewHeight = 320
  const padLeft = 52
  const padTop = 36
  const padRight = 52
  const padBottom = 42
  const scale = Math.min(
    (viewWidth - padLeft - padRight) / widthMm,
    (viewHeight - padTop - padBottom) / heightMm,
  )
  const drawingWidth = widthMm * scale
  const drawingHeight = heightMm * scale
  const originX = padLeft + ((viewWidth - padLeft - padRight) - drawingWidth) / 2
  const originY = padTop + ((viewHeight - padTop - padBottom) - drawingHeight) / 2
  const x = (mm: number) => originX + mm * scale
  const y = (mm: number) => originY + mm * scale
  const sectionAX = x(sectionAXMm)
  const sectionBY = y(sectionBYMm)
  const openSection = (section: ModuleSectionId) => onSectionChange(section)
  const closeSection = () => onSectionChange(null)

  if (selectedSection) {
    const isA = selectedSection === 'A'
    const sectionName = isA ? 'A–A' : 'B–B'
    const sectionTitle = isA ? 'Вертикално сечение' : 'Хоризонтално сечение'
    const sectionPosition = isA
      ? `${Math.round(sectionAXMm)} mm отляво`
      : `${Math.round(sectionBYMm)} mm отгоре`
    const sectionContext = isA ? `През Поле ${firstField?.sequence ?? 1}` : 'През целия модул'

    return <section className="assembly-section-detail-workspace" aria-label={`Сечение ${sectionName} на Модул ${module.sequence}`}>
      <header className="assembly-section-detail-heading">
        <div>
          <span>СЕЧЕНИЕ НА МОДУЛА</span>
          <b>Сечение {sectionName}</b>
          <small>{sectionTitle} · {sectionContext} · {sectionPosition}</small>
        </div>
        <button type="button" onClick={closeSection}>Назад към схемата</button>
      </header>

      <div className="assembly-section-detail-layout">
        <article className="assembly-section-detail-key">
          <div className="assembly-section-card-title"><span>ОРИЕНТАЦИЯ</span><b>Къде е сечението</b></div>
          <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Ориентация на сечение ${sectionName}`}>
            <rect className="assembly-section-key-frame" x={originX} y={originY} width={drawingWidth} height={drawingHeight} />
            {fields.map((field) => field.polygon ? (
              <polygon key={field.id} className="assembly-section-key-field" points={field.polygon.map((point) => `${x(point.xMm)},${y(point.yMm)}`).join(' ')} />
            ) : (
              <rect key={field.id} className="assembly-section-key-field" x={x(field.bounds.xMm)} y={y(field.bounds.yMm)} width={field.bounds.widthMm * scale} height={field.bounds.heightMm * scale} />
            ))}
            {dividers.map((divider) => divider.axis === 'vertical' ? (
              <rect key={divider.id} className="assembly-section-key-divider" x={x(divider.positionMm)} y={y(divider.startMm)} width={Math.max(2, divider.thicknessMm * scale)} height={(divider.endMm - divider.startMm) * scale} />
            ) : (
              <rect key={divider.id} className="assembly-section-key-divider" x={x(divider.startMm)} y={y(divider.positionMm)} width={(divider.endMm - divider.startMm) * scale} height={Math.max(2, divider.thicknessMm * scale)} />
            ))}
            {isA ? <>
              <line className="assembly-section-cut-line" x1={sectionAX} y1={originY - 16} x2={sectionAX} y2={originY + drawingHeight + 16} />
              <circle className="assembly-section-cut-badge" cx={sectionAX} cy={originY - 22} r="14" />
              <circle className="assembly-section-cut-badge" cx={sectionAX} cy={originY + drawingHeight + 22} r="14" />
              <text className="assembly-section-cut-label" x={sectionAX} y={originY - 18} textAnchor="middle">A</text>
              <text className="assembly-section-cut-label" x={sectionAX} y={originY + drawingHeight + 26} textAnchor="middle">A</text>
            </> : <>
              <line className="assembly-section-cut-line is-secondary" x1={originX - 16} y1={sectionBY} x2={originX + drawingWidth + 16} y2={sectionBY} />
              <circle className="assembly-section-cut-badge is-secondary" cx={originX - 22} cy={sectionBY} r="14" />
              <circle className="assembly-section-cut-badge is-secondary" cx={originX + drawingWidth + 22} cy={sectionBY} r="14" />
              <text className="assembly-section-cut-label" x={originX - 22} y={sectionBY + 4} textAnchor="middle">B</text>
              <text className="assembly-section-cut-label" x={originX + drawingWidth + 22} y={sectionBY + 4} textAnchor="middle">B</text>
            </>}
          </svg>
          <dl className="assembly-section-detail-facts">
            <div><dt>Модул</dt><dd>{module.sequence}</dd></div>
            <div><dt>Размер</dt><dd>{Math.round(widthMm)} × {Math.round(heightMm)} mm</dd></div>
            <div><dt>Позиция</dt><dd>{sectionPosition}</dd></div>
          </dl>
        </article>

        <article className="assembly-section-detail-main">
          <header><div><span>ТЕХНИЧЕСКО СЕЧЕНИЕ</span><b>{sectionName} · {sectionTitle}</b></div><em>НЯМА ПОТВЪРДЕНО СЕЧЕНИЕ</em></header>
          <div className="assembly-section-detail-canvas" aria-label={`Каталогови профилни сечения за ${sectionName}`}>
            <Prelude60SectionSourceViewer
              snapshot={snapshot}
              moduleId={moduleId}
              section={selectedSection}
              fieldId={firstField?.id ?? null}
              fieldType={firstField?.fieldType ?? null}
              dividerId={dividers[0]?.id ?? null}
            />
          </div>
          <p className="assembly-section-detail-note"><b>Каталогово доказателство, не производствен възел:</b> реалните рисунки на отделните профили са от източника. FacadeFlow не ги сглобява геометрично, докато няма проверено правило за конкретния възел.</p>
        </article>
      </div>
    </section>
  }

  return <section className="assembly-section-workspace" aria-label={`Сечения на Модул ${module.sequence}`}>
    <div className="assembly-section-workspace-heading">
      <div><span>СЕЧЕНИЯ НА МОДУЛА</span><b>Схема на местата + технически сечения</b></div>
      <small>Модул {module.sequence} · {Math.round(widthMm)} × {Math.round(heightMm)} mm</small>
    </div>

    <div className="assembly-section-layout">
      <article className="assembly-section-key-card">
        <div className="assembly-section-card-title">
          <span>КЛЮЧОВА СХЕМА</span>
          <b>Къде минават сеченията</b>
        </div>
        <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Ключова схема на сеченията за Модул ${module.sequence}`}>
          <rect className="assembly-section-key-frame" x={originX} y={originY} width={drawingWidth} height={drawingHeight} />
          {fields.map((field) => field.polygon ? (
            <polygon key={field.id} className="assembly-section-key-field" points={field.polygon.map((point) => `${x(point.xMm)},${y(point.yMm)}`).join(' ')} />
          ) : (
            <rect key={field.id} className="assembly-section-key-field" x={x(field.bounds.xMm)} y={y(field.bounds.yMm)} width={field.bounds.widthMm * scale} height={field.bounds.heightMm * scale} />
          ))}
          {dividers.map((divider) => divider.axis === 'vertical' ? (
            <rect key={divider.id} className="assembly-section-key-divider" x={x(divider.positionMm)} y={y(divider.startMm)} width={Math.max(2, divider.thicknessMm * scale)} height={(divider.endMm - divider.startMm) * scale} />
          ) : (
            <rect key={divider.id} className="assembly-section-key-divider" x={x(divider.startMm)} y={y(divider.positionMm)} width={(divider.endMm - divider.startMm) * scale} height={Math.max(2, divider.thicknessMm * scale)} />
          ))}
          {angledDividers.map((divider) => (
            <polygon key={divider.id} className="assembly-section-key-divider" points={divider.facePolygon.map((point) => `${x(point.xMm)},${y(point.yMm)}`).join(' ')} />
          ))}

          <line className="assembly-section-cut-line" x1={sectionAX} y1={originY - 16} x2={sectionAX} y2={originY + drawingHeight + 16} />
          <circle className="assembly-section-cut-badge" cx={sectionAX} cy={originY - 22} r="14" />
          <circle className="assembly-section-cut-badge" cx={sectionAX} cy={originY + drawingHeight + 22} r="14" />
          <text className="assembly-section-cut-label" x={sectionAX} y={originY - 18} textAnchor="middle">A</text>
          <text className="assembly-section-cut-label" x={sectionAX} y={originY + drawingHeight + 26} textAnchor="middle">A</text>

          <line className="assembly-section-cut-line is-secondary" x1={originX - 16} y1={sectionBY} x2={originX + drawingWidth + 16} y2={sectionBY} />
          <circle className="assembly-section-cut-badge is-secondary" cx={originX - 22} cy={sectionBY} r="14" />
          <circle className="assembly-section-cut-badge is-secondary" cx={originX + drawingWidth + 22} cy={sectionBY} r="14" />
          <text className="assembly-section-cut-label" x={originX - 22} y={sectionBY + 4} textAnchor="middle">B</text>
          <text className="assembly-section-cut-label" x={originX + drawingWidth + 22} y={sectionBY + 4} textAnchor="middle">B</text>
        </svg>
        <p>Линиите A–A и B–B са изведени от реалната геометрия на модула и служат само за ориентация на сечението.</p>
      </article>

      <div className="assembly-section-cards">
        <article className="assembly-section-card">
          <header><span>A–A</span><div><b>Вертикално сечение</b><small>През Поле {firstField?.sequence ?? 1} · позиция {Math.round(sectionAXMm)} mm отляво</small></div></header>
          <div className="assembly-section-sketch is-vertical" aria-label="Схематична скица на вертикално сечение A-A">
            <svg viewBox="0 0 340 150" role="img">
              <line x1="170" y1="18" x2="170" y2="132" />
              <path d="M128 34 H212 M128 75 H212 M128 116 H212" />
              <circle cx="170" cy="22" r="13" /><circle cx="170" cy="128" r="13" />
              <text x="170" y="26" textAnchor="middle">A</text><text x="170" y="132" textAnchor="middle">A</text>
            </svg>
            <div><strong>Техническо сечение</strong><p>Няма потвърдено каталожно сечение за тази позиция.</p><button type="button" className="assembly-section-open" onClick={() => openSection('A')}>Отвори сечение A–A</button></div>
          </div>
        </article>

        <article className="assembly-section-card">
          <header><span>B–B</span><div><b>Хоризонтално сечение</b><small>През модула · позиция {Math.round(sectionBYMm)} mm отгоре</small></div></header>
          <div className="assembly-section-sketch is-horizontal" aria-label="Схематична скица на хоризонтално сечение B-B">
            <svg viewBox="0 0 340 150" role="img">
              <line x1="48" y1="75" x2="292" y2="75" />
              <path d="M92 42 V108 M170 42 V108 M248 42 V108" />
              <circle cx="52" cy="75" r="13" /><circle cx="288" cy="75" r="13" />
              <text x="52" y="79" textAnchor="middle">B</text><text x="288" y="79" textAnchor="middle">B</text>
            </svg>
            <div><strong>Техническо сечение</strong><p>Няма потвърдено каталожно сечение за тази позиция.</p><button type="button" className="assembly-section-open" onClick={() => openSection('B')}>Отвори сечение B–B</button></div>
          </div>
        </article>
      </div>
    </div>

    <p className="assembly-section-boundary"><b>Важно:</b> схемите показват къде се взема сечението. Реален контур на каса, крило, делител, стъклопакет и размери на възела ще се показват само когато са свързани с потвърден каталожен източник. Не се измисля производствена геометрия.</p>
  </section>
}

/** Read-only by construction: no edit/save/confirm callbacks; baseline rules only. */
export function AssemblyReviewPanel({ snapshot, moduleId }: { snapshot: ProjectSnapshot; moduleId: string | null }) {
  const [open, setOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<ModuleSectionId | null>(null)
  const drawing = useDrawingViewport(`${open}-${moduleId}-${selectedSection}`)
  useEffect(() => { setSelectedSection(null) }, [moduleId])
  const activeModule = moduleId ? snapshot.modulesById[moduleId] ?? null : null
  const dialog = useRef<HTMLElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const result = useMemo(() => {
    if (!open || !moduleId) return null
    const assembly = deriveResolvedAssembly(snapshot, moduleId)
    return { assembly, review: selectAssemblyReview(assembly), gates: assessReadiness(assembly, snapshot) }
  }, [open, snapshot, moduleId])
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
    <button ref={launcher} type="button" className="assembly-review-launcher" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} aria-label="Преглед на сглобката">{activeModule ? `Сглобка и сечения · Модул ${activeModule.sequence}` : 'Сглобка и сечения'}</button>
    {open && createPortal(
      <div
        className="assembly-review-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}
      >
        <section
          ref={dialog}
          className="assembly-review-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assembly-review-title"
          tabIndex={-1}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            }
          }}
        >
      <header><div><h2 id="assembly-review-title">{activeModule ? `Сглобка на Модул ${activeModule.sequence}` : 'Сглобка на модула'}</h2><p>Технически преглед · схема, сглобка и сечения</p></div><button type="button" onClick={() => setOpen(false)}>Затвори</button></header>
      <p className="assembly-review-boundary">Няма потвърдено производствено сечение. Прегледът не разрешава производство.</p>
      {!result ? <p>Избери модул в Конструктора, за да прегледаш сглобката.</p> : <>
        <div className="assembly-review-viewbar" aria-label="Управление на изгледа">
          <div><span>ИЗГЛЕД</span><b>Схема и сечения</b></div>
          <div className="assembly-review-zoom-controls">
            <button type="button" aria-label="Намали изгледа" onClick={() => drawing.setZoom(drawing.zoom - 10)}>−</button>
            <output aria-live="polite">{drawing.zoom}%</output>
            <button type="button" aria-label="Увеличи изгледа" onClick={() => drawing.setZoom(drawing.zoom + 10)}>+</button>
            <button type="button" onClick={drawing.fitToView}>Побери</button>
            <button type="button" onClick={() => drawing.setZoom(100)}>100%</button>
          </div>
        </div>
        <div ref={drawing.viewportRef} className="assembly-review-drawing-viewport drawing-viewport" tabIndex={0} aria-label="Работна площ за схема и сечения">
          <div className="drawing-scroll-space" style={drawing.spaceStyle}>
            <div className="drawing-scaled-page" style={drawing.pageStyle}>
              <div ref={drawing.canvasRef} className={`assembly-review-drawing-canvas ${selectedSection ? 'is-section-detail' : 'is-overview'}`} style={drawing.canvasStyle}>
                {activeModule && !selectedSection && <ModuleAssemblyPreview snapshot={snapshot} moduleId={activeModule.id} />}
                {activeModule && <ModuleSectionSketches snapshot={snapshot} moduleId={activeModule.id} selectedSection={selectedSection} onSectionChange={setSelectedSection} />}
              </div>
            </div>
          </div>
        </div>
        <details className="assembly-review-checks"><summary>Техническа проверка · {result.review.unresolved.length} неизпълнени изисквания</summary><div className="assembly-review-checks-content">
        <div className="assembly-review-summary" role="status"><strong>{result.review.supportLabel}</strong><span>{result.review.coverageLabel} · Блокирано</span></div>
        <p className="assembly-review-source">Текуща чернова · {result.gates[0].freshness === 'current' ? 'Актуални зависимости' : 'Зависимостите изискват нов преглед'}</p>
        {result.review.contextBlockers.map((b) => <div key={b.id} className="assembly-review-blocker"><b>{b.messageBg}</b><p>{b.nextStepBg}</p></div>)}
        <h3>Неизпълнени изисквания ({result.review.unresolved.length})</h3>
        <p>Позициите за профилни членове са моделни роли. Те не са детайли за рязане или количества за поръчка.</p>
        <ul className="assembly-review-requirements">{result.review.unresolved.map(({ requirement, targetLabel, blockers }) => <li key={requirement.id}>
          <small>{targetLabel} · {requirement.requiredBy.includes('ASSEMBLY_RESOLUTION') ? 'Блокира сглобката' : 'По-късен етап'}</small>
          <b>{requirement.labelBg}</b>
          {blockers.map((b) => <p key={b.id}>{b.nextStepBg}</p>)}
        </li>)}</ul>
        <details><summary>Налични входни и ограничени каталогови факти ({result.review.known.length})</summary><ul>{result.review.known.map((r) => <li key={r.id}>{r.labelBg}{r.satisfaction.status === 'resolved' && typeof r.satisfaction.value === 'number' ? `: ${r.satisfaction.value} mm` : ''}</li>)}</ul></details>
        <h3>Готовност по дейности</h3><ul className="assembly-review-gates">{result.gates.map((g) => <li key={g.gate}><span>{gateLabels[g.gate]}</span><b>Блокирано</b><small>{g.gate === 'ASSEMBLY_RESOLUTION' ? 'Липсват проверени технически правила.' : 'Бъдещ етап — още не е активиран.'}</small></li>)}</ul>
        </div></details>
      </>}
            </section>
      </div>,
      document.body,
    )}
  </>
}
