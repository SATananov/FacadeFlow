import { canonicalize, fingerprint, freezeDeep } from '../assurance/canonical'
import type { ProjectSnapshot } from '../project/projectModel'
import type { AssemblyBlocker, ReadinessAssessment, ResolvedAssembly } from './assemblyModel'
import { GATES, GATE_CONTRACT } from './assemblyRules'
import { derivedId, deriveResolvedAssembly, type DerivationOptions } from './resolveAssembly'

/** Explicitly selects the evaluation context. Historical evaluation must pass
 * revisionId; the default is the exact CURRENT draft, never implicit history. */
export function assessReadiness(assembly: ResolvedAssembly, snapshot: ProjectSnapshot, options: DerivationOptions = {}): readonly ReadinessAssessment[] {
  const current = deriveResolvedAssembly(snapshot, assembly.source.moduleId, options)
  const extra: AssemblyBlocker[] = []
  const issue = (code: AssemblyBlocker['code'], messageBg: string) => extra.push({
    id: derivedId(assembly.source.moduleId, 'freshness', code), code,
    target: { kind: 'module', id: assembly.source.moduleId }, requirementId: null,
    blocks: [...GATES], messageBg, nextStepBg: 'Генерирай нов преглед от точния вход и наличните версии на правилата и доказателствата.',
  })
  let invalidDigest = false
  try {
    const { resultDigest, ...content } = assembly
    invalidDigest = fingerprint(content) !== resultDigest
  } catch { invalidDigest = true }
  if (invalidDigest) issue('RESULT_INVALID', 'Резултатът не съвпада със своя отпечатък.')
  if (canonicalize(current.source) !== canonicalize(assembly.source)) issue('INPUT_STALE', 'Прегледът е за друг вход, чернова или ревизия.')
  const ruleDeps = (item: ResolvedAssembly) => item.dependencies.filter((d) => ['rules', 'resolver'].includes(d.kind))
  if (canonicalize(current.ruleSet) !== canonicalize(assembly.ruleSet) || canonicalize(current.resolver) !== canonicalize(assembly.resolver) ||
    canonicalize(ruleDeps(current)) !== canonicalize(ruleDeps(assembly))) issue('RULE_STALE', 'Версията на правилата, gate-контракта или resolver-а е променена.')
  const evidenceDeps = (item: ResolvedAssembly) => item.dependencies.filter((d) => ['catalog', 'evidence', 'source'].includes(d.kind))
  if (canonicalize(evidenceDeps(current)) !== canonicalize(evidenceDeps(assembly))) issue('EVIDENCE_STALE', 'Каталоговите данни или доказателствата са променени.')
  const unavailable = current.blockers.some((b) => ['SOURCE_INVALID', 'HISTORICAL_RULE_UNAVAILABLE'].includes(b.code))
  const intrinsicStale = current.blockers.some((b) => ['EVIDENCE_STALE', 'RULE_STALE', 'INPUT_STALE'].includes(b.code))
  // Also reject a fabricated result with a recomputed digest. Source/rule
  // bindings alone are not authority: deterministic regeneration must agree.
  if (!extra.length && current.resultDigest !== assembly.resultDigest) issue('RESULT_INVALID', 'Резултатът не се възпроизвежда от посочените входове.')
  return freezeDeep(GATES.map((gate): ReadinessAssessment => {
    const blockers = [...new Map([...assembly.blockers, ...current.blockers, ...extra]
      .filter((b) => b.blocks.includes(gate)).map((b) => [b.id, b])).values()]
    const eligible = gate === 'ASSEMBLY_RESOLUTION' && current.support.status === 'supported' &&
      current.coverageStatus === 'complete' && !blockers.length && !unavailable
    return { gate, contract: GATE_CONTRACT, assemblyDigest: assembly.resultDigest,
      evaluatedAgainst: current.source, authority: assembly.authority,
      freshness: invalidDigest || unavailable ? 'unverifiable' : extra.length || intrinsicStale ? 'stale' : 'current',
      status: eligible ? 'READY' : 'BLOCKED', blockers }
  }))
}
