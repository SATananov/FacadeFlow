import { getProfileSystemById } from '../../data/profileSystems'
import { resolveConstructionTopology, type ConstructorDraftSnapshot } from '../construction'
import { createOfferModule, retainPendingOfferModuleFieldDescriptions, type OfferModuleDraft } from '../offerModules'
import { buildOfferModuleDefaults } from '../offerModuleDefaults'
import { createModuleProfileResolution, reconcileModuleProfileResolution } from '../profileResolution'
import { trackChanges } from '../assurance/changeTracking'
import { synchronizeEvidence } from '../assurance/legacyEvidenceAdapter'
import { assertHistoryPreserved, freezeHistory } from './revisionOperations'
import { canonicalize } from '../assurance/canonical'
import {
  createStableId, getEditingOffer, getModules, settingsFromForm, EMPTY_OFFER,
  type FreeConstructorModule, type IdFactory, type OfferDraft, type ProjectModule, type ProjectSnapshot,
} from './projectModel'

export type Update<T> = T | ((current: T) => T)
export const applyUpdate = <T>(current: T, update: Update<T>): T => typeof update === 'function'
  ? (update as (current: T) => T)(current) : update

/** A single immutable graph transaction. Never edits Constructor topology. */
export function editProject(snapshot: ProjectSnapshot, edit: (draft: ProjectSnapshot) => void): ProjectSnapshot {
  const next = structuredClone(snapshot)
  edit(next)
  // Constructor topology owns geometry. During the Form -> Constructor handoff,
  // unresolved form FIELD semantics remain as a semantic-only transition payload
  // until the topology has matching FIELD identities. No divider geometry is inferred.
  for (const module of Object.values(next.modulesById)) {
    const topology = next.constructionDraftsByModuleId[module.id]?.topology
    if (module.definition.kind === 'offer' && topology) {
      const topologyFields = resolveConstructionTopology(topology).fields.map((field) => ({
        id: field.id,
        sequence: field.sequence,
        widthMm: field.bounds.widthMm,
        fieldType: field.fieldType,
        openingMode: field.openingMode,
        openingHanding: field.openingHanding,
      }))
      const pendingFields = retainPendingOfferModuleFieldDescriptions(
        module.definition.draft.fields,
        topologyFields,
      )
      Object.assign(module.definition.draft, {
        widthMm: null,
        widthSource: 'unset',
        heightMm: null,
        heightSource: 'unset',
        fieldCount: null,
        fieldCountSource: 'unset',
        fields: pendingFields,
      })
    }
  }
  assertHistoryPreserved(snapshot, next)
  if (canonicalize(snapshot.revisions) !== canonicalize(next.revisions) || canonicalize(snapshot.assurance) !== canonicalize(next.assurance)) {
    throw new Error('Use explicit PF02 domain operations to edit assurance/history')
  }
  trackChanges(snapshot, next)
  synchronizeEvidence(next)
  return freezeHistory(next)
}

export function writeOfferForm(snapshot: ProjectSnapshot, form: OfferDraft): void {
  const { clientName, clientEik, clientAddress, clientPhone, clientEmail, clientContactPerson, objectName, objectAddress } = form
  snapshot.project.client = { clientName, clientEik, clientAddress, clientPhone, clientEmail, clientContactPerson }
  snapshot.project.site = { objectName, objectAddress }
  const offer = getEditingOffer(snapshot)
  offer.settingsDraft = settingsFromForm(form)
  offer.commonConditions = form.commonConditions
}

function keepOwnedModules(snapshot: ProjectSnapshot, offerId: string, keep: Set<string>): void {
  for (const module of getModules(snapshot, offerId)) {
    if (keep.has(module.id)) continue
    delete snapshot.modulesById[module.id]
    delete snapshot.constructionDraftsByModuleId[module.id]
    delete snapshot.profileResolutionsByModuleId[module.id]
  }
  const active = snapshot.workspace.activeModuleIdByOffer[offerId]
  if (active && !keep.has(active)) snapshot.workspace.activeModuleIdByOffer[offerId] = null
}
function assertModuleOwnership(snapshot: ProjectSnapshot, id: string, offerId: string): void {
  if (!id || id === snapshot.project.id || Object.hasOwn(snapshot.offersById, id)) throw new Error('Invalid module identity')
  const existing = snapshot.modulesById[id]
  if (existing && existing.offerId !== offerId) throw new Error('Module belongs to another offer')
}
function initializePayload(snapshot: ProjectSnapshot, module: ProjectModule): void {
  if (!Object.hasOwn(snapshot.constructionDraftsByModuleId, module.id)) snapshot.constructionDraftsByModuleId[module.id] = null
  if (!Object.hasOwn(snapshot.profileResolutionsByModuleId, module.id)) {
    const systemId = module.definition.kind === 'free' ? module.definition.profileSystemId : module.definition.draft.inheritedDefaults.profileSystemId
    snapshot.profileResolutionsByModuleId[module.id] = systemId ? createModuleProfileResolution(systemId) : null
  }
}

export function replaceOfferModules(snapshot: ProjectSnapshot, modules: OfferModuleDraft[]): void {
  const offer = getEditingOffer(snapshot)
  if (new Set(modules.map((module) => module.id)).size !== modules.length) throw new Error('Duplicate module identity')
  keepOwnedModules(snapshot, offer.id, new Set(modules.map((module) => module.id)))
  for (const { id, sequence, ...draft } of modules) {
    assertModuleOwnership(snapshot, id, offer.id)
    const module: ProjectModule = { id, offerId: offer.id, sequence, definition: { kind: 'offer', draft } }
    snapshot.modulesById[id] = module
    initializePayload(snapshot, module)
  }
}
export function replaceFreeModules(snapshot: ProjectSnapshot, modules: FreeConstructorModule[]): void {
  const offerId = snapshot.workspace.freeOfferId
  if (new Set(modules.map((module) => module.id)).size !== modules.length) throw new Error('Duplicate module identity')
  keepOwnedModules(snapshot, offerId, new Set(modules.map((module) => module.id)))
  for (const { id, sequence, profileSystemId, productType, profileResolution } of modules) {
    assertModuleOwnership(snapshot, id, offerId)
    const module: ProjectModule = { id, offerId, sequence, definition: { kind: 'free', profileSystemId, productType } }
    snapshot.modulesById[id] = module
    initializePayload(snapshot, module)
    snapshot.profileResolutionsByModuleId[id] = profileResolution
  }
}

export function clearConfiguredModules(snapshot: ProjectSnapshot): void {
  const offer = getEditingOffer(snapshot)
  // Preserve the independently copied source while the human fills offer settings.
  // Applicability is reconciled against the chosen settings when setup completes.
  if (!offer.pendingCopyModuleId) replaceOfferModules(snapshot, [])
}

export function copyFreeModuleToOffer(
  snapshot: ProjectSnapshot, sourceModuleId: string, draft: ConstructorDraftSnapshot | null,
  idFactory: IdFactory = createStableId,
): ProjectSnapshot {
  const source = snapshot.modulesById[sourceModuleId]
  if (!source || source.definition.kind !== 'free') throw new Error('Missing free module')
  const offerId = idFactory(), moduleId = idFactory()
  const allIds = new Set([snapshot.project.id, ...Object.keys(snapshot.offersById), ...Object.keys(snapshot.modulesById)])
  if (offerId === moduleId || allIds.has(offerId) || allIds.has(moduleId)) throw new Error('Duplicate copy identity')
  return editProject(snapshot, (next) => {
    if (source.definition.kind !== 'free') return
    const settings = settingsFromForm({ ...EMPTY_OFFER, profileSystemId: source.definition.profileSystemId })
    next.offersById[offerId] = { id: offerId, projectId: next.project.id, entryMode: 'offer', settingsDraft: settings,
      commonConditions: '', setupStage: 'editing', pendingCopyModuleId: moduleId, fromFreeSketch: true }
    const { id, sequence, ...definition } = createOfferModule(buildOfferModuleDefaults(settings), 1, moduleId)
    definition.productType = source.definition.productType
    definition.productTypeSource = source.definition.productType ? 'preset' : 'unset'
    next.modulesById[id] = { id, offerId, sequence, definition: { kind: 'offer', draft: definition } }
    next.constructionDraftsByModuleId[id] = structuredClone(draft)
    next.profileResolutionsByModuleId[id] = structuredClone(snapshot.profileResolutionsByModuleId[sourceModuleId])
    next.workspace.offerId = offerId
    next.workspace.activeModuleIdByOffer[offerId] = id
    next.workspace.screen = 'offer-setup'
  })
}

export function completeOfferSetup(snapshot: ProjectSnapshot, idFactory: IdFactory = createStableId): ProjectSnapshot {
  return editProject(snapshot, (next) => {
    const offer = getEditingOffer(next)
    const defaults = buildOfferModuleDefaults(offer.settingsDraft)
    if (offer.pendingCopyModuleId) {
      const module = next.modulesById[offer.pendingCopyModuleId]
      if (!module || module.definition.kind !== 'offer') throw new Error('Missing copied module')
      module.definition.draft.inheritedDefaults = defaults
      const system = getProfileSystemById(defaults.profileSystemId)
      const topology = next.constructionDraftsByModuleId[module.id]?.topology
      const resolved = topology ? resolveConstructionTopology(topology) : null
      next.profileResolutionsByModuleId[module.id] = system ? reconcileModuleProfileResolution(
        next.profileResolutionsByModuleId[module.id], system, module.definition.draft.productType,
        [...(resolved?.dividers ?? []), ...(resolved?.angledDividers ?? [])].map((item) => item.id), resolved?.fields ?? [],
      ) : null
      offer.pendingCopyModuleId = null
    } else if (getModules(next, offer.id).length === 0) {
      const module = createOfferModule(defaults, 1, idFactory())
      replaceOfferModules(next, [module])
      next.workspace.activeModuleIdByOffer[offer.id] = module.id
    }
    offer.setupStage = 'modules'
  })
}
