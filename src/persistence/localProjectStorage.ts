import { createProjectSnapshot, getProjectDisplayName, type IdFactory, type ProjectSnapshot } from '../domain/project/projectModel'
import { deserializeProject, serializeProject } from '../domain/project/projectSerialization'
import { assertHistoryPreserved } from '../domain/project/revisionOperations'
import { dependencyContents } from '../domain/assurance/changeTracking'
import { fingerprint } from '../domain/assurance/canonical'
import type { ChangeKey } from '../domain/assurance/assuranceModel'

export const PROJECT_KEY_PREFIX = 'facadeflow.project-foundation-01.project.'
export const ACTIVE_PROJECT_KEY = 'facadeflow.project-foundation-01.active'
export type ProjectStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>
export type StoredProjectSummary = {
  id: string
  label: string
  clientName: string
  objectName: string
  moduleCount: number
  headRevisionNumber: number | null
  openable: boolean
}
export type PersistenceStatus = 'saved' | 'unsaved' | 'failed'
export type ProjectSession = {
  snapshot: ProjectSnapshot; hydrated: boolean; blocked: boolean; detached: boolean; status: PersistenceStatus; error: string | null
}
export class LocalProjectStorage {
  constructor(private readonly getStorage: () => ProjectStorage) {}
  load(projectId?: string): ProjectSnapshot | null {
    const storage = this.getStorage()
    const id = projectId ?? storage.getItem(ACTIVE_PROJECT_KEY)
    if (!id) return null
    const json = storage.getItem(PROJECT_KEY_PREFIX + id)
    if (json === null) throw new Error('Липсва записът на избрания проект.')
    const snapshot = deserializeProject(json)
    if (snapshot.project.id !== id) throw new Error('Несъответствие в идентичността на проекта.')
    return snapshot
  }
  save(snapshot: ProjectSnapshot): void {
    const json = serializeProject(snapshot)
    const storage = this.getStorage()
    const key = PROJECT_KEY_PREFIX + snapshot.project.id
    // Never replace unreadable/future-version data, even on an explicit retry.
    const existing = storage.getItem(key)
    if (existing !== null) {
      const previous = deserializeProject(existing)
      assertHistoryPreserved(previous, snapshot)
      const before = dependencyContents(previous), after = dependencyContents(snapshot)
      for (const [key, value] of Object.entries(previous.assurance.changeGenerations)) {
        const nextGeneration = snapshot.assurance.changeGenerations[key as ChangeKey]
        if (!(nextGeneration >= value) || (nextGeneration === value && fingerprint(before[key as ChangeKey] ?? null) !== fingerprint(after[key as ChangeKey] ?? null))) {
          throw new Error('Проектът е променен в друг контекст. Отвори актуалния запис преди нов запис.')
        }
      }
    }
    storage.setItem(key, json)
    try {
      if (storage.getItem(ACTIVE_PROJECT_KEY) !== snapshot.project.id) storage.setItem(ACTIVE_PROJECT_KEY, snapshot.project.id)
    } catch (error) {
      // setItem itself is atomic. Restore the previous project if updating the
      // separate navigation pointer failed; never discard in-memory history.
      if (existing !== null) storage.setItem(key, existing)
      throw error
    }
  }
  deleteProject(projectId: string): void {
    const storage = this.getStorage()
    const key = PROJECT_KEY_PREFIX + projectId
    if (storage.getItem(key) === null) throw new Error('Проектът не е намерен.')
    // Clear the startup pointer first. If removing the project itself fails, the
    // next launch still cannot point at a record that was meant to be deleted.
    if (storage.getItem(ACTIVE_PROJECT_KEY) === projectId) storage.removeItem(ACTIVE_PROJECT_KEY)
    storage.removeItem(key)
    if (storage.getItem(key) !== null) throw new Error('Проектът не можа да бъде изтрит.')
  }
  list(): StoredProjectSummary[] {
    const storage = this.getStorage()
    const projects: StoredProjectSummary[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key?.startsWith(PROJECT_KEY_PREFIX)) continue
      const id = key.slice(PROJECT_KEY_PREFIX.length)
      let summary: StoredProjectSummary = {
        id, label: 'Невъзстановим проект', clientName: '', objectName: '', moduleCount: 0, headRevisionNumber: null, openable: false,
      }
      try {
        const snapshot = this.load(id)
        if (snapshot) {
          const head = snapshot.revisions.headRevisionId
            ? snapshot.revisions.revisionsById[snapshot.revisions.headRevisionId] ?? null
            : null
          summary = {
            id,
            label: getProjectDisplayName(snapshot),
            clientName: snapshot.project.client.clientName.trim(),
            objectName: snapshot.project.site.objectName.trim(),
            moduleCount: Object.keys(snapshot.modulesById).length,
            headRevisionNumber: head?.number ?? null,
            openable: true,
          }
        }
      } catch { /* Keep the raw record available; opening it reports the error. */ }
      projects.push(summary)
    }
    return projects
  }
}
const message = (error: unknown) => error instanceof Error ? error.message : 'Локалното хранилище е недостъпно.'

/** Synchronous hydration finishes before React can schedule an autosave effect. */
export function hydrateProject(storage: LocalProjectStorage, idFactory?: IdFactory): ProjectSession {
  try {
    const loaded = storage.load()
    return { snapshot: loaded ?? createProjectSnapshot(idFactory), hydrated: true, blocked: false, detached: !loaded,
      status: loaded ? 'saved' : 'unsaved', error: null }
  } catch (error) {
    return { snapshot: createProjectSnapshot(idFactory), hydrated: true, blocked: true, detached: true, status: 'failed', error: message(error) }
  }
}
export function saveProjectSession(session: ProjectSession, storage: LocalProjectStorage): ProjectSession {
  if (!session.hydrated || session.blocked || session.detached) return session
  try {
    storage.save(session.snapshot)
    return { ...session, status: 'saved', error: null }
  } catch (error) {
    return { ...session, status: 'failed', error: message(error) }
  }
}
