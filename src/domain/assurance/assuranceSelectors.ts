import type { ProjectSnapshot } from '../project/projectModel'
import type { EvidenceRecord, HumanConfirmation } from './assuranceModel'
import { canonicalize, fingerprint } from './canonical'
import { dependencyContents } from './changeTracking'
import { collectEvidence } from './legacyEvidenceAdapter'
import { statementKey } from './predicateRegistry'

export function evidenceFreshness(snapshot: ProjectSnapshot, evidence: EvidenceRecord): { state: 'current' | 'stale'; reasons: string[] } {
  const reasons: string[] = [], contents = dependencyContents(snapshot)
  for (const dependency of evidence.dependencies) {
    if (!Object.hasOwn(contents, dependency.key) || snapshot.assurance.changeGenerations[dependency.key] !== dependency.generation || fingerprint(contents[dependency.key]) !== dependency.digest) reasons.push(`Changed dependency: ${dependency.key}`)
  }
  // Compare the complete input/source/rule closure with today's versioned adapter.
  // Old records remain readable if the bundled knowledge changes.
  const current = collectEvidence(snapshot), seen = new Set<string>()
  const visit = (record: EvidenceRecord) => {
    if (seen.has(record.id)) return
    seen.add(record.id)
    const candidate = current.evidenceById[current.currentEvidenceByStatementKey[statementKey(record.statement)]]
    if (!candidate || canonicalize(candidate) !== canonicalize(record)) reasons.push(`Changed statement/source/rule: ${record.statement.predicate}`)
    for (const id of record.inputEvidenceIds) {
      const input = snapshot.assurance.evidenceById[id]
      if (input) visit(input); else reasons.push(`Missing evidence: ${id}`)
    }
  }
  visit(evidence)
  return { state: reasons.length ? 'stale' : 'current', reasons }
}
export function confirmationFreshness(snapshot: ProjectSnapshot, confirmation: HumanConfirmation) {
  const evidence = snapshot.assurance.evidenceById[confirmation.statementEvidenceId]
  if (!evidence) return { state: 'stale' as const, reasons: ['Missing statement evidence'] }
  return evidenceFreshness(snapshot, evidence)
}
export function assessStatement(snapshot: ProjectSnapshot, evidenceId: string) {
  const evidence = snapshot.assurance.evidenceById[evidenceId]
  if (!evidence) throw new Error('Missing evidence')
  const freshness = evidenceFreshness(snapshot, evidence)
  const humanConfirmationIds = Object.values(snapshot.assurance.confirmationsById).filter((c) => c.statementEvidenceId === evidenceId && confirmationFreshness(snapshot, c).state === 'current').map((c) => c.id)
  return { freshness, authority: { humanConfirmationIds, reviewedRules: evidence.reviewedRule ? [evidence.reviewedRule] : [] },
    applicability: evidence.applicability,
    effectiveAllowedUsage: freshness.state === 'current' && evidence.applicability === 'applicable' ? [...evidence.allowedUsage] : [],
    productionReady: false as const, machineReady: false as const }
}
export function inspectableStatements(snapshot: ProjectSnapshot, moduleId: string | null) {
  return Object.values(snapshot.assurance.currentEvidenceByStatementKey).map((id) => snapshot.assurance.evidenceById[id])
    .filter((e) => e.statement.scope.kind === 'module' && e.statement.scope.moduleId === moduleId)
    .sort((a, b) => statementKey(a.statement).localeCompare(statementKey(b.statement)))
}
