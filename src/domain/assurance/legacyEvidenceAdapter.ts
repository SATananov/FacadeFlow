import type { ProjectSnapshot } from '../project/projectModel'
import type { EvidenceRecord, SourceReference, Statement, StatementScope, Target, RuleReference } from './assuranceModel'
import { fingerprint, freezeDeep } from './canonical'
import { statementKey } from './predicateRegistry'
import { moduleDependencies } from './changeTracking'
import { getProfileSystemById } from '../../data/profileSystems'
import {
  findPrelude60SectionalEvidenceCandidate,
  getPrelude60GlazingBeadEvidenceByCode,
  type Prelude60SectionalEvidenceCandidate,
} from '../../data/profileSystems/glazingEvidence'
import { profileDimensionalSemantics } from '../../data/profileSystems/dimensionalSemantics'
import { profileJointEvidenceRules } from '../../data/profileSystems/jointSemantics'
import type { CatalogEvidence } from '../../data/profileSystems/types'
import { resolveConstructionTopology } from '../construction'
import { getProfileSystemFinishOptions } from '../../data/profileSystems/finishOptions'
import { getConfirmedGlazingOptions } from '../../data/profileSystems/glazingOptions'
import { getConfirmedHardwareStandards, getProfileSystemHardwareCompatibility } from '../../data/profileSystems/hardwareOptions'

export const LEGACY_EVIDENCE_VERSION = 'pf01-evidence-adapter-1'
export function sourceReference(systemId: string, item: string, source: CatalogEvidence): SourceReference {
  const data = {
    documentId: `legacy:${fingerprint({ title: source.documentTitle, systemId })}`,
    documentTitle: source.documentTitle, documentVersion: { state: 'unknown' as const, reason: 'PF01 did not record the external edition' },
    sourceSystemId: 'pf01-bundled-catalog', profileSystemId: systemId,
    locator: { printedPage: source.page > 0 ? String(source.page) : null, pdfPageIndex: null, section: source.section, table: null, row: null, item },
    capturedRecordVersion: LEGACY_EVIDENCE_VERSION, documentContentDigest: null, note: source.note ?? null,
  }
  const capturedRecordDigest = fingerprint(data)
  return freezeDeep({ ...data, id: `source:${capturedRecordDigest}`, capturedRecordDigest })
}
export function sourceDigest(source: SourceReference): string {
  const { id: _id, capturedRecordDigest: _digest, ...data } = source
  return fingerprint(data)
}

function sectionalEvidenceSourceReference(candidate: Prelude60SectionalEvidenceCandidate): SourceReference {
  const data = {
    documentId: `external:${fingerprint({ url: candidate.sourceUrl, publisher: candidate.sourcePublisher })}`,
    documentTitle: 'ALTEST /series 60mm/ technical PDF',
    documentVersion: { state: 'unknown' as const, reason: 'External PDF edition/revision is not stated in the captured candidate.' },
    sourceSystemId: 'altest-official-technical-pdf',
    profileSystemId: candidate.systemId,
    locator: {
      printedPage: String(candidate.sourcePage),
      pdfPageIndex: null,
      section: candidate.sourceSection,
      table: null,
      row: null,
      item: candidate.sourceLocatorBg,
    },
    capturedRecordVersion: candidate.version,
    documentContentDigest: null,
    note: `${candidate.sourceUrl} · Source-bound review candidate only. Human review does not promote a production rule.`,
  }
  const capturedRecordDigest = fingerprint(data)
  return freezeDeep({ ...data, id: `source:${capturedRecordDigest}`, capturedRecordDigest })
}
export function evidenceDigest(record: Omit<EvidenceRecord, 'id'>): string { return `evidence:${fingerprint(record)}` }

/** Pure adaptation of accepted PF01 facts. Never changes technical payloads or creates confirmations. */
export function collectEvidence(snapshot: ProjectSnapshot): {
  sourcesById: Record<string, SourceReference>; evidenceById: Record<string, EvidenceRecord>; currentEvidenceByStatementKey: Record<string, string>
} {
  const sourcesById: Record<string, SourceReference> = {}, evidenceById: Record<string, EvidenceRecord> = {}, currentEvidenceByStatementKey: Record<string, string> = {}
  const add = (statement: Statement, provenance: EvidenceRecord['provenance'], sources: SourceReference[] = [], reviewedRule: RuleReference | null = null, inputs: string[] = []) => {
    sources.forEach((source) => { sourcesById[source.id] = source })
    const data: Omit<EvidenceRecord, 'id'> = { statement, provenance, sourceReferenceIds: sources.map((s) => s.id), inputEvidenceIds: inputs,
      reviewedRule, applicability: statement.value.state === 'unknown' ? 'unknown' : 'applicable',
      allowedUsage: statement.value.state === 'unknown' ? [] : ['schematic', 'technical-review'],
      dependencies: statement.scope.kind === 'module' ? moduleDependencies(snapshot, statement.scope.moduleId) : [] }
    const id = evidenceDigest(data)
    evidenceById[id] = freezeDeep({ ...data, id }); currentEvidenceByStatementKey[statementKey(statement)] = id
    return id
  }
  const statement = (scope: StatementScope, predicate: Statement['predicate'], value: Statement['value'], unit: Statement['unit'], parameters: Statement['parameters'] = {}): Statement =>
    ({ registryVersion: 'pf02-predicates-1', scope, predicate, parameters, value, unit })
  const human = { kind: 'human-input' as const, actor: null, enteredAt: null }
  for (const module of Object.values(snapshot.modulesById)) {
    const resolution = snapshot.profileResolutionsByModuleId[module.id]
    if (!resolution) continue
    const systemId = resolution.profileSystemId, system = getProfileSystemById(systemId)
    const scope = (target: Target): StatementScope => ({ kind: 'module', projectId: snapshot.project.id, offerId: module.offerId, moduleId: module.id, target })
    const catalog = (itemCode: string): StatementScope => ({ kind: 'catalog', profileSystemId: systemId, itemCode })
    const policy = (category: string, code: string, data: unknown) => {
      const source = sourceReference(systemId, code, { documentTitle: 'PF01 operational policy registry', page: 0,
        section: category, note: 'Legacy operational choice/policy only; no new operator confirmation, assembly proof or production authority.' })
      const rule: RuleReference = { id: `pf01-policy:${category}:${systemId}:${code}`, version: LEGACY_EVIDENCE_VERSION, digest: fingerprint(data), sourceReferenceIds: [source.id] }
      add(statement(catalog(code), 'reviewed-operational-policy', { state: 'known', value: code }, 'none', { category }), { kind: 'derived', rule }, [source], rule)
    }
    for (const option of getProfileSystemFinishOptions(systemId)) policy('finish-choice', option.id, option)
    for (const option of getConfirmedGlazingOptions()) policy('glazing-choice', option.id, option)
    for (const option of getConfirmedHardwareStandards()) {
      policy('hardware-standard', option.id, option)
      const compatibility = getProfileSystemHardwareCompatibility(systemId, option.id)
      if (compatibility?.status === 'human-confirmed') policy('hardware-system-policy', option.id, compatibility)
    }
    const selectedProfile = (target: Target, code: string) => {
      const profile = system?.mainProfiles.find((p) => p.code === code)
      return add(statement(scope(target), 'human-selected-profile', { state: 'known', value: code }, 'none', { profileSystemId: systemId }), human,
        profile ? [sourceReference(systemId, code, profile.evidence)] : [])
    }
    if (resolution.frame) selectedProfile({ kind: 'frame' }, resolution.frame.profileCode)
    for (const [dividerId, assignment] of Object.entries(resolution.dividers)) selectedProfile({ kind: 'divider', dividerId }, assignment.profileCode)
    for (const [fieldId, assignment] of Object.entries(resolution.fieldSashes)) selectedProfile({ kind: 'field', fieldId }, assignment.profileCode)
    for (const [key, assignment] of Object.entries(resolution.reinforcements)) {
      const index = key.indexOf(':'), kind = key.slice(0, index), id = key.slice(index + 1)
      const target: Target = kind === 'frame' ? { kind: 'frame' } : kind === 'divider' ? { kind: 'divider', dividerId: id } : { kind: 'field', fieldId: id }
      const match = system?.reinforcements.find((r) => r.code === assignment.reinforcementCode && r.appliesToProfileCodes.includes(assignment.appliesToProfileCode) && r.thicknessOptionsMm.includes(assignment.thicknessMm))
      const parameters = { baseProfileCode: assignment.appliesToProfileCode, thicknessMm: assignment.thicknessMm }
      const inputs: string[] = []
      if (match) inputs.push(add(statement(catalog(match.code), 'catalog-reinforcement-pairing', { state: 'known', value: match.code }, 'none', parameters), { kind: 'catalog' }, [sourceReference(systemId, match.code, match.evidence)]))
      add(statement(scope(target), 'human-selected-reinforcement', { state: 'known', value: assignment.reinforcementCode }, 'none', { profileSystemId: systemId, ...parameters }), human, [], null, inputs)
    }
    const topology = snapshot.constructionDraftsByModuleId[module.id]?.topology
    const fields = topology ? resolveConstructionTopology(topology).fields : []
    for (const field of fields) {
      const target = scope({ kind: 'field', fieldId: field.id }), thickness = resolution.fieldGlazingThicknesses[field.id]?.thicknessMm
      if (thickness !== undefined) add(statement(target, 'human-glazing-thickness', { state: 'known', value: thickness }, 'mm', { profileSystemId: systemId }), human)
      for (const predicate of ['glazing-inset', 'glass-cut-width'] as const) add(statement(target, predicate, { state: 'unknown', reason: 'No reviewed technical rule in PF01' }, 'mm', { profileSystemId: systemId }), { kind: 'unknown', reason: 'Technical evidence absent' })
      const bead = resolution.fieldGlazingBeads[field.id]?.profileCode
      const base = field.fieldType === 'fixed' ? resolution.frame?.profileCode : resolution.fieldSashes[field.id]?.profileCode
      if (bead && base && thickness !== undefined) {
        const inputs: string[] = []
        const fact = systemId === 'kmg-prelude-60' ? getPrelude60GlazingBeadEvidenceByCode(bead) : undefined
        if (fact) inputs.push(add(statement(catalog(bead), 'catalog-stated-bead-thickness', { state: 'known', value: fact.nominalGlazingThicknessMm }, 'mm'), { kind: 'catalog' }, [sourceReference(systemId, bead, fact.evidence)]))
        add(statement(target, 'human-selected-bead', { state: 'known', value: bead }, 'none', { profileSystemId: systemId, thicknessMm: thickness, baseProfileCode: base }), human, [], null, inputs)
        add(statement(target, 'bead-base-profile-compatibility', { state: 'unknown', reason: 'BASE-PROFILE COMPATIBILITY: UNCONFIRMED' }, 'none', { profileSystemId: systemId, beadCode: bead, baseProfileCode: base }), { kind: 'unknown', reason: 'No reviewed pairing rule' })

        if (field.fieldType === 'operable') {
          for (const [kind, predicate] of [
            ['bead-base-compatibility', 'official-sectional-bead-base-pairing'],
            ['placement-evidence', 'official-sectional-bead-placement'],
          ] as const) {
            const candidate = findPrelude60SectionalEvidenceCandidate({
              systemId,
              kind,
              baseProfileCode: base,
              beadCode: bead,
              glazingThicknessMm: thickness,
            })
            if (!candidate) continue
            const source = sectionalEvidenceSourceReference(candidate)
            add(statement(
              scope({ kind: 'module' }),
              predicate,
              { state: 'known', value: 'показано в официална техническа скица' },
              'none',
              {
                profileSystemId: systemId,
                baseProfileCode: base,
                beadCode: bead,
                thicknessMm: thickness,
                sourceCandidateId: candidate.id,
              },
            ), { kind: 'catalog' }, [source])
          }
        }
      }
    }
    for (const entry of profileDimensionalSemantics.filter((entry) => entry.systemId === systemId && entry.visibleFace?.source === 'human-confirmed')) {
      const source = sourceReference(systemId, entry.profileCode, { documentTitle: 'PF01 reviewed dimensional semantics', page: 0, section: entry.profileCode, note: entry.visibleFace!.noteBg })
      const rule: RuleReference = { id: `pf01-visible-face:${systemId}:${entry.profileCode}`, version: LEGACY_EVIDENCE_VERSION, digest: fingerprint(entry), sourceReferenceIds: [source.id] }
      add(statement(catalog(entry.profileCode), 'reviewed-visible-face', { state: 'known', value: entry.visibleFace!.valueMm }, 'mm'), { kind: 'derived', rule }, [source], rule)
    }
    for (const entry of profileJointEvidenceRules.filter((entry) => entry.systemId === systemId && entry.sashOverlapMm !== null)) {
      const sources = [...entry.componentEvidence, ...(entry.assemblyEvidence ? [entry.assemblyEvidence] : [])].map((e) => sourceReference(systemId, `${entry.supportProfileCode}/${entry.sashProfileCode}`, e))
      const rule: RuleReference = { id: `pf01-overlap:${systemId}:${entry.supportProfileCode}:${entry.sashProfileCode}`, version: LEGACY_EVIDENCE_VERSION, digest: fingerprint(entry), sourceReferenceIds: sources.map((s) => s.id) }
      add(statement(catalog(entry.sashProfileCode), 'reviewed-front-elevation-overlap', { state: 'known', value: entry.sashOverlapMm! }, 'mm', { supportProfileCode: entry.supportProfileCode }), { kind: 'derived', rule }, sources, rule)
    }
  }
  return { sourcesById, evidenceById, currentEvidenceByStatementKey }
}
const ADDITIVE_REVIEW_PREDICATES = new Set<Statement['predicate']>([
  'official-sectional-bead-base-pairing',
  'official-sectional-bead-placement',
])

/**
 * Schema-evolution bridge for persisted PF02 projects created before the
 * official sectional review candidates existed. Only deterministic,
 * source-bound review candidates are added to the CURRENT draft evidence
 * graph. Historical revisions are never rewritten and no rule/authority is
 * promoted.
 */
export function backfillAdditiveReviewEvidence(snapshot: ProjectSnapshot): void {
  const collected = collectEvidence(snapshot)
  for (const [key, evidenceId] of Object.entries(collected.currentEvidenceByStatementKey)) {
    const evidence = collected.evidenceById[evidenceId]
    if (!evidence || evidence.statement.scope.kind !== 'module' || !ADDITIVE_REVIEW_PREDICATES.has(evidence.statement.predicate)) continue
    if (Object.hasOwn(snapshot.assurance.currentEvidenceByStatementKey, key)) continue
    for (const sourceId of evidence.sourceReferenceIds) {
      const source = collected.sourcesById[sourceId]
      if (source) snapshot.assurance.sourcesById[sourceId] = source
    }
    snapshot.assurance.evidenceById[evidenceId] = evidence
    snapshot.assurance.currentEvidenceByStatementKey[key] = evidenceId
  }
}

function pinnedEvidenceIds(snapshot: ProjectSnapshot): Set<string> {
  const pinned = new Set<string>(Object.values(snapshot.assurance.currentEvidenceByStatementKey))
  for (const revision of Object.values(snapshot.revisions.revisionsById)) {
    for (const id of Object.values(revision.content.evidenceByStatementKey)) pinned.add(id)
  }
  for (const confirmation of Object.values(snapshot.assurance.confirmationsById)) {
    pinned.add(confirmation.statementEvidenceId)
    confirmation.supportingEvidenceIds.forEach((id) => pinned.add(id))
  }
  const visit = (id: string) => {
    const record = snapshot.assurance.evidenceById[id]
    if (!record) return
    for (const inputId of record.inputEvidenceIds) if (!pinned.has(inputId)) { pinned.add(inputId); visit(inputId) }
  }
  ;[...pinned].forEach(visit)
  return pinned
}

/**
 * Keep the current evidence graph plus immutable records pinned by revisions or
 * confirmations. Superseded draft-only evidence is not historical authority and
 * must not grow localStorage without bound during ordinary editing.
 */
export function pruneTransientEvidence(snapshot: ProjectSnapshot): void {
  const evidenceIds = pinnedEvidenceIds(snapshot)
  const sourceIds = new Set<string>()
  for (const id of evidenceIds) {
    const record = snapshot.assurance.evidenceById[id]
    if (!record) continue
    record.sourceReferenceIds.forEach((sourceId) => sourceIds.add(sourceId))
    record.reviewedRule?.sourceReferenceIds.forEach((sourceId) => sourceIds.add(sourceId))
  }
  for (const id of Object.keys(snapshot.assurance.evidenceById)) if (!evidenceIds.has(id)) delete snapshot.assurance.evidenceById[id]
  for (const id of Object.keys(snapshot.assurance.sourcesById)) if (!sourceIds.has(id)) delete snapshot.assurance.sourcesById[id]
}

export function synchronizeEvidence(snapshot: ProjectSnapshot): void {
  const collected = collectEvidence(snapshot)
  Object.assign(snapshot.assurance.sourcesById, collected.sourcesById)
  Object.assign(snapshot.assurance.evidenceById, collected.evidenceById)
  snapshot.assurance.currentEvidenceByStatementKey = collected.currentEvidenceByStatementKey
  pruneTransientEvidence(snapshot)
}
