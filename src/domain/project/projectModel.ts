import type { ConstructorDraftSnapshot } from '../construction'
import { resolveConstructionTopology } from '../construction'
import { syncOfferModuleFieldsFromTopology } from '../offerModules'
import type { OfferModuleDraft } from '../offerModules'
import type { OfferModuleDefaults } from '../offerModuleDefaults'
import type { ModuleProfileResolution } from '../profileResolution'
import { emptyAssurance, type AssuranceState } from '../assurance/assuranceModel'
import type { RevisionState } from './revisionModel'
import type { CompositeModuleStructure } from '../compositeModuleStructure'
import { trackChanges } from '../assurance/changeTracking'

export const PROJECT_SCHEMA_VERSION = 'project-foundation-02' as const
export type IdFactory = () => string
export const createStableId: IdFactory = () => globalThis.crypto.randomUUID()

export type ClientMetadata = {
  clientName: string; clientEik: string; clientAddress: string
  clientPhone: string; clientEmail: string; clientContactPerson: string
}
export type SiteMetadata = { objectName: string; objectAddress: string }
export type OfferSettingsDraft = Omit<OfferModuleDefaults, 'inheritanceMode'>
/** Compatibility view for the existing form, not another persisted entity. */
export type OfferDraft = ClientMetadata & SiteMetadata & OfferSettingsDraft & { commonConditions: string }
export const EMPTY_OFFER: OfferDraft = {
  clientName: '', clientEik: '', clientAddress: '', clientPhone: '', clientEmail: '', clientContactPerson: '',
  objectName: '', objectAddress: '', profileSystemId: '', colorId: '', foilModeId: '', glazingId: '',
  hardwareStandardId: '', hardwareManufacturerId: 'unspecified', commonConditions: '',
}

type OfferBase = { id: string; projectId: string }
export type ProjectOffer = OfferBase & (
  // Internal workspace ownership only. No commercial settings or lifecycle.
  | { entryMode: 'free' }
  | { entryMode: 'offer'; settingsDraft: OfferSettingsDraft; commonConditions: string
      setupStage: 'editing' | 'modules'; pendingCopyModuleId: string | null; fromFreeSketch: boolean }
)
export type ModuleDefinition =
  | { kind: 'offer'; draft: Omit<OfferModuleDraft, 'id' | 'sequence'> }
  | { kind: 'free'; profileSystemId: string; productType: 'window' | 'door' | null }
export type ProjectModule = {
  id: string; offerId: string; sequence: number; definition: ModuleDefinition
  compositeStructure?: CompositeModuleStructure | null
}
/** Existing module definition is the sole system authority, for both workflows. */
export function getProjectModuleSystemId(module: ProjectModule): string {
  return module.definition.kind === 'free' ? module.definition.profileSystemId : module.definition.draft.inheritedDefaults.profileSystemId
}
export type FreeConstructorModule = {
  id: string; sequence: number; profileSystemId: string; productType: 'window' | 'door' | null
  profileResolution: ModuleProfileResolution | null
}

export type ProjectSnapshot = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION
  revisions: RevisionState
  assurance: AssuranceState
  project: { id: string; client: ClientMetadata; site: SiteMetadata }
  offersById: Record<string, ProjectOffer>
  modulesById: Record<string, ProjectModule>
  constructionDraftsByModuleId: Record<string, ConstructorDraftSnapshot | null>
  profileResolutionsByModuleId: Record<string, ModuleProfileResolution | null>
  /** Navigation envelope; never a technical or commercial decision. */
  workspace: {
    offerId: string; freeOfferId: string
    activeModuleIdByOffer: Record<string, string | null>
    screen: 'home' | 'offer-setup' | 'offer-constructor' | 'free-constructor'
  }
}
export type PF01Snapshot = Omit<ProjectSnapshot, 'schemaVersion' | 'revisions' | 'assurance'> & { schemaVersion: 'project-foundation-01' }


export function getProjectDisplayName(snapshot: Pick<ProjectSnapshot, 'project' | 'workspace'>): string {
  const objectName = snapshot.project.site.objectName.trim()
  const clientName = snapshot.project.client.clientName.trim()
  if (objectName && clientName) return `${objectName} · ${clientName}`
  if (objectName) return objectName
  if (clientName) return clientName
  return snapshot.workspace.screen === 'free-constructor' ? 'Свободен проект' : 'Нов проект'
}

export function settingsFromForm(form: OfferDraft): OfferSettingsDraft {
  const { profileSystemId, colorId, foilModeId, glazingId, hardwareStandardId, hardwareManufacturerId } = form
  return { profileSystemId, colorId, foilModeId, glazingId, hardwareStandardId, hardwareManufacturerId }
}

export type ProjectActivity = {
  kind: 'empty' | 'free' | 'offer'
  hasOfferWork: boolean
  hasFreeWork: boolean
}

function hasMeaningfulChoice(key: keyof OfferSettingsDraft, value: string): boolean {
  const normalized = value.trim()
  if (key === 'hardwareManufacturerId') return normalized.length > 0 && normalized !== 'unspecified'
  return normalized.length > 0
}

export function getProjectActivity(snapshot: ProjectSnapshot): ProjectActivity {
  const hasProjectMetadata = [
    ...Object.values(snapshot.project.client),
    ...Object.values(snapshot.project.site),
  ].some((value) => value.trim().length > 0)

  const offer = snapshot.offersById[snapshot.workspace.offerId]
  const hasOfferSetup = offer?.entryMode === 'offer' && (
    Object.entries(offer.settingsDraft).some(([key, value]) => (
      hasMeaningfulChoice(key as keyof OfferSettingsDraft, String(value))
    ))
    || offer.commonConditions.trim().length > 0
    || offer.setupStage !== 'editing'
    || offer.fromFreeSketch
  )

  const hasOfferModules = Object.values(snapshot.modulesById).some(
    (module) => module.offerId === snapshot.workspace.offerId,
  )
  const hasFreeModules = Object.values(snapshot.modulesById).some(
    (module) => module.offerId === snapshot.workspace.freeOfferId,
  )

  const hasOfferWork = hasProjectMetadata || Boolean(hasOfferSetup) || hasOfferModules
  const hasFreeWork = hasFreeModules

  return {
    kind: hasOfferWork ? 'offer' : hasFreeWork ? 'free' : 'empty',
    hasOfferWork,
    hasFreeWork,
  }
}

export function hasMeaningfulProjectContent(snapshot: ProjectSnapshot): boolean {
  return getProjectActivity(snapshot).kind !== 'empty'
}

export function createProjectSnapshot(idFactory: IdFactory = createStableId): ProjectSnapshot {
  const projectId = idFactory(), offerId = idFactory(), freeOfferId = idFactory()
  if (new Set([projectId, offerId, freeOfferId]).size !== 3) throw new Error('Duplicate project identity')
  const snapshot: ProjectSnapshot = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    revisions: { headRevisionId: null, revisionsById: {} }, assurance: emptyAssurance(),
    project: {
      id: projectId,
      client: { clientName: '', clientEik: '', clientAddress: '', clientPhone: '', clientEmail: '', clientContactPerson: '' },
      site: { objectName: '', objectAddress: '' },
    },
    offersById: {
      [offerId]: { id: offerId, projectId, entryMode: 'offer', settingsDraft: settingsFromForm(EMPTY_OFFER),
        commonConditions: '', setupStage: 'editing', pendingCopyModuleId: null, fromFreeSketch: false },
      [freeOfferId]: { id: freeOfferId, projectId, entryMode: 'free' },
    },
    modulesById: {}, constructionDraftsByModuleId: {}, profileResolutionsByModuleId: {},
    workspace: { offerId, freeOfferId, activeModuleIdByOffer: { [offerId]: null, [freeOfferId]: null }, screen: 'home' },
  }
  trackChanges(null, snapshot)
  return snapshot
}

export function getEditingOffer(snapshot: ProjectSnapshot) {
  const offer = snapshot.offersById[snapshot.workspace.offerId]
  if (!offer || offer.entryMode !== 'offer') throw new Error('Missing editable offer')
  return offer
}
export function getOfferForm(snapshot: ProjectSnapshot): OfferDraft {
  const offer = getEditingOffer(snapshot)
  return { ...snapshot.project.client, ...snapshot.project.site, ...offer.settingsDraft, commonConditions: offer.commonConditions }
}
export function getModules(snapshot: ProjectSnapshot, offerId: string): ProjectModule[] {
  return Object.values(snapshot.modulesById).filter((module) => module.offerId === offerId).sort((a, b) => a.sequence - b.sequence)
}
/** Numbering is scoped to the owning offer/workspace, using current persisted modules. */
export function getNextModuleSequence(snapshot: ProjectSnapshot, offerId: string): number {
  return getModules(snapshot, offerId).reduce((maximum, module) => Math.max(maximum, module.sequence), 0) + 1
}
export function getOfferModules(snapshot: ProjectSnapshot): OfferModuleDraft[] {
  return getModules(snapshot, snapshot.workspace.offerId).flatMap((module) => module.definition.kind === 'offer'
    ? [getModuleDraftView(snapshot, module)] : [])
}
export function getModuleDraftView(snapshot: ProjectSnapshot, module: ProjectModule): OfferModuleDraft {
  if (module.definition.kind !== 'offer') throw new Error('Expected offer module')
  const definition = { ...module.definition.draft, id: module.id, sequence: module.sequence }
  const topology = snapshot.constructionDraftsByModuleId[module.id]?.topology
  if (!topology) return definition
  const fields = resolveConstructionTopology(topology).fields
  return { ...definition, widthMm: topology.frame.widthMm, heightMm: topology.frame.heightMm,
    widthSource: 'constructor', heightSource: 'constructor', fieldCount: fields.length, fieldCountSource: 'constructor',
    fields: syncOfferModuleFieldsFromTopology(definition.fields, fields.map((field) => ({ ...field, widthMm: field.bounds.widthMm }))) }
}
export function getFreeModules(snapshot: ProjectSnapshot): FreeConstructorModule[] {
  return getModules(snapshot, snapshot.workspace.freeOfferId).flatMap((module) => module.definition.kind === 'free'
    ? [{ id: module.id, sequence: module.sequence, profileSystemId: module.definition.profileSystemId,
        productType: module.definition.productType, profileResolution: snapshot.profileResolutionsByModuleId[module.id] }] : [])
}
