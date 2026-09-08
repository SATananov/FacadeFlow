export type HardwareSourceStatus = 'human-confirmed'

export type HardwareCompatibilityStatus =
  | 'human-confirmed'
  | 'not-validated'

export type HardwareManufacturerSelection = 'unspecified'

export interface HardwareStandardOption {
  id: string
  labelBg: string
  descriptionBg: string
  sourceStatus: HardwareSourceStatus
  manufacturerSelection: HardwareManufacturerSelection
}

export interface ProfileSystemHardwareCompatibility {
  profileSystemId: string
  hardwareStandardId: string
  status: HardwareCompatibilityStatus
  grooveType: 'standard-european'
  specialHardwareRequired: boolean
  noteBg: string
}

/**
 * Human-confirmed operational hardware policy.
 *
 * The current offer-level choice is intentionally brand-neutral. A concrete
 * manufacturer, series, handle, hinge set, lock, or opening mechanism is not
 * inferred here and can be specified later when module-level rules are added.
 */
export const CONFIRMED_HARDWARE_STANDARDS: readonly HardwareStandardOption[] = [
  {
    id: 'standard-european',
    labelBg: 'Стандартен европейски обков',
    descriptionBg: 'Стандартен обковен жлеб; конкретна марка не е фиксирана',
    sourceStatus: 'human-confirmed',
    manufacturerSelection: 'unspecified',
  },
]

/**
 * Compatibility currently confirmed by the operator only for PRELUDE 60.
 * No compatibility claim is silently extended to PRESTIGE systems.
 */
const PROFILE_SYSTEM_HARDWARE_COMPATIBILITY: readonly ProfileSystemHardwareCompatibility[] = [
  {
    profileSystemId: 'kmg-prelude-60',
    hardwareStandardId: 'standard-european',
    status: 'human-confirmed',
    grooveType: 'standard-european',
    specialHardwareRequired: false,
    noteBg:
      'PRELUDE 60 използва стандартен обковен жлеб и не изисква специален или рядък механизъм.',
  },
]

export function getConfirmedHardwareStandards(): readonly HardwareStandardOption[] {
  return CONFIRMED_HARDWARE_STANDARDS
}

export function getHardwareStandardById(
  hardwareStandardId: string,
): HardwareStandardOption | undefined {
  return CONFIRMED_HARDWARE_STANDARDS.find(
    (option) => option.id === hardwareStandardId,
  )
}

export function getProfileSystemHardwareCompatibility(
  profileSystemId: string,
  hardwareStandardId: string,
): ProfileSystemHardwareCompatibility | undefined {
  return PROFILE_SYSTEM_HARDWARE_COMPATIBILITY.find(
    (item) =>
      item.profileSystemId === profileSystemId &&
      item.hardwareStandardId === hardwareStandardId,
  )
}
