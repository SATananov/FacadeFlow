/** View transforms only. These helpers never modify the construction model. */
export type CadPoint = { xMm: number; yMm: number }
export type ScreenPoint = { xPx: number; yPx: number }
export type CadViewport = { origin: ScreenPoint; pxPerMm: number }
export type CadRulerAxis = 'x' | 'y'
export type CadWorldRange = { minMm: number; maxMm: number }
export type CadRulerTick = { valueMm: number; screenPx: number }
export type ScreenRect = { left: number; right: number; top: number; bottom: number }
export type CadBounds = { x: number; y: number; width: number; height: number }
export type FrameView = {
  frame: CadPoint
  placement: CadPoint
}

export type DoorViewOrientation = 'outside' | 'inside' | null

/** Inverse view-only X mapping for a horizontally mirrored frame drawing. */
export function framePointForDoorView(point: CadPoint, frameWidthMm: number, orientation: DoorViewOrientation): CadPoint {
  return orientation === 'inside'
    ? { xMm: frameWidthMm - point.xMm, yMm: point.yMm }
    : point
}

/** Client/canvas pixels -> CAD world using the active viewport origin and scale. */
export function screenToCadWorld(point: ScreenPoint, viewport: CadViewport): CadPoint {
  return {
    xMm: (point.xPx - viewport.origin.xPx) / viewport.pxPerMm,
    yMm: (point.yPx - viewport.origin.yPx) / viewport.pxPerMm,
  }
}

/** CAD world -> canvas pixels using the shared viewport transform. */
export function cadWorldToScreen(point: CadPoint, viewport: CadViewport): ScreenPoint {
  return {
    xPx: viewport.origin.xPx + point.xMm * viewport.pxPerMm,
    yPx: viewport.origin.yPx + point.yMm * viewport.pxPerMm,
  }
}

/** Clamp a view-only pan while keeping a useful part of the sketch in its viewport. */
export function clampCadViewOffset(
  offset: ScreenPoint,
  bounds: CadBounds,
  viewportWidthPx: number,
  viewportHeightPx: number,
  pxPerMm: number,
  minimumVisiblePx = 72,
): ScreenPoint {
  if (![offset.xPx, offset.yPx, bounds.x, bounds.y, bounds.width, bounds.height,
    viewportWidthPx, viewportHeightPx, pxPerMm, minimumVisiblePx].every(Number.isFinite)
    || bounds.width <= 0 || bounds.height <= 0 || viewportWidthPx <= 0
    || viewportHeightPx <= 0 || pxPerMm <= 0 || minimumVisiblePx < 0) return offset

  const clampAxis = (originPx: number, startMm: number, lengthMm: number, viewportPx: number) => {
    const drawingLengthPx = lengthMm * pxPerMm
    const visiblePx = Math.min(minimumVisiblePx, drawingLengthPx, viewportPx)
    const minOffset = visiblePx - (startMm + lengthMm) * pxPerMm
    const maxOffset = viewportPx - visiblePx - startMm * pxPerMm
    return Math.min(maxOffset, Math.max(minOffset, originPx))
  }

  return {
    xPx: clampAxis(offset.xPx, bounds.x, bounds.width, viewportWidthPx),
    yPx: clampAxis(offset.yPx, bounds.y, bounds.height, viewportHeightPx),
  }
}

/** Model placement is kept separate from the viewport pan. */
export function frameOriginInCadWorld(view: FrameView): CadPoint {
  return {
    xMm: view.frame.xMm + view.placement.xMm,
    yMm: view.frame.yMm + view.placement.yMm,
  }
}

export function visibleCadWorldRange(
  axis: CadRulerAxis,
  viewportLengthPx: number,
  viewport: CadViewport,
): CadWorldRange | null {
  if (!Number.isFinite(viewportLengthPx) || viewportLengthPx <= 0
    || !Number.isFinite(viewport.pxPerMm) || viewport.pxPerMm <= 0) return null

  const start = screenToCadWorld({ xPx: 0, yPx: 0 }, viewport)
  const end = screenToCadWorld(
    axis === 'x' ? { xPx: viewportLengthPx, yPx: 0 } : { xPx: 0, yPx: viewportLengthPx },
    viewport,
  )
  const startMm = axis === 'x' ? start.xMm : start.yMm
  const endMm = axis === 'x' ? end.xMm : end.yMm
  return { minMm: Math.min(startMm, endMm), maxMm: Math.max(startMm, endMm) }
}

export function cadRulerTickStep(
  pxPerMm: number,
  baseStepMm = 500,
  minimumSpacingPx = 56,
): number | null {
  if (!Number.isFinite(pxPerMm) || pxPerMm <= 0
    || !Number.isFinite(baseStepMm) || baseStepMm <= 0
    || !Number.isFinite(minimumSpacingPx) || minimumSpacingPx <= 0) return null
  const multiple = Math.max(1, Math.ceil(minimumSpacingPx / (baseStepMm * pxPerMm)))
  return baseStepMm * multiple
}

export function buildCadRulerTicks(
  axis: CadRulerAxis,
  viewportLengthPx: number,
  viewport: CadViewport,
  baseStepMm = 500,
  minimumSpacingPx = 56,
): CadRulerTick[] {
  const range = visibleCadWorldRange(axis, viewportLengthPx, viewport)
  const stepMm = cadRulerTickStep(viewport.pxPerMm, baseStepMm, minimumSpacingPx)
  if (!range || stepMm === null) return []

  const epsilonMm = stepMm * 1e-10
  const firstValueMm = Math.ceil((range.minMm - epsilonMm) / stepMm) * stepMm
  const maxTicks = Math.ceil(viewportLengthPx / minimumSpacingPx) + 2
  const ticks: CadRulerTick[] = []
  for (let index = 0; index < maxTicks; index += 1) {
    const valueMm = firstValueMm + index * stepMm
    if (valueMm > range.maxMm + epsilonMm) break
    const screen = cadWorldToScreen(
      axis === 'x' ? { xMm: valueMm, yMm: 0 } : { xMm: 0, yMm: valueMm },
      viewport,
    )
    const screenPx = axis === 'x' ? screen.xPx : screen.yPx
    if (screenPx >= -1e-7 && screenPx <= viewportLengthPx + 1e-7) {
      ticks.push({ valueMm, screenPx })
    }
  }
  return ticks
}

/** Build non-negative ruler labels relative to the sketch/module origin. */
export function buildModuleLocalRulerTicks(
  axis: CadRulerAxis,
  viewport: CadViewport,
  moduleOrigin: CadPoint,
  localExtentMm: number,
  baseStepMm = 500,
  minimumSpacingPx = 56,
): CadRulerTick[] {
  const readableStepMm = cadRulerTickStep(viewport.pxPerMm, baseStepMm, minimumSpacingPx)
  if (readableStepMm === null || !Number.isFinite(localExtentMm) || localExtentMm < 0) return []
  const densityStepMm = baseStepMm * Math.max(1, Math.ceil(localExtentMm / (baseStepMm * 511)))
  const stepMm = Math.max(readableStepMm, densityStepMm)

  const originMm = axis === 'x' ? moduleOrigin.xMm : moduleOrigin.yMm
  const epsilonMm = stepMm * 1e-10
  const lastTickMm = Math.ceil((localExtentMm - epsilonMm) / stepMm) * stepMm
  const maxTicks = Math.ceil(lastTickMm / stepMm) + 1
  const ticks: CadRulerTick[] = []
  for (let index = 0; index < maxTicks; index += 1) {
    const valueMm = index * stepMm
    if (valueMm > lastTickMm + epsilonMm) break
    const screen = cadWorldToScreen(
      axis === 'x'
        ? { xMm: originMm + valueMm, yMm: moduleOrigin.yMm }
        : { xMm: moduleOrigin.xMm, yMm: originMm + valueMm },
      viewport,
    )
    const screenPx = axis === 'x' ? screen.xPx : screen.yPx
    ticks.push({ valueMm, screenPx })
  }
  return ticks
}

export function rulerLabelFitsWithinBounds(label: ScreenRect, clip: ScreenRect): boolean {
  return Number.isFinite(label.left) && Number.isFinite(label.right)
    && Number.isFinite(label.top) && Number.isFinite(label.bottom)
    && label.left >= clip.left && label.right <= clip.right
    && label.top >= clip.top && label.bottom <= clip.bottom
}

/** Inverse of the rendered frame placement. Preserve signed, unsnapped values. */
export function screenToFrameLocal(point: ScreenPoint, viewport: CadViewport, view: FrameView): CadPoint {
  const world = screenToCadWorld(point, viewport)
  const origin = frameOriginInCadWorld(view)
  return { xMm: world.xMm - origin.xMm, yMm: world.yMm - origin.yMm }
}

/** Pointer editing uses canonical construction coordinates, without visual offsets. */
export function screenToConstructionWorld(point: ScreenPoint, viewport: CadViewport, view: FrameView): CadPoint {
  const local = screenToFrameLocal(point, viewport, view)
  return { xMm: view.frame.xMm + local.xMm, yMm: view.frame.yMm + local.yMm }
}
