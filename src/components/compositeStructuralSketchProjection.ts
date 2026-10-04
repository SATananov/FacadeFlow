import type { CompositeFramePartFunction } from '../domain/compositeModuleStructure'
import { getFramePartPlacement, validateCompositeModuleStructure, type FrameSides } from '../domain/compositeModuleStructure'
import { hasModuleConstructorConstruction } from '../domain/project/compositeModuleGuard'
import type { ProjectSnapshot } from '../domain/project/projectModel'

/** Presentation units only: never passed to construction topology or project persistence. */
export type SketchBounds = { x: number; y: number; width: number; height: number }
export type SketchPart = SketchBounds & {
  id: string
  function: CompositeFramePartFunction
  label: string
  widthMm: number
  heightMm: number
  dimensions: string
  profileCode: string | null
  sides: FrameSides
}
export type CompositeSketchProjection =
  | { status: 'empty' | 'invalid' | 'unresolved'; message: string }
  | { status: 'ready'; bounds: SketchBounds; parts: readonly SketchPart[]; connections: readonly {
    id: string; fromId: string; toId: string; fromX: number; fromY: number; toX: number; toY: number; laneY: number
  }[] }

export type ConstructorView =
  | { kind: 'legacy'; historicalConflict: boolean }
  | { kind: 'composite'; projection: CompositeSketchProjection }

export function selectModuleConstructorView(snapshot: ProjectSnapshot, moduleId: string | undefined): ConstructorView {
  const structure = moduleId ? snapshot.modulesById[moduleId]?.compositeStructure : null
  if (structure == null) return { kind: 'legacy', historicalConflict: false }
  if (hasModuleConstructorConstruction(snapshot, moduleId!)) return { kind: 'legacy', historicalConflict: true }
  return { kind: 'composite', projection: buildCompositeStructuralSketchProjection(structure) }
}

export function buildCompositeStructuralSketchProjection(value: unknown): CompositeSketchProjection {
  // Empty drafts are not persistable, but the view must still handle this state.
  if (value && typeof value === 'object' && 'frameParts' in value
    && Array.isArray(value.frameParts) && value.frameParts.length === 0) {
    return { status: 'empty', message: 'Добави рамкови части от „Структура на модула“.' }
  }
  try { validateCompositeModuleStructure(value) } catch {
    return { status: 'invalid', message: 'Структурата на модула изисква преглед.' }
  }
  if (value.frameParts.some((part) => {
    const placement = getFramePartPlacement(part)
    return placement.order === null || placement.verticalAlignment === null
  })) return { status: 'unresolved', message: 'Позицията на рамковите части не е определена.' }

  const ordered = [...value.frameParts].sort((a, b) => getFramePartPlacement(a).order! - getFramePartPlacement(b).order!)
  const nominalScale = ordered.reduce((max, part) => Math.max(max, part.widthMm, part.heightMm), 0)
  const tallest = ordered.reduce((max, part) => Math.max(max, part.heightMm / nominalScale), 0) * 1000
  // Separations and annotation lanes are arbitrary screen spacing, not joints or clearances.
  const top = value.connections.length * 80 + 80
  let x = 0
  const parts = ordered.map((part) => {
    const width = part.widthMm / nominalScale * 1000, height = part.heightMm / nominalScale * 1000
    const result: SketchPart = {
      id: part.id, function: part.function ?? null,
      label: part.function === 'window' ? 'Прозорец' : part.function === 'terrace-door' ? 'Терасна врата' : part.function === 'door' ? 'Врата' : 'Рамкова част',
      widthMm: part.widthMm, heightMm: part.heightMm,
      dimensions: `${part.widthMm} × ${part.heightMm} mm`, profileCode: part.frameProfileCode ?? null, sides: { ...part.frameSides },
      x, y: top + (getFramePartPlacement(part).verticalAlignment === 'BOTTOM' ? tallest - height : 0), width, height,
    }
    x += width + 100
    return result
  })
  const width = x - 100, height = top + tallest
  const scale = 2000 / Math.max(width, height)
  for (const part of parts) {
    part.x *= scale; part.y *= scale; part.width *= scale; part.height *= scale
  }
  const byId = new Map(parts.map((part) => [part.id, part]))
  const connections = value.connections.map((connection, index) => {
    const from = byId.get(connection.fromFramePartId)!, to = byId.get(connection.toFramePartId)!
    return { id: connection.id, fromId: from.id, toId: to.id,
      fromX: from.x + from.width / 2, fromY: from.y,
      toX: to.x + to.width / 2, toY: to.y, laneY: (index + 1) * 80 * scale }
  })
  return { status: 'ready', bounds: { x: 0, y: 0, width: width * scale, height: height * scale }, parts, connections }
}
