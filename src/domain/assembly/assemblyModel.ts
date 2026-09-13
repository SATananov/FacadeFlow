import type { DeepReadonly } from '../project/revisionModel'

export type Side = 'left' | 'right' | 'top' | 'bottom'
export type VersionedRef = { id: string; version: string; digest: string }
export type SourceBinding = {
  projectId: string; offerId: string; moduleId: string; contentDigest: string
} & ({ kind: 'draft'; baseRevisionId: string | null } | { kind: 'revision'; revisionId: string })
export type DependencyRef = {
  kind: 'input' | 'catalog' | 'evidence' | 'source' | 'rules' | 'resolver'
  key: string; digest: string
}
export type Proof = {
  rule: VersionedRef
  authority: 'representation' | 'human-input' | 'catalog' | 'reviewed-front-elevation' | 'synthetic-test'
  dependencies: readonly DependencyRef[]
  permittedUse: 'technical-review' | 'synthetic-mechanics-only'
}
export type Resolution<T> =
  | { status: 'resolved'; value: T; proof: Proof }
  | { status: 'unresolved' | 'unsupported' | 'invalid'; blockerIds: readonly string[] }
  | { status: 'not-applicable'; proof: Proof }
export type ResolutionStatus = Resolution<unknown>['status']
export type AssemblyTarget =
  | { kind: 'module'; id: string }
  | { kind: 'field'; id: string }
  | { kind: 'divider'; id: string }
  | { kind: 'member'; id: string }
  | { kind: 'connection'; id: string }
  | { kind: 'infill'; id: string }
export type SelectionRef = {
  moduleId: string; sourcePath: readonly string[]; assignmentDigest: string; componentCode: string; source: 'human'
}
export type AssemblyMember = {
  id: string
  origin: { kind: 'frame-side'; side: Side } | { kind: 'sash-side'; fieldId: string; side: Side }
    | { kind: 'divider'; dividerId: string; axis: 'vertical' | 'horizontal' | 'angled' }
  profileSelection: Resolution<SelectionRef>
  physicalRealization: Resolution<'specified'>
  requirementIds: readonly string[]
}
export type ConnectionEndpoint =
  | { kind: 'member'; memberId: string; location: Side | 'start' | 'end' }
  | { kind: 'infill'; infillId: string; side: Side }
export type AssemblyConnection = {
  id: string
  kind: 'frame-corner' | 'sash-corner' | 'divider-to-frame' | 'sash-to-frame' | 'glazing-to-surround'
  endpoints: readonly [ConnectionEndpoint, ConnectionEndpoint]
  adjacency: Resolution<'established'>
  physicalSpecification: Resolution<'specified'>
  requirementIds: readonly string[]
}
export type AssemblyInfill = {
  id: string; fieldId: string; kind: 'glazing'
  nominalThicknessMm: Resolution<number>
  selectedBead: Resolution<SelectionRef>
  boundaryConnectionIds: readonly string[]
  requirementIds: readonly string[]
}
export type GateName = 'ASSEMBLY_RESOLUTION' | 'BOM' | 'QUOTATION' | 'GLASS_ORDER' | 'PRODUCTION_RELEASE' | 'MACHINE_EXPORT'
export type RequirementKind =
  | 'profile-selection' | 'member-realization' | 'connection-specification'
  | 'bead-selection' | 'glazing-thickness' | 'bead-base-compatibility' | 'glazing-seat-specification'
  | 'reinforcement-candidate' | 'reinforcement-selection' | 'reinforcement-applicability' | 'reinforcement-adequacy'
  | 'seal-specification' | 'hardware-opening-context' | 'hardware-kit'
  | 'accessory-applicability' | 'glazing-inset' | 'glass-cut-dimensions' | 'manufacturing-dimensions'
  | 'reviewed-visible-face' | 'reviewed-overlap'
export type RequirementValue = SelectionRef | number | string | { mode: string; handing: string }
export type AssemblyRequirement = {
  id: string; kind: RequirementKind; target: AssemblyTarget; labelBg: string
  applicability: Resolution<'required' | 'optional'>
  satisfaction: Resolution<RequirementValue>
  requiredBy: readonly GateName[]
}
export type BlockerCode =
  | 'SOURCE_INVALID' | 'OWNERSHIP_MISMATCH' | 'INPUT_MISSING' | 'ASSIGNMENT_MISSING'
  | 'SELECTION_INCOMPATIBLE' | 'CONFIGURATION_UNSUPPORTED' | 'EVIDENCE_MISSING'
  | 'RULE_MISSING' | 'RULE_CONFLICT' | 'INPUT_STALE' | 'EVIDENCE_STALE' | 'RULE_STALE'
  | 'HISTORICAL_RULE_UNAVAILABLE' | 'STAGE_NOT_IMPLEMENTED' | 'RESULT_INVALID'
export type AssemblyBlocker = {
  id: string; code: BlockerCode; target: AssemblyTarget; requirementId: string | null
  blocks: readonly GateName[]; messageBg: string; nextStepBg: string
}
export type Configuration = 'PRELUDE60_FIX_RECT_01' | 'PRELUDE60_OPERABLE_RECT_01'
export type ResolvedAssembly = DeepReadonly<{
  schemaVersion: 'af01a-assembly-1'; source: SourceBinding; resolver: VersionedRef; ruleSet: VersionedRef
  authority: 'technical-review' | 'synthetic-mechanics-only'
  support: { status: 'supported'; configuration: Configuration }
    | { status: 'undetermined' | 'unsupported'; blockerIds: readonly string[] }
  coverageStatus: 'complete' | 'partial' | 'unresolved' | 'invalid'
  members: AssemblyMember[]; connections: AssemblyConnection[]; infills: AssemblyInfill[]
  requirements: AssemblyRequirement[]; blockers: AssemblyBlocker[]; dependencies: DependencyRef[]
  resultDigest: string
}>
export type ReadinessAssessment = DeepReadonly<{
  gate: GateName; contract: VersionedRef; assemblyDigest: string; evaluatedAgainst: SourceBinding
  authority: ResolvedAssembly['authority']; freshness: 'current' | 'stale' | 'unverifiable'
  status: 'READY' | 'BLOCKED' | 'NOT_APPLICABLE'; blockers: AssemblyBlocker[]
}>
