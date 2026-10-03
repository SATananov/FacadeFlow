import type { ConstructionFrameEdgeKind, ResolvedConstructionField } from '../domain/construction'

/** Presentation only: bottom-reaching rectangular operables, never fixed sidelights
 * or upper transoms. Pixel spacing is not a physical clearance or rebate.
 * AUTOMATIC GEOMETRY = NO; RULES VALIDATED = NO; MACHINE READY = NO.
 */
export function doorLeafVisualClass(
  productType: string | null,
  field: ResolvedConstructionField,
  bottom: ConstructionFrameEdgeKind | undefined,
  frameHeight: number,
  frameFace: number,
): string {
  if (productType !== 'door' || field.fieldType !== 'operable' || field.polygon || !bottom) return ''
  const innerBottom = frameHeight - (bottom === 'frame' ? frameFace : 0)
  if (Math.abs(field.bounds.yMm + field.bounds.heightMm - innerBottom) > 0.01) return ''
  return `is-door-leaf door-leaf-bottom-${bottom}`
}
