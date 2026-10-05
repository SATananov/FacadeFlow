import {
  evaluateGlazingBeadCompatibility,
  type ComponentCompatibilityStatus,
} from './componentCompatibility'
import { getConstructionFrameEdges, resolveConstructionTopology } from './construction'
import { buildFieldHardwareRequirements } from './hardwareResolution'
import {
  getEffectiveFieldGlazingThicknessMm,
  type ModuleProfileResolution,
} from './profileResolution'
import type { DerivedProductModel, DerivedSketchElementReference } from './derivedProductModel'
import type { SemanticSketch } from './semanticSketch'
import {
  type ProductBlocker,
  type ProductFact,
  type ProductResolutionStatus,
  type SelectedSystem,
} from './productResolution'
import { getProfileSystemById } from '../data/profileSystems'
import type { ProfileDefinition, ProfileSystemCatalogEntry } from '../data/profileSystems/types'

export type ProductResolverInput = Readonly<{
  sketch: SemanticSketch
  system: SelectedSystem
}>

export const PRODUCT_RESOLVER_VERSION = 'product-resolver-03' as const

export type ProductResolverResult = Readonly<{
  model: DerivedProductModel
  status: ProductResolutionStatus
  blockers: readonly ProductBlocker[]
  machineReady: false
}>

type ProductReference = DerivedSketchElementReference

function resolved(value: ProductReference): ProductFact<ProductReference> {
  return { status: 'RESOLVED', value, technicalRenderingAllowed: true, blocksProductionReadiness: false }
}

function unknown(
  reason: string,
  sketchId: string,
  options: { semanticValue?: ProductReference; technicalRenderingAllowed?: boolean } = {},
): ProductFact<ProductReference> {
  return {
    status: 'UNKNOWN',
    value: null,
    semanticValue: options.semanticValue,
    reason,
    affectedSketchId: sketchId,
    technicalRenderingAllowed: options.technicalRenderingAllowed ?? false,
    blocksProductionReadiness: true,
  }
}

function unsupported(reason: string, sketchId: string, semanticValue?: ProductReference): ProductFact<ProductReference> {
  return {
    status: 'UNSUPPORTED',
    value: null,
    semanticValue,
    reason,
    affectedSketchId: sketchId,
    technicalRenderingAllowed: false,
    blocksProductionReadiness: true,
  }
}

function blocker(id: string, fact: ProductFact<ProductReference>): ProductBlocker | null {
  if (fact.status === 'RESOLVED') return null
  return {
    id,
    status: fact.status,
    reason: fact.reason,
    affectedSketchId: fact.affectedSketchId,
    blocksProductionReadiness: fact.blocksProductionReadiness,
  }
}

function findProfile(system: ProfileSystemCatalogEntry | null, code: string | null | undefined): ProfileDefinition | null {
  if (!system || !code) return null
  const groups: readonly (readonly ProfileDefinition[])[] = [
    system.mainProfiles,
    system.glassBeads,
    system.additionalProfiles,
    system.gaskets,
    system.panelsAndSills,
  ]
  return groups.flat().find((profile) => profile.code === code) ?? null
}

function assignmentFact(args: {
  system: ProfileSystemCatalogEntry | null
  resolution: ModuleProfileResolution | null
  assignment: { profileCode: string; source: 'human' } | null | undefined
  sketchId: string
  expectedRoles: readonly ProfileDefinition['role'][]
  role: string
}): ProductFact<ProductReference> {
  const semanticValue: ProductReference = { sketchId: args.sketchId, kind: args.role === 'frame' ? 'module' : args.role === 'divider' ? 'divider' : 'field', role: args.role }
  if (!args.system) return unknown('Selected profile system is missing or unsupported.', args.sketchId, { semanticValue })
  if (!args.resolution) return unknown('Explicit profile resolution is missing.', args.sketchId, { semanticValue })
  if (!args.assignment) return unknown(`No explicit ${args.role} profile assignment exists.`, args.sketchId, { semanticValue })
  const profile = findProfile(args.system, args.assignment.profileCode)
  if (!profile || !args.expectedRoles.includes(profile.role)) {
    return unsupported(`Profile assignment ${args.assignment.profileCode} is not supported for ${args.role}.`, args.sketchId, { ...semanticValue, profileCode: args.assignment.profileCode })
  }
  return resolved({ ...semanticValue, profileCode: profile.code })
}

function compatibilityStatusToFact(
  status: ComponentCompatibilityStatus,
  sketchId: string,
  semanticValue: ProductReference,
): ProductFact<ProductReference> {
  if (status === 'valid') return resolved(semanticValue)
  if (status === 'invalid') return unsupported('Explicit glazing bead is incompatible with the current supported context.', sketchId, semanticValue)
  return unknown('Glazing bead compatibility is not reviewed for the current base profile.', sketchId, { semanticValue, technicalRenderingAllowed: true })
}

function statusOf(facts: readonly ProductFact<ProductReference>[], hasCoreUnsupported: boolean): ProductResolutionStatus {
  if (hasCoreUnsupported || facts.some((fact) => fact.status === 'UNSUPPORTED')) return 'UNRESOLVED'
  return facts.some((fact) => fact.status === 'UNKNOWN') ? 'PARTIALLY_RESOLVED' : 'RESOLVED'
}

/**
 * Pure PRODUCT RESOLVER 03.
 *
 * It reads authoritative inputs and catalogue/evidence helpers only. It does
 * not mutate either input, emit physical coordinates, or persist a result.
 */
export function resolveProductFromSketch(input: ProductResolverInput): ProductResolverResult {
  const { sketch, system: selectedSystem } = input
  const topology = resolveConstructionTopology(sketch.topology)
  const system = selectedSystem.profileSystemId ? getProfileSystemById(selectedSystem.profileSystemId) ?? null : null
  const resolution = selectedSystem.profileResolution?.profileSystemId === selectedSystem.profileSystemId
    ? selectedSystem.profileResolution
    : null
  const blockers: ProductBlocker[] = []
  const allFacts: ProductFact<ProductReference>[] = []

  const frame = assignmentFact({
    system,
    resolution,
    assignment: resolution?.frame,
    sketchId: sketch.moduleId,
    expectedRoles: ['frame'],
    role: 'frame',
  })
  allFacts.push(frame)
  const frameBlocker = blocker('frame-profile', frame)
  if (frameBlocker) blockers.push(frameBlocker)

  const fields: ProductFact<ProductReference>[] = []
  const sashIntent: ProductFact<ProductReference>[] = []
  const members: ProductFact<ProductReference>[] = []
  const dividers: ProductFact<ProductReference>[] = []
  const glazing: ProductFact<ProductReference>[] = []
  const beads: ProductFact<ProductReference>[] = []
  const openings: ProductFact<ProductReference>[] = []
  const hardware: ProductFact<ProductReference>[] = []

  const regionByFieldId = new Map(
    (sketch.combinedComposition?.regions ?? [])
      .filter((region): region is typeof region & { fieldId: string } => region.fieldId !== null)
      .map((region) => [region.fieldId, region] as const),
  )

  for (const field of topology.fields) {
    const fieldReference: ProductReference = {
      sketchId: field.id,
      kind: 'field',
      role: 'field-semantic-intent',
      fieldType: field.fieldType,
      openingMode: field.openingMode,
      openingHanding: field.openingHanding,
    }
    const fieldFact = field.fieldType
      ? resolved(fieldReference)
      : unknown('FIELD type is not explicitly defined.', field.id, { semanticValue: fieldReference, technicalRenderingAllowed: true })
    fields.push(fieldFact)
    allFacts.push(fieldFact)
    if (fieldFact.status !== 'RESOLVED') {
      const fieldBlocker = blocker(`field:${field.id}`, fieldFact)
      if (fieldBlocker) blockers.push(fieldBlocker)
    }

    if (field.fieldType !== 'operable') continue

    const sashIntentReference: ProductReference = {
      sketchId: field.id,
      kind: 'field',
      role: 'sash-intent',
      fieldType: 'operable',
      openingMode: field.openingMode,
      openingHanding: field.openingHanding,
    }
    const sashIntentFact = resolved(sashIntentReference)
    sashIntent.push(sashIntentFact)
    allFacts.push(sashIntentFact)

    const regionRole = regionByFieldId.get(field.id)?.role
    const expectedSashRoles: readonly ProfileDefinition['role'][] = regionRole === 'DOOR_REGION' || sketch.productIntent.productType === 'door' || sketch.productIntent.productType === 'terrace-door'
      ? ['door-sash']
      : ['sash']
    const sashFact = assignmentFact({
      system,
      resolution,
      assignment: resolution?.fieldSashes[field.id],
      sketchId: field.id,
      expectedRoles: expectedSashRoles,
      role: 'sash',
    })
    members.push(sashFact)
    allFacts.push(sashFact)
    const sashBlocker = blocker(`sash:${field.id}`, sashFact)
    if (sashBlocker) blockers.push(sashBlocker)

    const openingReference: ProductReference = { ...sashIntentReference, role: 'opening-intent' }
    const openingFact = !field.openingMode
      ? unknown('Opening mode is not explicitly defined.', field.id, { semanticValue: openingReference, technicalRenderingAllowed: true })
      : field.openingHanding || !['side-hinged', 'tilt-turn', 'side-hinged-top-hung'].includes(field.openingMode)
        ? resolved(openingReference)
        : unknown('Opening handing is not explicitly defined.', field.id, { semanticValue: openingReference, technicalRenderingAllowed: true })
    openings.push(openingFact)
    allFacts.push(openingFact)
    const openingBlocker = blocker(`opening:${field.id}`, openingFact)
    if (openingBlocker) blockers.push(openingBlocker)

    const hardwareRequirements = buildFieldHardwareRequirements({
      field: {
        id: field.id,
        fieldType: field.fieldType,
        openingMode: field.openingMode,
        openingHanding: field.openingHanding,
      },
      profileSystemId: selectedSystem.profileSystemId,
      hardwareStandardId: selectedSystem.hardware.standardId,
    })
    const hardwareReference: ProductReference = { ...sashIntentReference, role: 'hardware-requirement' }
    const hardwareFact = hardwareRequirements.status === 'not-applicable'
      ? resolved(hardwareReference)
      : unknown(`Concrete hardware kit remains unresolved (${hardwareRequirements.status}).`, field.id, { semanticValue: hardwareReference, technicalRenderingAllowed: true })
    hardware.push(hardwareFact)
    allFacts.push(hardwareFact)
    const hardwareBlocker = blocker(`hardware:${field.id}`, hardwareFact)
    if (hardwareBlocker) blockers.push(hardwareBlocker)
  }

  for (const divider of topology.dividers) {
    const dividerFact = assignmentFact({
      system,
      resolution,
      assignment: resolution?.dividers[divider.id],
      sketchId: divider.id,
      expectedRoles: ['mullion'],
      role: 'divider',
    })
    dividers.push(dividerFact)
    allFacts.push(dividerFact)
    const dividerBlocker = blocker(`divider:${divider.id}`, dividerFact)
    if (dividerBlocker) blockers.push(dividerBlocker)
  }

  for (const boundary of topology.semanticBoundaries) {
    const zeroReference: ProductReference = { sketchId: boundary.id, kind: 'divider', role: 'ZERO_DIVIDER', semanticOnly: true }
    const zeroFact = resolved(zeroReference)
    dividers.push(zeroFact)
    allFacts.push(zeroFact)
  }

  for (const field of topology.fields) {
    if (!field.fieldType) continue
    const thickness = getEffectiveFieldGlazingThicknessMm(resolution, selectedSystem.offerDefaultGlazingId, field.id)
    const baseProfileCode = field.fieldType === 'fixed' ? resolution?.frame?.profileCode ?? null : resolution?.fieldSashes[field.id]?.profileCode ?? null
    const glazingReference: ProductReference = {
      sketchId: field.id,
      kind: 'field',
      role: 'glazing-context',
      fieldType: field.fieldType,
      glazingThicknessMm: thickness,
    }
    const glazingFact = thickness !== null
      ? resolved(glazingReference)
      : unknown('Explicit glazing thickness/context is missing.', field.id, { semanticValue: glazingReference, technicalRenderingAllowed: true })
    glazing.push(glazingFact)
    allFacts.push(glazingFact)
    const glazingBlocker = blocker(`glazing:${field.id}`, glazingFact)
    if (glazingBlocker) blockers.push(glazingBlocker)

    const beadCode = resolution?.fieldGlazingBeads[field.id]?.profileCode ?? null
    const beadReference: ProductReference = { ...glazingReference, role: 'glazing-bead', profileCode: beadCode ?? undefined }
    const compatibility = system
      ? evaluateGlazingBeadCompatibility(system, thickness, beadCode, {
          fieldType: field.fieldType,
          baseProfileCode,
          baseProfileRole: field.fieldType === 'fixed' ? 'frame' : sketch.productIntent.productType === 'door' || regionByFieldId.get(field.id)?.role === 'DOOR_REGION' ? 'door-sash' : 'sash',
        })
      : null
    const beadFact = compatibility
      ? compatibilityStatusToFact(compatibility.status, field.id, beadReference)
      : unknown('Selected profile system is missing; bead compatibility cannot be evaluated.', field.id, { semanticValue: beadReference })
    beads.push(beadFact)
    allFacts.push(beadFact)
    const beadBlocker = blocker(`bead:${field.id}`, beadFact)
    if (beadBlocker) blockers.push(beadBlocker)

    const insetFact = unknown('Exact glazing inset and glass-cut geometry are not proven.', field.id, { semanticValue: { ...glazingReference, role: 'glazing-inset' }, technicalRenderingAllowed: true })
    glazing.push(insetFact)
    allFacts.push(insetFact)
    const insetBlocker = blocker(`glazing-inset:${field.id}`, insetFact)
    if (insetBlocker) blockers.push(insetBlocker)
  }

  const edges = getConstructionFrameEdges(sketch.topology)
  const bottomReference: ProductReference = { sketchId: sketch.moduleId, kind: 'module', role: 'bottom-boundary', boundaryKind: edges.bottom, semanticOnly: true }
  const bottomBoundary = edges.bottom === 'threshold'
    ? unknown('Threshold intent is explicit, but exact threshold geometry is not proven.', sketch.moduleId, { semanticValue: bottomReference, technicalRenderingAllowed: true })
    : resolved(bottomReference)
  allFacts.push(bottomBoundary)
  const bottomBlocker = blocker('bottom-boundary', bottomBoundary)
  if (bottomBlocker) blockers.push(bottomBlocker)

  const regions: ProductFact<ProductReference>[] = (sketch.combinedComposition?.regions ?? []).map((region) => resolved({
    sketchId: region.id,
    kind: 'region',
    role: region.role,
    semanticOnly: true,
  }))
  allFacts.push(...regions)
  const hasCoreUnsupported = !system || !resolution || (selectedSystem.profileSystemId !== null && !system)
  const resolutionStatus = statusOf(allFacts, hasCoreUnsupported)
  const model: DerivedProductModel = {
    version: 'derived-product-model-contract-02',
    moduleId: sketch.moduleId,
    sketch: { moduleId: sketch.moduleId },
    system: { profileSystemId: selectedSystem.profileSystemId, standardId: selectedSystem.standardId },
    productType: sketch.productIntent.productType,
    resolutionStatus,
    frame,
    members,
    dividers,
    fields,
    regions,
    sashIntent,
    glazing,
    beads,
    openings,
    hardware,
    bottomBoundaries: [bottomBoundary],
    blockers,
    machineReady: false,
  }
  return { model, status: resolutionStatus, blockers, machineReady: false }
}
