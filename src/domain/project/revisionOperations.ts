import type { IdFactory, ProjectSnapshot } from './projectModel'
import type { HumanActor } from '../assurance/assuranceModel'
import type { ProjectRevision, RevisionContent } from './revisionModel'
import { canonicalize, fingerprint, freezeDeep } from '../assurance/canonical'
import { recordedOffers } from '../assurance/changeTracking'
import { invariant, nonempty, objectKeys } from '../assurance/predicateRegistry'

export function validateActor(value: unknown): asserts value is HumanActor {
  objectKeys(value, ['id', 'label', 'identityBasis']); nonempty(value.id); nonempty(value.label)
  invariant(value.identityBasis === 'local-self-asserted', 'unsupported actor identity basis')
}
export function validateTimestamp(value: unknown): asserts value is string {
  invariant(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'invalid UTC timestamp')
}
export function revisionContent(snapshot: ProjectSnapshot): RevisionContent {
  return structuredClone({ project: snapshot.project, offersById: recordedOffers(snapshot), modulesById: snapshot.modulesById,
    constructionDraftsByModuleId: snapshot.constructionDraftsByModuleId, profileResolutionsByModuleId: snapshot.profileResolutionsByModuleId,
    evidenceByStatementKey: snapshot.assurance.currentEvidenceByStatementKey, changeGenerations: snapshot.assurance.changeGenerations })
}
export function revisionStatus(snapshot: ProjectSnapshot): { head: ProjectRevision | null; matches: boolean } {
  const head = snapshot.revisions.headRevisionId ? snapshot.revisions.revisionsById[snapshot.revisions.headRevisionId] : null
  if (head) invariant(head.id === snapshot.revisions.headRevisionId && head.projectId === snapshot.project.id && fingerprint(head.content) === head.contentDigest, 'invalid revision identity/fingerprint')
  return { head, matches: !!head && head.contentDigest === fingerprint(revisionContent(snapshot)) }
}
export function assertUnusedId(snapshot: ProjectSnapshot, id: string): void {
  nonempty(id)
  invariant(id !== snapshot.project.id && ![snapshot.offersById, snapshot.modulesById, snapshot.revisions.revisionsById,
    snapshot.assurance.confirmationsById, snapshot.assurance.evidenceById, snapshot.assurance.sourcesById].some((map) => Object.hasOwn(map, id)), 'duplicate identity')
}
export function freezeHistory(snapshot: ProjectSnapshot): ProjectSnapshot {
  Object.values(snapshot.revisions.revisionsById).forEach(freezeDeep)
  Object.values(snapshot.assurance.sourcesById).forEach(freezeDeep)
  Object.values(snapshot.assurance.evidenceById).forEach(freezeDeep)
  Object.values(snapshot.assurance.confirmationsById).forEach(freezeDeep)
  return snapshot
}
/** The sole revision-creation boundary. Editing, autosave and confirmation never call it implicitly. */
export function recordProjectRevision(snapshot: ProjectSnapshot, actor: HumanActor, recordedAt: string,
  idFactory: IdFactory = () => globalThis.crypto.randomUUID()): ProjectSnapshot {
  validateActor(actor); validateTimestamp(recordedAt)
  if (revisionStatus(snapshot).matches) return snapshot
  const id = idFactory(); assertUnusedId(snapshot, id)
  const next = structuredClone(snapshot), content = revisionContent(snapshot)
  const head = revisionStatus(snapshot).head
  next.revisions.revisionsById[id] = {
    id, projectId: snapshot.project.id, number: (head?.number ?? 0) + 1, parentRevisionId: head?.id ?? null,
    recordedAt, recordedBy: structuredClone(actor), contentSchemaVersion: 'project-revision-02', contentDigest: fingerprint(content), content,
  }
  next.revisions.headRevisionId = id
  return freezeHistory(next)
}
export function getOfferRevisionView(revision: ProjectRevision, offerId: string) {
  const offer = revision.content.offersById[offerId]
  invariant(offer, 'Offer absent from revision')
  return freezeDeep(structuredClone({ revisionId: revision.id, offer, modules: Object.values(revision.content.modulesById).filter((m) => m.offerId === offerId) }))
}
export function getModuleRevisionView(revision: ProjectRevision, moduleId: string) {
  invariant(revision.content.modulesById[moduleId], 'Module absent from revision')
  return freezeDeep(structuredClone({ revisionId: revision.id, module: revision.content.modulesById[moduleId],
    construction: revision.content.constructionDraftsByModuleId[moduleId], profiles: revision.content.profileResolutionsByModuleId[moduleId] }))
}
function historicallyPinnedEvidenceIds(snapshot: ProjectSnapshot): Set<string> {
  const pinned = new Set<string>()
  for (const revision of Object.values(snapshot.revisions.revisionsById)) {
    Object.values(revision.content.evidenceByStatementKey).forEach((id) => pinned.add(id))
  }
  for (const confirmation of Object.values(snapshot.assurance.confirmationsById)) {
    pinned.add(confirmation.statementEvidenceId)
    confirmation.supportingEvidenceIds.forEach((id) => pinned.add(id))
  }
  const visit = (id: string) => {
    const evidence = snapshot.assurance.evidenceById[id]
    if (!evidence) return
    for (const inputId of evidence.inputEvidenceIds) if (!pinned.has(inputId)) { pinned.add(inputId); visit(inputId) }
  }
  ;[...pinned].forEach(visit)
  return pinned
}
function historicallyPinnedSourceIds(snapshot: ProjectSnapshot, evidenceIds: Set<string>): Set<string> {
  const sources = new Set<string>()
  for (const id of evidenceIds) {
    const evidence = snapshot.assurance.evidenceById[id]
    if (!evidence) continue
    evidence.sourceReferenceIds.forEach((sourceId) => sources.add(sourceId))
    evidence.reviewedRule?.sourceReferenceIds.forEach((sourceId) => sources.add(sourceId))
  }
  return sources
}
export function assertHistoryPreserved(previous: ProjectSnapshot, next: ProjectSnapshot): void {
  for (const [id, record] of Object.entries(previous.revisions.revisionsById)) {
    invariant(Object.hasOwn(next.revisions.revisionsById, id) && canonicalize(record) === canonicalize(next.revisions.revisionsById[id]), 'immutable revision history cannot be rewritten')
  }
  for (const [id, record] of Object.entries(previous.assurance.confirmationsById)) {
    invariant(Object.hasOwn(next.assurance.confirmationsById, id) && canonicalize(record) === canonicalize(next.assurance.confirmationsById[id]), 'immutable confirmation history cannot be rewritten')
  }
  const evidenceIds = historicallyPinnedEvidenceIds(previous)
  for (const id of evidenceIds) {
    const before = previous.assurance.evidenceById[id], after = next.assurance.evidenceById[id]
    invariant(before && after && canonicalize(before) === canonicalize(after), 'revision/confirmation evidence cannot be rewritten or removed')
  }
  for (const id of historicallyPinnedSourceIds(previous, evidenceIds)) {
    const before = previous.assurance.sourcesById[id], after = next.assurance.sourcesById[id]
    invariant(before && after && canonicalize(before) === canonicalize(after), 'revision/confirmation source cannot be rewritten or removed')
  }
}
