import {
  CONSTRUCTION_DEFAULT_FRAME_FACE_MM,
  createConstructionModel,
  createFieldDefinition,
  type ConstructionAxis,
  type ConstructionFieldBounds,
  type ConstructionFieldNode,
  type ConstructionFrame,
  type ConstructionModel,
  type ConstructorDividerSnapshot,
  type ResolvedConstructionDivider,
  type ResolvedConstructionField,
} from './constructionModel'

export const CONSTRUCTION_MIN_FIELD_MM = 120
export const CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM = 40

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
  _divider: Extract<ConstructionFieldNode, { kind: 'split' }>['divider'],
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

function walkResolved(
  node: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
  fields: ResolvedConstructionField[],
  dividers: ResolvedConstructionDivider[],
) {
  if (node.kind === 'field') {
    fields.push({ ...node.field, sequence: 0, bounds: { ...bounds } })
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

  walkResolved(node.first, geometry.firstBounds, fields, dividers)
  walkResolved(node.second, geometry.secondBounds, fields, dividers)
}

function resolveTopologyWithBounds(
  root: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
): { fields: ResolvedConstructionField[]; dividers: ResolvedConstructionDivider[] } {
  const fields: ResolvedConstructionField[] = []
  const dividers: ResolvedConstructionDivider[] = []
  walkResolved(root, bounds, fields, dividers)
  fields.sort((a, b) => {
    const rowDelta = a.bounds.yMm - b.bounds.yMm
    if (Math.abs(rowDelta) > 0.001) return rowDelta
    return a.bounds.xMm - b.bounds.xMm
  })
  return {
    fields: fields.map((field, index) => ({ ...field, sequence: index + 1 })),
    dividers,
  }
}

export function resolveConstructionTopology(model: ConstructionModel): {
  fields: ResolvedConstructionField[]
  dividers: ResolvedConstructionDivider[]
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
  if (model.version === 'field-topology-03' && Number(model.frameFaceMm) > 0) {
    return { ...cloned, version: 'field-topology-03' }
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

  const firstFieldId = `field-${model.nextFieldId}`
  const secondFieldId = `field-${model.nextFieldId + 1}`
  const dividerId = `divider-${model.nextDividerId}`

  return {
    ...model,
    version: 'field-topology-03',
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

function updateDividerOffset(
  node: ConstructionFieldNode,
  dividerId: string,
  requestedOffsetMm: number,
  bounds: ConstructionFieldBounds,
): ConstructionFieldNode {
  if (node.kind === 'field') return node

  if (node.divider.id === dividerId) {
    const axisLength = node.divider.axis === 'vertical' ? bounds.widthMm : bounds.heightMm
    const geometry = clampDividerGeometry(node, axisLength, requestedOffsetMm)
    return {
      ...node,
      divider: {
        ...node.divider,
        offsetMm: geometry.offsetMm,
        thicknessMm: CONSTRUCTION_DEFAULT_DIVIDER_FACE_MM,
      },
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
  if (node.divider.id === dividerId) return node
  return findDividerNode(node.first, dividerId) ?? findDividerNode(node.second, dividerId)
}

export function moveDivider(
  model: ConstructionModel,
  dividerId: string,
  offsetMm: number,
): ConstructionModel {
  const dividerNode = findDividerNode(model.root, dividerId)
  if (!dividerNode) return model

  return {
    ...model,
    version: 'field-topology-03',
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: updateDividerOffset(
      model.root,
      dividerId,
      offsetMm,
      getFrameInteriorBounds(model),
    ),
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
    version: 'field-topology-03',
    frameFaceMm: getConstructionFrameFaceMm(model),
    root: removeDividerNode(model.root, dividerId),
  }
}

function normalizeNodeToBounds(
  node: ConstructionFieldNode,
  bounds: ConstructionFieldBounds,
): ConstructionFieldNode {
  if (node.kind === 'field') return node

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
    version: 'field-topology-03',
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
  return resolveConstructionTopology(model).fields.find(({ bounds }) => (
    xMm >= bounds.xMm &&
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
