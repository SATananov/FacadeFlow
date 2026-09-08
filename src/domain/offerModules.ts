import type { OfferModuleDefaults } from './offerModuleDefaults'

export type ModuleProductType = 'window' | 'door'

export interface OfferModuleDraft {
  id: string
  sequence: number
  inheritedDefaults: OfferModuleDefaults
  productType: ModuleProductType | null
  widthMm: number | null
  heightMm: number | null
}

/**
 * Creates the first human-editable module from the already confirmed
 * offer-level defaults. The inherited defaults are copied as a snapshot.
 *
 * This is intentionally not a geometry generator: no sash layout, opening
 * direction, hardware kit, profile cutting, or machine output is inferred.
 */
export function createFirstOfferModule(
  defaults: OfferModuleDefaults,
): OfferModuleDraft {
  return {
    id: 'module-1',
    sequence: 1,
    inheritedDefaults: { ...defaults },
    productType: null,
    widthMm: null,
    heightMm: null,
  }
}

export function isOfferModuleBasicsReady(
  module: OfferModuleDraft,
): boolean {
  return (
    module.productType !== null &&
    module.widthMm !== null &&
    module.widthMm > 0 &&
    module.heightMm !== null &&
    module.heightMm > 0
  )
}
