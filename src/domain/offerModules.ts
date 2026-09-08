import type { OfferModuleDefaults } from './offerModuleDefaults'

export type ModuleProductType = 'window' | 'door'
export type ModuleInputSource = 'unset' | 'preset' | 'manual'
export type ModuleFieldType = 'fixed' | 'operable'

export const MODULE_PRODUCT_TYPE_PRESETS = [
  { id: 'window', labelBg: 'Прозорец' },
  { id: 'door', labelBg: 'Врата' },
] as const satisfies readonly {
  id: ModuleProductType
  labelBg: string
}[]


export const MODULE_FIELD_TYPE_PRESETS = [
  { id: 'fixed', labelBg: 'Фиксирано' },
  { id: 'operable', labelBg: 'Отваряемо' },
] as const satisfies readonly {
  id: ModuleFieldType
  labelBg: string
}[]

/**
 * No company-confirmed standard field widths have been supplied yet.
 * Field widths are optional and remain manual until real presets are confirmed.
 */
export const MODULE_FIELD_WIDTH_PRESETS_MM: readonly number[] = []

export interface OfferModuleFieldDraft {
  id: string
  sequence: number

  fieldType: ModuleFieldType | null
  customFieldTypeLabel: string
  fieldTypeSource: ModuleInputSource

  widthMm: number | null
  widthSource: ModuleInputSource
}

export function createOfferModuleFieldDraft(sequence: number): OfferModuleFieldDraft {
  return {
    id: `field-${sequence}`,
    sequence,
    fieldType: null,
    customFieldTypeLabel: '',
    fieldTypeSource: 'unset',
    widthMm: null,
    widthSource: 'unset',
  }
}

export function resizeOfferModuleFields(
  current: readonly OfferModuleFieldDraft[],
  fieldCount: number | null,
): OfferModuleFieldDraft[] {
  if (fieldCount === null || !Number.isFinite(fieldCount) || fieldCount <= 0) {
    return []
  }

  const normalizedCount = Math.floor(fieldCount)
  return Array.from({ length: normalizedCount }, (_, index) => {
    const sequence = index + 1
    const existing = current[index]
    return existing
      ? { ...existing, id: `field-${sequence}`, sequence }
      : createOfferModuleFieldDraft(sequence)
  })
}

export function hasOfferModuleFieldType(field: OfferModuleFieldDraft): boolean {
  if (field.fieldTypeSource === 'preset') {
    return field.fieldType !== null
  }

  if (field.fieldTypeSource === 'manual') {
    return field.customFieldTypeLabel.trim().length > 0
  }

  return false
}

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
  fields: OfferModuleFieldDraft[]
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
    fields: [],
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


export function getOfferModuleConfiguredFieldCount(
  module: OfferModuleDraft,
): number {
  return module.fields.filter(hasOfferModuleFieldType).length
}

export function areOfferModuleFieldsDescribed(
  module: OfferModuleDraft,
): boolean {
  return (
    module.fieldCount !== null &&
    module.fieldCount > 0 &&
    module.fields.length === Math.floor(module.fieldCount) &&
    module.fields.every(hasOfferModuleFieldType)
  )
}
