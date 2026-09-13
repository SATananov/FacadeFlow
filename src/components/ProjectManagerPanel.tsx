import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StoredProjectSummary } from '../persistence/localProjectStorage'
import './ProjectManagerPanel.css'

type CurrentProjectSummary = {
  id: string
  label: string
  moduleCount: number
  headRevisionNumber: number | null
}

type Props = {
  current: CurrentProjectSummary
  projects: StoredProjectSummary[]
  blocked: boolean
  onOpen: (id: string) => void
  onNew: () => void
}

function moduleLabel(count: number) {
  return count === 1 ? '1 модул' : `${count} модула`
}

export function ProjectManagerPanel({ current, projects, blocked, onOpen, onNew }: Props) {
  const [open, setOpen] = useState(false)
  const available = useMemo(() => {
    const map = new Map<string, StoredProjectSummary>()
    for (const project of projects) map.set(project.id, project)
    if (!map.has(current.id)) {
      map.set(current.id, {
        ...current,
        openable: true,
        clientName: '',
        objectName: '',
      })
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === current.id) return -1
      if (b.id === current.id) return 1
      return a.label.localeCompare(b.label, 'bg')
    })
  }, [current, projects])

  const createNew = () => {
    onNew()
    setOpen(false)
  }

  const openProject = (id: string) => {
    if (id === current.id) {
      setOpen(false)
      return
    }
    onOpen(id)
    setOpen(false)
  }

  return (
    <>
      <div className="project-current-summary" aria-label={`Текущ проект: ${current.label}`}>
        <span className="project-manager-trigger-kicker">Текущ проект</span>
        <strong>{current.label}</strong>
      </div>
      <button
        type="button"
        className="project-open-trigger"
        aria-label="Отвори проект"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Отвори проект
      </button>
      <button type="button" className="project-new-trigger" onClick={createNew} disabled={blocked}>
        + Нов проект
      </button>

      {open && createPortal(
        <div className="project-manager-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}>
          <section className="project-manager-dialog" role="dialog" aria-modal="true" aria-labelledby="project-manager-title">
            <header className="project-manager-header">
              <div>
                <span className="project-manager-kicker">Проекти</span>
                <h2 id="project-manager-title">Отвори запазен проект</h2>
                <p>Избери проект по име. Вътрешните идентификатори остават скрити.</p>
              </div>
              <button type="button" className="project-manager-close" aria-label="Затвори" onClick={() => setOpen(false)}>×</button>
            </header>

            <div className="project-manager-toolbar">
              <span>{available.length === 1 ? '1 наличен проект' : `${available.length} налични проекта`}</span>
              <button type="button" onClick={createNew} disabled={blocked}>+ Нов проект</button>
            </div>

            <div className="project-manager-list">
              {available.map((project) => {
                const isCurrent = project.id === current.id
                return (
                  <article className={`project-manager-card${isCurrent ? ' is-current' : ''}${!project.openable ? ' is-unavailable' : ''}`} key={project.id}>
                    <div className="project-manager-card-main">
                      <div className="project-manager-card-title-row">
                        <h3>{project.label}</h3>
                        {isCurrent && <span className="project-manager-current-badge">Текущ</span>}
                      </div>
                      {(project.clientName || project.objectName) && (
                        <p className="project-manager-context">
                          {project.clientName && <span>Клиент: {project.clientName}</span>}
                          {project.objectName && <span>Обект: {project.objectName}</span>}
                        </p>
                      )}
                      <p className="project-manager-meta">
                        <span>{moduleLabel(project.moduleCount)}</span>
                        <span>{project.headRevisionNumber === null ? 'Без записана ревизия' : `Последна ревизия R${project.headRevisionNumber}`}</span>
                      </p>
                      {!project.openable && <p className="project-manager-warning">Записът не може да се отвори безопасно. FacadeFlow няма да го презапише.</p>}
                    </div>
                    <button type="button" disabled={!project.openable || isCurrent} onClick={() => openProject(project.id)}>
                      {isCurrent ? 'Отворен' : project.openable ? 'Отвори' : 'Недостъпен'}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}
