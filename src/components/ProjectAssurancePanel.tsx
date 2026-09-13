import { useEffect, useState } from 'react'
import type { ProjectSnapshot } from '../domain/project/projectModel'
import type { HumanActor, HumanConfirmation } from '../domain/assurance/assuranceModel'
import type { ConfirmationRequest } from '../domain/assurance/assuranceOperations'
import { inspectableStatements, confirmationFreshness } from '../domain/assurance/assuranceSelectors'
import { revisionStatus } from '../domain/project/revisionOperations'
import './ProjectAssurancePanel.css'

const predicateLabel: Record<string, string> = {
  'human-selected-bead': 'Избран стъклодържател',
  'human-glazing-thickness': 'Дебелина на стъклопакета',
  'human-selected-profile': 'Избран профил',
  'human-selected-reinforcement': 'Избрана армировка',
  'catalog-stated-bead-thickness': 'Каталожна дебелина за стъклодържателя',
  'catalog-reinforcement-pairing': 'Каталожна връзка профил / армировка',
  'bead-base-profile-compatibility': 'Съвместимост стъклодържател / базов профил',
  'reviewed-front-elevation-overlap': 'Проверено застъпване на крилото',
  'reviewed-visible-face': 'Проверена видима ширина на профила',
  'reviewed-operational-policy': 'Проверено правило за избор',
  'glazing-inset': 'Отстъп на стъклопакета',
  'glass-cut-width': 'Размер за рязане на стъклото',
}
const displayPredicate = (predicate: string) => predicateLabel[predicate] ?? 'Техническо твърдение'
const displayValue = (value: { state: 'known'; value: unknown } | { state: 'unknown'; reason: string }) =>
  value.state === 'known' ? String(value.value) : 'Неизвестно'

const parameterLabel: Record<string, string> = {
  profileSystemId: 'Профилна система',
  thicknessMm: 'Дебелина',
  baseProfileCode: 'Базов профил',
  beadCode: 'Стъклодържател',
  supportProfileCode: 'Опорен профил',
  category: 'Категория',
}
const displayParameter = (key: string) => parameterLabel[key] ?? key

type Props = {
  snapshot: ProjectSnapshot; moduleId: string | null; blocked: boolean
  onRecord: (actor: HumanActor) => void
  onInspect: (evidenceId: string) => ConfirmationRequest
  onConfirm: (request: ConfirmationRequest, actor: HumanActor, intent: HumanConfirmation['intent']) => void
}

export function ProjectAssurancePanel({ snapshot, moduleId, blocked, onRecord, onInspect, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  const [actorId] = useState(() => globalThis.crypto.randomUUID())
  const [name, setName] = useState('')
  const [evidenceId, setEvidenceId] = useState('')
  const [displayed, setDisplayed] = useState<ConfirmationRequest | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const status = revisionStatus(snapshot)
  const statements = inspectableStatements(snapshot, moduleId)
  const activeResolution = moduleId ? snapshot.profileResolutionsByModuleId[moduleId] ?? null : null
  const emptyStatementReason = !moduleId
    ? 'Няма активен модул. Избери модул и направи технически избор, за да се появят твърдения за преглед.'
    : !activeResolution
      ? 'Текущият модул още няма профилна система и технически контекст. Първо избери профилна система, после направи човешки технически избор — профил, дебелина на стъклопакета или стъклодържател.'
      : 'В текущия технически контекст още няма твърдение за потвърждение. Направи човешки избор в модула — например профил, армировка, дебелина на стъклопакета или стъклодържател.'
  const actor = (): HumanActor => ({ id: actorId, label: name.trim(), identityBasis: 'local-self-asserted' })
  const perform = (operation: () => void) => {
    setError(''); setNotice('')
    try { operation() } catch (err) { setError(err instanceof Error ? err.message : 'Неуспешно действие'); setDisplayed(null) }
  }
  const scope = displayed?.statement.scope
  const relevantConfirmations = Object.values(snapshot.assurance.confirmationsById).filter((confirmation) => (
    confirmation.statement.scope.kind === 'module'
    && confirmation.statement.scope.moduleId === moduleId
  ))
  const confirmationStates = relevantConfirmations.map((confirmation) => ({
    confirmation,
    freshness: confirmationFreshness(snapshot, confirmation),
  }))
  const staleCount = confirmationStates.filter(({ freshness }) => freshness.state !== 'current').length
  const revisionLabel = status.head ? `R${status.head.number}` : 'Без ревизия'
  const draftLabel = status.matches ? 'текущата версия е записана' : 'има незаписани промени'
  const nextRevisionNumber = (status.head?.number ?? 0) + 1
  const revisionActionLabel = status.matches
    ? `${revisionLabel} е актуална`
    : status.head ? `Запиши като R${nextRevisionNumber}` : 'Запиши първа ревизия'

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [open])

  return <>
    <button
      type="button"
      className={`project-assurance-launcher${staleCount > 0 ? ' has-review' : ''}`}
      aria-expanded={open}
      aria-controls="project-assurance-drawer"
      onClick={() => setOpen(true)}
    >
      <span className="project-assurance-launcher-title">Ревизии и доказателства</span>
      <span className="project-assurance-launcher-meta">
        {revisionLabel} · {draftLabel}{staleCount > 0 ? ` · ${staleCount} за преглед` : ''}
      </span>
    </button>

    {open && <div
      className="project-assurance-layer"
      onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false) }}
    >
      <aside
        id="project-assurance-drawer"
        className="project-assurance-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Ревизии и доказателства"
      >
        <header className="project-assurance-header">
          <div>
            <span className="project-assurance-eyebrow">ИСТОРИЯ НА ПРОЕКТА</span>
            <h2>Ревизии и доказателства</h2>
            <p>{revisionLabel} · {draftLabel}</p>
          </div>
          <button type="button" className="project-assurance-close" onClick={() => setOpen(false)} aria-label="Затвори ревизии и доказателства">×</button>
        </header>

        <div className="project-assurance-body">
          {!status.matches && <div className="project-assurance-callout is-draft">
            <b>Текущото съдържание е чернова.</b>
            <span>За потвърждение първо запиши текущата ревизия. Локалният запис и обикновеното редактиране не създават ревизия.</span>
          </div>}

          {staleCount > 0 && <div className="project-assurance-callout is-review" role="status">
            <b>{staleCount} потвърждение{staleCount === 1 ? '' : 'я'} изисква{staleCount === 1 ? '' : 'т'} нов преглед.</b>
            <span>Историческият запис е запазен; текущият контекст вече не съвпада с него.</span>
          </div>}

          <section className="project-assurance-section" aria-labelledby="project-assurance-revision-title">
            <h3 id="project-assurance-revision-title">1. Запази текущото състояние като ревизия</h3>
            <div className="project-assurance-controls">
              <label>Кой записва ревизията?
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Име" />
              </label>
              <button
                type="button"
                className="project-assurance-primary"
                disabled={blocked || !name.trim() || status.matches}
                onClick={() => perform(() => {
                  onRecord(actor())
                  setDisplayed(null)
                  setNotice('Ревизията е записана. Статусът на локалното съхранение е отделен.')
                })}
              >{revisionActionLabel}</button>
              {status.matches && <small>Няма нови промени след {revisionLabel}. Направи промяна в проекта, за да запишеш следваща ревизия.</small>}
            </div>
          </section>

          <section className="project-assurance-section" aria-labelledby="project-assurance-statement-title">
            <h3 id="project-assurance-statement-title">2. Избери решение за потвърждение</h3>
            {statements.length === 0 ? <div className="project-assurance-empty-guide" role="status">
              <b>Няма технически решения за потвърждение.</b>
              <span>{emptyStatementReason}</span>
              <button type="button" onClick={() => setOpen(false)}>Върни се към текущия модул</button>
            </div> : <div className="project-assurance-controls">
              <label>Решение от текущия модул
                <select value={evidenceId} onChange={(event) => { setEvidenceId(event.target.value); setDisplayed(null) }}>
                  <option value="">Избери решение от текущия модул</option>
                  {statements.map((evidence) => {
                    const statementScope = evidence.statement.scope
                    const module = statementScope.kind === 'module' ? snapshot.modulesById[statementScope.moduleId] : null
                    const targetLabel = statementScope.kind !== 'module' ? ''
                      : statementScope.target.kind === 'field' ? 'ПОЛЕ'
                        : statementScope.target.kind === 'divider' ? 'ДЕЛИТЕЛ' : 'КАСА'
                    return <option key={evidence.id} value={evidence.id}>
                      {displayPredicate(evidence.statement.predicate)} · {module ? `Модул ${module.sequence}` : ''}{targetLabel ? ` · ${targetLabel}` : ''} · {displayValue(evidence.statement.value)}
                    </option>
                  })}
                </select>
              </label>
              <button
                type="button"
                disabled={blocked || !status.matches || !statements.some((evidence) => evidence.id === evidenceId)}
                onClick={() => perform(() => setDisplayed(onInspect(evidenceId)))}
              >Прегледай преди потвърждение</button>
            </div>}
          </section>

          {displayed && <section className="project-assurance-statement" aria-label="Точно твърдение за потвърждение">
            <span className="project-assurance-exact-badge">КОНКРЕТНО РЕШЕНИЕ</span>
            <p><b>{displayPredicate(displayed.statement.predicate)}</b>: {displayValue(displayed.statement.value)} {displayed.statement.unit === 'mm' ? 'mm' : ''}</p>
            <p>Ревизия: {snapshot.revisions.revisionsById[displayed.projectRevisionId] ? `R${snapshot.revisions.revisionsById[displayed.projectRevisionId].number}` : 'неизвестна'}</p>
            {scope?.kind === 'module' && <p>Контекст: Модул {snapshot.modulesById[scope.moduleId]?.sequence ?? '—'} · {scope.target.kind === 'field' ? 'ПОЛЕ' : scope.target.kind === 'divider' ? 'ДЕЛИТЕЛ' : 'КАСА'}</p>}
            <dl>{Object.entries(displayed.statement.parameters).map(([key, value]) => <div key={key}><dt>{displayParameter(key)}</dt><dd>{key === 'thicknessMm' ? `${value} mm` : value}</dd></div>)}</dl>
            {displayed.sources.length ? <ul>{displayed.sources.map((source) => <li key={source.id}>{source.documentTitle} · стр. {source.locator.printedPage ?? 'неизвестна'} · {source.locator.section} · издание: {source.documentVersion.state === 'known' ? source.documentVersion.value : 'неизвестно'} · запис: {source.capturedRecordVersion}</li>)}</ul> : <p>Няма документен източник. Това е човешко въвеждане или изрично неизвестно твърдение.</p>}
            <div className="project-assurance-boundary">
              Потвърждението важи само за показаното решение.<br />
              Съвместимостта с базовия профил остава непотвърдена. Отстъпът на стъклопакета и размерът за рязане на стъклото остават неизвестни.<br />
              Това не означава готовност за производство или за машина.
            </div>
            <button type="button" className="project-assurance-primary" disabled={blocked || !name.trim()} onClick={() => perform(() => {
              const predicate = displayed.statement.predicate
              onConfirm(displayed, actor(), predicate.startsWith('human-selected-') ? 'selection-attestation' : predicate === 'human-glazing-thickness' ? 'input-attestation' : 'technical-review-attestation')
              setDisplayed(null)
              setNotice('Записано е изрично потвърждение на показаното твърдение.')
            })}>Потвърждавам показаното решение</button>
          </section>}

          <section className="project-assurance-section" aria-labelledby="project-assurance-history-title">
            <h3 id="project-assurance-history-title">3. История на потвържденията</h3>
            {confirmationStates.length === 0
              ? <p className="project-assurance-empty">Все още няма изрични потвърждения за този модул.</p>
              : <ul className="project-assurance-history">{confirmationStates.map(({ confirmation, freshness }) => <li key={confirmation.id} className={freshness.state === 'current' ? 'is-current' : 'is-stale'}>
                <b>{displayPredicate(confirmation.statement.predicate)}</b>
                <span>{freshness.state === 'current' ? 'Съвпада с текущия контекст' : 'Нужен нов преглед'}</span>
                <small>{snapshot.revisions.revisionsById[confirmation.projectRevisionId] ? `Ревизия R${snapshot.revisions.revisionsById[confirmation.projectRevisionId].number}` : 'Ревизия неизвестна'}</small>
              </li>)}</ul>}
          </section>

          {error && <p role="alert" className="project-assurance-message is-error">{error}</p>}
          {notice && <p role="status" className="project-assurance-message is-notice">{notice}</p>}
        </div>
      </aside>
    </div>}
  </>
}
