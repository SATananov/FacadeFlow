import type { OfferModuleDefaults } from './offerModuleDefaults'

export type ModuleProductType = 'window' | 'door'
export type ModuleInputSource = 'unset' | 'preset' | 'manual' | 'constructor'
export type ModuleFieldType = 'fixed' | 'operable'
export type ModuleOpeningMode = 'side-hinged' | 'tilt' | 'tilt-turn'
export type ModuleOpeningHanding = 'left' | 'right'

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
 * Confirmed conceptual opening modes for an operable field.
 * These describe behavior only. Hinge side / handing remains intentionally
 * separate and is not inferred in Concept 06D.
 */
export const MODULE_OPENING_MODE_PRESETS = [
  { id: 'side-hinged', labelBg: 'Странично' },
  { id: 'tilt', labelBg: 'Падащо' },
  { id: 'tilt-turn', labelBg: 'Странично + падащо' },
] as const satisfies readonly {
  id: ModuleOpeningMode
  labelBg: string
}[]


/**
 * Optional human-entered working handing for opening modes that use a side.
 * Left/right is intentionally NOT treated as production geometry yet because
 * the reference viewing side has not been standardized in Concept 06E.
 */
export const MODULE_OPENING_HANDING_PRESETS = [
  { id: 'left', labelBg: 'Ляво' },
  { id: 'right', labelBg: 'Дясно' },
] as const satisfies readonly {
  id: ModuleOpeningHanding
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
  /** Stable identity of the canonical Constructor FIELD when topology is authoritative. */
  constructionFieldId: string | null

  fieldType: ModuleFieldType | null
  customFieldTypeLabel: string
  fieldTypeSource: ModuleInputSource

  widthMm: number | null
  widthSource: ModuleInputSource

  openingMode: ModuleOpeningMode | null
  customOpeningModeLabel: string
  openingModeSource: ModuleInputSource

  openingHanding: ModuleOpeningHanding | null
  customOpeningHandingLabel: string
  openingHandingSource: ModuleInputSource
}

export function createOfferModuleFieldDraft(sequence: number): OfferModuleFieldDraft {
  return {
    id: `field-${sequence}`,
    sequence,
    constructionFieldId: null,
    fieldType: null,
    customFieldTypeLabel: '',
    fieldTypeSource: 'unset',
    widthMm: null,
    widthSource: 'unset',

    openingMode: null,
    customOpeningModeLabel: '',
    openingModeSource: 'unset',

    openingHanding: null,
    customOpeningHandingLabel: '',
    openingHandingSource: 'unset',
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
  if (field.fieldTypeSource === 'preset' || field.fieldTypeSource === 'constructor') {
    return field.fieldType !== null
  }

  if (field.fieldTypeSource === 'manual') {
    return field.customFieldTypeLabel.trim().length > 0
  }

  return false
}

export function isOfferModuleFieldOperable(
  field: OfferModuleFieldDraft,
): boolean {
  return (
    (field.fieldTypeSource === 'preset' || field.fieldTypeSource === 'constructor') &&
    field.fieldType === 'operable'
  )
}

export function hasOfferModuleOpeningMode(
  field: OfferModuleFieldDraft,
): boolean {
  if (!isOfferModuleFieldOperable(field)) {
    return false
  }

  if (field.openingModeSource === 'preset' || field.openingModeSource === 'constructor') {
    return field.openingMode !== null
  }

  if (field.openingModeSource === 'manual') {
    return field.customOpeningModeLabel.trim().length > 0
  }

  return false
}


export function isOfferModuleOpeningHandingRelevant(
  field: OfferModuleFieldDraft,
): boolean {
  if (!isOfferModuleFieldOperable(field)) {
    return false
  }

  if (field.openingModeSource === 'manual') {
    return true
  }

  return (
    (field.openingModeSource === 'preset' || field.openingModeSource === 'constructor') &&
    (field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn')
  )
}

export function hasOfferModuleOpeningHanding(
  field: OfferModuleFieldDraft,
): boolean {
  if (!isOfferModuleOpeningHandingRelevant(field)) {
    return false
  }

  if (field.openingHandingSource === 'preset' || field.openingHandingSource === 'constructor') {
    return field.openingHanding !== null
  }

  if (field.openingHandingSource === 'manual') {
    return field.customOpeningHandingLabel.trim().length > 0
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
export function createOfferModule(
  defaults: OfferModuleDefaults,
  sequence: number,
  id: string = globalThis.crypto.randomUUID(),
): OfferModuleDraft {
  const safeSequence = Math.max(1, Math.floor(sequence))

  return {
    id,
    sequence: safeSequence,
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

export function createFirstOfferModule(
  defaults: OfferModuleDefaults,
): OfferModuleDraft {
  return createOfferModule(defaults, 1)
}

function hasPositiveValue(value: number | null): boolean {
  return value !== null && Number.isFinite(value) && value > 0
}

export function hasOfferModuleProductType(
  module: OfferModuleDraft,
): boolean {
  if (module.productTypeSource === 'preset' || module.productTypeSource === 'constructor') {
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

export function getOfferModuleOperableFieldCount(
  module: OfferModuleDraft,
): number {
  return module.fields.filter(isOfferModuleFieldOperable).length
}

export function getOfferModuleConfiguredOpeningCount(
  module: OfferModuleDraft,
): number {
  return module.fields.filter(hasOfferModuleOpeningMode).length
}


export function getOfferModuleHandingRelevantFieldCount(
  module: OfferModuleDraft,
): number {
  return module.fields.filter(isOfferModuleOpeningHandingRelevant).length
}

export function getOfferModuleConfiguredHandingCount(
  module: OfferModuleDraft,
): number {
  return module.fields.filter(hasOfferModuleOpeningHanding).length
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


export interface OfferModuleTopologyFieldInput {
  id: string
  sequence: number
  widthMm: number
  fieldType?: ModuleFieldType | null
  openingMode?: ModuleOpeningMode | null
  openingHanding?: ModuleOpeningHanding | null
}

function isPendingFieldDescriptionSource(source: ModuleInputSource): boolean {
  return source === 'preset' || source === 'manual'
}

/**
 * A pre-Constructor FIELD description remains pending only while it still
 * carries form-owned semantics that have not yet become canonical topology.
 * Constructor-owned and unset values are projections, not pending input.
 */
export function hasPendingOfferModuleFieldDescription(
  field: OfferModuleFieldDraft,
): boolean {
  return (
    isPendingFieldDescriptionSource(field.fieldTypeSource) ||
    isPendingFieldDescriptionSource(field.openingModeSource) ||
    isPendingFieldDescriptionSource(field.openingHandingSource)
  )
}

function clearConstructorOwnedFieldSemantics(
  field: OfferModuleFieldDraft,
): OfferModuleFieldDraft {
  return {
    ...field,
    widthMm: null,
    widthSource: 'unset',
    fieldType: field.fieldTypeSource === 'constructor' ? null : field.fieldType,
    customFieldTypeLabel: field.fieldTypeSource === 'constructor' ? '' : field.customFieldTypeLabel,
    fieldTypeSource: field.fieldTypeSource === 'constructor' ? 'unset' : field.fieldTypeSource,
    openingMode: field.openingModeSource === 'constructor' ? null : field.openingMode,
    customOpeningModeLabel: field.openingModeSource === 'constructor' ? '' : field.customOpeningModeLabel,
    openingModeSource: field.openingModeSource === 'constructor' ? 'unset' : field.openingModeSource,
    openingHanding: field.openingHandingSource === 'constructor' ? null : field.openingHanding,
    customOpeningHandingLabel: field.openingHandingSource === 'constructor' ? '' : field.customOpeningHandingLabel,
    openingHandingSource: field.openingHandingSource === 'constructor' ? 'unset' : field.openingHandingSource,
  }
}

/**
 * Synchronizes the offer-side FIELD drafts with the canonical Constructor
 * topology. Constructor geometry owns field count/order/width from this point.
 * Existing semantic values are preserved only when the same construction FIELD
 * identity still exists; newly created child fields intentionally start without
 * inherited FIX/opening assumptions.
 */
export function syncOfferModuleFieldsFromTopology(
  current: readonly OfferModuleFieldDraft[],
  topologyFields: readonly OfferModuleTopologyFieldInput[],
): OfferModuleFieldDraft[] {
  const byConstructionId = new Map(
    current
      .filter((field) => field.constructionFieldId !== null)
      .map((field) => [field.constructionFieldId as string, field] as const),
  )
  const bySequence = new Map(current.map((field) => [field.sequence, field] as const))
  const sequenceHandoffAllowed = current.length === topologyFields.length

  return topologyFields.map((topologyField) => {
    const existing = byConstructionId.get(topologyField.id)
      ?? (sequenceHandoffAllowed ? bySequence.get(topologyField.sequence) : undefined)
    const base = existing
      ? { ...existing }
      : createOfferModuleFieldDraft(topologyField.sequence)

    const constructorFieldType = topologyField.fieldType ?? null
    const pendingFieldType = constructorFieldType === null && hasPendingOfferModuleFieldDescription(base)
      ? base.fieldType
      : null
    const effectiveFieldType = constructorFieldType ?? pendingFieldType

    const constructorOpeningMode =
      constructorFieldType === 'operable' ? topologyField.openingMode ?? null : null
    const pendingOpeningMode =
      constructorOpeningMode === null && effectiveFieldType === 'operable' && isPendingFieldDescriptionSource(base.openingModeSource)
        ? base.openingMode
        : null
    const effectiveOpeningMode = constructorOpeningMode ?? pendingOpeningMode

    const constructorOpeningHanding =
      constructorFieldType === 'operable' &&
      (constructorOpeningMode === 'side-hinged' || constructorOpeningMode === 'tilt-turn')
        ? topologyField.openingHanding ?? null
        : null
    return {
      ...base,
      id: `field-${topologyField.sequence}`,
      sequence: topologyField.sequence,
      constructionFieldId: topologyField.id,
      widthMm: Math.round(topologyField.widthMm),
      widthSource: 'constructor',
      fieldType: constructorFieldType ?? base.fieldType,
      customFieldTypeLabel: constructorFieldType ? '' : base.customFieldTypeLabel,
      fieldTypeSource: constructorFieldType ? 'constructor' : base.fieldTypeSource,
      openingMode: constructorOpeningMode ?? (effectiveFieldType === 'operable' ? base.openingMode : null),
      customOpeningModeLabel: constructorOpeningMode ? '' : effectiveFieldType === 'operable' ? base.customOpeningModeLabel : '',
      openingModeSource: constructorOpeningMode ? 'constructor' : effectiveFieldType === 'operable' ? base.openingModeSource : 'unset',
      openingHanding: constructorOpeningHanding ?? (
        effectiveFieldType === 'operable' &&
        (effectiveOpeningMode === 'side-hinged' || effectiveOpeningMode === 'tilt-turn')
          ? base.openingHanding
          : null
      ),
      customOpeningHandingLabel: constructorOpeningHanding
        ? ''
        : effectiveFieldType === 'operable' &&
          (effectiveOpeningMode === 'side-hinged' || effectiveOpeningMode === 'tilt-turn')
          ? base.customOpeningHandingLabel
          : '',
      openingHandingSource: constructorOpeningHanding
        ? 'constructor'
        : effectiveFieldType === 'operable' &&
          (effectiveOpeningMode === 'side-hinged' || effectiveOpeningMode === 'tilt-turn')
          ? base.openingHandingSource
          : 'unset',
    }
  })
}

/**
 * Keeps only unresolved form semantics beside an authoritative topology.
 * Geometry-derived width/count data never survives here. When topology FIELD
 * count does not yet match the form FIELD count, every semantic description is
 * retained without creating dividers or guessing geometry.
 */
export function retainPendingOfferModuleFieldDescriptions(
  current: readonly OfferModuleFieldDraft[],
  topologyFields: readonly OfferModuleTopologyFieldInput[],
): OfferModuleFieldDraft[] {
  if (current.length === 0) return []

  const source = current.length === topologyFields.length
    ? syncOfferModuleFieldsFromTopology(current, topologyFields)
    : current.map((field) => ({ ...field }))

  const pending = source.map(clearConstructorOwnedFieldSemantics)
  return pending.some(hasPendingOfferModuleFieldDescription) ? pending : []
}
