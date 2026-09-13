import type { ProjectSnapshot } from '../project/projectModel'
import type { RevisionContent } from '../project/revisionModel'
import type { ChangeKey, EvidenceRecord, RuleReference } from './assuranceModel'
import { canonicalize, fingerprint } from './canonical'
import { invariant, nonempty, objectKeys, statementKey, validateStatement } from './predicateRegistry'
import { dependencyContents } from './changeTracking'
import { collectEvidence, evidenceDigest, sourceDigest } from './legacyEvidenceAdapter'
import { validateActor, validateTimestamp } from '../project/revisionOperations'

function map(value: unknown): asserts value is Record<string, unknown> {
  invariant(value && typeof value === 'object' && !Array.isArray(value), 'expected record map')
  for (const key of Object.keys(value)) nonempty(key)
}
function ids(value: unknown): asserts value is string[] {
  invariant(Array.isArray(value), 'expected references')
  value.forEach(nonempty); invariant(new Set(value).size === value.length, 'duplicate references')
}
function digest(value: unknown) { invariant(typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value), 'invalid fingerprint') }
function generation(value: unknown) { invariant(typeof value === 'number' && Number.isSafeInteger(value) && value >= 1, 'invalid generation') }
function rule(value: unknown): asserts value is RuleReference {
  objectKeys(value, ['id', 'version', 'digest', 'sourceReferenceIds']); nonempty(value.id); nonempty(value.version); digest(value.digest); ids(value.sourceReferenceIds)
  invariant(value.sourceReferenceIds.length > 0, 'reviewed rule lacks source')
}
function knownVersion(value: unknown) {
  const item = value as Record<string, unknown>
  invariant(item && ['known', 'unknown'].includes(String(item.state)), 'invalid known/unknown version')
  objectKeys(item, item.state === 'known' ? ['state', 'value'] : ['state', 'reason'])
  nonempty(item[item.state === 'known' ? 'value' : 'reason'])
}
function validateEvidence(e: EvidenceRecord) {
  objectKeys(e, ['id', 'statement', 'provenance', 'sourceReferenceIds', 'inputEvidenceIds', 'reviewedRule', 'applicability', 'allowedUsage', 'dependencies'])
  validateStatement(e.statement); ids(e.sourceReferenceIds); ids(e.inputEvidenceIds)
  invariant(['applicable', 'invalid', 'unknown'].includes(e.applicability), 'invalid applicability')
  invariant(Array.isArray(e.allowedUsage) && e.allowedUsage.every((u) => ['schematic', 'technical-review'].includes(u)) && new Set(e.allowedUsage).size === e.allowedUsage.length, 'unsupported usage')
  invariant(Array.isArray(e.dependencies), 'missing dependencies')
  for (const d of e.dependencies) {
    objectKeys(d, ['key', 'generation', 'digest']); nonempty(d.key); generation(d.generation); digest(d.digest)
  }
  if (e.statement.scope.kind === 'module') {
    invariant(e.dependencies.length === 1 && e.dependencies[0].key === `module:${e.statement.scope.moduleId}`, 'module dependency required')
  } else invariant(e.dependencies.length === 0, 'catalog statement cannot borrow module context')
  const p = e.provenance
  invariant(p && typeof p === 'object', 'missing provenance')
  if (e.statement.predicate.startsWith('human-')) {
    objectKeys(p, ['kind', 'actor', 'enteredAt']); invariant(p.kind === 'human-input', 'input provenance required')
    if (p.actor !== null) validateActor(p.actor)
    if (p.enteredAt !== null) validateTimestamp(p.enteredAt)
    invariant(e.reviewedRule === null, 'human input cannot grant reviewed authority')
  } else if (e.statement.predicate.startsWith('catalog-')) {
    objectKeys(p, ['kind']); invariant(p.kind === 'catalog' && e.sourceReferenceIds.length > 0 && e.reviewedRule === null, 'catalog source required')
  } else if (e.statement.predicate.startsWith('reviewed-')) {
    objectKeys(p, ['kind', 'rule']); invariant(p.kind === 'derived', 'reviewed derivation required')
    rule(e.reviewedRule); rule(p.rule)
    invariant(canonicalize(e.reviewedRule) === canonicalize(p.rule), 'reviewed rule mismatch')
    invariant(canonicalize(e.reviewedRule.sourceReferenceIds) === canonicalize(e.sourceReferenceIds), 'reviewed source mismatch')
  } else {
    objectKeys(p, ['kind', 'reason']); invariant(p.kind === 'unknown', 'unknown technical provenance required'); nonempty(p.reason)
    invariant(e.reviewedRule === null && e.applicability === 'unknown' && e.allowedUsage.length === 0, 'unknown value cannot acquire authority/usage')
  }
  const { id, ...data } = e
  invariant(id === evidenceDigest(data), 'evidence integrity mismatch')
}
function graphForRevision(content: RevisionContent) {
  const offersById = Object.fromEntries(Object.values(content.offersById).map((offer) => [offer.id, offer.entryMode === 'free' ? offer : {
    ...offer, setupStage: 'modules', pendingCopyModuleId: null, fromFreeSketch: false,
  }]))
  const offer = Object.values(content.offersById).find((o) => o.entryMode === 'offer')
  const free = Object.values(content.offersById).find((o) => o.entryMode === 'free')
  invariant(offer && free, 'revision graph requires PF01 ownership containers')
  return { schemaVersion: 'project-foundation-01', project: content.project, offersById, modulesById: content.modulesById,
    constructionDraftsByModuleId: content.constructionDraftsByModuleId, profileResolutionsByModuleId: content.profileResolutionsByModuleId,
    workspace: { offerId: offer.id, freeOfferId: free.id, activeModuleIdByOffer: Object.fromEntries(Object.keys(offersById).map((id) => [id, null])), screen: 'home' } }
}
function checkGenerations(generations: Record<ChangeKey, number>) {
  map(generations)
  for (const [key, value] of Object.entries(generations)) { invariant(/^(project|offer|module):.+/.test(key), 'invalid generation key'); generation(value) }
}
function bindings(snapshot: ProjectSnapshot, graph: RevisionContent | ProjectSnapshot, refs: Record<string, string>, generations: Record<ChangeKey, number>) {
  map(refs); checkGenerations(generations)
  const contents = dependencyContents(graph)
  for (const key of Object.keys(contents) as ChangeKey[]) generation(generations[key])
  // Only module values are checked against graph ownership. Historical catalog
  // facts/rules are validated as captured records, not reinterpreted by today's catalog.
  const projected = { ...snapshot, ...graph, assurance: { ...snapshot.assurance, changeGenerations: generations } } as ProjectSnapshot
  const expected = collectEvidence(projected)
  for (const [key, id] of Object.entries(refs)) {
    const e = snapshot.assurance.evidenceById[id]
    invariant(e && statementKey(e.statement) === key, 'dangling or mismatched statement binding')
    if (e.statement.scope.kind === 'module') {
      const candidate = expected.evidenceById[expected.currentEvidenceByStatementKey[key]]
      invariant(candidate && canonicalize(candidate.statement) === canonicalize(e.statement), 'statement differs from owned graph context')
      for (const d of e.dependencies) invariant(generations[d.key] === d.generation && Object.hasOwn(contents, d.key) && fingerprint(contents[d.key]) === d.digest, 'statement dependency mismatch')
    }
  }
  for (const e of Object.values(expected.evidenceById)) if (e.statement.scope.kind === 'module') invariant(Object.hasOwn(refs, statementKey(e.statement)), 'missing input/unknown evidence binding')
}

/** Strict persisted contract validation; never promotes or repairs technical status. */
export function validateAssuranceSnapshot(snapshot: ProjectSnapshot, validateGraph: (value: unknown) => void): void {
  const a = snapshot.assurance, r = snapshot.revisions
  objectKeys(a, ['sourcesById', 'evidenceById', 'confirmationsById', 'currentEvidenceByStatementKey', 'changeGenerations'])
  objectKeys(r, ['headRevisionId', 'revisionsById'])
  map(a.sourcesById); map(a.evidenceById); map(a.confirmationsById); map(r.revisionsById)
  for (const [id, source] of Object.entries(a.sourcesById)) {
    objectKeys(source, ['id', 'documentId', 'documentTitle', 'documentVersion', 'sourceSystemId', 'profileSystemId', 'locator', 'capturedRecordVersion', 'capturedRecordDigest', 'documentContentDigest', 'note'])
    invariant(source.id === id, 'source identity mismatch'); nonempty(source.documentId); nonempty(source.documentTitle); nonempty(source.capturedRecordVersion)
    knownVersion(source.documentVersion)
    for (const field of [source.sourceSystemId, source.profileSystemId, source.note]) if (field !== null) nonempty(field)
    objectKeys(source.locator, ['printedPage', 'pdfPageIndex', 'section', 'table', 'row', 'item'])
    for (const [key, value] of Object.entries(source.locator)) if (value !== null) {
      if (key === 'pdfPageIndex') invariant(typeof value === 'number' && Number.isSafeInteger(value) && value >= 0, 'invalid PDF page index')
      else nonempty(value)
    }
    if (source.documentContentDigest !== null) digest(source.documentContentDigest)
    invariant(source.capturedRecordDigest === sourceDigest(source) && id === `source:${source.capturedRecordDigest}`, 'source integrity mismatch')
  }
  for (const [id, e] of Object.entries(a.evidenceById)) {
    validateEvidence(e); invariant(e.id === id, 'evidence identity mismatch')
    for (const ref of e.sourceReferenceIds) invariant(a.sourcesById[ref], 'dangling source')
    for (const ref of e.inputEvidenceIds) invariant(a.evidenceById[ref], 'dangling input evidence')
  }
  const visiting = new Set<string>(), visited = new Set<string>()
  function visit(id: string, depth: number) {
    invariant(depth < 128 && !visiting.has(id), 'cyclic/excessive evidence dependencies')
    if (visited.has(id)) return
    visiting.add(id); a.evidenceById[id].inputEvidenceIds.forEach((input) => visit(input, depth + 1)); visiting.delete(id); visited.add(id)
  }
  Object.keys(a.evidenceById).forEach((id) => visit(id, 0))
  const revisions = Object.values(r.revisionsById).sort((x, y) => x.number - y.number)
  let parent: string | null = null
  let previousGenerations: Record<ChangeKey, number> = {}
  for (let i = 0; i < revisions.length; i++) {
    const revision = revisions[i]
    objectKeys(revision, ['id', 'projectId', 'number', 'parentRevisionId', 'recordedAt', 'recordedBy', 'contentSchemaVersion', 'contentDigest', 'content'])
    invariant(r.revisionsById[revision.id] === revision && revision.projectId === snapshot.project.id && revision.number === i + 1 && revision.parentRevisionId === parent, 'invalid revision identity/ancestry')
    validateActor(revision.recordedBy); validateTimestamp(revision.recordedAt)
    invariant(revision.contentSchemaVersion === 'project-revision-02' && revision.contentDigest === fingerprint(revision.content), 'revision integrity/version mismatch')
    objectKeys(revision.content, ['project', 'offersById', 'modulesById', 'constructionDraftsByModuleId', 'profileResolutionsByModuleId', 'evidenceByStatementKey', 'changeGenerations'])
    const content = revision.content as RevisionContent
    invariant(content.project.id === snapshot.project.id, 'revision content project mismatch')
    map(content.offersById)
    for (const offer of Object.values(content.offersById)) objectKeys(offer, offer.entryMode === 'free' ? ['id', 'projectId', 'entryMode'] : ['id', 'projectId', 'entryMode', 'settingsDraft', 'commonConditions'])
    validateGraph(graphForRevision(content))
    bindings(snapshot, content, content.evidenceByStatementKey, content.changeGenerations)
    for (const [key, value] of Object.entries(previousGenerations)) invariant(content.changeGenerations[key as ChangeKey] >= value, 'revision generations moved backwards')
    previousGenerations = content.changeGenerations
    parent = revision.id
  }
  invariant(r.headRevisionId === parent, 'invalid revision head')
  bindings(snapshot, snapshot, a.currentEvidenceByStatementKey, a.changeGenerations)
  for (const [key, value] of Object.entries(previousGenerations)) invariant(a.changeGenerations[key as ChangeKey] >= value, 'draft generations moved backwards')
  for (const [id, c] of Object.entries(a.confirmationsById)) {
    objectKeys(c, ['id', 'projectRevisionId', 'actor', 'confirmedAt', 'intent', 'statementEvidenceId', 'statement', 'supportingEvidenceIds', 'dependencies'])
    invariant(id === c.id, 'confirmation identity mismatch'); validateActor(c.actor); validateTimestamp(c.confirmedAt); validateStatement(c.statement)
    invariant(['input-attestation', 'selection-attestation', 'technical-review-attestation'].includes(c.intent), 'unsupported confirmation intent')
    const revision = r.revisionsById[c.projectRevisionId], evidence = a.evidenceById[c.statementEvidenceId]
    invariant(revision && evidence && c.statement.scope.kind === 'module' && revision.content.evidenceByStatementKey[statementKey(c.statement)] === evidence.id, 'confirmation revision/context mismatch')
    invariant(canonicalize(c.statement) === canonicalize(evidence.statement) && canonicalize(c.dependencies) === canonicalize(evidence.dependencies), 'confirmation statement/dependency mismatch')
    ids(c.supportingEvidenceIds)
    const closure = new Set<string>()
    const gather = (e: EvidenceRecord) => { for (const ref of e.inputEvidenceIds) if (!closure.has(ref)) { closure.add(ref); gather(a.evidenceById[ref]) } }
    gather(evidence)
    invariant(canonicalize([...closure].sort()) === canonicalize([...c.supportingEvidenceIds].sort()), 'confirmation support mismatch')
  }
  const allIds = [snapshot.project.id, ...Object.keys(snapshot.offersById), ...Object.keys(snapshot.modulesById), ...Object.keys(r.revisionsById), ...Object.keys(a.confirmationsById), ...Object.keys(a.sourcesById), ...Object.keys(a.evidenceById)]
  invariant(new Set(allIds).size === allIds.length, 'cross-domain identity collision')
}
