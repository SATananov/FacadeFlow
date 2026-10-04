import type { CombinedModuleLayout } from '../domain/offerModules'
import type { ResolvedCombinedRegionGeometry } from '../domain/combinedRegionGeometry'

export type CombinedTechnicalDimensionLayout = {
  regionWidths: Array<{ regionId: string; startMm: number; endMm: number; yMm: number }>
  regionWidthExtensions: Array<{ xMm: number; startMm: number }>
  totalWidth: { startMm: number; endMm: number; yMm: number; startEdgeBottomMm: number; endEdgeBottomMm: number }
  regionHeights: Array<{ regionId: string; side: 'left' | 'right'; xMm: number; startMm: number; endMm: number }>
  totalHeight: { xMm: number; startMm: number; endMm: number } | null
  extensionOverrunMm: number
}

export const COMBINED_REGION_CHAIN_OFFSET_MM = 48
export const COMBINED_OVERALL_CHAIN_SEPARATION_MM = 160
export const COMBINED_VERTICAL_DIMENSION_OFFSET_MM = 72
export const COMBINED_DIMENSION_EXTENSION_OVERRUN_MM = 2

/** Presentation coordinates only; all measurements are read from resolved geometry. */
export function layoutCombinedTechnicalDimensions(
  layout: CombinedModuleLayout,
  resolved: ResolvedCombinedRegionGeometry,
  regionChainOffsetMm = COMBINED_REGION_CHAIN_OFFSET_MM,
  overallChainSeparationMm = COMBINED_OVERALL_CHAIN_SEPARATION_MM,
  verticalDimensionOffsetMm = COMBINED_VERTICAL_DIMENSION_OFFSET_MM,
  extensionOverrunMm = COMBINED_DIMENSION_EXTENSION_OVERRUN_MM,
): CombinedTechnicalDimensionLayout | null {
  if (resolved.status !== 'complete' || !resolved.extent || resolved.regions.length === 0
    || resolved.regions.length !== (layout === 'window-both' ? 3 : 2)
    || !Number.isFinite(regionChainOffsetMm) || regionChainOffsetMm <= 0
    || !Number.isFinite(overallChainSeparationMm) || overallChainSeparationMm <= 0
    || !Number.isFinite(verticalDimensionOffsetMm) || verticalDimensionOffsetMm <= 0
    || !Number.isFinite(extensionOverrunMm) || extensionOverrunMm < 0) return null

  const extent = resolved.extent
  const localRight = extent.xMm + extent.widthMm
  const localBottom = extent.yMm + extent.heightMm
  const firstRegion = resolved.regions[0]
  const lastRegion = resolved.regions[resolved.regions.length - 1]
  const regionWidths = resolved.regions.map(({ regionId, bounds }) => ({
    regionId,
    startMm: bounds.xMm,
    endMm: bounds.xMm + bounds.widthMm,
    yMm: localBottom + regionChainOffsetMm,
  }))
  const regionWidthExtensions = [
    {
      xMm: firstRegion.bounds.xMm,
      startMm: firstRegion.bounds.yMm + firstRegion.bounds.heightMm,
    },
    ...resolved.regions.slice(0, -1).map(({ bounds }, index) => {
      const nextBounds = resolved.regions[index + 1].bounds
      const regionBottomMm = bounds.yMm + bounds.heightMm
      const nextBottomMm = nextBounds.yMm + nextBounds.heightMm
      return {
        xMm: bounds.xMm + bounds.widthMm,
        startMm: Math.min(regionBottomMm, nextBottomMm),
      }
    }),
    {
      xMm: lastRegion.bounds.xMm + lastRegion.bounds.widthMm,
      startMm: lastRegion.bounds.yMm + lastRegion.bounds.heightMm,
    },
  ]
  const regionHeights = resolved.regions.map(({ regionId, bounds }, index) => {
    const side: 'left' | 'right' = index === 0 ? 'left' : 'right'
    const rightSlot = index === 0 ? 0 : index
    return {
      regionId,
      side,
      xMm: side === 'left'
        ? extent.xMm - verticalDimensionOffsetMm
        : localRight + verticalDimensionOffsetMm * rightSlot,
      startMm: bounds.yMm,
      endMm: bounds.yMm + bounds.heightMm,
    }
  })
  const hasRegionAtOverallHeight = resolved.regions.some(({ bounds }) =>
    bounds.yMm === extent.yMm && bounds.yMm + bounds.heightMm === localBottom)

  return {
    regionWidths,
    regionWidthExtensions,
    totalWidth: {
      startMm: extent.xMm,
      endMm: localRight,
      yMm: localBottom + regionChainOffsetMm + overallChainSeparationMm,
      startEdgeBottomMm: firstRegion.bounds.yMm + firstRegion.bounds.heightMm,
      endEdgeBottomMm: lastRegion.bounds.yMm + lastRegion.bounds.heightMm,
    },
    regionHeights,
    extensionOverrunMm,
    totalHeight: hasRegionAtOverallHeight ? null : {
      xMm: localRight + verticalDimensionOffsetMm * (resolved.regions.length + 1),
      startMm: extent.yMm,
      endMm: localBottom,
    },
  }
}
