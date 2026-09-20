import { getProfileSystemById } from '../data/profileSystems/catalog'
import type { ProfileDefinition, ProfileRole } from '../data/profileSystems/types'

export const FACADE_MODEL_SCHEMA_VERSION = 1 as const
export const MODEL_LIBRARY_SAFETY = {
  assemblyCompatibility: 'UNKNOWN / HUMAN REVIEW',
  automaticGeometry: false,
  rulesValidated: false,
  machineReady: false,
} as const

export type ModelProfileField = 'frameProfileCode' | 'dividerProfileCode' | 'sashProfileCode'
export const MODEL_PROFILE_FIELDS: readonly ModelProfileField[] = [
  'frameProfileCode', 'dividerProfileCode', 'sashProfileCode',
]
export const MODEL_PROFILE_LABELS: Record<ModelProfileField, string> = {
  frameProfileCode: 'Каса', dividerProfileCode: 'Делител', sashProfileCode: 'Крило',
}
// A model has no product type. Both catalogue sash roles can be selected;
// this does not assert that any selected profiles form a compatible assembly.
const MODEL_PROFILE_ROLES: Record<ModelProfileField, readonly ProfileRole[]> = {
  frameProfileCode: ['frame'], dividerProfileCode: ['mullion'], sashProfileCode: ['sash', 'door-sash'],
}

export type FacadeModelInput = {
  name: string
  systemId: string
  // Unassigned roles remain null, consistent with manual Profile Resolution.
  // A saved configuration does not imply completeness or production readiness.
  frameProfileCode: string | null
  dividerProfileCode: string | null
  sashProfileCode: string | null
}
export type FacadeModel = FacadeModelInput & {
  id: string
  createdAt: string
  updatedAt: string
  schemaVersion: typeof FACADE_MODEL_SCHEMA_VERSION
}

export function getModelProfileCandidates(systemId: string, field: ModelProfileField): readonly ProfileDefinition[] {
  return getProfileSystemById(systemId)?.mainProfiles.filter((profile) => MODEL_PROFILE_ROLES[field].includes(profile.role)) ?? []
}

export function changeModelSystem(input: FacadeModelInput, systemId: string): FacadeModelInput {
  const next = { ...input, systemId }
  for (const field of MODEL_PROFILE_FIELDS) {
    if (!getModelProfileCandidates(systemId, field).some((profile) => profile.code === next[field])) next[field] = null
  }
  return next
}

/** Membership and role validation only; no engineering compatibility inference. */
export function validateFacadeModelInput(input: FacadeModelInput): void {
  if (!input || typeof input.name !== 'string' || !input.name.trim()) throw new Error('Въведи име на модела.')
  if (typeof input.systemId !== 'string' || !getProfileSystemById(input.systemId)) throw new Error('Избери съществуваща система.')
  for (const field of MODEL_PROFILE_FIELDS) {
    const code = input[field]
    if (code === null) continue
    if (typeof code !== 'string' || !getModelProfileCandidates(input.systemId, field).some((profile) => profile.code === code)) {
      throw new Error(`${MODEL_PROFILE_LABELS[field]}: профилът не принадлежи на избраната система или няма подходяща каталожна роля.`)
    }
  }
}

export function validateFacadeModel(value: unknown): asserts value is FacadeModel {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Невалиден запис на модел.')
  const model = value as FacadeModel
  if (model.schemaVersion !== FACADE_MODEL_SCHEMA_VERSION) throw new Error('Неподдържана версия на модел.')
  if (typeof model.id !== 'string' || !model.id.trim()) throw new Error('Липсва идентичност на модел.')
  for (const timestamp of [model.createdAt, model.updatedAt]) {
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) throw new Error('Невалидна дата на модел.')
  }
  if (Date.parse(model.updatedAt) < Date.parse(model.createdAt)) throw new Error('Невалидна последователност на датите на модел.')
  validateFacadeModelInput(model)
}

export function createFacadeModel(input: FacadeModelInput, id: string, now: string): FacadeModel {
  validateFacadeModelInput(input)
  const model: FacadeModel = {
    id, name: input.name.trim(), systemId: input.systemId,
    frameProfileCode: input.frameProfileCode, dividerProfileCode: input.dividerProfileCode, sashProfileCode: input.sashProfileCode,
    createdAt: now, updatedAt: now, schemaVersion: FACADE_MODEL_SCHEMA_VERSION,
  }
  validateFacadeModel(model)
  return model
}

export function updateFacadeModel(current: FacadeModel, input: FacadeModelInput, now: string): FacadeModel {
  validateFacadeModel(current)
  const next = { ...createFacadeModel(input, current.id, now), createdAt: current.createdAt }
  validateFacadeModel(next)
  return next
}
