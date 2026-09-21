import { getNextModuleSequence, getProjectModuleSystemId, type ProjectSnapshot } from './projectModel'

/** Constructor only publishes this payload after a construction action. Its
 * initial form-size seed is local UI state, not a persisted construction draft.
 * A committed outer frame alone is real content, including legacy frame-only drafts. */
export function hasModuleConstructorConstruction(snapshot: ProjectSnapshot, moduleId: string): boolean {
  return Boolean(snapshot.modulesById[moduleId] && snapshot.constructionDraftsByModuleId[moduleId])
}

export function needsCompositeModuleGuard(snapshot: ProjectSnapshot, moduleId: string): boolean {
  return !snapshot.modulesById[moduleId]?.compositeStructure && hasModuleConstructorConstruction(snapshot, moduleId)
}

export type CompositeModuleCreationRequest = {
  projectId: string
  moduleId: string
  offerId: string
  sourceSequence: number
  sourceSystemId: string
  nextSequence: number
  systemId: string
}

/** Read-only proposal. It creates neither a module nor a stable ID. */
export function proposeCompositeModule(snapshot: ProjectSnapshot, moduleId: string): CompositeModuleCreationRequest | null {
  if (!needsCompositeModuleGuard(snapshot, moduleId)) return null
  const module = snapshot.modulesById[moduleId], owner = snapshot.offersById[module.offerId]
  return {
    projectId: snapshot.project.id, moduleId, offerId: module.offerId, sourceSequence: module.sequence,
    sourceSystemId: getProjectModuleSystemId(module), nextSequence: getNextModuleSequence(snapshot, module.offerId),
    systemId: owner.entryMode === 'offer' ? owner.settingsDraft.profileSystemId : getProjectModuleSystemId(module),
  }
}
