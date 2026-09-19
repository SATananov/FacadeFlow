import type { Predicate } from './predicateRegistry'

export type HumanActor = { id: string; label: string; identityBasis: 'local-self-asserted' }
export type Known<T> = { state: 'known'; value: T } | { state: 'unknown'; reason: string }
export type Target = { kind: 'module' } | { kind: 'frame' } | { kind: 'field'; fieldId: string } | { kind: 'divider'; dividerId: string }
export type StatementScope =
  | { kind: 'catalog'; profileSystemId: string; itemCode: string }
  | { kind: 'module'; projectId: string; offerId: string; moduleId: string; target: Target }
export type Statement = {
  registryVersion: 'pf02-predicates-1'; predicate: Predicate; scope: StatementScope
  parameters: Record<string, string | number>; value: Known<string | number>; unit: 'mm' | 'none'
}
export type SourceReference = {
  id: string; documentId: string; documentTitle: string; documentVersion: Known<string>
  sourceSystemId: string | null; profileSystemId: string | null
  locator: { printedPage: string | null; pdfPageIndex: number | null; section: string | null; table: string | null; row: string | null; item: string | null }
  capturedRecordVersion: string; capturedRecordDigest: string; documentContentDigest: string | null; note: string | null
}
export type RuleReference = { id: string; version: string; digest: string; sourceReferenceIds: string[] }
export type Provenance =
  | { kind: 'human-input'; actor: HumanActor | null; enteredAt: string | null }
  | { kind: 'catalog' }
  | { kind: 'derived'; rule: RuleReference }
  | { kind: 'calculated'; algorithmId: string; algorithmVersion: string }
  | { kind: 'unknown'; reason: string }
export type Usage = 'schematic' | 'technical-review' | 'commercial' | 'production' | 'machine'
export type PF02Usage = Extract<Usage, 'schematic' | 'technical-review'>
export type ChangeKey = `project:${string}` | `offer:${string}` | `module:${string}`
export type Dependency = { key: ChangeKey; generation: number; digest: string }
export type EvidenceRecord = {
  id: string; statement: Statement; provenance: Provenance
  sourceReferenceIds: string[]; inputEvidenceIds: string[]; reviewedRule: RuleReference | null
  applicability: 'applicable' | 'invalid' | 'unknown'; allowedUsage: PF02Usage[]; dependencies: Dependency[]
}
export type HumanConfirmation = {
  id: string; projectRevisionId: string; actor: HumanActor; confirmedAt: string
  intent: 'input-attestation' | 'selection-attestation' | 'technical-review-attestation'
  statementEvidenceId: string; statement: Statement; supportingEvidenceIds: string[]; dependencies: Dependency[]
}
export type AssuranceState = {
  sourcesById: Record<string, SourceReference>; evidenceById: Record<string, EvidenceRecord>
  confirmationsById: Record<string, HumanConfirmation>; currentEvidenceByStatementKey: Record<string, string>
  changeGenerations: Record<ChangeKey, number>
}
export const emptyAssurance = (): AssuranceState => ({ sourcesById: {}, evidenceById: {}, confirmationsById: {},
  currentEvidenceByStatementKey: {}, changeGenerations: {} })
