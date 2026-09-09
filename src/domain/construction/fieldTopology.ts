import {
  CONSTRUCTION_DEFAULT_FRAME_FACE_MM,
  createConstructionModel,
  createFieldDefinition,
  type ConstructionAxis,
  type ConstructionFieldBounds,
  type ConstructionFieldNode,
  type ConstructionFrame,
  type ConstructionModel,
  type ConstructionPoint,
  type ConstructionFieldType,
  type ConstructionOpeningMode,
  type ConstructionOpeningHanding,
  type ConstructorDividerSnapshot,
  type ResolvedConstructionDivider,
  type ResolvedConstructionAngledDivider,
  type ResolvedConstructionField,
} from './constructionModel'

export const CONSTRUCTION_MIN_FIELD_MM = 120
export const CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM = 40
export const CONSTRUCTION_ANGLED_CORNER_SNAP_MM = 30

export function getConstructionFrameFaceMm(model: ConstructionModel): number {
  const candidate = Number(model.frameFaceMm)
  return Number.isFinite(candidate) && candidate > 0
    ? Math.round(candidate)
    : CONSTRUCTION_DEFAULT_FRAME_FACE_MM
}

export function getFrameInteriorBounds(model: ConstructionModel): ConstructionFieldBounds {
  const frameFaceMm = getConstructionFrameFaceMm(model)
  return {
    xMm: frameFaceMm,
    yMm: frameFaceMm,
    widthMm: Math.max(0, model.frame.widthMm - frameFaceMm * 2),
    heightMm: Math.max(0, model.frame.heightMm - frameFaceMm * 2),
  }
}

function getDividerThicknessMm(
  _divider: Extract<ConstructionFieldNode, { kind: 'split' | 'angled-split' }>['divider'],
): number {
  // Constructor 01C.3.2: until Profile Resolution, divider face width is a fixed
  // schematic system value. User input never changes it.
  return CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM
}

function minimumNodeSize(node: ConstructionFieldNode): { widthMm: number; heightMm: number } {
  if (node.kind === 'field') {
    return { widthMm: CONSTRUCTION_MIN_FIELD_MM, heightMm: CONSTRUCTION_MIN_FIELD_MM }
  }

  const first = minimumNodeSize(node.first)
  const second = minimumNodeSize(node.second)
  const dividerThicknessMm = getDividerThicknessMm(node.divider)

  if (node.kind === 'angled-split') {
    return {
      widthMm: first.widthMm + dividerThicknessMm + second.widthMm,
      heightMm: Math.max(CONSTRUCTION_MIN_FIELD_MM, first.heightMm, second.heightMm),
    }
  }

  return node.divider.axis === 'vertical'
    ? {
        widthMm: first.widthMm + dividerThicknessMm + second.widthMm,
        heightMm: Math.max(first.heightMm, second.heightMm),
      }
    : {
        widthMm: Math.max(first.widthMm, second.widthMm),
        heightMm: first.heightMm + dividerThicknessMm + second.heightMm,
      }
}

function clampDividerGeometry(
  node: Extract<ConstructionFieldNode, { kind: 'split' }>,
  axisLength: number,
  requestedOffsetMm: number,
): { offsetMm: number; thicknessMm: number } {
  const firstMinimum = minimumNodeSize(node.first)
  const secondMinimum = minimumNodeSize(node.second)
  const minimumFirst = node.divider.axis === 'vertical' ? firstMinimum.widthMm : firstMinimum.heightMm
  const minimumSecond = node.divider.axis === 'vertical' ? secondMinimum.widthMm : secondMinimum.heightMm
  const thicknessMm = CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM
  const maximumOffset = Math.max(
    minimumFirst,
    axisLength - thicknessMm - minimumSecond,
  )
  const offsetMm = Math.round(
    Math.min(Math.max(requestedOffsetMm, minimumFirst), maximumOffset),
  )

  return { offsetMm, thicknessMm }
}

function cloneNode(node: ConstructionFieldNode): ConstructionFieldNode {
  if (node.kind === 'field') {
    return { kind: 'field', field: { ...node.field } }
  }

  if (node.kind === 'angled-split') {
    return {
      kind: 'angled-split',
      field: { ...node.field },
      divider: {
        ...node.divider,
        thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
      },
      first: cloneNode(node.first),
      second: cloneNode(node.second),
    }
  }

  return {
    kind: 'split',
    field: { ...node.field },
    divider: {
      ...node.divider,
      thicknessMm: getDividerThicknessMm(node.divider),
    },
    first: cloneNode(node.first),
    second: cloneNode(node.second),
  }
}

export function cloneConstructionModel(model: ConstructionModel): ConstructionModel {
  return {
    ...model,
    frame: { ...model.frame },
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: cloneNode(model.root),
  }
}

type ResolvedSplitGeometry = {
  offsetMm: number
  dividerThicknessMm: number
  firstBounds: ConstructionFieldBounds
  secondBounds: ConstructionFieldBounds
}

function resolveSplitGeometry(
  node: Extract<ConstructionFieldNode, { kind: 'split' }>,
  bounds: ConstructionFieldBounds,
): ResolvedSplitGeometry {
  const axisLength = node.divider.axis === 'vertical' ? bounds.widthMm : bounds.heightMm
  const geometry = clampDividerGeometry(
    node,
    axisLength,
    node.divider.offsetMm,
  )
  const offsetMm = geometry.offsetMm
  const dividerThicknessMm = geometry.thicknessMm

  if (node.divider.axis === 'vertical') {
    return {
      offsetMm,
      dividerThicknessMm,
      firstBounds: {
        xMm: bounds.xMm,
        yMm: bounds.yMm,
        widthMm: offsetMm,
        heightMm: bounds.heightMm,
      },
      secondBounds: {
        xMm: bounds.xMm + offsetMm + dividerThicknessMm,
        yMm: bounds.yMm,
        widthMm: Math.max(0, bounds.widthMm - offsetMm - dividerThicknessMm),
        heightMm: bounds.heightMm,
      },
    }
  }

  return {
    offsetMm,
    dividerThicknessMm,
    firstBounds: {
      xMm: bounds.xMm,
      yMm: bounds.yMm,
      widthMm: bounds.widthMm,
      heightMm: offsetMm,
    },
    secondBounds: {
      xMm: bounds.xMm,
      yMm: bounds.yMm + offsetMm + dividerThicknessMm,
      widthMm: bounds.widthMm,
      heightMm: Math.max(0, bounds.heightMm - offsetMm - dividerThicknessMm),
    },
  }
}

function polygonBounds(points: readonly ConstructionPoint[]): ConstructionFieldBounds {
  const xs = points.map((point) => point.xMm)
  const ys = points.map((point) => point.yMm)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { xMm: minX, yMm: minY, widthMm: maxX - minX, heightMm: maxY - minY }
}

function pointInPolygon(point: ConstructionPoint, polygon: readonly ConstructionPoint[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].xMm
    const yi = polygon[i].yMm
    const xj = polygon[j].xMm
    const yj = polygon[j].yMm
    const intersects = ((yi > point.yMm) !== (yj > point.yMm)) &&
      (point.xMm < ((xj - xi) * (point.yMm - yi)) / ((yj - yi) || Number.EPSILON) + xi)
    if (intersects) inside = !inside
  }
  return inside
}

function clampToRange(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function snapAngledEndpointToCorner(offsetMm: number, widthMm: number): number {
  const clamped = clampToRange(Math.round(offsetMm), 0, Math.max(0, widthMm))
  if (clamped <= CONSTRUCTION_ANGLED_CORNER_SNAP_MM) return 0
  if (clamped >= widthMm - CONSTRUCTION_ANGLED_CORNER_SNAP_MM) return widthMm
  return clamped
}

function normalizePolygon(points: readonly ConstructionPoint[]): ConstructionPoint[] {
  const normalized: ConstructionPoint[] = []

  for (const point of points) {
    const previous = normalized[normalized.length - 1]
    if (!previous || previous.xMm !== point.xMm || previous.yMm !== point.yMm) {
      normalized.push(point)
    }
  }

  if (
    normalized.length > 1 &&
    normalized[0].xMm === normalized[normalized.length - 1].xMm &&
    normalized[0].yMm === normalized[normalized.length - 1].yMm
  ) {
    normalized.pop()
  }

  return normalized
}

function polygonArea(points: readonly ConstructionPoint[]): number {
  if (points.length < 3) return 0
  let twiceArea = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    twiceArea += current.xMm * next.yMm - next.xMm * current.yMm
  }
  return Math.abs(twiceArea) / 2
}

function clipPolygonByAxisBoundary(
  polygon: readonly ConstructionPoint[],
  axis: ConstructionAxis,
  boundaryMm: number,
  keepLeadingSide: boolean,
): ConstructionPoint[] {
  if (polygon.length < 3) return []
  const coordinate = (point: ConstructionPoint) => axis === 'vertical' ? point.xMm : point.yMm
  const inside = (point: ConstructionPoint) => keepLeadingSide
    ? coordinate(point) <= boundaryMm + 1e-6
    : coordinate(point) >= boundaryMm - 1e-6
  const intersection = (start: ConstructionPoint, end: ConstructionPoint): ConstructionPoint => {
    const startCoordinate = coordinate(start)
    const endCoordinate = coordinate(end)
    const denominator = endCoordinate - startCoordinate
    const ratio = Math.abs(denominator) < 1e-9 ? 0 : (boundaryMm - startCoordinate) / denominator
    return {
      xMm: start.xMm + (end.xMm - start.xMm) * ratio,
      yMm: start.yMm + (end.yMm - start.yMm) * ratio,
    }
  }

  const output: ConstructionPoint[] = []
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]
    const previous = polygon[(index + polygon.length - 1) % polygon.length]
    const currentInside = inside(current)
    const previousInside = inside(previous)

    if (currentInside) {
      if (!previousInside) output.push(intersection(previous, current))
      output.push({ ...current })
    } else if (previousInside) {
      output.push(intersection(previous, current))
    }
  }

  return normalizePolygon(output)
}

function clipPolygonToAxisStrip(
  polygon: readonly ConstructionPoint[],
  axis: ConstructionAxis,
  startMm: number,
  endMm: number,
): ConstructionPoint[] {
  return clipPolygonByAxisBoundary(
    clipPolygonByAxisBoundary(polygon, axis, startMm, false),
    axis,
    endMm,
    true,
  )
}

type ResolvedPolygonSplitGeometry = ResolvedSplitGeometry & {
  firstPolygon: ConstructionPoint[]
  secondPolygon: ConstructionPoint[]
  facePolygon: ConstructionPoint[]
}

function resolvePolygonSplitGeometry(
  node: Extract<ConstructionFieldNode, { kind: 'split' }>,
  bounds: ConstructionFieldBounds,
  polygon: readonly ConstructionPoint[],
): ResolvedPolygonSplitGeometry {
  const axisLength = node.divider.axis === 'vertical' ? bounds.widthMm : bounds.heightMm
  const geometry = clampDividerGeometry(node, axisLength, node.divider.offsetMm)
  const offsetMm = geometry.offsetMm
  const dividerThicknessMm = geometry.thicknessMm
  const leadingFaceMm = (node.divider.axis === 'vertical' ? bounds.xMm : bounds.yMm) + offsetMm
  const trailingFaceMm = leadingFaceMm + dividerThicknessMm
  const firstPolygon = clipPolygonByAxisBoundary(polygon, node.divider.axis, leadingFaceMm, true)
  const secondPolygon = clipPolygonByAxisBoundary(polygon, node.divider.axis, trailingFaceMm, false)
  const facePolygon = clipPolygonToAxisStrip(polygon, node.divider.axis, leadingFaceMm, trailingFaceMm)

  return {
    offsetMm,
    dividerThicknessMm,
    firstBounds: polygonBounds(firstPolygon),
    secondBounds: polygonBounds(secondPolygon),
    firstPolygon,
    secondPolygon,
    facePolygon,
  }
}

function resolveAngledGeometry(
  node: Extract<ConstructionFieldNode, { kind: 'angled-split' }>,
  bounds: ConstructionFieldBounds,
) {
  const heightMm = Math.max(1, bounds.heightMm)
  const thicknessMm = CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM
  const deltaX = node.divider.bottomOffsetMm - node.divider.topOffsetMm
  const lengthMm = Math.hypot(deltaX, heightMm)
  const horizontalHalfFaceMm = (thicknessMm / 2) * (lengthMm / heightMm)
  const topOffsetMm = snapAngledEndpointToCorner(node.divider.topOffsetMm, bounds.widthMm)
  const bottomOffsetMm = snapAngledEndpointToCorner(node.divider.bottomOffsetMm, bounds.widthMm)
  const topCenterX = bounds.xMm + topOffsetMm
  const bottomCenterX = bounds.xMm + bottomOffsetMm
  const leftBoundary = bounds.xMm
  const rightBoundary = bounds.xMm + bounds.widthMm
  const topLeftX = clampToRange(topCenterX - horizontalHalfFaceMm, leftBoundary, rightBoundary)
  const topRightX = clampToRange(topCenterX + horizontalHalfFaceMm, leftBoundary, rightBoundary)
  const bottomLeftX = clampToRange(bottomCenterX - horizontalHalfFaceMm, leftBoundary, rightBoundary)
  const bottomRightX = clampToRange(bottomCenterX + horizontalHalfFaceMm, leftBoundary, rightBoundary)

  const firstPolygon = normalizePolygon([
    { xMm: bounds.xMm, yMm: bounds.yMm },
    { xMm: topLeftX, yMm: bounds.yMm },
    { xMm: bottomLeftX, yMm: bounds.yMm + bounds.heightMm },
    { xMm: bounds.xMm, yMm: bounds.yMm + bounds.heightMm },
  ])
  const secondPolygon = normalizePolygon([
    { xMm: topRightX, yMm: bounds.yMm },
    { xMm: bounds.xMm + bounds.widthMm, yMm: bounds.yMm },
    { xMm: bounds.xMm + bounds.widthMm, yMm: bounds.yMm + bounds.heightMm },
    { xMm: bottomRightX, yMm: bounds.yMm + bounds.heightMm },
  ])
  const facePolygon = normalizePolygon([
    { xMm: topLeftX, yMm: bounds.yMm },
    { xMm: topRightX, yMm: bounds.yMm },
    { xMm: bottomRightX, yMm: bounds.yMm + bounds.heightMm },
    { xMm: bottomLeftX, yMm: bounds.yMm + bounds.heightMm },
  ])

  return {
    thicknessMm,
    topOffsetMm,
    bottomOffsetMm,
    topPoint: { xMm: topCenterX, yMm: bounds.yMm },
    bottomPoint: { xMm: bottomCenterX, yMm: bounds.yMm + bounds.heightMm },
    firstPolygon,
    secondPolygon,
    facePolygon,
    lengthMm,
  }
}

function walkResolved(
  node: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
  fields: ResolvedConstructionField[],
  dividers: ResolvedConstructionDivider[],
  angledDividers: ResolvedConstructionAngledDivider[],
  polygon?: ConstructionPoint[],
) {
  if (node.kind === 'field') {
    fields.push({ ...node.field, sequence: 0, bounds: polygon ? polygonBounds(polygon) : { ...bounds }, polygon: polygon ? polygon.map((p) => ({ ...p })) : undefined })
    return
  }

  if (node.kind === 'angled-split') {
    const geometry = resolveAngledGeometry(node, bounds)
    angledDividers.push({
      id: node.divider.id,
      parentFieldId: node.field.id,
      parentBounds: { ...bounds },
      axis: 'angled',
      topPoint: geometry.topPoint,
      bottomPoint: geometry.bottomPoint,
      topOffsetMm: geometry.topOffsetMm,
      bottomOffsetMm: geometry.bottomOffsetMm,
      thicknessMm: geometry.thicknessMm,
      lengthMm: geometry.lengthMm,
      facePolygon: geometry.facePolygon,
    })
    walkResolved(node.first, polygonBounds(geometry.firstPolygon), fields, dividers, angledDividers, geometry.firstPolygon)
    walkResolved(node.second, polygonBounds(geometry.secondPolygon), fields, dividers, angledDividers, geometry.secondPolygon)
    return
  }

  if (polygon) {
    const geometry = resolvePolygonSplitGeometry(node, bounds, polygon)
    const faceBounds = polygonBounds(geometry.facePolygon)
    dividers.push({
      id: node.divider.id,
      parentFieldId: node.field.id,
      axis: node.divider.axis,
      positionMm: node.divider.axis === 'vertical'
        ? bounds.xMm + geometry.offsetMm
        : bounds.yMm + geometry.offsetMm,
      startMm: node.divider.axis === 'vertical' ? faceBounds.yMm : faceBounds.xMm,
      endMm: node.divider.axis === 'vertical'
        ? faceBounds.yMm + faceBounds.heightMm
        : faceBounds.xMm + faceBounds.widthMm,
      offsetMm: geometry.offsetMm,
      firstClearMm: geometry.offsetMm,
      secondClearMm: node.divider.axis === 'vertical'
        ? geometry.secondBounds.widthMm
        : geometry.secondBounds.heightMm,
      thicknessMm: geometry.dividerThicknessMm,
      facePolygon: geometry.facePolygon,
    })
    walkResolved(node.first, geometry.firstBounds, fields, dividers, angledDividers, geometry.firstPolygon)
    walkResolved(node.second, geometry.secondBounds, fields, dividers, angledDividers, geometry.secondPolygon)
    return
  }

  const geometry = resolveSplitGeometry(node, bounds)

  dividers.push({
    id: node.divider.id,
    parentFieldId: node.field.id,
    axis: node.divider.axis,
    positionMm: node.divider.axis === 'vertical'
      ? bounds.xMm + geometry.offsetMm
      : bounds.yMm + geometry.offsetMm,
    startMm: node.divider.axis === 'vertical' ? bounds.yMm : bounds.xMm,
    endMm: node.divider.axis === 'vertical'
      ? bounds.yMm + bounds.heightMm
      : bounds.xMm + bounds.widthMm,
    offsetMm: geometry.offsetMm,
    firstClearMm: geometry.offsetMm,
    secondClearMm: node.divider.axis === 'vertical'
      ? geometry.secondBounds.widthMm
      : geometry.secondBounds.heightMm,
    thicknessMm: geometry.dividerThicknessMm,
  })

  walkResolved(node.first, geometry.firstBounds, fields, dividers, angledDividers)
  walkResolved(node.second, geometry.secondBounds, fields, dividers, angledDividers)
}

function resolveTopologyWithBounds(
  root: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
): { fields: ResolvedConstructionField[]; dividers: ResolvedConstructionDivider[]; angledDividers: ResolvedConstructionAngledDivider[] } {
  const fields: ResolvedConstructionField[] = []
  const dividers: ResolvedConstructionDivider[] = []
  const angledDividers: ResolvedConstructionAngledDivider[] = []
  walkResolved(root, bounds, fields, dividers, angledDividers)
  fields.sort((a, b) => {
    const rowDelta = a.bounds.yMm - b.bounds.yMm
    if (Math.abs(rowDelta) > 0.001) return rowDelta
    return a.bounds.xMm - b.bounds.xMm
  })
  return {
    fields: fields.map((field, index) => ({ ...field, sequence: index + 1 })),
    dividers,
    angledDividers,
  }
}

export function resolveConstructionTopology(model: ConstructionModel): {
  fields: ResolvedConstructionField[]
  dividers: ResolvedConstructionDivider[]
  angledDividers: ResolvedConstructionAngledDivider[]
} {
  return resolveTopologyWithBounds(model.root, getFrameInteriorBounds(model))
}

/**
 * Runtime compatibility for Constructor 01C.1/01C.2 saved topologies. 01C.3
 * introduces a real schematic frame face and therefore a true interior FIELD
 * rectangle. Existing divider leading faces are kept visually stable whenever
 * the new interior constraints permit it. Constructor 01C.3.2 also normalizes any
 * experimental editable divider face back to the canonical 40 mm schematic face.
 */
export function upgradeConstructionModelPhysicalDividers(model: ConstructionModel): ConstructionModel {
  const cloned = cloneConstructionModel(model)
  if ((model.version === 'field-topology-03' || model.version === 'field-topology-04' || model.version === 'field-topology-05' || model.version === 'field-topology-06' || model.version === 'field-topology-07') && Number(model.frameFaceMm) > 0) {
    return { ...cloned, version: model.version }
  }

  const frameFaceMm = getConstructionFrameFaceMm(model)
  const oldBounds: ConstructionFieldBounds = {
    xMm: 0,
    yMm: 0,
    widthMm: model.frame.widthMm,
    heightMm: model.frame.heightMm,
  }
  const nextBounds: ConstructionFieldBounds = {
    xMm: frameFaceMm,
    yMm: frameFaceMm,
    widthMm: Math.max(0, model.frame.widthMm - frameFaceMm * 2),
    heightMm: Math.max(0, model.frame.heightMm - frameFaceMm * 2),
  }

  const migrateNode = (
    node: ConstructionFieldNode,
    previousBounds: ConstructionFieldBounds,
    interiorBounds: ConstructionFieldBounds,
  ): ConstructionFieldNode => {
    if (node.kind === 'field') return cloneNode(node)
    if (node.kind === 'angled-split') return cloneNode(node)

    const previousGeometry = resolveSplitGeometry(node, previousBounds)
    const previousLeading = node.divider.axis === 'vertical'
      ? previousBounds.xMm + previousGeometry.offsetMm
      : previousBounds.yMm + previousGeometry.offsetMm
    const requestedOffset = node.divider.axis === 'vertical'
      ? previousLeading - interiorBounds.xMm
      : previousLeading - interiorBounds.yMm
    const axisLength = node.divider.axis === 'vertical'
      ? interiorBounds.widthMm
      : interiorBounds.heightMm
    const nextGeometryValues = clampDividerGeometry(
      node,
      axisLength,
      requestedOffset,
    )
    const migratedNode: Extract<ConstructionFieldNode, { kind: 'split' }> = {
      kind: 'split',
      field: { ...node.field },
      divider: {
        ...node.divider,
        offsetMm: nextGeometryValues.offsetMm,
        thicknessMm: nextGeometryValues.thicknessMm,
      },
      first: cloneNode(node.first),
      second: cloneNode(node.second),
    }
    const nextGeometry = resolveSplitGeometry(migratedNode, interiorBounds)

    return {
      ...migratedNode,
      first: migrateNode(node.first, previousGeometry.firstBounds, nextGeometry.firstBounds),
      second: migrateNode(node.second, previousGeometry.secondBounds, nextGeometry.secondBounds),
    }
  }

  return {
    ...cloned,
    version: 'field-topology-03',
    frameFaceMm,
    root: migrateNode(cloned.root, oldBounds, nextBounds),
  }
}

function replaceLeafWithSplit(
  node: ConstructionFieldNode,
  fieldId: string,
  axis: ConstructionAxis,
  offsetMm: number,
  dividerThicknessMm: number,
  firstFieldId: string,
  secondFieldId: string,
  dividerId: string,
): ConstructionFieldNode {
  if (node.kind === 'field') {
    if (node.field.id !== fieldId) return node

    return {
      kind: 'split',
      field: { ...node.field },
      divider: {
        id: dividerId,
        axis,
        offsetMm,
        thicknessMm: dividerThicknessMm,
      },
      first: { kind: 'field', field: createFieldDefinition(firstFieldId) },
      second: { kind: 'field', field: createFieldDefinition(secondFieldId) },
    }
  }

  return {
    ...node,
    first: replaceLeafWithSplit(
      node.first,
      fieldId,
      axis,
      offsetMm,
      dividerThicknessMm,
      firstFieldId,
      secondFieldId,
      dividerId,
    ),
    second: replaceLeafWithSplit(
      node.second,
      fieldId,
      axis,
      offsetMm,
      dividerThicknessMm,
      firstFieldId,
      secondFieldId,
      dividerId,
    ),
  }
}

export function splitField(
  model: ConstructionModel,
  fieldId: string,
  axis: ConstructionAxis,
  offsetMm: number,
): ConstructionModel | null {
  const field = resolveConstructionTopology(model).fields.find((item) => item.id === fieldId)
  if (!field) return null

  const safeThicknessMm = CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM
  const axisLength = axis === 'vertical' ? field.bounds.widthMm : field.bounds.heightMm
  if (axisLength < CONSTRUCTION_MIN_FIELD_MM * 2 + safeThicknessMm) return null

  const safeOffset = Math.round(
    Math.min(
      Math.max(offsetMm, CONSTRUCTION_MIN_FIELD_MM),
      axisLength - safeThicknessMm - CONSTRUCTION_MIN_FIELD_MM,
    ),
  )

  if (field.polygon) {
    const previewNode: Extract<ConstructionFieldNode, { kind: 'split' }> = {
      kind: 'split',
      field: { id: field.id, fieldType: field.fieldType, openingMode: field.openingMode, openingHanding: field.openingHanding },
      divider: {
        id: 'preview-divider',
        axis,
        offsetMm: safeOffset,
        thicknessMm: safeThicknessMm,
      },
      first: { kind: 'field', field: createFieldDefinition('preview-first') },
      second: { kind: 'field', field: createFieldDefinition('preview-second') },
    }
    const preview = resolvePolygonSplitGeometry(previewNode, field.bounds, field.polygon)
    if (
      preview.firstPolygon.length < 3 ||
      preview.secondPolygon.length < 3 ||
      polygonArea(preview.firstPolygon) < 1 ||
      polygonArea(preview.secondPolygon) < 1
    ) return null
  }

  const firstFieldId = `field-${model.nextFieldId}`
  const secondFieldId = `field-${model.nextFieldId + 1}`
  const dividerId = `divider-${model.nextDividerId}`

  return {
    ...model,
    version: 'field-topology-06',
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: replaceLeafWithSplit(
      model.root,
      fieldId,
      axis,
      safeOffset,
      safeThicknessMm,
      firstFieldId,
      secondFieldId,
      dividerId,
    ),
    nextFieldId: model.nextFieldId + 2,
    nextDividerId: model.nextDividerId + 1,
  }
}

function replaceLeafWithAngledSplit(
  node: ConstructionFieldNode,
  fieldId: string,
  topOffsetMm: number,
  bottomOffsetMm: number,
  firstFieldId: string,
  secondFieldId: string,
  dividerId: string,
): ConstructionFieldNode {
  if (node.kind === 'field') {
    if (node.field.id !== fieldId) return node
    return {
      kind: 'angled-split',
      field: { ...node.field },
      divider: {
        id: dividerId,
        axis: 'angled',
        topOffsetMm,
        bottomOffsetMm,
        thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
      },
      first: { kind: 'field', field: createFieldDefinition(firstFieldId) },
      second: { kind: 'field', field: createFieldDefinition(secondFieldId) },
    }
  }
  return {
    ...node,
    first: replaceLeafWithAngledSplit(node.first, fieldId, topOffsetMm, bottomOffsetMm, firstFieldId, secondFieldId, dividerId),
    second: replaceLeafWithAngledSplit(node.second, fieldId, topOffsetMm, bottomOffsetMm, firstFieldId, secondFieldId, dividerId),
  }
}

export function splitFieldAngled(
  model: ConstructionModel,
  fieldId: string,
  centerOffsetMm: number,
): ConstructionModel | null {
  const field = resolveConstructionTopology(model).fields.find((item) => item.id === fieldId)
  if (!field || field.polygon) return null
  if (field.bounds.widthMm < CONSTRUCTION_MIN_FIELD_MM * 2 + CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM) return null
  const safeCenter = Math.min(
    Math.max(centerOffsetMm, CONSTRUCTION_MIN_FIELD_MM + CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM),
    field.bounds.widthMm - CONSTRUCTION_MIN_FIELD_MM - CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
  )
  const lean = Math.min(120, Math.max(50, Math.round(field.bounds.widthMm * 0.08)))
  const topOffsetMm = Math.max(CONSTRUCTION_MIN_FIELD_MM + 20, safeCenter - lean)
  const bottomOffsetMm = Math.min(field.bounds.widthMm - CONSTRUCTION_MIN_FIELD_MM - 20, safeCenter + lean)
  const firstFieldId = `field-${model.nextFieldId}`
  const secondFieldId = `field-${model.nextFieldId + 1}`
  const dividerId = `divider-${model.nextDividerId}`
  return {
    ...model,
    version: 'field-topology-06',
    root: replaceLeafWithAngledSplit(model.root, fieldId, topOffsetMm, bottomOffsetMm, firstFieldId, secondFieldId, dividerId),
    nextFieldId: model.nextFieldId + 2,
    nextDividerId: model.nextDividerId + 1,
  }
}

function updateAngledDividerNode(
  node: ConstructionFieldNode,
  dividerId: string,
  updater: (divider: Extract<ConstructionFieldNode, { kind: 'angled-split' }>['divider']) => Extract<ConstructionFieldNode, { kind: 'angled-split' }>['divider'],
): ConstructionFieldNode {
  if (node.kind === 'field') return node
  if (node.kind === 'angled-split' && node.divider.id === dividerId) {
    return { ...node, divider: updater(node.divider) }
  }
  return {
    ...node,
    first: updateAngledDividerNode(node.first, dividerId, updater),
    second: updateAngledDividerNode(node.second, dividerId, updater),
  }
}

export function moveAngledDividerEndpoint(
  model: ConstructionModel,
  dividerId: string,
  endpoint: 'top' | 'bottom',
  requestedOffsetMm: number,
): ConstructionModel {
  const resolved = resolveConstructionTopology(model).angledDividers.find((item) => item.id === dividerId)
  if (!resolved) return model
  const candidate = snapAngledEndpointToCorner(
    requestedOffsetMm,
    resolved.parentBounds.widthMm,
  )
  return {
    ...model,
    version: 'field-topology-06',
    root: updateAngledDividerNode(model.root, dividerId, (divider) => ({
      ...divider,
      topOffsetMm: endpoint === 'top' ? candidate : divider.topOffsetMm,
      bottomOffsetMm: endpoint === 'bottom' ? candidate : divider.bottomOffsetMm,
      thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
    })),
  }
}

export function moveAngledDivider(
  model: ConstructionModel,
  dividerId: string,
  deltaMm: number,
): ConstructionModel {
  const resolved = resolveConstructionTopology(model).angledDividers.find((item) => item.id === dividerId)
  if (!resolved) return model
  const minimumOffset = 0
  const maximumOffset = Math.max(0, resolved.parentBounds.widthMm)
  const minDelta = Math.max(minimumOffset - resolved.topOffsetMm, minimumOffset - resolved.bottomOffsetMm)
  const maxDelta = Math.min(maximumOffset - resolved.topOffsetMm, maximumOffset - resolved.bottomOffsetMm)
  const safeDelta = Math.min(Math.max(Math.round(deltaMm), minDelta), maxDelta)
  return {
    ...model,
    version: 'field-topology-06',
    root: updateAngledDividerNode(model.root, dividerId, (divider) => ({
      ...divider,
      topOffsetMm: divider.topOffsetMm + safeDelta,
      bottomOffsetMm: divider.bottomOffsetMm + safeDelta,
      thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
    })),
  }
}

function updateDividerOffset(
  node: ConstructionFieldNode,
  dividerId: string,
  requestedOffsetMm: number,
  bounds: ConstructionFieldBounds,
  polygon?: ConstructionPoint[],
): ConstructionFieldNode {
  if (node.kind === 'field') return node

  if (node.kind === 'angled-split') {
    const geometry = resolveAngledGeometry(node, bounds)
    return {
      ...node,
      first: updateDividerOffset(
        node.first,
        dividerId,
        requestedOffsetMm,
        polygonBounds(geometry.firstPolygon),
        geometry.firstPolygon,
      ),
      second: updateDividerOffset(
        node.second,
        dividerId,
        requestedOffsetMm,
        polygonBounds(geometry.secondPolygon),
        geometry.secondPolygon,
      ),
    }
  }

  if (node.divider.id === dividerId) {
    const axisLength = node.divider.axis === 'vertical' ? bounds.widthMm : bounds.heightMm
    const geometry = clampDividerGeometry(node, axisLength, requestedOffsetMm)
    if (polygon) {
      const previewNode: Extract<ConstructionFieldNode, { kind: 'split' }> = {
        ...node,
        divider: {
          ...node.divider,
          offsetMm: geometry.offsetMm,
          thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
        },
      }
      const preview = resolvePolygonSplitGeometry(previewNode, bounds, polygon)
      if (
        preview.firstPolygon.length < 3 ||
        preview.secondPolygon.length < 3 ||
        polygonArea(preview.firstPolygon) < 1 ||
        polygonArea(preview.secondPolygon) < 1
      ) return node
    }
    return {
      ...node,
      divider: {
        ...node.divider,
        offsetMm: geometry.offsetMm,
        thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
      },
    }
  }

  if (polygon) {
    const geometry = resolvePolygonSplitGeometry(node, bounds, polygon)
    return {
      ...node,
      divider: {
        ...node.divider,
        offsetMm: geometry.offsetMm,
        thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
      },
      first: updateDividerOffset(
        node.first,
        dividerId,
        requestedOffsetMm,
        geometry.firstBounds,
        geometry.firstPolygon,
      ),
      second: updateDividerOffset(
        node.second,
        dividerId,
        requestedOffsetMm,
        geometry.secondBounds,
        geometry.secondPolygon,
      ),
    }
  }

  const geometry = resolveSplitGeometry(node, bounds)
  return {
    ...node,
    divider: {
      ...node.divider,
      offsetMm: geometry.offsetMm,
      thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
    },
    first: updateDividerOffset(
      node.first,
      dividerId,
      requestedOffsetMm,
      geometry.firstBounds,
    ),
    second: updateDividerOffset(
      node.second,
      dividerId,
      requestedOffsetMm,
      geometry.secondBounds,
    ),
  }
}

function findDividerNode(
  node: ConstructionFieldNode,
  dividerId: string,
): Extract<ConstructionFieldNode, { kind: 'split' }> | null {
  if (node.kind === 'field') return null
  if (node.kind === 'split' && node.divider.id === dividerId) return node
  return findDividerNode(node.first, dividerId) ?? findDividerNode(node.second, dividerId)
}

function collectSameAxisDescendantDividerIds(
  node: ConstructionFieldNode,
  axis: ConstructionAxis,
  ids: string[] = [],
): string[] {
  if (node.kind === 'field') return ids

  if (node.kind === 'split' && node.divider.axis === axis) {
    ids.push(node.divider.id)
  }

  collectSameAxisDescendantDividerIds(node.first, axis, ids)
  collectSameAxisDescendantDividerIds(node.second, axis, ids)
  return ids
}

function moveOneDivider(
  model: ConstructionModel,
  dividerId: string,
  requestedOffsetMm: number,
): ConstructionModel {
  return {
    ...model,
    version: 'field-topology-06',
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: updateDividerOffset(
      model.root,
      dividerId,
      requestedOffsetMm,
      getFrameInteriorBounds(model),
    ),
  }
}

function restoreDividerAbsolutePosition(
  model: ConstructionModel,
  dividerId: string,
  absolutePositionMm: number,
): ConstructionModel {
  const resolved = resolveConstructionTopology(model).dividers
    .find((divider) => divider.id === dividerId)
  if (!resolved) return model

  const parentStartMm = resolved.positionMm - resolved.offsetMm
  return moveOneDivider(
    model,
    dividerId,
    absolutePositionMm - parentStartMm,
  )
}

function dividerPositionsMatch(
  model: ConstructionModel,
  preservedPositions: ReadonlyMap<string, number>,
): boolean {
  const positions = new Map(
    resolveConstructionTopology(model).dividers.map((divider) => [
      divider.id,
      divider.positionMm,
    ]),
  )

  return Array.from(preservedPositions.entries()).every(
    ([id, expected]) => Math.abs((positions.get(id) ?? Number.NaN) - expected) < 0.001,
  )
}

function moveDividerWithPreservedDescendants(
  model: ConstructionModel,
  dividerId: string,
  requestedOffsetMm: number,
  preservedDividerIds: readonly string[],
  preservedPositions: ReadonlyMap<string, number>,
): ConstructionModel {
  let next = moveOneDivider(model, dividerId, requestedOffsetMm)

  for (const preservedId of preservedDividerIds) {
    const absolutePositionMm = preservedPositions.get(preservedId)
    if (absolutePositionMm === undefined) continue
    next = restoreDividerAbsolutePosition(next, preservedId, absolutePositionMm)
  }

  return next
}

export function moveDivider(
  model: ConstructionModel,
  dividerId: string,
  offsetMm: number,
): ConstructionModel {
  const dividerNode = findDividerNode(model.root, dividerId)
  if (!dividerNode) return model

  const resolvedBefore = resolveConstructionTopology(model)
  const selectedBefore = resolvedBefore.dividers.find(
    (divider) => divider.id === dividerId,
  )
  if (!selectedBefore) return model

  const preservedDividerIds = [
    ...collectSameAxisDescendantDividerIds(
      dividerNode.first,
      dividerNode.divider.axis,
    ),
    ...collectSameAxisDescendantDividerIds(
      dividerNode.second,
      dividerNode.divider.axis,
    ),
  ]

  if (preservedDividerIds.length === 0) {
    return moveOneDivider(model, dividerId, offsetMm)
  }

  const preservedPositions = new Map(
    resolvedBefore.dividers
      .filter((divider) => preservedDividerIds.includes(divider.id))
      .map((divider) => [divider.id, divider.positionMm] as const),
  )

  const tryMove = (requested: number) =>
    moveDividerWithPreservedDescendants(
      model,
      dividerId,
      requested,
      preservedDividerIds,
      preservedPositions,
    )

  const direct = tryMove(offsetMm)
  if (dividerPositionsMatch(direct, preservedPositions)) {
    return direct
  }

  const originalOffset = Math.round(selectedBefore.offsetMm)
  const requestedOffset = Math.round(offsetMm)

  if (requestedOffset === originalOffset) {
    return model
  }

  let best = model

  if (requestedOffset > originalOffset) {
    let low = originalOffset
    let high = requestedOffset

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = tryMove(mid)

      if (dividerPositionsMatch(candidate, preservedPositions)) {
        best = candidate
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
  } else {
    let low = requestedOffset
    let high = originalOffset

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = tryMove(mid)

      if (dividerPositionsMatch(candidate, preservedPositions)) {
        best = candidate
        high = mid - 1
      } else {
        low = mid + 1
      }
    }
  }

  return best
}


function updateLeafFieldDefinition(
  node: ConstructionFieldNode,
  fieldId: string,
  updater: (field: ConstructionFieldNode['field']) => ConstructionFieldNode['field'],
): ConstructionFieldNode {
  if (node.kind === 'field') {
    return node.field.id === fieldId
      ? { kind: 'field', field: updater({ ...node.field }) }
      : node
  }

  return {
    ...node,
    first: updateLeafFieldDefinition(node.first, fieldId, updater),
    second: updateLeafFieldDefinition(node.second, fieldId, updater),
  }
}

/**
 * Constructor 01D canonical FIELD semantics.
 * Geometry is unchanged; only the selected leaf FIELD definition is updated.
 */
export function setConstructionFieldType(
  model: ConstructionModel,
  fieldId: string,
  fieldType: ConstructionFieldType | null,
): ConstructionModel {
  return {
    ...model,
    version: 'field-topology-07',
    root: updateLeafFieldDefinition(model.root, fieldId, (field) => ({
      ...field,
      fieldType,
      openingMode: fieldType === 'operable' ? field.openingMode : null,
      openingHanding: fieldType === 'operable' ? field.openingHanding : null,
    })),
  }
}

export function setConstructionFieldOpeningMode(
  model: ConstructionModel,
  fieldId: string,
  openingMode: ConstructionOpeningMode | null,
): ConstructionModel {
  return {
    ...model,
    version: 'field-topology-07',
    root: updateLeafFieldDefinition(model.root, fieldId, (field) => {
      if (field.fieldType !== 'operable') return field
      return {
        ...field,
        openingMode,
        openingHanding:
          openingMode === 'side-hinged' || openingMode === 'tilt-turn'
            ? field.openingHanding
            : null,
      }
    }),
  }
}

export function setConstructionFieldOpeningHanding(
  model: ConstructionModel,
  fieldId: string,
  openingHanding: ConstructionOpeningHanding | null,
): ConstructionModel {
  return {
    ...model,
    version: 'field-topology-07',
    root: updateLeafFieldDefinition(model.root, fieldId, (field) => {
      const handingRelevant =
        field.fieldType === 'operable' &&
        (field.openingMode === 'side-hinged' || field.openingMode === 'tilt-turn')
      return handingRelevant
        ? { ...field, openingHanding }
        : field
    }),
  }
}

function removeDividerNode(node: ConstructionFieldNode, dividerId: string): ConstructionFieldNode {
  if (node.kind === 'field') return node
  if (node.divider.id === dividerId) {
    return { kind: 'field', field: { ...node.field } }
  }

  return {
    ...node,
    first: removeDividerNode(node.first, dividerId),
    second: removeDividerNode(node.second, dividerId),
  }
}

export function removeDivider(model: ConstructionModel, dividerId: string): ConstructionModel {
  return {
    ...model,
    version: 'field-topology-06',
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: removeDividerNode(model.root, dividerId),
  }
}

function normalizeNodeToBounds(
  node: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
  polygon?: ConstructionPoint[],
): ConstructionFieldNode {
  if (node.kind === 'field') return node

  if (node.kind === 'angled-split') {
    const geometry = resolveAngledGeometry(node, bounds)
    return {
      ...node,
      divider: {
        ...node.divider,
        topOffsetMm: geometry.topOffsetMm,
        bottomOffsetMm: geometry.bottomOffsetMm,
        thicknessMm: geometry.thicknessMm,
      },
      first: normalizeNodeToBounds(
        node.first,
        polygonBounds(geometry.firstPolygon),
        geometry.firstPolygon,
      ),
      second: normalizeNodeToBounds(
        node.second,
        polygonBounds(geometry.secondPolygon),
        geometry.secondPolygon,
      ),
    }
  }

  if (polygon) {
    const geometry = resolvePolygonSplitGeometry(node, bounds, polygon)
    return {
      ...node,
      divider: {
        ...node.divider,
        offsetMm: geometry.offsetMm,
        thicknessMm: geometry.dividerThicknessMm,
      },
      first: normalizeNodeToBounds(node.first, geometry.firstBounds, geometry.firstPolygon),
      second: normalizeNodeToBounds(node.second, geometry.secondBounds, geometry.secondPolygon),
    }
  }

  const geometry = resolveSplitGeometry(node, bounds)

  return {
    ...node,
    divider: {
      ...node.divider,
      offsetMm: geometry.offsetMm,
      thicknessMm: geometry.dividerThicknessMm,
    },
    first: normalizeNodeToBounds(node.first, geometry.firstBounds),
    second: normalizeNodeToBounds(node.second, geometry.secondBounds),
  }
}

export function resizeConstructionFrame(
  model: ConstructionModel,
  frame: ConstructionFrame,
): ConstructionModel {
  const frameFaceMm = getConstructionFrameFaceMm(model)
  const nextModel: ConstructionModel = {
    ...model,
    version: 'field-topology-06',
    frame: { ...frame },
    frameFaceMm,
  }
  return {
    ...nextModel,
    root: normalizeNodeToBounds(nextModel.root, getFrameInteriorBounds(nextModel)),
  }
}

export function findFieldAtPoint(
  model: ConstructionModel,
  xMm: number,
  yMm: number,
): ResolvedConstructionField | null {
  const point = { xMm, yMm }
  return resolveConstructionTopology(model).fields.find(({ bounds, polygon }) => (
    polygon
      ? pointInPolygon(point, polygon)
      : xMm >= bounds.xMm &&
        xMm <= bounds.xMm + bounds.widthMm &&
        yMm >= bounds.yMm &&
        yMm <= bounds.yMm + bounds.heightMm
  )) ?? null
}

/**
 * Converts Constructor 01C full-span draft data into the canonical FIELD tree.
 * New topology is immediately based on the schematic frame interior.
 */
export function migrateLegacyDividersToTopology(
  frame: ConstructionFrame,
  legacyDividers: readonly ConstructorDividerSnapshot[],
): ConstructionModel {
  let model = createConstructionModel(frame)

  const verticals = legacyDividers
    .filter((divider) => divider.axis === 'vertical')
    .sort((a, b) => a.positionMm - b.positionMm)
  const horizontals = legacyDividers
    .filter((divider) => divider.axis === 'horizontal')
    .sort((a, b) => a.positionMm - b.positionMm)

  for (const divider of verticals) {
    const field = resolveConstructionTopology(model).fields.find(({ bounds }) => (
      divider.positionMm >= bounds.xMm + CONSTRUCTION_MIN_FIELD_MM &&
      divider.positionMm <= bounds.xMm + bounds.widthMm - CONSTRUCTION_MIN_FIELD_MM
    ))
    if (!field) continue
    const offset = divider.positionMm - field.bounds.xMm
    model = splitField(model, field.id, 'vertical', offset) ?? model
  }

  for (const divider of horizontals) {
    const targets = resolveConstructionTopology(model).fields.filter(({ bounds }) => (
      divider.positionMm >= bounds.yMm + CONSTRUCTION_MIN_FIELD_MM &&
      divider.positionMm <= bounds.yMm + bounds.heightMm - CONSTRUCTION_MIN_FIELD_MM
    ))
    for (const field of targets) {
      const offset = divider.positionMm - field.bounds.yMm
      model = splitField(model, field.id, 'horizontal', offset) ?? model
    }
  }

  return model
}

export function getTopologyMinimumSize(node: ConstructionFieldNode): { widthMm: number; heightMm: number } {
  return minimumNodeSize(node)
}

export function getConstructionMinimumFrameSize(model: ConstructionModel): {
  widthMm: number
  heightMm: number
} {
  const minimum = minimumNodeSize(model.root)
  const frameFaceMm = getConstructionFrameFaceMm(model)
  return {
    widthMm: minimum.widthMm + frameFaceMm * 2,
    heightMm: minimum.heightMm + frameFaceMm * 2,
  }
}
