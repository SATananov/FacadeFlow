/** View transforms only. These helpers never modify the construction model. */
export type CadPoint = { xMm: number; yMm: number }
export type ScreenPoint = { xPx: number; yPx: number }
export type CadViewport = { origin: ScreenPoint; pxPerMm: number }
export type FrameView = {
  frame: CadPoint
  placement: CadPoint
  pan: ScreenPoint
}

/** Client pixels -> fixed CAD world. Pan belongs to the product view, not the grid. */
export function screenToCadWorld(point: ScreenPoint, viewport: CadViewport): CadPoint {
  return {
    xMm: (point.xPx - viewport.origin.xPx) / viewport.pxPerMm,
    yMm: (point.yPx - viewport.origin.yPx) / viewport.pxPerMm,
  }
}

/** CAD world -> pixels; use origin (0, 0) for canvas-relative CSS positions. */
export function cadWorldToScreen(point: CadPoint, viewport: CadViewport): ScreenPoint {
  return {
    xPx: viewport.origin.xPx + point.xMm * viewport.pxPerMm,
    yPx: viewport.origin.yPx + point.yMm * viewport.pxPerMm,
  }
}

export function frameOriginInCadWorld(view: FrameView, pxPerMm: number): CadPoint {
  return {
    xMm: view.frame.xMm + view.placement.xMm + view.pan.xPx / pxPerMm,
    yMm: view.frame.yMm + view.placement.yMm + view.pan.yPx / pxPerMm,
  }
}

/** Inverse of the rendered frame placement. Preserve signed, unsnapped values. */
export function screenToFrameLocal(point: ScreenPoint, viewport: CadViewport, view: FrameView): CadPoint {
  const world = screenToCadWorld(point, viewport)
  const origin = frameOriginInCadWorld(view, viewport.pxPerMm)
  return { xMm: world.xMm - origin.xMm, yMm: world.yMm - origin.yMm }
}

/** Pointer editing uses canonical construction coordinates, without visual offsets. */
export function screenToConstructionWorld(point: ScreenPoint, viewport: CadViewport, view: FrameView): CadPoint {
  const local = screenToFrameLocal(point, viewport, view)
  return { xMm: view.frame.xMm + local.xMm, yMm: view.frame.yMm + local.yMm }
}
