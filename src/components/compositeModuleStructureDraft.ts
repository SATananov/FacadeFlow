import { getProfileSystemById } from '../data/profileSystems/catalog'
import {
  COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION, validateCompositeModuleStructure,
  upgradeCompositeModuleStructure, type CompositeModuleStructure, type CurrentCompositeModuleStructure, type FramePartConnection,
} from '../domain/compositeModuleStructure'

/** UI editing state uses the 01A shape; it is not valid until domain validation passes. */
export function emptyCompositeDraft(): CurrentCompositeModuleStructure {
  return { schemaVersion: COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION, systemId: '', frameParts: [], connections: [] }
}

export function compositeFrameCandidates(systemId: string) {
  return getProfileSystemById(systemId)?.mainProfiles.filter((profile) => profile.role === 'frame') ?? []
}

export function changeCompositeSystem(draft: CurrentCompositeModuleStructure, systemId: string): CurrentCompositeModuleStructure {
  const candidates = compositeFrameCandidates(systemId)
  return { ...draft, systemId, frameParts: draft.frameParts.map((part) => ({ ...part,
    frameProfileCode: candidates.some((profile) => profile.code === part.frameProfileCode) ? part.frameProfileCode : null,
  })) }
}

export function addCompositeFramePart(draft: CurrentCompositeModuleStructure, id: string): CurrentCompositeModuleStructure {
  return { ...draft, frameParts: [...draft.frameParts, {
    id, function: null, widthMm: NaN, heightMm: NaN, frameProfileCode: null, fieldIds: [],
    // UI starting values only, never inferred from WINDOW/DOOR.
    frameSides: { top: true, right: true, bottom: true, left: true },
    placement: { order: null, verticalAlignment: null },
  }] }
}

export function removeCompositeFramePart(draft: CurrentCompositeModuleStructure, id: string): CurrentCompositeModuleStructure {
  return { ...draft, frameParts: draft.frameParts.filter((part) => part.id !== id),
    connections: draft.connections.filter((connection) => connection.fromFramePartId !== id && connection.toFramePartId !== id) }
}

export function openCompositeDraft(value: CompositeModuleStructure): CurrentCompositeModuleStructure {
  return upgradeCompositeModuleStructure(value)
}

/** Storage order is deliberately ignored. Unresolved parts are not ranked. */
export function orderedCompositeParts(draft: CurrentCompositeModuleStructure) {
  return draft.frameParts.filter((part) => part.placement.order !== null)
    .sort((a, b) => a.placement.order! - b.placement.order!)
}

/** Explicit user insertion/reorder. Renumber only already placed parts plus the target. */
export function placeCompositePart(draft: CurrentCompositeModuleStructure, id: string, beforeId: string | null): CurrentCompositeModuleStructure {
  const target = draft.frameParts.find((part) => part.id === id)
  if (!target || id === beforeId) return draft
  const ordered = orderedCompositeParts(draft).filter((part) => part.id !== id)
  const index = beforeId === null ? ordered.length : ordered.findIndex((part) => part.id === beforeId)
  if (index < 0) return draft
  ordered.splice(index, 0, target)
  const orders = new Map(ordered.map((part, index) => [part.id, index + 1]))
  return { ...draft, frameParts: draft.frameParts.map((part) => orders.has(part.id)
    ? { ...part, placement: { ...part.placement, order: orders.get(part.id)! } } : part) }
}

export function moveCompositePart(draft: CurrentCompositeModuleStructure, id: string, direction: 'left' | 'right'): CurrentCompositeModuleStructure {
  const ordered = orderedCompositeParts(draft)
  const index = ordered.findIndex((part) => part.id === id)
  if (index < 0 || (direction === 'left' ? index === 0 : index === ordered.length - 1)) return draft
  return placeCompositePart(draft, id, direction === 'left' ? ordered[index - 1].id : ordered[index + 2]?.id ?? null)
}

/** Form guidance plus translation; 01A remains the final structural authority. */
export function compositeDraftProblem(draft: CompositeModuleStructure): string | null {
  if (!draft.systemId) return 'Избери система.'
  if (draft.frameParts.length === 0) return 'Добави поне една рамкова част.'
  for (const [index, part] of draft.frameParts.entries()) {
    if (!Number.isFinite(part.widthMm) || part.widthMm <= 0) return `Рамкова част ${index + 1}: въведи ширина, по-голяма от 0 mm.`
    if (!Number.isFinite(part.heightMm) || part.heightMm <= 0) return `Рамкова част ${index + 1}: въведи височина, по-голяма от 0 mm.`
  }
  try {
    validateCompositeModuleStructure(draft)
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('system not found')) return 'Избраната система не е намерена в каталога.'
    if (message.includes('self connection')) return 'Избери две различни рамкови части за връзката.'
    if (message.includes('missing frame part endpoint') || message.includes('invalid reference ID')) return 'Избери две съществуващи рамкови части за връзката.'
    if (message.includes('duplicate equivalent connection')) return 'Между тези две рамкови части вече има връзка.'
    if (message.includes('frameProfileCode')) return 'Провери касовите профили: всеки трябва да е каса от избраната система.'
    if (message.includes('duplicate order')) return 'Две рамкови части не могат да имат еднаква позиция.'
    if (message.includes('placement')) return 'Провери позицията и вертикалното подравняване на рамковите части.'
    return 'Структурата съдържа невалидни данни. Провери рамковите части и връзките.'
  }
}

export function connectCompositeParts(
  draft: CurrentCompositeModuleStructure, id: string, fromFramePartId: string, toFramePartId: string,
): { draft: CurrentCompositeModuleStructure; error: string | null } {
  const connection: FramePartConnection = { id, fromFramePartId, toFramePartId, kind: 'ZERO_DIVIDER' }
  const next = { ...draft, connections: [...draft.connections, connection] }
  const error = compositeDraftProblem(next)
  return { draft: error ? draft : next, error }
}
