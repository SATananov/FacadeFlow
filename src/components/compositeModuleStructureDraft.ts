import { getProfileSystemById } from '../data/profileSystems/catalog'
import {
  COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION, validateCompositeModuleStructure,
  type CompositeModuleStructure, type FramePartConnection,
} from '../domain/compositeModuleStructure'

/** UI editing state uses the 01A shape; it is not valid until domain validation passes. */
export function emptyCompositeDraft(): CompositeModuleStructure {
  return { schemaVersion: COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION, systemId: '', frameParts: [], connections: [] }
}

export function compositeFrameCandidates(systemId: string) {
  return getProfileSystemById(systemId)?.mainProfiles.filter((profile) => profile.role === 'frame') ?? []
}

export function changeCompositeSystem(draft: CompositeModuleStructure, systemId: string): CompositeModuleStructure {
  const candidates = compositeFrameCandidates(systemId)
  return { ...draft, systemId, frameParts: draft.frameParts.map((part) => ({ ...part,
    frameProfileCode: candidates.some((profile) => profile.code === part.frameProfileCode) ? part.frameProfileCode : null,
  })) }
}

export function addCompositeFramePart(draft: CompositeModuleStructure, id: string): CompositeModuleStructure {
  return { ...draft, frameParts: [...draft.frameParts, {
    id, function: null, widthMm: NaN, heightMm: NaN, frameProfileCode: null, fieldIds: [],
    // UI starting values only, never inferred from WINDOW/DOOR.
    frameSides: { top: true, right: true, bottom: true, left: true },
  }] }
}

export function removeCompositeFramePart(draft: CompositeModuleStructure, id: string): CompositeModuleStructure {
  return { ...draft, frameParts: draft.frameParts.filter((part) => part.id !== id),
    connections: draft.connections.filter((connection) => connection.fromFramePartId !== id && connection.toFramePartId !== id) }
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
    return 'Структурата съдържа невалидни данни. Провери рамковите части и връзките.'
  }
}

export function connectCompositeParts(
  draft: CompositeModuleStructure, id: string, fromFramePartId: string, toFramePartId: string,
): { draft: CompositeModuleStructure; error: string | null } {
  const connection: FramePartConnection = { id, fromFramePartId, toFramePartId, kind: 'ZERO_DIVIDER' }
  const next = { ...draft, connections: [...draft.connections, connection] }
  const error = compositeDraftProblem(next)
  return { draft: error ? draft : next, error }
}
