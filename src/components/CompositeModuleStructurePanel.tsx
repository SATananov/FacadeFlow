import { useState } from 'react'
import { getProfileSystemById } from '../data/profileSystems/catalog'
import type { CompositeFramePart, CompositeModuleStructure, FrameSides } from '../domain/compositeModuleStructure'
import type { CurrentCompositeModuleStructure } from '../domain/compositeModuleStructure'
import {
  addCompositeFramePart, compositeDraftProblem, compositeFrameCandidates,
  connectCompositeParts, emptyCompositeDraft, removeCompositeFramePart,
  openCompositeDraft, orderedCompositeParts, placeCompositePart, moveCompositePart,
} from './compositeModuleStructureDraft'
import './CompositeModuleStructurePanel.css'

const sides: readonly { key: keyof FrameSides; label: string }[] = [
  { key: 'top', label: 'Горе' }, { key: 'right', label: 'Дясно' },
  { key: 'bottom', label: 'Долу' }, { key: 'left', label: 'Ляво' },
]
const functionLabel = (value: CompositeFramePart['function']) => value === 'window' ? 'Прозорец' : value === 'door' ? 'Врата' : 'Не е избрана функция'
const dimensionLabel = (value: number) => Number.isFinite(value) && value > 0 ? String(value) : 'не е въведено'

export type CompositeModuleStructurePanelProps = {
  moduleNumber: number
  systemId: string
  initialValue: CompositeModuleStructure | null
  onSave: (value: CompositeModuleStructure, expected: CompositeModuleStructure | null) => string | null
  onCancel: () => void
}

export function CompositeModuleStructurePanel({ moduleNumber, systemId, initialValue, onSave, onCancel }: CompositeModuleStructurePanelProps) {
  const [baseline] = useState(() => structuredClone(initialValue))
  const [draft, setDraft] = useState<CurrentCompositeModuleStructure>(() => baseline
    ? openCompositeDraft(baseline) : { ...emptyCompositeDraft(), systemId })
  const [fromPartId, setFromPartId] = useState('')
  const [toPartId, setToPartId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const candidates = compositeFrameCandidates(draft.systemId)
  const problem = draft.systemId !== systemId ? 'Системата на модула е променена. Откажи и отвори структурата отново.' : compositeDraftProblem(draft)
  const partLabel = (id: string) => `Рамкова част ${draft.frameParts.findIndex((part) => part.id === id) + 1}`
  const orderedParts = orderedCompositeParts(draft)
  const placementUnresolved = draft.frameParts.some((part) => part.placement.order === null || part.placement.verticalAlignment === null)
  const alignmentLabel = (part: CompositeFramePart) => part.placement.verticalAlignment === 'TOP' ? 'Горе' : part.placement.verticalAlignment === 'BOTTOM' ? 'Долу' : 'Не е определено'

  const updateDraft = (next: CurrentCompositeModuleStructure) => { setDraft(next); setError(null); setNotice('') }
  const updatePart = (id: string, patch: Partial<Pick<CompositeFramePart, 'function' | 'widthMm' | 'heightMm' | 'frameProfileCode' | 'frameSides' | 'placement'>>) => {
    updateDraft({ ...draft, frameParts: draft.frameParts.map((part) => part.id === id ? { ...part, ...patch } : part) })
  }
  const removePart = (id: string) => {
    updateDraft(removeCompositeFramePart(draft, id))
    if (fromPartId === id) setFromPartId('')
    if (toPartId === id) setToPartId('')
    setNotice('Рамковата част и връзките към нея са премахнати.')
  }
  const addConnection = () => {
    const result = connectCompositeParts(draft, globalThis.crypto.randomUUID(), fromPartId, toPartId)
    setError(result.error)
    setNotice('')
    if (!result.error) {
      setDraft(result.draft)
      setFromPartId('')
      setToPartId('')
      setNotice('Добавена е връзка „Нулев делител“.')
    }
  }

  return (
    <section className="product-section-page composite-structure" aria-labelledby="composite-title">
      <div className="product-section-panel">
        <span className="product-section-eyebrow">РЪЧНО ОПИСАНИЕ</span>
        <h2 id="composite-title">Структура на Модул {moduleNumber}</h2>
        <p>Редактираш структурата на Модул {moduleNumber}. Добави рамкови части и опиши връзките между тях.</p>
        <p className="composite-draft-note">Промените се записват в проекта само с „Запази“. „Откажи“ запазва предишната структура.</p>
        <div className="composite-editor-actions">
          <button type="button" className="composite-primary" disabled={Boolean(problem)} onClick={() => {
            const validation = compositeDraftProblem(draft)
            if (draft.systemId !== systemId || validation) { setError(validation ?? 'Системата на структурата не съвпада с модула.'); return }
            const failure = onSave(draft, baseline)
            if (failure) setError(failure)
            else onCancel()
          }}>Запази</button>
          <button type="button" onClick={onCancel}>Откажи</button>
        </div>
        {error && <p className="composite-error" role="alert">{error}</p>}
        <p className="composite-boundary">Само структурно описание. Съвместимостта между касите изисква човешка проверка. Точната геометрия на връзката не е определена. Не се изчисляват срезове, застъпвания или отстъпи.</p>

        <div className="composite-system">
          <label htmlFor="composite-system">1. Система на модула</label>
          <input id="composite-system" readOnly value={getProfileSystemById(systemId)?.name ?? 'Не е избрана'} />
          <p>{systemId ? 'След запис на структура системата на този модул е заключена.' : 'Откажи и избери система чрез съществуващите настройки на модула.'}</p>
        </div>

        <div className="composite-layout">
          <div className="composite-editor">
            <h3>2. Рамкови части</h3>
            <p className="composite-hint">Номерът на рамковата част я обозначава, но не определя мястото ѝ. Задай позиция отляво надясно и подравняване отделно. Новите части започват без определено разположение.</p>
            {draft.frameParts.length === 0 && <p>След избора на система добави първата рамкова част.</p>}
            {draft.frameParts.map((part, index) => (
              <fieldset className="composite-part" key={part.id}>
                <legend>Рамкова част {index + 1}</legend>
                <label htmlFor={`composite-function-${part.id}`}>Функция</label>
                <select id={`composite-function-${part.id}`} value={part.function ?? ''}
                  onChange={(event) => updatePart(part.id, { function: event.target.value === 'window' ? 'window' : event.target.value === 'door' ? 'door' : null })}>
                  <option value="">Избери функция</option>
                  <option value="window">Прозорец</option>
                  <option value="door">Врата</option>
                </select>
                <label htmlFor={`composite-position-${part.id}`}>Позиция в модула</label>
                <select id={`composite-position-${part.id}`} value={part.placement.order === null ? '' : 'current'}
                  onChange={(event) => {
                    const value = event.target.value
                    if (!value) updatePart(part.id, { placement: { ...part.placement, order: null } })
                    else if (value !== 'current') updateDraft(placeCompositePart(draft, part.id, value === 'end' ? null : value.slice(7)))
                  }}>
                  <option value="">Не е определена</option>
                  {part.placement.order !== null && <option value="current">Ред {part.placement.order} отляво надясно</option>}
                  {orderedParts.filter((other) => other.id !== part.id).map((other) => <option key={other.id} value={`before:${other.id}`}>Преди {partLabel(other.id)} · {functionLabel(other.function)}</option>)}
                  <option value="end">{orderedParts.some((other) => other.id !== part.id) ? 'След подредените части' : 'Постави първа'}</option>
                </select>
                <div className="composite-editor-actions">
                  <button type="button" id={`composite-move-left-${part.id}`} disabled={part.placement.order === null || orderedParts[0]?.id === part.id}
                    onClick={() => updateDraft(moveCompositePart(draft, part.id, 'left'))}>Наляво</button>
                  <button type="button" id={`composite-move-right-${part.id}`} disabled={part.placement.order === null || orderedParts.at(-1)?.id === part.id}
                    onClick={() => updateDraft(moveCompositePart(draft, part.id, 'right'))}>Надясно</button>
                </div>
                <label htmlFor={`composite-alignment-${part.id}`}>Вертикално подравняване</label>
                <select id={`composite-alignment-${part.id}`} value={part.placement.verticalAlignment ?? ''}
                  onChange={(event) => updatePart(part.id, { placement: { ...part.placement,
                    verticalAlignment: event.target.value === 'TOP' ? 'TOP' : event.target.value === 'BOTTOM' ? 'BOTTOM' : null } })}>
                  <option value="">Не е определено</option>
                  <option value="TOP">Горе</option>
                  <option value="BOTTOM">Долу</option>
                </select>
                <div className="composite-dimensions">
                  <div><label htmlFor={`composite-width-${part.id}`}>Ширина, mm</label>
                    <input id={`composite-width-${part.id}`} type="number" step="any" value={Number.isFinite(part.widthMm) ? part.widthMm : ''}
                      onChange={(event) => updatePart(part.id, { widthMm: event.target.valueAsNumber })} />
                  </div>
                  <div><label htmlFor={`composite-height-${part.id}`}>Височина, mm</label>
                    <input id={`composite-height-${part.id}`} type="number" step="any" value={Number.isFinite(part.heightMm) ? part.heightMm : ''}
                      onChange={(event) => updatePart(part.id, { heightMm: event.target.valueAsNumber })} />
                  </div>
                </div>
                <label htmlFor={`composite-profile-${part.id}`}>Каса · профил от каталога</label>
                <select id={`composite-profile-${part.id}`} value={part.frameProfileCode ?? ''} disabled={!draft.systemId}
                  onChange={(event) => updatePart(part.id, { frameProfileCode: event.target.value || null })}>
                  <option value="">Без избран касов профил</option>
                  {candidates.map((profile) => <option key={profile.code} value={profile.code}>{profile.code} · {profile.labelBg}</option>)}
                </select>
                <fieldset className="composite-sides">
                  <legend>Страни на касата</legend>
                  {sides.map((side) => <label key={side.key} htmlFor={`composite-${side.key}-${part.id}`}>
                    <input id={`composite-${side.key}-${part.id}`} type="checkbox" checked={part.frameSides[side.key]}
                      onChange={(event) => updatePart(part.id, { frameSides: { ...part.frameSides, [side.key]: event.target.checked } })} />{side.label}
                  </label>)}
                </fieldset>
                <button type="button" className="composite-delete" onClick={() => removePart(part.id)}>Изтрий рамкова част {index + 1}</button>
              </fieldset>
            ))}
            <button type="button" className="composite-primary" disabled={!draft.systemId}
              onClick={() => updateDraft(addCompositeFramePart(draft, globalThis.crypto.randomUUID()))}>Добави рамкова част</button>
            <p className="composite-hint">Новата част започва с четири включени страни само като начална стойност. Смяната Прозорец ↔ Врата не ги променя. Касовият профил може да остане неизбран.</p>
            <p className="composite-hint">Изтриването на рамкова част премахва и връзките към нея.</p>

            <section className="composite-connections" aria-labelledby="composite-connections-title">
              <h3 id="composite-connections-title">3. Връзки между рамкови части</h3>
              <p>Избери две части. „Нулев делител“ описва връзка между отделни каси.</p>
              <label htmlFor="composite-from">Първа рамкова част</label>
              <select id="composite-from" value={fromPartId} onChange={(event) => { setFromPartId(event.target.value); setError(null); setNotice('') }}>
                <option value="">Избери рамкова част</option>
                {draft.frameParts.map((part) => <option key={part.id} value={part.id}>{partLabel(part.id)}</option>)}
              </select>
              <label htmlFor="composite-to">Втора рамкова част</label>
              <select id="composite-to" value={toPartId} onChange={(event) => { setToPartId(event.target.value); setError(null); setNotice('') }}>
                <option value="">Избери рамкова част</option>
                {draft.frameParts.map((part) => <option key={part.id} value={part.id}>{partLabel(part.id)}</option>)}
              </select>
              <p className="composite-kind">Вид връзка: <strong>Нулев делител</strong></p>
              <button type="button" disabled={draft.frameParts.length < 2} onClick={addConnection}>Добави връзка</button>
              {draft.connections.map((connection) => <div key={connection.id} className="composite-connection">
                <span>{partLabel(connection.fromFramePartId)} ↔ {partLabel(connection.toFramePartId)} · Нулев делител</span>
                <button type="button" aria-label={`Изтрий връзка: ${partLabel(connection.fromFramePartId)} ↔ ${partLabel(connection.toFramePartId)}`}
                  onClick={() => updateDraft({ ...draft, connections: draft.connections.filter((item) => item.id !== connection.id) })}>Изтрий връзка</button>
              </div>)}
              <p role="status" className="composite-notice">{notice}</p>
            </section>
          </div>

          <aside className="composite-summary" aria-labelledby="composite-summary-title">
            <h3 id="composite-summary-title">Обобщение</h3>
            <p>Система: <strong>{getProfileSystemById(draft.systemId)?.name ?? 'Не е избрана'}</strong></p>
            <p>Рамкови части: {draft.frameParts.length}</p>
            <p role="status">{placementUnresolved ? 'Разположението не е напълно определено. Може да запазиш като чернова.' : 'Разположението е зададено от човек.'}</p>
            <ul>{[...orderedParts, ...draft.frameParts.filter((part) => part.placement.order === null)].map((part) => <li key={part.id}>
              <strong>{functionLabel(part.function)}</strong>
              <p>{partLabel(part.id)} · Позиция: {part.placement.order ?? 'Не е определена'} · Подравняване: {alignmentLabel(part)}</p>
              <p>{dimensionLabel(part.widthMm)} × {dimensionLabel(part.heightMm)} mm</p>
              <p>Каса: {part.frameProfileCode ?? 'Не е избрана'}</p>
              <p>Страни: {sides.filter((side) => part.frameSides[side.key]).map((side) => side.label.toLowerCase()).join(' / ') || 'Няма включени страни'}</p>
              {!part.frameSides.bottom && <p>Долу: няма каса</p>}
            </li>)}</ul>
            <h4>Връзки</h4>
            {draft.connections.length === 0 ? <p>Няма добавени връзки.</p> : <ul>{draft.connections.map((connection) => <li key={connection.id}>
              {partLabel(connection.fromFramePartId)} ↔ {partLabel(connection.toFramePartId)}<br />Нулев делител
            </li>)}</ul>}
            <div className={`composite-validation${problem ? '' : ' is-defined'}`} role="status">
              <strong>{problem ? 'Описанието не е завършено' : 'Структурно дефинирано'}</strong>
              <p>{problem ?? 'Проверени са само структурните данни. Това не потвърждава производствена съвместимост.'}</p>
            </div>
            <p className="composite-hint">Точната геометрия на връзката не е определена. Съвместимостта между касите изисква човешка проверка.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
