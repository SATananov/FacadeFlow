import { fingerprint, canonicalize } from '../assurance/canonical'
import { collectEvidence } from '../assurance/legacyEvidenceAdapter'
import { validateProjectSnapshot } from '../project/projectSerialization'
import { revisionContent } from '../project/revisionOperations'
import type { ProjectSnapshot } from '../project/projectModel'
import { getProfileSystemById } from '../../data/profileSystems'
import { profileDimensionalSemantics } from '../../data/profileSystems/dimensionalSemantics'
import { profileJointEvidenceRules } from '../../data/profileSystems/jointSemantics'
import { getConfirmedHardwareStandards, getProfileSystemHardwareCompatibility } from '../../data/profileSystems/hardwareOptions'
import type { DependencyRef, SourceBinding } from './assemblyModel'

export function prepareAssemblyInput(snapshot: ProjectSnapshot, moduleId: string, revisionId?: string) {
  validateProjectSnapshot(snapshot)
  const revision = revisionId ? snapshot.revisions.revisionsById[revisionId] : null
  if (revisionId && !revision) throw Error('Requested revision unavailable')
  const graph = structuredClone(revision ? revision.content : revisionContent(snapshot))
  if (revision && fingerprint(graph) !== revision.contentDigest) throw Error('Revision digest mismatch')
  const module = graph.modulesById[moduleId]
  if (!module || module.offerId === moduleId || !graph.offersById[module.offerId] ||
    graph.offersById[module.offerId].projectId !== graph.project.id) throw Error('Module ownership unavailable')
  const source: SourceBinding = {
    projectId: graph.project.id, offerId: module.offerId, moduleId,
    contentDigest: fingerprint(graph),
    ...(revision ? { kind: 'revision' as const, revisionId: revision.id }
      : { kind: 'draft' as const, baseRevisionId: snapshot.revisions.headRevisionId }),
  }
  const resolution = graph.profileResolutionsByModuleId[moduleId]
  const systemId = module.definition.kind === 'free' ? module.definition.profileSystemId : module.definition.draft.inheritedDefaults.profileSystemId
  const system = getProfileSystemById(systemId)
  const hardwareStandardId = module.definition.kind === 'offer' ? module.definition.draft.inheritedDefaults.hardwareStandardId : null
  const hardware = hardwareStandardId ? getProfileSystemHardwareCompatibility(systemId, hardwareStandardId) : undefined
  const deps: DependencyRef[] = [
    { kind: 'input', key: `project:${graph.project.id}`, digest: source.contentDigest },
    { kind: 'catalog', key: `system:${systemId}`, digest: fingerprint(system ?? null) },
    { kind: 'catalog', key: 'reviewed-semantics', digest: fingerprint({
      dimensions: profileDimensionalSemantics.filter((e) => e.systemId === systemId),
      joints: profileJointEvidenceRules.filter((e) => e.systemId === systemId),
      standards: getConfirmedHardwareStandards(), hardware: hardware ?? null,
    }) },
  ]
  // For history, adapt THAT graph and generation set, not the current draft.
  // A changed bundled interpretation is unavailable for exact historical replay.
  const expected = collectEvidence({ ...snapshot, ...graph } as ProjectSnapshot)
  const evidenceProblems: { id: string; historical: boolean }[] = []
  const visited = new Set<string>()
  const records = snapshot.assurance.evidenceById
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    const record = records[id]
    if (!record) { evidenceProblems.push({ id, historical: Boolean(revision) }); return }
    deps.push({ kind: 'evidence', key: id, digest: fingerprint(record) })
    if (!expected.evidenceById[id] || canonicalize(expected.evidenceById[id]) !== canonicalize(record)) evidenceProblems.push({ id, historical: Boolean(revision) })
    for (const sourceId of record.sourceReferenceIds) {
      const item = snapshot.assurance.sourcesById[sourceId]
      if (!item) evidenceProblems.push({ id: sourceId, historical: Boolean(revision) })
      else deps.push({ kind: 'source', key: sourceId, digest: fingerprint(item) })
    }
    record.inputEvidenceIds.forEach(visit)
  }
  for (const id of Object.values(graph.evidenceByStatementKey).sort()) {
    const scope = records[id]?.statement.scope
    if ((scope?.kind === 'module' && scope.moduleId === moduleId) || (scope?.kind === 'catalog' && scope.profileSystemId === systemId)) visit(id)
  }
  // Missing expected evidence cannot silently become an input-only proof.
  for (const [key, id] of Object.entries(expected.currentEvidenceByStatementKey).sort(([a], [b]) => a < b ? -1 : 1)) {
    const scope = expected.evidenceById[id].statement.scope
    if (((scope.kind === 'module' && scope.moduleId === moduleId) || (scope.kind === 'catalog' && scope.profileSystemId === systemId)) && !graph.evidenceByStatementKey[key]) evidenceProblems.push({ id, historical: Boolean(revision) })
  }
  return { graph, module, source, resolution, system, systemId, hardwareStandardId, hardware,
    topology: graph.constructionDraftsByModuleId[moduleId]?.topology,
    dependencies: [...new Map(deps.map((d) => [`${d.kind}:${d.key}`, d])).values()]
      .sort((a, b) => `${a.kind}:${a.key}` < `${b.kind}:${b.key}` ? -1 : 1), evidenceProblems }
}
