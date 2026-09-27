/** Screen-space annotation layout only; no profile or construction dimensions. */
export const SCHEMATIC_OPENING_INSET_PX = 11

type ScreenRect = { left: number; top: number; width: number; height: number }
type LabelPlacement = ScreenRect & { external: boolean }

export function placeFieldDimensionLabel(
  text: string,
  fieldWidthPx: number,
  fieldHeightPx: number,
  opening: ScreenRect | null,
  hasUnknownWarning: boolean,
  options: { viewport?: ScreenRect; forceExternal?: boolean; obstacles?: readonly ScreenRect[] } = {},
): LabelPlacement | null {
  // Conservative monospace text allowance, including padding and border.
  const width = text.length * 7 + 12
  const height = 18
  const margin = 6
  if (![fieldWidthPx, fieldHeightPx].every((value) => Number.isFinite(value) && value > 0)) return null
  const fits = (rect: ScreenRect, bounds: ScreenRect) => rect.left >= bounds.left
    && rect.top >= bounds.top && rect.left + rect.width <= bounds.left + bounds.width
    && rect.top + rect.height <= bounds.top + bounds.height
  const overlaps = (a: ScreenRect, b: ScreenRect) => a.left < b.left + b.width + margin
    && a.left + a.width > b.left - margin && a.top < b.top + b.height + margin
    && a.top + a.height > b.top - margin
  const obstacles = options.obstacles ?? []
  const fallback = (): LabelPlacement => {
    const candidates = [
      { left: (fieldWidthPx - width) / 2, top: fieldHeightPx + margin, width, height },
      { left: fieldWidthPx + margin, top: (fieldHeightPx - height) / 2, width, height },
      { left: -width - margin, top: (fieldHeightPx - height) / 2, width, height },
    ]
    const viewport = options.viewport
    const blocked = [...obstacles, { left: 0, top: 0, width: fieldWidthPx, height: fieldHeightPx }]
    const available = (rect: ScreenRect) => (!viewport || fits(rect, viewport))
      && !blocked.some((obstacle) => overlaps(rect, obstacle))
    const candidate = candidates.find(available)
    if (candidate) return { ...candidate, external: true }
    const preferred = candidates[0]
    // Try the edges of occupied annotation lanes before clamping at a viewport
    // edge. This keeps the callout clear of overall/bay dimensions, not over them.
    const xs = [preferred.left, ...blocked.flatMap((rect) => [rect.left - width - margin, rect.left + rect.width + margin])]
    const ys = [preferred.top, ...blocked.flatMap((rect) => [rect.top - height - margin, rect.top + rect.height + margin])]
    if (viewport) {
      xs.push(viewport.left, viewport.left + viewport.width - width)
      ys.push(viewport.top, viewport.top + viewport.height - height)
    }
    const alternatives = xs.flatMap((left) => ys.map((top) => ({ left, top, width, height })))
      .filter(available)
      .sort((a, b) => Math.hypot(a.left - preferred.left, a.top - preferred.top)
        - Math.hypot(b.left - preferred.left, b.top - preferred.top))
    if (alternatives[0]) return { ...alternatives[0], external: true }
    // A fully occupied viewport may have no free callout slot. Visibility takes
    // priority, but dimension lanes remain excluded whenever a slot exists.
    const visibleAlternatives = xs.flatMap((left) => ys.map((top) => ({ left, top, width, height })))
      .filter((rect) => (!viewport || fits(rect, viewport)) && !obstacles.some((obstacle) => overlaps(rect, obstacle)))
      .sort((a, b) => Math.hypot(a.left - preferred.left, a.top - preferred.top)
        - Math.hypot(b.left - preferred.left, b.top - preferred.top))
    if (visibleAlternatives[0]) return { ...visibleAlternatives[0], external: true }
    return {
      ...preferred,
      left: viewport ? Math.max(viewport.left, Math.min(preferred.left, viewport.left + viewport.width - width)) : preferred.left,
      top: viewport ? Math.max(viewport.top, Math.min(preferred.top, viewport.top + viewport.height - height)) : preferred.top,
      external: true,
    }
  }
  if (options.forceExternal) return fallback()
  const area = opening ?? { left: 0, top: 0, width: fieldWidthPx, height: fieldHeightPx }
  if (![area.left, area.top, area.width, area.height].every(Number.isFinite) || area.width <= 0 || area.height <= 0) return fallback()
  const left = area.left + (area.width - width) / 2
  const top = Math.min(area.top + area.height - margin, fieldHeightPx - (hasUnknownWarning ? 32 : margin)) - height

  // Keep the centre number badge and the existing bottom warning unobstructed.
  if (top < fieldHeightPx / 2 + 16 || left < margin || left + width > fieldWidthPx - margin) return fallback()
  if (opening) {
    // Below the lower side-hung diagonals, the central gap is also clear of
    // tilt diagonals for either handing. These are normalized symbol positions,
    // not hinge/profile geometry. Use a callout if this gap is too narrow.
    const relativeTop = (top - area.top) / area.height
    const clearHalfWidth = Math.max(0, Math.min(0.5, 2 * relativeTop - 1.5)) * area.width
    if (width / 2 + margin > clearHalfWidth) return fallback()
  }
  const inside = { left, top, width, height }
  if ((options.viewport && !fits(inside, options.viewport)) || obstacles.some((obstacle) => overlaps(inside, obstacle))) return fallback()
  return { ...inside, external: false }
}
