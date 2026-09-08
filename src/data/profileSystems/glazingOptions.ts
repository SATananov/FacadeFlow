export type GlazingSourceStatus = 'human-confirmed'

export type GlassCode = 'b' | 'k' | '4s'

export interface GlassCodeDefinition {
  code: GlassCode
  labelBg: string
}

export interface GlazingOption {
  id: string
  labelBg: string
  descriptionBg: string
  totalThicknessMm: number
  panes: readonly GlassCode[]
  sourceStatus: GlazingSourceStatus
}

export const GLASS_CODE_LEGEND: readonly GlassCodeDefinition[] = [
  {
    code: 'b',
    labelBg: 'бяло / обикновено стъкло',
  },
  {
    code: 'k',
    labelBg: 'стъкло за зимна топлозащита',
  },
  {
    code: '4s',
    labelBg: 'Four Seasons',
  },
]

/**
 * Human-confirmed operational glazing choices.
 *
 * The package thickness is stored exactly as stated by the operator.
 * Pane/spacer sub-thicknesses are intentionally NOT inferred.
 * Compatibility with a selected profile system is also NOT inferred from
 * manufacturer glass-bead catalogue values at this stage.
 */
export const CONFIRMED_GLAZING_OPTIONS: readonly GlazingOption[] = [
  {
    id: 'b-b-24',
    labelBg: 'б + б / 24',
    descriptionBg: 'обикновено + обикновено, 24 mm',
    totalThicknessMm: 24,
    panes: ['b', 'b'],
    sourceStatus: 'human-confirmed',
  },
  {
    id: 'b-b-32',
    labelBg: 'б + б / 32',
    descriptionBg: 'обикновено + обикновено, 32 mm',
    totalThicknessMm: 32,
    panes: ['b', 'b'],
    sourceStatus: 'human-confirmed',
  },
  {
    id: 'b-4s-24',
    labelBg: 'б + 4S / 24',
    descriptionBg: 'обикновено + Four Seasons, 24 mm',
    totalThicknessMm: 24,
    panes: ['b', '4s'],
    sourceStatus: 'human-confirmed',
  },
  {
    id: 'k-b-32',
    labelBg: 'к + б / 32',
    descriptionBg: 'зимно защитно + обикновено, 32 mm',
    totalThicknessMm: 32,
    panes: ['k', 'b'],
    sourceStatus: 'human-confirmed',
  },
  {
    id: 'k-b-4s-44',
    labelBg: 'к + б + 4S / 44',
    descriptionBg: 'зимно защитно + обикновено + Four Seasons, 44 mm',
    totalThicknessMm: 44,
    panes: ['k', 'b', '4s'],
    sourceStatus: 'human-confirmed',
  },
]

export function getConfirmedGlazingOptions(): readonly GlazingOption[] {
  return CONFIRMED_GLAZING_OPTIONS
}

export function getGlazingOptionById(
  glazingId: string,
): GlazingOption | undefined {
  return CONFIRMED_GLAZING_OPTIONS.find(
    (option) => option.id === glazingId,
  )
}
