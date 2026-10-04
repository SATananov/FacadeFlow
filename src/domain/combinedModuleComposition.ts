import type { CombinedModuleLayout } from './offerModules'

export type CombinedRegionRole = 'WINDOW_REGION' | 'DOOR_REGION'

export type CombinedModuleRegion = {
  id: string
  order: number
  role: CombinedRegionRole
  fieldId: string | null
}

export type CombinedModuleZeroDivider = {
  id: string
  boundaryId: string
  leftRegionId: string
  rightRegionId: string
  kind: 'ZERO_DIVIDER'
}

export type CombinedModuleComposition = {
  schemaVersion: 'combined-composition-01'
  layout: CombinedModuleLayout
  regions: CombinedModuleRegion[]
  zeroDividers: CombinedModuleZeroDivider[]
}

export function cloneCombinedModuleComposition(
  value: CombinedModuleComposition | null | undefined,
): CombinedModuleComposition | null {
  return value ? structuredClone(value) : null
}

export function createIncompleteCombinedComposition(
  layout: CombinedModuleLayout,
): CombinedModuleComposition {
  const roles = layout === 'window-left'
    ? ['WINDOW_REGION', 'DOOR_REGION'] as const
    : layout === 'window-right'
      ? ['DOOR_REGION', 'WINDOW_REGION'] as const
      : ['WINDOW_REGION', 'DOOR_REGION', 'WINDOW_REGION'] as const
  return {
    schemaVersion: 'combined-composition-01',
    layout,
    regions: roles.map((role, index) => ({
      id: `combined-region-${index + 1}`,
      order: index + 1,
      role,
      fieldId: null,
    })),
    zeroDividers: [],
  }
}

/** Phase C semantic adjacency without a Constructor split or boundary position. */
export function createCombinedRegionComposition(
  layout: CombinedModuleLayout,
): CombinedModuleComposition {
  const composition = createIncompleteCombinedComposition(layout)
  composition.zeroDividers = composition.regions.slice(0, -1).map((region, index) => ({
    id: `combined-zero-divider-relation-${index + 1}`,
    boundaryId: `combined-zero-divider-${index + 1}`,
    leftRegionId: region.id,
    rightRegionId: composition.regions[index + 1].id,
    kind: 'ZERO_DIVIDER',
  }))
  return composition
}

export function isCombinedCompositionComplete(value: CombinedModuleComposition | null | undefined): boolean {
  if (!value) return false
  const expectedBoundaryCount = value.layout === 'window-both' ? 2 : 1
  return value.regions.length === (value.layout === 'window-both' ? 3 : 2)
    && value.zeroDividers.length === expectedBoundaryCount
    && value.regions.every((region) => region.fieldId !== null)
}
