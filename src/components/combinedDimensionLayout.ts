import type { CombinedModuleLayout } from '../domain/offerModules'
import type { ResolvedCombinedRegionGeometry } from '../domain/combinedRegionGeometry'

export type CombinedTechnicalDimensionLayout = {
  regionWidths: Array<{ regionId: string; startMm: number; endMm: number; yMm: number }>
  totalWidth: { startMm: number; endMm: number; yMm: number }
  regionHeights: Array<{ regionId: string; side: 'left' | 'right'; xMm: number; startMm: number; endMm: number }>
  totalHeight: { xMm: number; startMm: number; endMm: number }
}

/** Presentation coordinates only; all measurements are read from resolved geometry. */
export function layoutCombinedTechnicalDimensions(
  layout: CombinedModuleLayout,
  resolved: ResolvedCombinedRegionGeometry,
  chainGapMm = 48,
): CombinedTechnicalDimensionLayout | null {
  if (resolved.status !== 'complete' || !resolved.extent || resolved.regions.length === 0
    || resolved.regions.length !== (layout === 'window-both' ? 3 : 2)
    || !Number.isFinite(chainGapMm) || chainGapMm <= 0) return null

  const extent = resolved.extent
  const localRight = extent.xMm + extent.widthMm
  const localBottom = extent.yMm + extent.heightMm
  const regionWidths = resolved.regions.map(({ regionId, bounds }) => ({
    regionId,
    startMm: bounds.xMm,
    endMm: bounds.xMm + bounds.widthMm,
    yMm: localBottom + chainGapMm,
  }))
  const regionHeights = resolved.regions.map(({ regionId, bounds }, index) => {
    const side: 'left' | 'right' = index === 0 ? 'left' : 'right'
    const rightSlot = index === 0 ? 0 : index
    return {
      regionId,
      side,
      xMm: side === 'left' ? extent.xMm - chainGapMm : localRight + chainGapMm * rightSlot,
      startMm: bounds.yMm,
      endMm: bounds.yMm + bounds.heightMm,
    }
  })
  return {
    regionWidths,
    totalWidth: { startMm: extent.xMm, endMm: localRight, yMm: localBottom + chainGapMm * 2 },
    regionHeights,
    totalHeight: {
      xMm: localRight + chainGapMm * resolved.regions.length,
      startMm: extent.yMm,
      endMm: localBottom,
    },
  }
}
