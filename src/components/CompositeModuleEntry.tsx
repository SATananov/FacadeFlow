import { useEffect, useRef, useState } from 'react'
import type { ProjectSnapshot } from '../domain/project/projectModel'
import { proposeCompositeModule, type CompositeModuleCreationRequest } from '../domain/project/compositeModuleGuard'
import './ProjectManagerPanel.css'
import './CompositeModuleEntry.css'

type Props = {
  snapshot: ProjectSnapshot
  moduleId: string
  onOpen: (moduleId: string) => void
  onCreate: (request: CompositeModuleCreationRequest) => { moduleId: string | null; error: string | null }
}

export function CompositeModuleEntry({ snapshot, moduleId, onOpen, onCreate }: Props) {
  const [request, setRequest] = useState<CompositeModuleCreationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const confirming = useRef(false)
  useEffect(() => {
    if (!request) return
    dialog.current?.showModal()
    return () => { dialog.current?.close(); trigger.current?.focus() }
  }, [request])
  const module = snapshot.modulesById[moduleId]
  if (!module) return null
  return <>
    <button type="button" ref={trigger} aria-haspopup="dialog" onClick={() => {
      const proposal = proposeCompositeModule(snapshot, moduleId)
      setError(null)
      if (proposal) setRequest(proposal)
      else onOpen(moduleId)
    }}>Структура на модула · Модул {module.sequence}</button>
    {request && <dialog ref={dialog} className="project-manager-dialog composite-guard-dialog"
      aria-labelledby="composite-guard-title" aria-describedby="composite-guard-description"
      onCancel={(event) => { event.preventDefault(); setRequest(null) }}>
      <header className="project-manager-header"><div>
        <h2 id="composite-guard-title">Модул {request.sourceSequence} вече съдържа конструкция</h2>
        <p id="composite-guard-description">Този модул вече има създадена скица в Конструктора. За да я запазим, новата рамкова структура трябва да бъде в отделен модул.</p>
      </div></header>
      {error && <p className="composite-guard-error" role="alert">{error}</p>}
      <div className="project-manager-toolbar">
        <button type="button" onClick={() => {
          if (confirming.current) return
          confirming.current = true
          const result = onCreate(request)
          if (result.moduleId) { setRequest(null); onOpen(result.moduleId) }
          else { setError(result.error); confirming.current = false }
        }}>Създай Модул {request.nextSequence}</button>
        <button type="button" autoFocus onClick={() => setRequest(null)}>Отказ</button>
      </div>
    </dialog>}
  </>
}
