import type { CombinedModuleComposition, CombinedModuleRegion } from './combinedModuleComposition'

export type CombinedRegionBounds = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

export type CombinedRegionGeometryEntry = {
  regionId: string
  fieldId: string | null
  bounds: {
    xMm: number | null
    yMm: number | null
    widthMm: number | null
    heightMm: number | null
  }
}

export type CombinedRegionGeometry = {
  schemaVersion: 'combined-region-geometry-01'
  regions: CombinedRegionGeometryEntry[]
}

export type CombinedRegionOutlineSegment = {
  start: { xMm: number; yMm: number }
  end: { xMm: number; yMm: number }
}

export type ResolvedCombinedRegionGeometry = {
  status: 'complete' | 'incomplete' | 'invalid'
  reason: string | null
  regions: Array<CombinedRegionGeometryEntry & { bounds: CombinedRegionBounds }>
  extent: CombinedRegionBounds | null
  outline: CombinedRegionOutlineSegment[]
  zeroDividers: Array<{
    relationId: string
    boundaryId: string
    leftRegionId: string
    rightRegionId: string
    start: { xMm: number; yMm: number }
    end: { xMm: number; yMm: number }
  }>
  exteriorVoid: 'implicit-outside-regions'
}

export function createIncompleteCombinedRegionGeometry(
  composition: CombinedModuleComposition | null | undefined,
): CombinedRegionGeometry | null {
  if (!composition) return null
  return {
    schemaVersion: 'combined-region-geometry-01',
    regions: composition.regions.map((region) => ({
      regionId: region.id,
      fieldId: region.fieldId,
      bounds: { xMm: null, yMm: 0, widthMm: null, heightMm: null },
    })),
  }
}

export function cloneCombinedRegionGeometry(
  geometry: CombinedRegionGeometry | null | undefined,
): CombinedRegionGeometry | null {
  return geometry ? structuredClone(geometry) : null
}

function expectedRoles(composition: CombinedModuleComposition): CombinedRegionRegionRole[] {
  return composition.layout === 'window-left'
    ? ['WINDOW_REGION', 'DOOR_REGION']
    : composition.layout === 'window-right'
      ? ['DOOR_REGION', 'WINDOW_REGION']
      : ['WINDOW_REGION', 'DOOR_REGION', 'WINDOW_REGION']
}

type CombinedRegionRegionRole = CombinedModuleRegion['role']

function buildOutline(regions: Array<CombinedRegionGeometryEntry & { bounds: CombinedRegionBounds }>): CombinedRegionOutlineSegment[] {
  const segments: CombinedRegionOutlineSegment[] = []
  const candidates = regions.flatMap(({ bounds }) => {
    const right = bounds.xMm + bounds.widthMm
    const bottom = bounds.yMm + bounds.heightMm
    return [
      { start: { xMm: bounds.xMm, yMm: bounds.yMm }, end: { xMm: right, yMm: bounds.yMm } },
      { start: { xMm: right, yMm: bounds.yMm }, end: { xMm: right, yMm: bottom } },
      { start: { xMm: right, yMm: bottom }, end: { xMm: bounds.xMm, yMm: bottom } },
      { start: { xMm: bounds.xMm, yMm: bottom }, end: { xMm: bounds.xMm, yMm: bounds.yMm } },
    ]
  })
  for (const candidate of candidates) {
    const horizontal = candidate.start.yMm === candidate.end.yMm
    const low = horizontal ? Math.min(candidate.start.xMm, candidate.end.xMm) : Math.min(candidate.start.yMm, candidate.end.yMm)
    const high = horizontal ? Math.max(candidate.start.xMm, candidate.end.xMm) : Math.max(candidate.start.yMm, candidate.end.yMm)
    const cuts = new Set([low, high])
    for (const { bounds } of regions) {
      const candidatesAtAxis = horizontal
        ? [bounds.xMm, bounds.xMm + bounds.widthMm]
        : [bounds.yMm, bounds.yMm + bounds.heightMm]
      candidatesAtAxis.forEach((value) => { if (value > low && value < high) cuts.add(value) })
    }
    const points = [...cuts].sort((a, b) => a - b)
    for (let index = 0; index < points.length - 1; index += 1) {
      const startValue = points[index], endValue = points[index + 1]
      const mid = (startValue + endValue) / 2
      const coveredFromBothSides = regions.filter(({ bounds }) => horizontal
        ? mid > bounds.xMm && mid < bounds.xMm + bounds.widthMm && candidate.start.yMm >= bounds.yMm && candidate.start.yMm <= bounds.yMm + bounds.heightMm
        : mid > bounds.yMm && mid < bounds.yMm + bounds.heightMm && candidate.start.xMm >= bounds.xMm && candidate.start.xMm <= bounds.xMm + bounds.widthMm).length > 1
      if (coveredFromBothSides) continue
      const forward = horizontal
        ? candidate.start.xMm <= candidate.end.xMm
        : candidate.start.yMm <= candidate.end.yMm
      const a = horizontal
        ? { xMm: forward ? startValue : endValue, yMm: candidate.start.yMm }
        : { xMm: candidate.start.xMm, yMm: forward ? startValue : endValue }
      const b = horizontal
        ? { xMm: forward ? endValue : startValue, yMm: candidate.start.yMm }
        : { xMm: candidate.start.xMm, yMm: forward ? endValue : startValue }
      segments.push({ start: a, end: b })
    }
  }
  return segments
}

export function resolveCombinedRegionGeometry(
  composition: CombinedModuleComposition | null | undefined,
  geometry: CombinedRegionGeometry | null | undefined,
): ResolvedCombinedRegionGeometry {
  const incomplete = (reason: string): ResolvedCombinedRegionGeometry => ({
    status: 'incomplete', reason, regions: [], extent: null, outline: [], zeroDividers: [], exteriorVoid: 'implicit-outside-regions',
  })
  const invalid = (reason: string): ResolvedCombinedRegionGeometry => ({
    status: 'invalid', reason, regions: [], extent: null, outline: [], zeroDividers: [], exteriorVoid: 'implicit-outside-regions',
  })
  if (!composition || !geometry) return incomplete('missing-composition-or-region-geometry')
  if (geometry.schemaVersion !== 'combined-region-geometry-01') return invalid('unknown-schema-version')
  if (!['window-left', 'window-right', 'window-both'].includes(composition.layout)) return invalid('unknown-combined-layout')
  const roles = expectedRoles(composition)
  if (composition.regions.length !== roles.length || geometry.regions.length !== roles.length) return invalid('region-count-mismatch')
  if (composition.zeroDividers.length !== roles.length - 1) return invalid('zero-divider-relation-count-mismatch')
  const mappedFieldIds = composition.regions.flatMap((region) => region.fieldId ? [region.fieldId] : [])
  if (new Set(composition.regions.map((region) => region.id)).size !== composition.regions.length
    || new Set(mappedFieldIds).size !== mappedFieldIds.length) return invalid('duplicate-region-or-field-identity')
  const complete: Array<{ regionId: string; fieldId: string | null; bounds: CombinedRegionBounds }> = []
  for (const [index, entry] of geometry.regions.entries()) {
    const region = composition.regions[index]
    if (!region || region.id !== entry.regionId || region.order !== index + 1 || region.role !== roles[index]) return invalid('region-identity-or-order-mismatch')
    if (region.fieldId !== entry.fieldId) return invalid('region-field-reference-mismatch')
    const bounds = entry.bounds
    if (!bounds || [bounds.xMm, bounds.yMm, bounds.widthMm, bounds.heightMm].some((value) => value === null)) return incomplete('region-bounds-missing')
    if (![bounds.xMm, bounds.yMm, bounds.widthMm, bounds.heightMm].every((value) => typeof value === 'number' && Number.isFinite(value))) return invalid('region-bounds-not-finite')
    complete.push({ ...entry, bounds: { xMm: bounds.xMm!, yMm: bounds.yMm!, widthMm: bounds.widthMm!, heightMm: bounds.heightMm! } })
  }
  for (const { bounds } of complete) {
    if (![bounds.xMm, bounds.yMm, bounds.widthMm, bounds.heightMm].every(Number.isFinite)
      || bounds.widthMm <= 0 || bounds.heightMm <= 0) return invalid('region-bounds-must-be-positive-and-finite')
    if (bounds.yMm !== 0) return invalid('regions-must-be-top-aligned')
  }
  for (let index = 0; index < complete.length; index += 1) {
    const current = complete[index].bounds
    const next = complete[index + 1]?.bounds
    if (!next) continue
    const right = current.xMm + current.widthMm
    if (Math.abs(right - next.xMm) > 1e-7) return invalid('adjacent-regions-do-not-share-edge')
    if (current.xMm + current.widthMm > next.xMm || next.xMm + next.widthMm <= current.xMm) return invalid('region-order-overlap-or-inversion')
  }
  const minX = Math.min(...complete.map(({ bounds }) => bounds.xMm))
  const minY = Math.min(...complete.map(({ bounds }) => bounds.yMm))
  const maxX = Math.max(...complete.map(({ bounds }) => bounds.xMm + bounds.widthMm))
  const maxY = Math.max(...complete.map(({ bounds }) => bounds.yMm + bounds.heightMm))
  const zeroDividers = composition.zeroDividers.map((relation, index) => {
    const left = complete[index]?.bounds
    const right = complete[index + 1]?.bounds
    if (!left || !right || relation.kind !== 'ZERO_DIVIDER'
      || relation.leftRegionId !== complete[index].regionId || relation.rightRegionId !== complete[index + 1].regionId) return null
    const x = left.xMm + left.widthMm
    const yStart = Math.max(left.yMm, right.yMm)
    const yEnd = Math.min(left.yMm + left.heightMm, right.yMm + right.heightMm)
    if (Math.abs(x - right.xMm) > 1e-7 || yEnd <= yStart) return null
    return {
      relationId: relation.id,
      boundaryId: relation.boundaryId,
      leftRegionId: relation.leftRegionId,
      rightRegionId: relation.rightRegionId,
      start: { xMm: x, yMm: yStart },
      end: { xMm: x, yMm: yEnd },
    }
  })
  if (zeroDividers.length !== roles.length - 1 || zeroDividers.some((item) => item === null)) return invalid('zero-divider-shared-edge-missing')
  return {
    status: 'complete', reason: null, regions: complete,
    extent: { xMm: minX, yMm: minY, widthMm: maxX - minX, heightMm: maxY - minY },
    outline: buildOutline(complete), zeroDividers: zeroDividers as NonNullable<(typeof zeroDividers)[number]>[],
    exteriorVoid: 'implicit-outside-regions',
  }
}

export function setCombinedRegionDimensions(
  composition: CombinedModuleComposition,
  geometry: CombinedRegionGeometry | null | undefined,
  regionId: string,
  dimension: 'widthMm' | 'heightMm',
  value: number,
): CombinedRegionGeometry | null {
  if (!Number.isFinite(value) || value <= 0) return null
  const next = cloneCombinedRegionGeometry(geometry) ?? createIncompleteCombinedRegionGeometry(composition)
  if (!next) return null
  const index = next.regions.findIndex((region) => region.regionId === regionId)
  if (index < 0) return null
  const entry = next.regions[index]
  entry.bounds = { ...entry.bounds, [dimension]: value, yMm: 0 }
  let xMm = next.regions[0].bounds.xMm ?? 0
  for (const region of next.regions) {
    region.bounds = { ...region.bounds, xMm, yMm: 0 }
    if (region.bounds.widthMm === null) break
    xMm += region.bounds.widthMm
  }
  return next
}

export function assignCombinedRegionFromFieldBounds(
  composition: CombinedModuleComposition,
  geometry: CombinedRegionGeometry | null | undefined,
  regionId: string,
  fieldId: string,
  fieldBounds: Pick<CombinedRegionBounds, 'widthMm' | 'heightMm'>,
): { composition: CombinedModuleComposition; geometry: CombinedRegionGeometry } | null {
  if (!fieldId || ![fieldBounds.widthMm, fieldBounds.heightMm].every((value) => Number.isFinite(value) && value > 0)) return null
  if (composition.schemaVersion !== 'combined-composition-01'
    || composition.regions.some((region) => region.id !== regionId && region.fieldId === fieldId)
    || composition.regions.some((region) => region.id === regionId && region.fieldId !== null && region.fieldId !== fieldId)) return null
  const nextComposition = structuredClone(composition)
  const regionIndex = nextComposition.regions.findIndex((region) => region.id === regionId)
  if (regionIndex < 0) return null
  const nextGeometry = cloneCombinedRegionGeometry(geometry) ?? createIncompleteCombinedRegionGeometry(nextComposition)
  if (!nextGeometry || nextGeometry.schemaVersion !== 'combined-region-geometry-01'
    || nextGeometry.regions.length !== nextComposition.regions.length) return null
  const geometryEntry = nextGeometry.regions.find((entry) => entry.regionId === regionId)
  if (!geometryEntry) return null
  nextComposition.regions[regionIndex] = { ...nextComposition.regions[regionIndex], fieldId }
  geometryEntry.fieldId = fieldId
  geometryEntry.bounds = {
    ...geometryEntry.bounds,
    widthMm: fieldBounds.widthMm,
    heightMm: fieldBounds.heightMm,
    yMm: 0,
  }
  let xMm = nextGeometry.regions[0].bounds.xMm ?? 0
  for (const entry of nextGeometry.regions) {
    entry.bounds = { ...entry.bounds, xMm, yMm: 0 }
    if (entry.bounds.widthMm === null) break
    xMm += entry.bounds.widthMm
  }
  return { composition: nextComposition, geometry: nextGeometry }
}

export function proportionallyResizeCombinedRegions(
  composition: CombinedModuleComposition,
  geometry: CombinedRegionGeometry,
  target: { widthMm?: number; heightMm?: number },
): CombinedRegionGeometry | null {
  const resolved = resolveCombinedRegionGeometry(composition, geometry)
  if (resolved.status !== 'complete' || !resolved.extent) return null
  const widthScale = target.widthMm === undefined ? 1 : target.widthMm / resolved.extent.widthMm
  const heightScale = target.heightMm === undefined ? 1 : target.heightMm / resolved.extent.heightMm
  if (![widthScale, heightScale].every((scale) => Number.isFinite(scale) && scale > 0)) return null
  return {
    schemaVersion: geometry.schemaVersion,
    regions: geometry.regions.map((region) => {
      if (region.bounds.widthMm === null || region.bounds.heightMm === null || region.bounds.xMm === null) return { ...region }
      return { ...region, bounds: {
        xMm: resolved.extent!.xMm + (region.bounds.xMm - resolved.extent!.xMm) * widthScale,
        yMm: 0,
        widthMm: region.bounds.widthMm * widthScale,
        heightMm: region.bounds.heightMm * heightScale,
      } }
    }),
  }
}

export function findCombinedRegionAtPoint(
  composition: CombinedModuleComposition | null | undefined,
  geometry: CombinedRegionGeometry | null | undefined,
  point: { xMm: number; yMm: number },
): CombinedRegionGeometryEntry & { bounds: CombinedRegionBounds } | null {
  const resolved = resolveCombinedRegionGeometry(composition, geometry)
  if (resolved.status !== 'complete') return null
  return resolved.regions.find(({ bounds }) => point.xMm >= bounds.xMm
    && point.xMm < bounds.xMm + bounds.widthMm
    && point.yMm >= bounds.yMm
    && point.yMm < bounds.yMm + bounds.heightMm) ?? null
}

export function findCombinedZeroDividerAtPoint(
  composition: CombinedModuleComposition | null | undefined,
  geometry: CombinedRegionGeometry | null | undefined,
  point: { xMm: number; yMm: number },
  toleranceMm: number,
) {
  if (!Number.isFinite(toleranceMm) || toleranceMm < 0) return null
  const resolved = resolveCombinedRegionGeometry(composition, geometry)
  if (resolved.status !== 'complete') return null
  return resolved.zeroDividers.find((boundary) => Math.abs(point.xMm - boundary.start.xMm) <= toleranceMm
    && point.yMm >= boundary.start.yMm - toleranceMm
    && point.yMm <= boundary.end.yMm + toleranceMm) ?? null
}
