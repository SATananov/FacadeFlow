import { useEffect, useRef, useState } from 'react'
import type { ConstructorDraftSnapshot } from '../domain/construction'
import { resolveConstructionTopology } from '../domain/construction'
import { getProfileSystemById } from '../data/profileSystems'
import { reconcileModuleProfileResolution, type ModuleProfileResolution } from '../domain/profileResolution'
import type { OfferModuleDraft } from '../domain/offerModules'
import {
  createProjectSnapshot, createStableId, getEditingOffer, getFreeModules, getModules, getOfferForm, getOfferModules, hasMeaningfulProjectContent,
  type FreeConstructorModule, type OfferDraft, type ProjectSnapshot,
} from '../domain/project/projectModel'
import {
  applyUpdate, clearConfiguredModules, completeOfferSetup, copyFreeModuleToOffer, editProject,
  replaceFreeModules, replaceOfferModules, writeOfferForm, createNextProjectModule, createConfirmedCompositeModule, type Update,
} from '../domain/project/projectOperations'
import { hydrateProject, LocalProjectStorage, saveProjectSession, type ProjectSession, type StoredProjectSummary } from '../persistence/localProjectStorage'
import { canonicalize } from '../domain/assurance/canonical'
import type { HumanActor, HumanConfirmation } from '../domain/assurance/assuranceModel'
import { confirmStatement, prepareConfirmation, type ConfirmationRequest } from '../domain/assurance/assuranceOperations'
import { recordProjectRevision } from '../domain/project/revisionOperations'
import type { CompositeModuleStructure } from '../domain/compositeModuleStructure'
import { CompositeModuleBindingError } from '../domain/project/compositeModuleBinding'
import { saveModuleCompositeStructure } from '../domain/project/projectOperations'
import type { CompositeModuleCreationRequest } from '../domain/project/compositeModuleGuard'

function reconcilePayload(snapshot: ProjectSnapshot, moduleId: string) {
  const module = snapshot.modulesById[moduleId]
  const definition = module.definition
  const systemId = definition.kind === 'free' ? definition.profileSystemId : definition.draft.inheritedDefaults.profileSystemId
  const productType = definition.kind === 'free' ? definition.productType : definition.draft.productType
  const offerDefaultGlazingId = definition.kind === 'offer' ? definition.draft.inheritedDefaults.glazingId : null
  const system = getProfileSystemById(systemId)
  if (!system) { snapshot.profileResolutionsByModuleId[moduleId] = null; return }
  const topology = snapshot.constructionDraftsByModuleId[moduleId]?.topology
  const resolved = topology ? resolveConstructionTopology(topology) : null
  snapshot.profileResolutionsByModuleId[moduleId] = reconcileModuleProfileResolution(
    snapshot.profileResolutionsByModuleId[moduleId], system, productType,
    [...(resolved?.dividers ?? []), ...(resolved?.angledDividers ?? [])].map((item) => item.id), resolved?.fields ?? [],
    null, offerDefaultGlazingId,
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
    if (!session.hydrated || session.blocked || session.detached || lastSaved.current === session.snapshot) return
    const result = saveProjectSession(session, storage)
    if (result.status === 'saved') lastSaved.current = session.snapshot
    setSession((current) => current.snapshot === session.snapshot ? result : current)
    refreshProjects()
  }, [session.snapshot, session.hydrated, session.blocked, session.detached, storage])
  useEffect(() => { refreshProjects() }, [storage])

  const transform = (operation: (snapshot: ProjectSnapshot) => ProjectSnapshot) => setSession((current) => {
    let snapshot: ProjectSnapshot
    try { snapshot = operation(current.snapshot) }
    catch (error) {
      if (error instanceof CompositeModuleBindingError) return { ...current, error: error.message }
      throw error
    }
    if (canonicalize(snapshot) === canonicalize(current.snapshot)) return current
    return {
      ...current,
      snapshot,
      detached: current.detached && !hasMeaningfulProjectContent(snapshot),
      status: current.blocked ? 'failed' : 'unsaved',
    }
  })
  const edit = (operation: (snapshot: ProjectSnapshot) => void) => transform((snapshot) => editProject(snapshot, operation))
  const applyAssurance = (operation: (snapshot: ProjectSnapshot) => ProjectSnapshot) => {
    const current = latest.current
    if (current.blocked) throw new Error('PF02: Project storage is blocked')
    const snapshot = operation(current.snapshot)
    if (snapshot === current.snapshot) return
    const next: ProjectSession = { ...current, snapshot, detached: false, status: 'unsaved' }
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
    if (!latest.current.blocked && !latest.current.detached && saveNow().status !== 'saved') return
    const next = createProjectSnapshot()
    next.workspace.screen = 'offer-setup'
    const session: ProjectSession = { snapshot: next, hydrated: true, blocked: false, detached: false, status: 'unsaved', error: null }
    latest.current = session
    lastSaved.current = null
    setSession(session)
  }
  const openProject = (id: string) => {
    if (!latest.current.blocked && !latest.current.detached && saveNow().status !== 'saved') return
    try {
      const loaded = storage.load(id)
      if (!loaded) throw new Error('Проектът не е намерен.')
      // Also update the startup pointer, with failures accurately surfaced.
      const result = saveProjectSession({ snapshot: loaded, hydrated: true, blocked: false, detached: false, status: 'unsaved', error: null }, storage)
      if (result.status !== 'saved') throw new Error(result.error ?? 'Неуспешно отваряне.')
      lastSaved.current = loaded
      latest.current = result
      setSession(result)
    } catch (error) {
      setSession((current) => ({ ...current, status: 'failed', error: error instanceof Error ? error.message : 'Неуспешно отваряне.' }))
    }
  }
  const deleteProject = (id: string) => {
    try {
      const deletingCurrent = id === latest.current.snapshot.project.id
      storage.deleteProject(id)
      if (deletingCurrent) {
        const snapshot = createProjectSnapshot()
        const next: ProjectSession = { snapshot, hydrated: true, blocked: false, detached: true, status: 'unsaved', error: null }
        lastSaved.current = null
        latest.current = next
        setSession(next)
      }
      refreshProjects()
    } catch (error) {
      setSession((current) => ({
        ...current, status: 'failed',
        error: error instanceof Error ? error.message : 'Неуспешно изтриване на проекта.',
      }))
    }
  }


  const commitNewModule = (operation: (snapshot: ProjectSnapshot) => { snapshot: ProjectSnapshot; moduleId: string }) => {
    const current = latest.current
    try {
      if (current.blocked) throw new CompositeModuleBindingError('Записът на проекта е блокиран.')
      const created = operation(current.snapshot)
      // On a project's first save, establish the original record/pointer before
      // writing the new module. A failed pointer write must not leave a hidden new module.
      if (!lastSaved.current && saveProjectSession({ ...current, detached: false }, storage).status !== 'saved') {
        throw new CompositeModuleBindingError('Проектът не можа да бъде записан. Нов модул не е създаден.')
      }
      const result = saveProjectSession({ ...current, snapshot: created.snapshot, detached: false, status: 'unsaved', error: null }, storage)
      if (result.status !== 'saved') throw new CompositeModuleBindingError('Новият модул не можа да бъде записан. Опитай отново.')
      latest.current = result
      lastSaved.current = result.snapshot
      setSession(result)
      refreshProjects()
      return { moduleId: created.moduleId, error: null }
    } catch (error) {
      return { moduleId: null, error: error instanceof Error ? error.message : 'Модулът не може да бъде създаден.' }
    }
  }

  return {
    createModule: (offerId: string, sourceModuleId: string | null) => {
      const id = createStableId()
      transform((s) => createNextProjectModule(s, offerId, sourceModuleId, () => id).snapshot)
    },
    confirmCompositeModule: (request: CompositeModuleCreationRequest) => commitNewModule((s) => createConfirmedCompositeModule(s, request)),
    saveCompositeStructure: (projectId: string, moduleId: string, value: CompositeModuleStructure, expected: CompositeModuleStructure | null): string | null => {
      const current = latest.current
      if (current.blocked) return 'Записът на проекта е блокиран. Черновата остава отворена.'
      if (current.snapshot.project.id !== projectId) return 'Проектът е сменен. Отвори структурата от текущия модул.'
      try {
        const snapshot = saveModuleCompositeStructure(current.snapshot, moduleId, value, expected)
        const result = saveProjectSession({ ...current, snapshot, detached: false, status: 'unsaved', error: null }, storage)
        if (result.status !== 'saved') return 'Структурата не можа да бъде записана в проекта. Черновата е запазена в редактора; опитай отново.'
        latest.current = result
        lastSaved.current = snapshot
        setSession(result)
        refreshProjects()
        return null
      } catch (error) {
        return error instanceof CompositeModuleBindingError ? error.message : 'Структурата не може да бъде записана. Провери данните и отвори актуалния проект при конфликт.'
      }
    },
    recordRevision: (actor: HumanActor) => applyAssurance((s) => recordProjectRevision(s, actor, new Date().toISOString())),
    prepareConfirmation: (evidenceId: string) => prepareConfirmation(latest.current.snapshot, evidenceId),
    confirmStatement: (request: ConfirmationRequest, actor: HumanActor, intent: HumanConfirmation['intent']) =>
      applyAssurance((s) => confirmStatement(s, request, actor, new Date().toISOString(), intent)),
    snapshot, persistence: { status: session.status, error: session.error, blocked: session.blocked, attached: !session.detached }, projects,
    saveNow, newProject, openProject, deleteProject,
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
