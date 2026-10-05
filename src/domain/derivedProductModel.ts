import type { ModuleProductType } from './offerModules'
import type { SemanticSketch } from './semanticSketch'
import type {
  ProductBlocker,
  ProductFact,
  ProductResolutionStatus,
  SelectedSystem,
} from './productResolution'

/**
 * DERIVED PRODUCT CONTRACT 02
 *
 * Product elements reference canonical sketch identities. They intentionally
 * contain no authoritative coordinates, dimensions, profile placement, cuts,
 * overlap, inset, handing geometry, or other invented physical facts.
 */
export type DerivedSketchElementReference = Readonly<{
  sketchId: string
  kind: 'module' | 'field' | 'divider' | 'region'
  role: string
}>

export type DerivedProductModel = Readonly<{
  version: 'derived-product-model-contract-02'
  moduleId: string
  sketch: Pick<SemanticSketch, 'moduleId'>
  system: Pick<SelectedSystem, 'profileSystemId' | 'standardId'>
  productType: ModuleProductType | null
  resolutionStatus: ProductResolutionStatus

  frame: ProductFact<DerivedSketchElementReference>
  members: readonly ProductFact<DerivedSketchElementReference>[]
  dividers: readonly ProductFact<DerivedSketchElementReference>[]
  fields: readonly ProductFact<DerivedSketchElementReference>[]
  sashIntent: readonly ProductFact<DerivedSketchElementReference>[]
  glazing: readonly ProductFact<DerivedSketchElementReference>[]
  beads: readonly ProductFact<DerivedSketchElementReference>[]
  openings: readonly ProductFact<DerivedSketchElementReference>[]
  hardware: readonly ProductFact<DerivedSketchElementReference>[]
  bottomBoundaries: readonly ProductFact<DerivedSketchElementReference>[]
  blockers: readonly ProductBlocker[]

  /** Safety boundary: this contract cannot claim machine readiness. */
  machineReady: false
}>

/**
 * The product model is an output of resolution only. Resolvers must return a
 * new value and must not mutate SemanticSketch or SelectedSystem.
 */
export type DerivedProductResolution = Readonly<{
  model: DerivedProductModel
  sourceSketchModuleId: string
  sourceProfileSystemId: string | null
  status: ProductResolutionStatus
  machineReady: false
}>
