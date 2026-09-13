import { useEffect, useRef, useState } from 'react'
import type { ConstructorDraftSnapshot } from '../domain/construction'
import { resolveConstructionTopology } from '../domain/construction'
import { getProfileSystemById } from '../data/profileSystems'
import { reconcileModuleProfileResolution, type ModuleProfileResolution } from '../domain/profileResolution'
import type { OfferModuleDraft } from '../domain/offerModules'
import {
  createProjectSnapshot, createStableId, getEditingOffer, getFreeModules, getModules, getOfferForm, getOfferModules,
  type FreeConstructorModule, type OfferDraft, type ProjectSnapshot,
} from '../domain/project/projectModel'
import {
  applyUpdate, clearConfiguredModules, completeOfferSetup, copyFreeModuleToOffer, editProject,
  replaceFreeModules, replaceOfferModules, writeOfferForm, type Update,
} from '../domain/project/projectOperations'
import { hydrateProject, LocalProjectStorage, saveProjectSession, type ProjectSession, type StoredProjectSummary } from '../persistence/localProjectStorage'
import { canonicalize } from '../domain/assurance/canonical'
import type { HumanActor, HumanConfirmation } from '../domain/assurance/assuranceModel'
import { confirmStatement, prepareConfirmation, type ConfirmationRequest } from '../domain/assurance/assuranceOperations'
import { recordProjectRevision } from '../domain/project/revisionOperations'

function reconcilePayload(snapshot: ProjectSnapshot, moduleId: string) {
  const module = snapshot.modulesById[moduleId]
  const definition = module.definition
  const systemId = definition.kind === 'free' ? definition.profileSystemId : definition.draft.inheritedDefaults.profileSystemId
  const productType = definition.kind === 'free' ? definition.productType : definition.draft.productType
  const system = getProfileSystemById(systemId)
  if (!system) { snapshot.profileResolutionsByModuleId[moduleId] = null; return }
  const topology = snapshot.constructionDraftsByModuleId[moduleId]?.topology
  const resolved = topology ? resolveConstructionTopology(topology) : null
  snapshot.profileResolutionsByModuleId[moduleId] = reconcileModuleProfileResolution(
    snapshot.profileResolutionsByModuleId[moduleId], system, productType,
    [...(resolved?.dividers ?? []), ...(resolved?.angledDividers ?? [])].map((item) => item.id), resolved?.fields ?? [],
  )
}

/** Compatibility selectors keep the working App/Constructor contract while the graph owns persisted state. */
export function useProjectWorkspace() {
  const [storage] = useState(() => new LocalProjectStorage(() => window.localStorage))
  const [session, setSession] = useState<ProjectSession>(() => hydrateProject(storage))
  const [projects, setProjects] = useState<StoredProjectSummary[]>([])
  const latest = useRef(session)
  latest.current = session
  const lastSaved = useRef<ProjectSnapshot | null>(session.status === 'saved' ? session.snapshot : null)
  const refreshProjects = () => { try { setProjects(storage.list()) } catch { /* save/load exposes the actual error */ } }

  useEffect(() => {
    if (!session.hydrated || session.blocked || lastSaved.current === session.snapshot) return
    const result = saveProjectSession(session, storage)
    if (result.status === 'saved') lastSaved.current = session.snapshot
    setSession((current) => current.snapshot === session.snapshot ? result : current)
    refreshProjects()
  }, [session.snapshot, session.hydrated, session.blocked, storage])
  useEffect(() => { refreshProjects() }, [storage])

  const transform = (operation: (snapshot: ProjectSnapshot) => ProjectSnapshot) => setSession((current) => {
    const snapshot = operation(current.snapshot)
    if (canonicalize(snapshot) === canonicalize(current.snapshot)) return current
    return { ...current, snapshot, status: current.blocked ? 'failed' : 'unsaved' }
  })
  const edit = (operation: (snapshot: ProjectSnapshot) => void) => transform((snapshot) => editProject(snapshot, operation))
  const applyAssurance = (operation: (snapshot: ProjectSnapshot) => ProjectSnapshot) => {
    const current = latest.current
    if (current.blocked) throw new Error('PF02: Project storage is blocked')
    const snapshot = operation(current.snapshot)
    if (snapshot === current.snapshot) return
    const next: ProjectSession = { ...current, snapshot, status: 'unsaved' }
    latest.current = next
    setSession(next)
  }
  const snapshot = session.snapshot
  const offer = getEditingOffer(snapshot)
  const active = snapshot.workspace.activeModuleIdByOffer
  const scopedDrafts = (s: ProjectSnapshot, free: boolean) => Object.fromEntries(getModules(s, free ? s.workspace.freeOfferId : s.workspace.offerId)
    .map((module) => [module.id, s.constructionDraftsByModuleId[module.id]]))
  const offerResolutions = (s: ProjectSnapshot): Record<string, ModuleProfileResolution> => Object.fromEntries(
    getModules(s, s.workspace.offerId).flatMap((module) => {
      const resolution = s.profileResolutionsByModuleId[module.id]
      return resolution ? [[module.id, resolution]] : []
    }),
  )
  const setDrafts = (free: boolean, update: Update<Record<string, ConstructorDraftSnapshot | null>>) => edit((s) => {
    const values = applyUpdate(scopedDrafts(s, free), update)
    for (const module of getModules(s, free ? s.workspace.freeOfferId : s.workspace.offerId)) {
      s.constructionDraftsByModuleId[module.id] = values[module.id] ?? null
      reconcilePayload(s, module.id)
    }
  })
  const setActive = (free: boolean, value: string | null) => edit((s) => {
    const ownerId = free ? s.workspace.freeOfferId : s.workspace.offerId
    if (value !== null && s.modulesById[value]?.offerId !== ownerId) return
    s.workspace.activeModuleIdByOffer[ownerId] = value
  })
  const saveNow = () => {
    const result = saveProjectSession(latest.current, storage)
    if (result.status === 'saved') lastSaved.current = result.snapshot
    setSession(result); refreshProjects()
    return result
  }
  const newProject = () => {
    // A damaged record stays untouched; the explicit new project uses a new key.
    if (!latest.current.blocked && saveNow().status !== 'saved') return
    const next = createProjectSnapshot()
    next.workspace.screen = 'offer-setup'
    setSession({ snapshot: next, hydrated: true, blocked: false, status: 'unsaved', error: null })
  }
  const openProject = (id: string) => {
    if (!latest.current.blocked && saveNow().status !== 'saved') return
    try {
      const loaded = storage.load(id)
      if (!loaded) throw new Error('Проектът не е намерен.')
      // Also update the startup pointer, with failures accurately surfaced.
      const result = saveProjectSession({ snapshot: loaded, hydrated: true, blocked: false, status: 'unsaved', error: null }, storage)
      if (result.status !== 'saved') throw new Error(result.error ?? 'Неуспешно отваряне.')
      lastSaved.current = loaded
      setSession(result)
    } catch (error) {
      setSession((current) => ({ ...current, status: 'failed', error: error instanceof Error ? error.message : 'Неуспешно отваряне.' }))
    }
  }

  return {
    recordRevision: (actor: HumanActor) => applyAssurance((s) => recordProjectRevision(s, actor, new Date().toISOString())),
    prepareConfirmation: (evidenceId: string) => prepareConfirmation(latest.current.snapshot, evidenceId),
    confirmStatement: (request: ConfirmationRequest, actor: HumanActor, intent: HumanConfirmation['intent']) =>
      applyAssurance((s) => confirmStatement(s, request, actor, new Date().toISOString(), intent)),
    snapshot, persistence: { status: session.status, error: session.error, blocked: session.blocked }, projects,
    saveNow, newProject, openProject,
    offer: getOfferForm(snapshot),
    setOffer: (update: Update<OfferDraft>) => edit((s) => writeOfferForm(s, applyUpdate(getOfferForm(s), update))),
    saved: offer.setupStage === 'modules',
    setSaved: (value: boolean) => edit((s) => { getEditingOffer(s).setupStage = value ? 'modules' : 'editing' }),
    modules: getOfferModules(snapshot),
    setModules: (update: Update<OfferModuleDraft[]>) => edit((s) => replaceOfferModules(s, applyUpdate(getOfferModules(s), update))),
    moduleSketchDrafts: scopedDrafts(snapshot, false),
    setModuleSketchDrafts: (update: Update<Record<string, ConstructorDraftSnapshot | null>>) => setDrafts(false, update),
    moduleProfileResolutions: offerResolutions(snapshot),
    setModuleProfileResolutions: (update: Update<Record<string, ModuleProfileResolution>>) => edit((s) => {
      const values = applyUpdate(offerResolutions(s), update)
      for (const module of getModules(s, s.workspace.offerId)) {
        s.profileResolutionsByModuleId[module.id] = values[module.id] ?? null
        reconcilePayload(s, module.id)
      }
    }),
    freeModules: getFreeModules(snapshot),
    setFreeModules: (update: Update<FreeConstructorModule[]>) => edit((s) => replaceFreeModules(s, applyUpdate(getFreeModules(s), update))),
    freeModuleSketchDrafts: scopedDrafts(snapshot, true),
    setFreeModuleSketchDrafts: (update: Update<Record<string, ConstructorDraftSnapshot | null>>) => setDrafts(true, update),
    activeModuleId: active[snapshot.workspace.offerId], activeFreeModuleId: active[snapshot.workspace.freeOfferId],
    setActiveModuleId: (id: string | null) => setActive(false, id), setActiveFreeModuleId: (id: string | null) => setActive(true, id),
    constructorMode: snapshot.workspace.screen === 'free-constructor' ? 'free' as const
      : snapshot.workspace.screen === 'offer-constructor' ? 'offer' as const : null,
    setConstructorMode: (mode: 'free' | 'offer' | null) => edit((s) => {
      s.workspace.screen = mode === 'free' ? 'free-constructor' : mode === 'offer' ? 'offer-constructor'
        : s.workspace.screen === 'offer-constructor' ? 'offer-setup' : 'home'
    }),
    offerStartOpen: snapshot.workspace.screen === 'offer-setup',
    setOfferStartOpen: (value: boolean) => edit((s) => {
      if (value) s.workspace.screen = 'offer-setup'
      else if (s.workspace.screen === 'offer-setup') s.workspace.screen = 'home'
    }),
    offerStartedFromFreeSketch: offer.fromFreeSketch,
    clearConfiguredModules: () => edit(clearConfiguredModules),
    completeOfferSetup: () => { const id = createStableId(); transform((s) => completeOfferSetup(s, () => id)) },
    copyFreeModuleToOffer: (moduleId: string, draft: ConstructorDraftSnapshot | null) => {
      const ids = [createStableId(), createStableId()]
      transform((s) => { let i = 0; return copyFreeModuleToOffer(s, moduleId, draft, () => ids[i++]) })
    },
  }
}
