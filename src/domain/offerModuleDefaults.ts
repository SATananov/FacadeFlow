export type OfferModuleDefaultsInheritanceMode = 'inherit-offer-defaults'

export interface OfferModuleDefaults {
  inheritanceMode: OfferModuleDefaultsInheritanceMode
  profileSystemId: string
  colorId: string
  foilModeId: string
  glazingId: string
  hardwareStandardId: string
  hardwareManufacturerId: 'unspecified'
}

export interface OfferModuleDefaultsInput {
  profileSystemId: string
  colorId: string
  foilModeId: string
  glazingId: string
  hardwareStandardId: string
  hardwareManufacturerId: 'unspecified'
}

/**
 * Canonical offer-level defaults that a future module starts from.
 *
 * This function does not create geometry and does not make module-specific
 * hardware decisions. It only preserves the common technical selections made
 * before the module workflow starts.
 */
export function buildOfferModuleDefaults(
  input: OfferModuleDefaultsInput,
): OfferModuleDefaults {
  return {
    inheritanceMode: 'inherit-offer-defaults',
    ...input,
  }
}
