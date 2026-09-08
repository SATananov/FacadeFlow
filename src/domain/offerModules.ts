import type { OfferModuleDefaults } from './offerModuleDefaults'

export type ModuleProductType = 'window' | 'door'
export type ModuleInputSource = 'unset' | 'preset' | 'manual'

export const MODULE_PRODUCT_TYPE_PRESETS = [
  { id: 'window', labelBg: 'Прозорец' },
  { id: 'door', labelBg: 'Врата' },
] as const satisfies readonly {
  id: ModuleProductType
  labelBg: string
}[]

/**
 * Human-confirmed structural shortcuts. They describe only the number of
 * conceptual fields. They do not generate mullions, sashes, or geometry.
 */
export const MODULE_FIELD_COUNT_PRESETS = [1, 2, 3, 4] as const

/**
 * No company-confirmed standard module dimensions have been supplied yet.
 * Keep the preset catalog empty rather than inventing production sizes.
 */
export const MODULE_DIMENSION_PRESETS_MM: readonly number[] = []

export interface OfferModuleDraft {
  id: string
  sequence: number
  inheritedDefaults: OfferModuleDefaults

  productType: ModuleProductType | null
  customProductTypeLabel: string
  productTypeSource: ModuleInputSource

  widthMm: number | null
  widthSource: ModuleInputSource

  heightMm: number | null
  heightSource: ModuleInputSource

  fieldCount: number | null
  fieldCountSource: ModuleInputSource
}

/**
 * Creates the first human-editable module from the already confirmed
 * offer-level defaults. The inherited defaults are copied as a snapshot.
 *
 * Every module-specific value starts unset. Concept 06B intentionally allows
 * the module to remain a partial draft and does not require completion in
 * order to keep working on the offer.
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
    customProductTypeLabel: '',
    productTypeSource: 'unset',

    widthMm: null,
    widthSource: 'unset',

    heightMm: null,
    heightSource: 'unset',

    fieldCount: null,
    fieldCountSource: 'unset',
  }
}

function hasPositiveValue(value: number | null): boolean {
  return value !== null && Number.isFinite(value) && value > 0
}

export function hasOfferModuleProductType(
  module: OfferModuleDraft,
): boolean {
  if (module.productTypeSource === 'preset') {
    return module.productType !== null
  }

  if (module.productTypeSource === 'manual') {
    return module.customProductTypeLabel.trim().length > 0
  }

  return false
}

/**
 * Historical 06A completeness signal. It remains informational only and is
 * not a save gate: a module may stay incomplete as a draft.
 */
export function isOfferModuleBasicsReady(
  module: OfferModuleDraft,
): boolean {
  return (
    hasOfferModuleProductType(module) &&
    hasPositiveValue(module.widthMm) &&
    hasPositiveValue(module.heightMm)
  )
}

export function isOfferModuleStructureReady(
  module: OfferModuleDraft,
): boolean {
  return (
    isOfferModuleBasicsReady(module) &&
    hasPositiveValue(module.fieldCount)
  )
}

export function getOfferModuleMissingFields(
  module: OfferModuleDraft,
): string[] {
  const missing: string[] = []

  if (!hasOfferModuleProductType(module)) {
    missing.push('тип изделие')
  }

  if (!hasPositiveValue(module.widthMm)) {
    missing.push('ширина')
  }

  if (!hasPositiveValue(module.heightMm)) {
    missing.push('височина')
  }

  if (!hasPositiveValue(module.fieldCount)) {
    missing.push('брой полета')
  }

  return missing
}
