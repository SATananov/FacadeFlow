import type { ProjectSnapshot } from '../project/projectModel'
import type { RevisionContent, RecordedOffer } from '../project/revisionModel'
import type { ChangeKey, Dependency } from './assuranceModel'
import { fingerprint } from './canonical'

export function recordedOffers(snapshot: Pick<ProjectSnapshot, 'offersById'>): Record<string, RecordedOffer> {
  return Object.fromEntries(Object.values(snapshot.offersById).map((offer) => [offer.id, offer.entryMode === 'free'
    ? { id: offer.id, projectId: offer.projectId, entryMode: offer.entryMode }
    : { id: offer.id, projectId: offer.projectId, entryMode: offer.entryMode, settingsDraft: offer.settingsDraft, commonConditions: offer.commonConditions }]))
}
type Graph = Pick<RevisionContent, 'project' | 'offersById' | 'modulesById' | 'constructionDraftsByModuleId' | 'profileResolutionsByModuleId'>
export function dependencyContents(graph: Graph): Record<ChangeKey, unknown> {
  const result: Record<ChangeKey, unknown> = {
    [`project:${graph.project.id}`]: { project: graph.project, offerIds: Object.keys(graph.offersById).sort() },
  }
  for (const offer of Object.values(graph.offersById)) {
    const semantic = offer.entryMode === 'free' ? { id: offer.id, projectId: offer.projectId, entryMode: offer.entryMode }
      : { id: offer.id, projectId: offer.projectId, entryMode: offer.entryMode, settingsDraft: offer.settingsDraft, commonConditions: offer.commonConditions }
    result[`offer:${offer.id}`] = { offer: semantic, modules: Object.values(graph.modulesById)
      .filter((m) => m.offerId === offer.id).map((m) => ({ id: m.id, sequence: m.sequence })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }
  }
  for (const module of Object.values(graph.modulesById)) result[`module:${module.id}`] = {
    id: module.id, offerId: module.offerId, definition: module.definition,
    // Omit absent/null data to preserve legacy dependency digests and history.
    ...(module.compositeStructure ? { compositeStructure: module.compositeStructure } : {}),
    construction: graph.constructionDraftsByModuleId[module.id], profiles: graph.profileResolutionsByModuleId[module.id],
  }
  return result
}
export function trackChanges(previous: ProjectSnapshot | null, next: ProjectSnapshot): void {
  const before = previous ? dependencyContents(previous) : {}, after = dependencyContents(next)
  const generations = { ...previous?.assurance.changeGenerations }
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)] as ChangeKey[])) {
    if (fingerprint(before[key] ?? null) !== fingerprint(after[key] ?? null)) {
      generations[key] = (generations[key] ?? 0) + 1
      if (!Number.isSafeInteger(generations[key])) throw new Error('Change generation exhausted')
    }
  }
  next.assurance.changeGenerations = generations
}
export function moduleDependencies(snapshot: ProjectSnapshot, moduleId: string): Dependency[] {
  const key: ChangeKey = `module:${moduleId}`, contents = dependencyContents(snapshot)
  if (!Object.hasOwn(contents, key)) throw new Error('Missing module dependency')
  return [{ key, generation: snapshot.assurance.changeGenerations[key] ?? 0, digest: fingerprint(contents[key]) }]
}
