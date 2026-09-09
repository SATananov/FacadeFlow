import { getProfileSystemHardwareCompatibility } from '../data/profileSystems/hardwareOptions'

export const HARDWARE_REQUIREMENTS_VERSION = 'hardware-requirements-02a' as const

export type HardwareResolvableField = {
  id: string
  fieldType: 'fixed' | 'operable' | null
  openingMode: 'side-hinged' | 'tilt' | 'tilt-turn' | null
  openingHanding: 'left' | 'right' | null
}

export type HardwareRequirementStatus =
  | 'not-applicable'
  | 'missing-data'
  | 'unconfirmed'
  | 'ready-for-kit-resolution'

export type FieldHardwareRequirements = {
  version: typeof HARDWARE_REQUIREMENTS_VERSION
  fieldId: string
  status: HardwareRequirementStatus
  openingMode: HardwareResolvableField['openingMode']
  openingHanding: HardwareResolvableField['openingHanding']
  handingRequired: boolean
  hardwareStandardId: string | null
  profileSystemCompatibility: 'human-confirmed' | 'not-validated' | 'missing'
  missing: readonly string[]
  noteBg: string
  machineReady: false
}

export function buildFieldHardwareRequirements(args: {
  field: HardwareResolvableField
  profileSystemId: string | null | undefined
  hardwareStandardId: string | null | undefined
}): FieldHardwareRequirements {
  const { field, profileSystemId, hardwareStandardId } = args

  if (field.fieldType === 'fixed') {
    return {
      version: HARDWARE_REQUIREMENTS_VERSION,
      fieldId: field.id,
      status: 'not-applicable',
      openingMode: null,
      openingHanding: null,
      handingRequired: false,
      hardwareStandardId: hardwareStandardId || null,
      profileSystemCompatibility: 'missing',
      missing: [],
      noteBg: 'FIX полето не изисква отваряем hardware kit.',
      machineReady: false,
    }
  }

  const missing: string[] = []
  if (field.fieldType !== 'operable') missing.push('FIELD_TYPE')
  if (field.fieldType === 'operable' && !field.openingMode) missing.push('OPENING_MODE')

  const handingRequired =
    field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn'
  if (field.fieldType === 'operable' && handingRequired && !field.openingHanding) {
    missing.push('OPENING_HANDING')
  }
  if (!profileSystemId) missing.push('PROFILE_SYSTEM')
  if (!hardwareStandardId) missing.push('HARDWARE_STANDARD')

  const compatibility = profileSystemId && hardwareStandardId
    ? getProfileSystemHardwareCompatibility(profileSystemId, hardwareStandardId)
    : undefined

  if (missing.length > 0) {
    return {
      version: HARDWARE_REQUIREMENTS_VERSION,
      fieldId: field.id,
      status: 'missing-data',
      openingMode: field.openingMode,
      openingHanding: field.openingHanding,
      handingRequired,
      hardwareStandardId: hardwareStandardId || null,
      profileSystemCompatibility: compatibility?.status ?? 'missing',
      missing,
      noteBg: `Липсва: ${missing.join(', ')}. FacadeFlow не избира hardware kit автоматично.`,
      machineReady: false,
    }
  }

  if (!compatibility || compatibility.status !== 'human-confirmed') {
    return {
      version: HARDWARE_REQUIREMENTS_VERSION,
      fieldId: field.id,
      status: 'unconfirmed',
      openingMode: field.openingMode,
      openingHanding: field.openingHanding,
      handingRequired,
      hardwareStandardId: hardwareStandardId || null,
      profileSystemCompatibility: compatibility?.status ?? 'missing',
      missing: [],
      noteBg: 'Opening semantics са налични, но profile-system ↔ hardware-standard съвместимостта не е human-confirmed.',
      machineReady: false,
    }
  }

  return {
    version: HARDWARE_REQUIREMENTS_VERSION,
    fieldId: field.id,
    status: 'ready-for-kit-resolution',
    openingMode: field.openingMode,
    openingHanding: field.openingHanding,
    handingRequired,
    hardwareStandardId: hardwareStandardId || null,
    profileSystemCompatibility: compatibility.status,
    missing: [],
    noteBg: 'Opening requirements са достатъчни за бъдещо търсене на съвместими hardware kits. Конкретен kit още НЕ е избран.',
    machineReady: false,
  }
}
