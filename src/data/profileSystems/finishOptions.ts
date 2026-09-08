export type FinishSourceStatus = 'human-confirmed'

export type FoilCoverage = 'both-sides' | 'exterior-only'

export type InteriorColorStatus = 'selected-finish' | 'unspecified'

export interface FoilModeOption {
  id: string
  labelBg: string
  coverage: FoilCoverage
  interiorColorStatus: InteriorColorStatus
}

export interface ProfileFinishOption {
  id: string
  labelBg: string
  sourceStatus: FinishSourceStatus
  foilModes: readonly FoilModeOption[]
}

const anthraciteFinish: ProfileFinishOption = {
  id: 'anthracite',
  labelBg: 'Антрацит',
  sourceStatus: 'human-confirmed',
  foilModes: [
    {
      id: 'both-sides',
      labelBg: 'Двустранно фолиран',
      coverage: 'both-sides',
      interiorColorStatus: 'selected-finish',
    },
    {
      id: 'exterior-only',
      labelBg: 'Външно фолиран',
      coverage: 'exterior-only',
      interiorColorStatus: 'unspecified',
    },
  ],
}

/**
 * Operational finish choices confirmed by a human operator.
 * These values are intentionally kept separate from manufacturer-catalog facts.
 * The same currently confirmed choice set is enabled for the three selectable
 * KMG systems; additional colors or system-specific restrictions can be added
 * later without changing the offer data model.
 */
const profileSystemFinishOptions: Readonly<
  Record<string, readonly ProfileFinishOption[]>
> = {
  'kmg-prelude-60': [anthraciteFinish],
  'kmg-prestige-70': [anthraciteFinish],
  'kmg-prestige-plus-70': [anthraciteFinish],
}

export function getProfileSystemFinishOptions(
  profileSystemId: string,
): readonly ProfileFinishOption[] {
  return profileSystemFinishOptions[profileSystemId] ?? []
}

export function getProfileSystemFinishOptionById(
  profileSystemId: string,
  finishId: string,
): ProfileFinishOption | undefined {
  return getProfileSystemFinishOptions(profileSystemId).find(
    (finish) => finish.id === finishId,
  )
}

export function getProfileSystemFoilModeById(
  profileSystemId: string,
  finishId: string,
  foilModeId: string,
): FoilModeOption | undefined {
  return getProfileSystemFinishOptionById(
    profileSystemId,
    finishId,
  )?.foilModes.find((mode) => mode.id === foilModeId)
}
