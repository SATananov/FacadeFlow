import { useRef, useState, type FormEvent } from 'react'
import { profileSystemCatalog, getProfileSystemById } from '../data/profileSystems/catalog'
import {
  changeModelSystem, getModelProfileCandidates, MODEL_PROFILE_FIELDS, MODEL_PROFILE_LABELS,
  type FacadeModel, type FacadeModelInput,
} from '../domain/facadeModel'
import { LocalModelLibraryStorage } from '../persistence/localModelLibraryStorage'
import './ModelLibraryPanel.css'

const library = new LocalModelLibraryStorage(() => window.localStorage)
const emptyDraft = (): FacadeModelInput => ({ name: '', systemId: '', frameProfileCode: null, dividerProfileCode: null, sashProfileCode: null })
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Локалното хранилище е недостъпно.'

function readLibrary(): { models: FacadeModel[]; error: string | null } {
  try { return { models: library.list(), error: null } }
  catch (error) { return { models: [], error: errorMessage(error) } }
}

export function ModelLibraryPanel() {
  const [stored, setStored] = useState(readLibrary)
  const [draft, setDraft] = useState<FacadeModelInput>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterSystemId, setFilterSystemId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const nameInput = useRef<HTMLInputElement>(null)
  const visibleModels = stored.models.filter((model) => !filterSystemId || model.systemId === filterSystemId)

  const resetEditor = () => {
    setDraft(emptyDraft())
    setEditingId(null)
    setError(null)
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice('')
    try {
      const model = editingId ? library.update(editingId, draft) : library.create(draft)
      setStored(readLibrary())
      setFilterSystemId(model.systemId)
      resetEditor()
      setNotice(`Модел „${model.name}“ е запазен.`)
    } catch (failure) { setError(errorMessage(failure)) }
  }

  const edit = (model: FacadeModel) => {
    setEditingId(model.id)
    setDraft({ name: model.name, systemId: model.systemId, frameProfileCode: model.frameProfileCode,
      dividerProfileCode: model.dividerProfileCode, sashProfileCode: model.sashProfileCode })
    setError(null)
    setNotice('')
    nameInput.current?.focus()
  }

  const duplicate = (model: FacadeModel) => {
    setError(null)
    setNotice('')
    try {
      const copy = library.duplicate(model.id)
      setStored(readLibrary())
      setNotice(`Създаден е модел „${copy.name}“.`)
    } catch (failure) { setError(errorMessage(failure)) }
  }

  const remove = (model: FacadeModel) => {
    if (!window.confirm(`Да се изтрие модел „${model.name}“ от библиотеката?`)) return
    setError(null)
    setNotice('')
    try {
      library.delete(model.id)
      setStored(readLibrary())
      if (editingId === model.id) resetEditor()
      setNotice(`Модел „${model.name}“ е изтрит.`)
    } catch (failure) { setError(errorMessage(failure)) }
  }

  return (
    <section className="product-section-page model-library" aria-labelledby="model-library-title">
      <div className="product-section-panel">
        <span className="product-section-eyebrow">СИСТЕМА · КАТАЛОГ · МОДЕЛ</span>
        <h2 id="model-library-title">Библиотека модели</h2>
        <p>Запази ръчно избрани профили от една система. Моделите остават в локалната библиотека независимо от проекта.</p>
        <p className="model-library-boundary">Съвместимост на сглобката: непотвърдена — необходима е човешка проверка. Записването проверява само системата и каталожните роли. Моделите още не се прилагат към полета.</p>
        {stored.error && <div role="alert" className="model-library-error">Библиотеката не може да се зареди: {stored.error} Записите не са променени.</div>}
        {error && <div role="alert" className="model-library-error">{error}</div>}
        <div role="status" className="model-library-notice">{notice}</div>
        <div className="model-library-layout">
          <form onSubmit={save} className="model-library-editor" aria-labelledby="model-editor-title">
            <h3 id="model-editor-title">{editingId ? 'Редактирай модел' : 'Нов модел'}</h3>
            <fieldset disabled={Boolean(stored.error)}>
              <legend className="model-library-legend">Ръчен избор от каталог</legend>
              <label htmlFor="model-system">Система</label>
              <select id="model-system" required value={draft.systemId}
                onChange={(event) => { setDraft(changeModelSystem(draft, event.target.value)); setError(null); setNotice('') }}>
                <option value="">Избери система</option>
                {profileSystemCatalog.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
              </select>
              <p className="model-library-hint">Каталог: {getProfileSystemById(draft.systemId)?.name ?? 'избери система, за да видиш профилите'}</p>
              {MODEL_PROFILE_FIELDS.map((field) => (
                <div className="model-library-profile" key={field}>
                  <label htmlFor={`model-${field}`}>{MODEL_PROFILE_LABELS[field]}</label>
                  <select id={`model-${field}`} value={draft[field] ?? ''} disabled={!draft.systemId}
                    onChange={(event) => { setDraft({ ...draft, [field]: event.target.value || null }); setNotice('') }}>
                    <option value="">Без избран профил</option>
                    {getModelProfileCandidates(draft.systemId, field).map((profile) => (
                      <option key={profile.code} value={profile.code}>{profile.code} · {profile.labelBg}</option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="model-library-hint">Неизбраните профили остават празни. Може да ги добавиш при следваща редакция.</p>
              <label htmlFor="model-name">Име на модела</label>
              <input id="model-name" ref={nameInput} required value={draft.name}
                onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setNotice('') }} />
              <div className="model-library-actions">
                <button type="submit" className="model-library-save">Запази модел</button>
                <button type="button" onClick={() => { resetEditor(); setNotice('') }}>{editingId ? 'Откажи редакцията' : 'Изчисти'}</button>
              </div>
            </fieldset>
          </form>
          <div className="model-library-list" aria-labelledby="saved-models-title">
            <h3 id="saved-models-title">Запазени модели ({visibleModels.length})</h3>
            <div className="model-library-list-toolbar">
              <label htmlFor="model-system-filter">Система в списъка</label>
              <select id="model-system-filter" value={filterSystemId} onChange={(event) => setFilterSystemId(event.target.value)}>
                <option value="">Всички системи</option>
                {profileSystemCatalog.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
              </select>
              <button type="button" onClick={() => { setStored(readLibrary()); setError(null); setNotice('') }}>Обнови списъка</button>
            </div>
            {!stored.error && visibleModels.length === 0 && <p>Няма запазени модели за този избор. Създай модел чрез формата.</p>}
            {visibleModels.map((model) => (
              <article key={model.id} className="model-library-card" aria-label={`Модел ${model.name}`}>
                <h4>{model.name}</h4>
                <p>Система: <strong>{getProfileSystemById(model.systemId)?.name ?? model.systemId}</strong></p>
                <dl>{MODEL_PROFILE_FIELDS.map((field) => <div key={field}><dt>{MODEL_PROFILE_LABELS[field]}</dt><dd>{model[field] ?? 'Не е избран'}</dd></div>)}</dl>
                <div className="model-library-actions">
                  <button type="button" onClick={() => edit(model)}>Редактирай</button>
                  <button type="button" onClick={() => duplicate(model)}>Дублирай</button>
                  <button type="button" onClick={() => remove(model)}>Изтрий</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
