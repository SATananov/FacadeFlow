import { getProfileSystemById } from '../data/profileSystems/catalog'
import type { ProfileSystemId } from '../data/profileSystems/catalog'
import type { Side } from './assembly/assemblyModel'
import type { ConstructionFieldDefinition } from './construction/constructionModel'
import type { ModuleProductType } from './offerModules'

export const COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION = 2 as const
export const COMPOSITE_MODULE_STRUCTURE_SAFETY = {
  automaticGeometry: false,
  rulesValidated: false,
  machineReady: false,
  zeroDividerExactGeometry: 'UNKNOWN',
  frameToFrameCompatibility: 'HUMAN REVIEW',
  exactCutOverlapInset: 'UNKNOWN',
  automaticPlacement: false,
  framePartPlacement: 'HUMAN DEFINED',
} as const

export type CompositeFramePartFunction = ModuleProductType | null
/** All four sides are explicit human/domain input, independent of function. */
export type FrameSides = Record<Side, boolean>

export type FramePartPlacement = {
  order: number | null
  verticalAlignment: 'TOP' | 'BOTTOM' | null
}

type FramePartData = {
  readonly id: string
  function: CompositeFramePartFunction
  widthMm: number
  heightMm: number
  frameProfileCode: string | null
  frameSides: FrameSides
  /** References only; no FIELD geometry or second ConstructionModel. */
  fieldIds: readonly ConstructionFieldDefinition['id'][]
}

export type LegacyCompositeFramePart = FramePartData & { placement?: never }
export type CompositeFramePart = FramePartData & { placement: FramePartPlacement }

export type FramePartConnection = {
  readonly id: string
  fromFramePartId: CompositeFramePart['id']
  toFramePartId: CompositeFramePart['id']
  /** Undirected structural relationship, NOT a mullion/profile assignment. */
  kind: 'ZERO_DIVIDER'
}

type CompositeStructureData = {
  /** Single authority for every part's catalogue membership. */
  systemId: ProfileSystemId
  connections: readonly FramePartConnection[]
}
export type CurrentCompositeModuleStructure = CompositeStructureData & {
  schemaVersion: typeof COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION
  frameParts: readonly CompositeFramePart[]
}
export type CompositeModuleStructure = CurrentCompositeModuleStructure | (CompositeStructureData & {
  schemaVersion: 1
  frameParts: readonly LegacyCompositeFramePart[]
})

type ObjectValue = Record<string, unknown>
function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid composite module structure: ${message}`)
}
function objectWithKeys(value: unknown, keys: readonly string[], path: string): ObjectValue {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), `${path}: expected object`)
  const object = value as ObjectValue
  requireThat(keys.every((key) => Object.hasOwn(object, key)), `${path}: missing explicit property`)
  requireThat(Object.keys(object).every((key) => keys.includes(key)), `${path}: unexpected property`)
  return object
}
function requireId(value: unknown, path: string): asserts value is string {
  requireThat(typeof value === 'string' && value.length > 0 && value.trim() === value, `${path}: invalid reference ID`)
}
function requireDimension(value: unknown, path: string): void {
  requireThat(typeof value === 'number' && Number.isFinite(value) && value > 0, `${path}: expected finite positive dimension`)
}

/**
 * Structural integrity only. Success does not confirm engineering compatibility.
 * No defaults, inferred frame sides, geometry, total dimensions or mutations.
 * FIELD IDs are checked for unambiguous ownership within this structure; their
 * existence in a Constructor context is left to a future integration boundary.
 */
export function validateCompositeModuleStructure(value: unknown): asserts value is CompositeModuleStructure {
  const structure = objectWithKeys(value, ['schemaVersion', 'systemId', 'frameParts', 'connections'], 'structure')
  requireThat(structure.schemaVersion === 1 || structure.schemaVersion === COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION, 'unsupported schemaVersion')
  requireThat(typeof structure.systemId === 'string', 'systemId: expected string')
  const system = getProfileSystemById(structure.systemId)
  requireThat(system, 'systemId: system not found')
  requireThat(Array.isArray(structure.frameParts) && structure.frameParts.length > 0, 'frameParts: expected at least one part')
  requireThat(Array.isArray(structure.connections), 'connections: expected array')

  const partIds = new Set<string>()
  const fieldIds = new Set<string>()
  const orders = new Set<number>()
  for (const [index, value] of structure.frameParts.entries()) {
    const path = `frameParts[${index}]`
    const part = objectWithKeys(value, ['id', 'function', 'widthMm', 'heightMm', 'frameProfileCode', 'frameSides', 'fieldIds',
      ...(structure.schemaVersion === 2 ? ['placement'] : [])], path)
    if (structure.schemaVersion === 2) {
      const placement = objectWithKeys(part.placement, ['order', 'verticalAlignment'], `${path}.placement`)
      const order = placement.order
      requireThat(order === null || (typeof order === 'number' && Number.isSafeInteger(order) && order > 0), `${path}.placement.order: expected positive safe integer or null`)
      requireThat(placement.verticalAlignment === null || placement.verticalAlignment === 'TOP' || placement.verticalAlignment === 'BOTTOM', `${path}.placement.verticalAlignment: unsupported alignment`)
      if (order !== null) {
        requireThat(!orders.has(order), `${path}.placement.order: duplicate order`)
        orders.add(order)
      }
    }
    requireId(part.id, `${path}.id`)
    requireThat(!partIds.has(part.id), `${path}: duplicate frame part ID`)
    partIds.add(part.id)
    requireThat(part.function === null || part.function === 'window' || part.function === 'door', `${path}: invalid function`)
    requireDimension(part.widthMm, `${path}.widthMm`)
    requireDimension(part.heightMm, `${path}.heightMm`)

    const sides = objectWithKeys(part.frameSides, ['top', 'right', 'bottom', 'left'] satisfies Side[], `${path}.frameSides`)
    for (const [side, present] of Object.entries(sides)) {
      requireThat(typeof present === 'boolean', `${path}.frameSides.${side}: expected explicit boolean`)
    }
    if (part.frameProfileCode !== null) {
      requireThat(typeof part.frameProfileCode === 'string', `${path}.frameProfileCode: expected code or null`)
      const profile = system.mainProfiles.find((profile) => profile.code === part.frameProfileCode)
      requireThat(profile, `${path}.frameProfileCode: profile not in module system`)
      requireThat(profile.role === 'frame', `${path}.frameProfileCode: expected catalogue frame role`)
    }

    requireThat(Array.isArray(part.fieldIds), `${path}.fieldIds: expected reference array`)
    for (const fieldId of part.fieldIds) {
      requireId(fieldId, `${path}.fieldIds`)
      requireThat(!fieldIds.has(fieldId), `${path}: duplicate or ambiguous FIELD reference`)
      fieldIds.add(fieldId)
    }
  }

  const connectionIds = new Set<string>()
  const pairs = new Set<string>()
  for (const [index, value] of structure.connections.entries()) {
    const path = `connections[${index}]`
    const connection = objectWithKeys(value, ['id', 'fromFramePartId', 'toFramePartId', 'kind'], path)
    requireId(connection.id, `${path}.id`)
    requireThat(!connectionIds.has(connection.id), `${path}: duplicate connection ID`)
    connectionIds.add(connection.id)
    requireThat(connection.kind === 'ZERO_DIVIDER', `${path}: unsupported connection kind`)
    requireId(connection.fromFramePartId, `${path}.fromFramePartId`)
    requireId(connection.toFramePartId, `${path}.toFramePartId`)
    requireThat(partIds.has(connection.fromFramePartId) && partIds.has(connection.toFramePartId), `${path}: missing frame part endpoint`)
    requireThat(connection.fromFramePartId !== connection.toFramePartId, `${path}: self connection`)
    // JSON tuples avoid delimiter collisions. Reversing endpoints is equivalent.
    const pair = JSON.stringify([connection.fromFramePartId, connection.toFramePartId].sort())
    requireThat(!pairs.has(pair), `${path}: duplicate equivalent connection`)
    pairs.add(pair)
  }
}

/** Copies explicit input and preserves caller-supplied stable IDs. No auto layout. */
export function createCompositeModuleStructure(
  input: Omit<CurrentCompositeModuleStructure, 'schemaVersion'>,
): CurrentCompositeModuleStructure {
  const structure = { ...input, schemaVersion: COMPOSITE_MODULE_STRUCTURE_SCHEMA_VERSION }
  validateCompositeModuleStructure(structure)
  return structuredClone(structure)
}

/** Detached editor migration only. Loading a project never rewrites saved data or history. */
export function upgradeCompositeModuleStructure(value: CompositeModuleStructure): CurrentCompositeModuleStructure {
  validateCompositeModuleStructure(value)
  if (value.schemaVersion === 2) return structuredClone(value)
  return createCompositeModuleStructure({ ...value,
    frameParts: value.frameParts.map((part) => ({ ...part, placement: { order: null, verticalAlignment: null } })),
  })
}
/** Read-only legacy view: unknown placement is never derived from array position. */
export function getFramePartPlacement(part: CompositeFramePart | LegacyCompositeFramePart): FramePartPlacement {
  return part.placement ? { ...part.placement } : { order: null, verticalAlignment: null }
}
