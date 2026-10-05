import type { ModuleProfileResolution } from './profileResolution'

/** Explicit outcome of resolving semantic intent against selected knowledge. */
export type ProductResolutionStatus =
  | 'RESOLVED'
  | 'PARTIALLY_RESOLVED'
  | 'UNRESOLVED'

export type ProductFactMetadata = Readonly<{
  reason?: string
  affectedSketchId?: string
  requiredEvidence?: readonly string[]
  requiredUserInput?: readonly string[]
  technicalRenderingAllowed: boolean
  blocksProductionReadiness: boolean
}>

export type ResolvedProductFact<T> = Readonly<{
  status: 'RESOLVED'
  value: T
  technicalRenderingAllowed: boolean
  blocksProductionReadiness: boolean
}>

export type UnknownProductFact = Readonly<{
  status: 'UNKNOWN'
  value: null
  reason: string
  affectedSketchId?: string
  requiredEvidence?: readonly string[]
  requiredUserInput?: readonly string[]
  technicalRenderingAllowed: boolean
  blocksProductionReadiness: boolean
}>

export type UnsupportedProductFact = Readonly<{
  status: 'UNSUPPORTED'
  value: null
  reason: string
  affectedSketchId?: string
  requiredEvidence?: readonly string[]
  requiredUserInput?: readonly string[]
  technicalRenderingAllowed: boolean
  blocksProductionReadiness: boolean
}>

/** A fact can never be silently replaced with an assumption. */
export type ProductFact<T> =
  | ResolvedProductFact<T>
  | UnknownProductFact
  | UnsupportedProductFact

export type SelectedSystem = Readonly<{
  /** AUTHORITATIVE: explicit selected profile system. */
  profileSystemId: string | null
  /** AUTHORITATIVE where an existing project standard/variant is selected. */
  standardId: string | null
  /** AUTHORITATIVE explicit component/glazing selections. */
  profileResolution: ModuleProfileResolution | null
  /** Existing explicit glazing default input, if supplied by the owning offer. */
  offerDefaultGlazingId: string | null
  /** Existing explicit hardware inputs; no kit is inferred from these values. */
  hardware: Readonly<{
    standardId: string | null
    manufacturerId: string | null
  }>
}>

/** A product resolver may return diagnostics without changing either input. */
export type ProductResolution = Readonly<{
  status: ProductResolutionStatus
  blockers: readonly ProductBlocker[]
  machineReady: false
}>

export type ProductBlocker = Readonly<{
  id: string
  status: 'UNKNOWN' | 'UNSUPPORTED'
  reason: string
  affectedSketchId?: string
  requiredEvidence?: readonly string[]
  requiredUserInput?: readonly string[]
  blocksProductionReadiness: boolean
}>

export type ProductFactMetadataShape = ProductFactMetadata
