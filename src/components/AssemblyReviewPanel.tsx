import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProjectSnapshot } from '../domain/project/projectModel'
import { deriveResolvedAssembly } from '../domain/assembly/resolveAssembly'
import { assessReadiness } from '../domain/assembly/assemblyReadiness'
import { selectAssemblyReview } from '../domain/assembly/assemblySelectors'
import './AssemblyReviewPanel.css'

const gateLabels = {
  ASSEMBLY_RESOLUTION: 'Разрешаване на сглобката', BOM: 'Материална спецификация', QUOTATION: 'Ценообразуване',
  GLASS_ORDER: 'Поръчка на стъклопакети', PRODUCTION_RELEASE: 'Разрешаване за производство', MACHINE_EXPORT: 'Машинен изход',
}

/** Read-only by construction: no edit/save/confirm callbacks; baseline rules only. */
export function AssemblyReviewPanel({ snapshot, moduleId }: { snapshot: ProjectSnapshot; moduleId: string | null }) {
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const result = useMemo(() => {
    if (!open || !moduleId) return null
    const assembly = deriveResolvedAssembly(snapshot, moduleId)
    return { assembly, review: selectAssemblyReview(assembly), gates: assessReadiness(assembly, snapshot) }
  }, [open, snapshot, moduleId])
  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    return () => { dialog.current?.close(); launcher.current?.focus() }
  }, [open])
  return <>
    <button ref={launcher} type="button" className="assembly-review-launcher" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Преглед на сглобката</button>
    {open && createPortal(<dialog ref={dialog} className="assembly-review-dialog" aria-labelledby="assembly-review-title" onCancel={() => setOpen(false)} onClick={(event) => {
      if (event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false)
      }
    }}>
      <header><div><h2 id="assembly-review-title">Преглед на сглобката</h2><p>Основа за технически преглед · AF01A</p></div><button type="button" onClick={() => setOpen(false)}>Затвори</button></header>
      <p className="assembly-review-boundary">Реалните данни за PRELUDE 60 още не доказват напълно разрешена физическа сглобка. Прегледът не променя конструкцията и не разрешава производство.</p>
      {!result ? <p>Избери модул в Constructor, за да прегледаш сглобката.</p> : <>
        <div className="assembly-review-summary" role="status"><strong>{result.review.supportLabel}</strong><span>{result.review.coverageLabel} · Блокирано</span></div>
        <p className="assembly-review-source">Текуща чернова · отпечатък {result.assembly.source.contentDigest.slice(0, 12)} · {result.gates[0].freshness === 'current' ? 'Актуални зависимости' : 'Зависимостите изискват нов преглед'}</p>
        {result.review.contextBlockers.map((b) => <div key={b.id} className="assembly-review-blocker"><b>{b.messageBg}</b><p>{b.nextStepBg}</p></div>)}
        <h3>Неизпълнени изисквания ({result.review.unresolved.length})</h3>
        <p>Позициите за профилни членове са моделни роли. Те не са детайли за рязане или количества за поръчка.</p>
        <ul className="assembly-review-requirements">{result.review.unresolved.map(({ requirement, targetLabel, blockers }) => <li key={requirement.id}>
          <small>{targetLabel} · {requirement.requiredBy.includes('ASSEMBLY_RESOLUTION') ? 'Блокира сглобката' : 'По-късен етап'}</small>
          <b>{requirement.labelBg}</b>
          {blockers.map((b) => <p key={b.id}>{b.nextStepBg}</p>)}
        </li>)}</ul>
        <details><summary>Налични входни и ограничени каталогови факти ({result.review.known.length})</summary><ul>{result.review.known.map((r) => <li key={r.id}>{r.labelBg}{r.satisfaction.status === 'resolved' && typeof r.satisfaction.value === 'number' ? `: ${r.satisfaction.value} mm` : ''}</li>)}</ul></details>
        <h3>Готовност по дейности</h3><ul className="assembly-review-gates">{result.gates.map((g) => <li key={g.gate}><span>{gateLabels[g.gate]}</span><b>Блокирано</b><small>{g.gate === 'ASSEMBLY_RESOLUTION' ? 'Липсват проверени технически правила.' : 'Бъдещ етап — не е реализиран в AF01A.'}</small></li>)}</ul>
      </>}
    </dialog>, document.body)}
  </>
}
