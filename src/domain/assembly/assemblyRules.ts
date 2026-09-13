import { fingerprint, freezeDeep } from '../assurance/canonical'
import type { Configuration, GateName, RequirementKind, VersionedRef } from './assemblyModel'

export const GATES: readonly GateName[] = ['ASSEMBLY_RESOLUTION', 'BOM', 'QUOTATION', 'GLASS_ORDER', 'PRODUCTION_RELEASE', 'MACHINE_EXPORT']
export const RESOLVER: VersionedRef = freezeDeep({ id: 'af01a-resolver', version: '1', digest: fingerprint('af01a-resolver-contract-1') })
export const GATE_CONTRACT: VersionedRef = freezeDeep({ id: 'af01a-structure-review', version: '1', digest: fingerprint('af01a-gate-contract-1') })

// AF01A has NO positive physical technical rules. The only injectable closure
// mechanism is conspicuously synthetic, for mechanics tests, never production.
export type SyntheticRule = {
  id: string; version: string; configuration: Configuration
  requirementId: string; kind: RequirementKind; decision: 'satisfied' | 'denied'
  evidence: { id: string; digest: string; classification: 'synthetic-test-only' }
}
export type AssemblyRuleBundle = {
  id: string; version: string
  purpose: 'baseline' | 'synthetic-mechanics-only'
  rules: readonly SyntheticRule[]
}
export const BASELINE_RULES: AssemblyRuleBundle = freezeDeep({
  id: 'af01a-prelude60-foundation', version: '1', purpose: 'baseline', rules: [],
})
export const SYNTHETIC_CLOSABLE: readonly RequirementKind[] = [
  'member-realization', 'connection-specification', 'bead-base-compatibility',
  'glazing-seat-specification', 'reinforcement-applicability', 'seal-specification', 'accessory-applicability',
]
export function ruleBundleRef(bundle: AssemblyRuleBundle): VersionedRef {
  return { id: bundle.id, version: bundle.version, digest: fingerprint({ ...bundle,
    rules: [...bundle.rules].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }) }
}
export function validateRuleBundle(bundle: AssemblyRuleBundle): void {
  if (!bundle.id || !bundle.version || !['baseline', 'synthetic-mechanics-only'].includes(bundle.purpose)) throw Error('Invalid rule bundle')
  if (bundle.purpose === 'baseline' && bundle.rules.length) throw Error('AF01A does not accept invented baseline technical rules')
  const ids = new Set<string>()
  for (const rule of bundle.rules) {
    if (!rule.id || ids.has(rule.id) || !rule.version || !rule.requirementId ||
      !['PRELUDE60_FIX_RECT_01', 'PRELUDE60_OPERABLE_RECT_01'].includes(rule.configuration) ||
      !SYNTHETIC_CLOSABLE.includes(rule.kind) || !['satisfied', 'denied'].includes(rule.decision) ||
      rule.evidence?.classification !== 'synthetic-test-only' || !rule.evidence.id || !rule.evidence.digest) throw Error('Invalid synthetic mechanics rule')
    ids.add(rule.id)
  }
}
