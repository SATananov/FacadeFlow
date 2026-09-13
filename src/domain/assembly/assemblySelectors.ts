import type { AssemblyTarget, ResolvedAssembly } from './assemblyModel'

const sides = { left: 'ляво', right: 'дясно', top: 'горе', bottom: 'долу' }
export function assemblyTargetLabel(assembly: ResolvedAssembly, target: AssemblyTarget): string {
  if (target.kind === 'module') return 'Модул'
  if (target.kind === 'member') {
    const origin = assembly.members.find((m) => m.id === target.id)?.origin
    if (origin?.kind === 'frame-side') return `Каса · ${sides[origin.side]}`
    if (origin?.kind === 'sash-side') return `Крило · ${sides[origin.side]} · ${origin.fieldId}`
    if (origin?.kind === 'divider') return `Делител · ${origin.dividerId}`
  }
  if (target.kind === 'connection') {
    const connection = assembly.connections.find((c) => c.id === target.id)
    const labels = { 'frame-corner': 'Ъгъл на касата', 'sash-corner': 'Ъгъл на крилото', 'sash-to-frame': 'Крило към каса', 'glazing-to-surround': 'Стъклопакет към обграждащ профил', 'divider-to-frame': 'Делител към каса' }
    if (connection) return `${labels[connection.kind]} · ${connection.endpoints.map((e) => e.kind === 'member'
      ? `${assemblyTargetLabel(assembly, { kind: 'member', id: e.memberId })} (${e.location in sides ? sides[e.location as keyof typeof sides] : e.location})`
      : sides[e.side]).join(' / ')}`
  }
  if (target.kind === 'infill') return `Стъклопакет · ${assembly.infills.find((i) => i.id === target.id)?.fieldId ?? 'поле'}`
  return `${target.kind === 'field' ? 'Поле' : 'Делител'} · ${target.id}`
}
export function selectAssemblyReview(assembly: ResolvedAssembly) {
  return {
    supportLabel: assembly.support.status === 'supported' ? 'Поддържана конфигурация'
      : assembly.support.status === 'unsupported' ? 'Неподдържана конфигурация' : 'Недостатъчни данни за определяне на обхвата',
    coverageLabel: { complete: 'Пълно покритие на контракта', partial: 'Частично покритие', unresolved: 'Неразрешено', invalid: 'Невалиден вход или избор' }[assembly.coverageStatus],
    unresolved: assembly.requirements.filter((r) => !['resolved', 'not-applicable'].includes(r.satisfaction.status) ||
      !['resolved', 'not-applicable'].includes(r.applicability.status))
      .map((r) => ({ requirement: r, targetLabel: assemblyTargetLabel(assembly, r.target), blockers: assembly.blockers.filter((b) => b.requirementId === r.id) })),
    known: assembly.requirements.filter((r) => r.satisfaction.status === 'resolved'),
    contextBlockers: assembly.blockers.filter((b) => !b.requirementId && b.blocks.includes('ASSEMBLY_RESOLUTION')),
  }
}
