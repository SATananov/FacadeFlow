import type { IdFactory, ProjectSnapshot } from '../project/projectModel'
import type { HumanActor, HumanConfirmation, Statement, Dependency, SourceReference } from './assuranceModel'
import { canonicalize, fingerprint, freezeDeep } from './canonical'
import { invariant } from './predicateRegistry'
import { evidenceFreshness } from './assuranceSelectors'
import { assertUnusedId, freezeHistory, revisionContent, revisionStatus, validateActor, validateTimestamp } from '../project/revisionOperations'
import { sourceDigest } from './legacyEvidenceAdapter'

export type ConfirmationRequest = {
  projectRevisionId: string; revisionDigest: string; draftDigest: string; statementEvidenceId: string
  statement: Statement; dependencies: Dependency[]; supportingEvidenceIds: string[]; sources: SourceReference[]
}
export function prepareConfirmation(snapshot: ProjectSnapshot, evidenceId: string): ConfirmationRequest {
  const status = revisionStatus(snapshot)
  invariant(status.head && status.matches, 'Record the current revision explicitly before confirmation')
  const evidence = snapshot.assurance.evidenceById[evidenceId]
  invariant(evidence && evidence.statement.scope.kind === 'module', 'A confirmation requires exact project context')
  invariant(Object.values(status.head.content.evidenceByStatementKey).includes(evidenceId), 'Statement absent from revision')
  invariant(evidenceFreshness(snapshot, evidence).state === 'current', 'Statement/source/dependencies changed; refresh')
  const supportingEvidenceIds: string[] = [], sources = new Map<string, SourceReference>()
  const visit = (id: string) => {
    const record = snapshot.assurance.evidenceById[id]
    invariant(record, 'Missing supporting evidence')
    for (const sourceId of record.sourceReferenceIds) {
      const source = snapshot.assurance.sourcesById[sourceId]
      invariant(source && source.capturedRecordDigest === sourceDigest(source) && source.id === `source:${source.capturedRecordDigest}`, 'Missing or changed source fingerprint')
      sources.set(sourceId, source)
    }
    for (const inputId of record.inputEvidenceIds) if (!supportingEvidenceIds.includes(inputId)) { supportingEvidenceIds.push(inputId); visit(inputId) }
  }
  visit(evidenceId)
  return freezeDeep(structuredClone({ projectRevisionId: status.head.id, revisionDigest: status.head.contentDigest,
    draftDigest: fingerprint(revisionContent(snapshot)), statementEvidenceId: evidenceId, statement: evidence.statement,
    dependencies: evidence.dependencies, supportingEvidenceIds: supportingEvidenceIds.sort(), sources: [...sources.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }))
}
export function confirmStatement(snapshot: ProjectSnapshot, displayed: ConfirmationRequest, actor: HumanActor,
  confirmedAt: string, intent: HumanConfirmation['intent'], idFactory: IdFactory = () => globalThis.crypto.randomUUID()): ProjectSnapshot {
  validateActor(actor); validateTimestamp(confirmedAt)
  invariant(['input-attestation', 'selection-attestation', 'technical-review-attestation'].includes(intent), 'unsupported attestation')
  const current = prepareConfirmation(snapshot, displayed.statementEvidenceId)
  invariant(canonicalize(current) === canonicalize(displayed), 'Displayed confirmation changed; refresh before confirming')
  const id = idFactory(); assertUnusedId(snapshot, id)
  const next = structuredClone(snapshot)
  next.assurance.confirmationsById[id] = structuredClone({ id, projectRevisionId: current.projectRevisionId, actor, confirmedAt, intent,
    statementEvidenceId: current.statementEvidenceId, statement: current.statement, supportingEvidenceIds: current.supportingEvidenceIds, dependencies: current.dependencies })
  // No graph edit, applicability/usage promotion or implicit revision recording.
  return freezeHistory(next)
}
