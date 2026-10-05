import type { CombinedModuleComposition } from './combinedModuleComposition'
import type {
  ConstructionFieldDefinition,
  ConstructionModel,
  ConstructionFrameEdgeKind,
} from './construction'
import type { ModuleProductType } from './offerModules'

/**
 * AUTHORITATIVE SKETCH CONTRACT 02
 *
 * ConstructionModel remains the sole owner of sketch topology and geometry.
 * This type is only the universal semantic envelope around that model; it
 * deliberately does not copy frame, field, divider, or coordinate data.
 */
export type SemanticSketch = Readonly<{
  moduleId: string
  topology: ConstructionModel
  productIntent: Readonly<{
    productType: ModuleProductType | null
  }>
  combinedComposition: CombinedModuleComposition | null
}>

/** Stable identity references derived from the authoritative topology. */
export type SemanticSketchReference = Readonly<{
  sketchId: string
  kind: 'module' | 'field' | 'divider' | 'region'
}>

/**
 * Semantic values are intentionally references/intent, not physical
 * realizations. A null value means the user has not explicitly defined it.
 */
export type SemanticFieldIntent = Readonly<Pick<
  ConstructionFieldDefinition,
  'id' | 'fieldType' | 'openingMode' | 'openingHanding'
>>

export type SemanticBottomBoundaryIntent = Readonly<{
  edge: 'bottom'
  kind: ConstructionFrameEdgeKind
}>

export type SemanticSketchInputReferences = Readonly<{
  module: SemanticSketchReference
  fields: readonly SemanticSketchReference[]
  dividers: readonly SemanticSketchReference[]
  regions: readonly SemanticSketchReference[]
  bottomBoundary: SemanticBottomBoundaryIntent
}>

/**
 * A future adapter boundary only. CompositeModuleStructure is not migrated,
 * reinterpreted, or made authoritative by this contract.
 */
export type LegacyCompositeSketchBoundary = Readonly<{
  kind: 'legacy-composite-module-structure'
  moduleId: string
  source: 'CompositeModuleStructure'
}>
