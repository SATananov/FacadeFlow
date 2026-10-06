import type { GeometryReadinessResult } from '../data/profileSystems/geometryReadiness'
import type { SelectedGeometryReadinessContext } from '../data/profileSystems/geometryReadinessContext'
import './GeometryReadinessSchematic.css'

type GeometryReadinessSchematicProps = Readonly<{
  context: SelectedGeometryReadinessContext
  evaluation: GeometryReadinessResult
}>

function participantRoleLabel(role: 'frame' | 'mullion' | 'sash'): string {
  if (role === 'frame') return 'Каса'
  if (role === 'mullion') return 'Делител'
  return 'Крило'
}

function participantLabel(participant: SelectedGeometryReadinessContext['participantA']): string {
  if (!participant) return 'Неопределен участник'
  return participant.profileId
    ? `${participant.profileId} — ${participantRoleLabel(participant.role)}`
    : `Неопределен профил — ${participantRoleLabel(participant.role)}`
}

export function GeometryReadinessSchematic({ context, evaluation }: GeometryReadinessSchematicProps) {
  const schematicAllowed = evaluation.allowedUses.some((item) => item.use === 'SCHEMATIC_RELATIONSHIP_DISPLAY')
  if (!schematicAllowed || !context.participantA || !context.participantB) return null

  const contextLabel = context.participantA.role === 'frame' && context.participantB.role === 'mullion'
    ? 'Каса → Делител'
    : `${participantRoleLabel(context.participantA.role)} → ${participantRoleLabel(context.participantB.role)}`
  const orientationLabel = context.orientation === 'horizontal'
    ? 'Хоризонтален контекст'
    : 'Вертикален контекст'

  return (
    <section className="geometry-readiness-schematic" aria-label="Схематично представяне на връзката">
      <header className="geometry-readiness-schematic-header">
        <strong>СХЕМАТИЧНО</strong>
        <span>Не е производствена геометрия</span>
      </header>
      <div className="geometry-readiness-schematic-visual" aria-hidden="true">
        <div className="geometry-readiness-schematic-participant geometry-readiness-schematic-participant-a"><span>A</span></div>
        <div className="geometry-readiness-schematic-junction">⋯</div>
        <div className="geometry-readiness-schematic-participant geometry-readiness-schematic-participant-b"><span>B</span></div>
      </div>
      <div className="geometry-readiness-schematic-facts">
        <div><span>A</span><strong>{participantLabel(context.participantA)}</strong></div>
        <div><span>B</span><strong>{participantLabel(context.participantB)}</strong></div>
        <div><span>Контекст</span><strong>{contextLabel}</strong></div>
        <div><span>Посока</span><strong>{orientationLabel}</strong></div>
      </div>
      <p className="geometry-readiness-schematic-warning">Схематично представяне — не е производствена геометрия.</p>
      <p className="geometry-readiness-schematic-blocked">Физическата сглобка остава блокирана до директно техническо доказателство.</p>
    </section>
  )
}
