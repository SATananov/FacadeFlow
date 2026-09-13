import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const revisions = load('src/domain/project/revisionOperations')
const assurance = load('src/domain/assurance/assuranceOperations')
const selectors = load('src/domain/assurance/assuranceSelectors')
const registry = load('src/domain/assurance/predicateRegistry')
const canonical = load('src/domain/assurance/canonical')
const adapter = load('src/domain/assurance/legacyEvidenceAdapter')
const persistence = load('src/persistence/localProjectStorage')
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const glazing = load('src/domain/glazingContext')
const system = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const actor = { id: 'operator-1', label: 'Test operator', identityBasis: 'local-self-asserted' }
const now = '2026-09-12T12:00:00.000Z'
let counter = 0, passed = 0
const idFactory = () => `pf02-test-${++counter}`
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
function fixture() {
  let s = model.createProjectSnapshot(idFactory)
  const a = idFactory(), b = idFactory()
  let topology = construction.createConstructionModel({ xMm: 20, yMm: 40, widthMm: 1800, heightMm: 1400 })
  topology = construction.setConstructionFieldType(topology, 'field-1', 'fixed')
  const field = construction.resolveConstructionTopology(topology).fields[0]
  let resolution = profiles.setFrameProfileAssignment(null, system, '482.30')
  resolution = profiles.setFieldHumanGlazingThicknessAssignment(resolution, system, field, 32)
  resolution = profiles.setFieldGlazingBeadAssignment(resolution, system, field, 32, '482.22')
  resolution = profiles.setReinforcementAssignment(resolution, system, { kind: 'frame', id: 'frame' }, '482.30', 'TRE 13', 1.2)
  s = ops.editProject(s, (next) => {
    ops.replaceFreeModules(next, [a, b].map((id, i) => ({ id, sequence: i + 1, profileSystemId: system.id, productType: 'window', profileResolution: structuredClone(resolution) })))
    for (const id of [a, b]) next.constructionDraftsByModuleId[id] = { version: 'constructor-01d', frame: structuredClone(topology.frame), topology: structuredClone(topology) }
  })
  codec.validateProjectSnapshot(s)
  return { s, a, b, field }
}
const evidence = (s, moduleId, predicate = 'human-selected-bead') => selectors.inspectableStatements(s, moduleId).find((e) => e.statement.predicate === predicate)
const record = (s) => revisions.recordProjectRevision(s, actor, now, idFactory)
function confirmed() {
  const f = fixture(), s = record(f.s)
  const request = assurance.prepareConfirmation(s, evidence(s, f.a).id)
  const next = assurance.confirmStatement(s, request, actor, now, 'selection-attestation', idFactory)
  return { ...f, s: next, request, confirmation: Object.values(next.assurance.confirmationsById)[0] }
}
const editThickness = (s, id, value, field) => ops.editProject(s, (next) => {
  next.profileResolutionsByModuleId[id] = profiles.setFieldHumanGlazingThicknessAssignment(next.profileResolutionsByModuleId[id], system, field, value)
})
class MemoryStorage {
  data = new Map(); failWrite = false; writes = 0
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { if (this.failWrite) throw Error('quota'); this.writes++; this.data.set(key, value) }
}

test('canonical serialization ignores nested object insertion order; arrays retain order', () => {
  const a = { z: [1, { b: 'Български', a: -0 }], a: null }, b = { a: null, z: [1, { a: 0, b: 'Български' }] }
  assert.equal(canonical.canonicalize(a), canonical.canonicalize(b))
  assert.equal(canonical.fingerprint(a), canonical.fingerprint(b))
  assert.notEqual(canonical.fingerprint([1, 2]), canonical.fingerprint([2, 1]))
})
test('SHA256 integrity matches Node crypto across block lengths and Unicode', () => {
  for (const value of ['', null, {}, '🪟 Б', 'a'.repeat(55), 'b'.repeat(64), 'c'.repeat(1000)]) {
    assert.equal(canonical.fingerprint(value), `sha256:${createHash('sha256').update(canonical.canonicalize(value)).digest('hex')}`)
  }
})
test('non-JSON, nonfinite, sparse and cyclic canonical inputs fail closed', () => {
  const cyclic = {}; cyclic.self = cyclic
  const sparse = [1, 2]; delete sparse[0]
  for (const value of [undefined, NaN, Infinity, new Date(), cyclic, sparse, { missing: undefined }, { [Symbol('hidden')]: 1 }]) assert.throws(() => canonical.canonicalize(value))
})
test('statement keys deterministic; FIELD context and predicate remain distinct', () => {
  const { s, a, b } = fixture(), one = evidence(s, a).statement
  const reordered = Object.fromEntries(Object.entries(one).reverse())
  reordered.parameters = Object.fromEntries(Object.entries(one.parameters).reverse())
  assert.equal(registry.statementKey(one), registry.statementKey(reordered))
  assert.notEqual(registry.statementKey(one), registry.statementKey(evidence(s, b).statement))
  assert.notEqual(registry.statementKey(one), registry.statementKey(evidence(s, a, 'bead-base-profile-compatibility').statement))
})
for (const [name, mutate] of [
  ['unsupported predicate', (s) => { s.predicate = 'approved-for-production' }],
  ['future registry', (s) => { s.registryVersion = 'pf02-predicates-99' }],
  ['incorrect unit', (s) => { s.unit = 'mm' }],
  ['incorrect value', (s) => { s.value = { state: 'known', value: 22 } }],
  ['incorrect scope', (s) => { s.scope.target = { kind: 'frame' } }],
  ['missing parameter', (s) => { delete s.parameters.thicknessMm }],
  ['extra parameter', (s) => { s.parameters.confirmed = 'yes' }],
]) test(`predicate validation rejects ${name}`, () => {
  const { s, a } = fixture(), statement = structuredClone(evidence(s, a).statement)
  mutate(statement); assert.throws(() => registry.validateStatement(statement))
})
test('unknown technical predicates reject fabricated known values', () => {
  const { s, a } = fixture()
  for (const predicate of ['bead-base-profile-compatibility', 'glazing-inset', 'glass-cut-width']) {
    const statement = structuredClone(evidence(s, a, predicate).statement)
    statement.value = { state: 'known', value: 22 }
    assert.throws(() => registry.validateStatement(statement))
  }
})
test('normal edits and navigation create zero revisions or confirmations', () => {
  const { s, a, field } = fixture()
  let next = editThickness(s, a, 24, field)
  next = ops.editProject(next, (draft) => { draft.project.site.objectName = 'typing'; draft.workspace.screen = 'free-constructor'; draft.workspace.activeModuleIdByOffer[draft.workspace.freeOfferId] = a })
  assert.equal(Object.keys(next.revisions.revisionsById).length, 0)
  assert.equal(Object.keys(next.assurance.confirmationsById).length, 0)
})
test('explicit record creates stable revision identity; unchanged recording reuses head', () => {
  const { s } = fixture(), next = record(s)
  assert.notEqual(next.revisions.headRevisionId, s.project.id)
  assert.equal(record(next), next)
  const changed = ops.editProject(next, (draft) => { draft.project.site.objectName = 'changed' })
  const second = record(changed)
  assert.equal(revisions.revisionStatus(second).head.number, 2)
  assert.equal(revisions.revisionStatus(second).head.parentRevisionId, next.revisions.headRevisionId)
})
test('revision actor required and duplicate identities rejected', () => {
  const { s } = fixture()
  assert.throws(() => revisions.recordProjectRevision(s, { ...actor, label: '' }, now))
  assert.throws(() => revisions.recordProjectRevision(s, actor, now, () => s.project.id))
})
test('recorded graph detached, deeply frozen; edits cannot rewrite history', () => {
  const { s, a, field } = fixture(), next = record(s), revision = revisions.revisionStatus(next).head
  const before = canonical.canonicalize(revision)
  assert.notEqual(revision.content.profileResolutionsByModuleId[a], s.profileResolutionsByModuleId[a])
  assert.throws(() => { revision.content.profileResolutionsByModuleId[a].frame.profileCode = 'other' })
  const edited = editThickness(next, a, 24, field)
  assert.equal(canonical.canonicalize(edited.revisions.revisionsById[revision.id]), before)
  assert.throws(() => ops.editProject(next, (draft) => { delete draft.revisions.revisionsById[revision.id] }))
})
test('Offer and Module revision selectors do not create entities or share mutable state', () => {
  const { s, a } = fixture(), next = record(s), revision = revisions.revisionStatus(next).head
  const view = revisions.getModuleRevisionView(revision, a)
  assert.equal(view.module.id, a); assert.ok(Object.isFrozen(view.profiles))
  assert.equal(revisions.getOfferRevisionView(revision, s.workspace.freeOfferId).modules.length, 2)
  assert.throws(() => revisions.getModuleRevisionView(revision, 'absent'))
})
test('navigation, selection and unchanged callbacks do not dirty recorded content or advance module generations', () => {
  const { s, a } = fixture(), recorded = record(s)
  const next = ops.editProject(recorded, (draft) => { draft.workspace.screen = 'free-constructor'; draft.workspace.activeModuleIdByOffer[draft.workspace.freeOfferId] = a })
  assert.deepEqual(next.assurance.changeGenerations, recorded.assurance.changeGenerations)
  assert.equal(revisions.revisionStatus(next).matches, true)
  assert.equal(record(next), next)
})
test('source records distinguish captured versions and retain unknown external editions', () => {
  const { s } = fixture(), source = Object.values(s.assurance.sourcesById)[0]
  assert.equal(source.documentVersion.state, 'unknown')
  const different = { ...source, capturedRecordVersion: 'new-transcription' }
  different.capturedRecordDigest = adapter.sourceDigest(different); different.id = `source:${different.capturedRecordDigest}`
  assert.notEqual(source.id, different.id)
  const next = structuredClone(s); next.assurance.sourcesById[different.id] = different
  codec.validateProjectSnapshot(next)
})
test('explicit recording required before confirmation; no implicit revision', () => {
  const { s, a } = fixture()
  assert.throws(() => assurance.prepareConfirmation(s, evidence(s, a).id))
  assert.equal(s.revisions.headRevisionId, null)
})
test('confirmation binds exact actor, statement, revision, sources and dependencies', () => {
  const { s, request, confirmation } = confirmed()
  assert.equal(confirmation.projectRevisionId, s.revisions.headRevisionId)
  assert.deepEqual(confirmation.statement, request.statement)
  assert.deepEqual(confirmation.dependencies, request.dependencies)
  assert.deepEqual(confirmation.actor, actor)
  assert.equal(confirmation.confirmedAt, now)
  assert.ok(request.sources.length > 0)
  assert.equal(Object.keys(s.revisions.revisionsById).length, 1)
  codec.validateProjectSnapshot(s)
})
test('confirmation does not increase applicability, usage or technical authority', () => {
  const { s, a } = confirmed()
  const bead = evidence(s, a)
  assert.equal(selectors.assessStatement(s, bead.id).authority.humanConfirmationIds.length, 1)
  for (const predicate of ['bead-base-profile-compatibility', 'glazing-inset', 'glass-cut-width']) {
    const e = evidence(s, a, predicate), assessment = selectors.assessStatement(s, e.id)
    assert.equal(e.statement.value.state, 'unknown'); assert.equal(assessment.applicability, 'unknown')
    assert.deepEqual(assessment.effectiveAllowedUsage, []); assert.equal(assessment.machineReady, false)
  }
  const context = glazing.resolveHumanGlazingContext(system, 32, '482.22')
  assert.equal(context.baseProfileCompatibility, 'UNCONFIRMED'); assert.equal(context.glassCutKnown, false)
})
test('technical-review attestation of an unknown cannot create technical proof', () => {
  const { s: draft, a } = fixture(), s = record(draft), e = evidence(s, a, 'glazing-inset')
  const next = assurance.confirmStatement(s, assurance.prepareConfirmation(s, e.id), actor, now, 'technical-review-attestation', idFactory)
  assert.deepEqual(selectors.assessStatement(next, e.id).effectiveAllowedUsage, [])
  assert.equal(next.assurance.evidenceById[e.id].statement.value.state, 'unknown')
})
test('confirmation rejects an edited statement or omitted displayed dependency', () => {
  const { s, request } = confirmed()
  for (const mutate of [(r) => { r.statement.value.value = '482.15' }, (r) => { r.dependencies = [] }, (r) => { r.sources = [] }, (r) => { r.projectRevisionId = 'other' }]) {
    const changed = structuredClone(request); mutate(changed)
    assert.throws(() => assurance.confirmStatement(s, changed, actor, now, 'selection-attestation'))
  }
})
test('confirmation race rejects changed module, other-module edit, generation or revision', () => {
  const { s, a, b, field, request } = confirmed()
  const changes = [editThickness(s, a, 24, field), editThickness(s, b, 24, field)]
  const tampered = structuredClone(s); tampered.assurance.changeGenerations[`module:${a}`]++
  changes.push(tampered)
  const rerecorded = record(editThickness(s, b, 24, field)); changes.push(rerecorded)
  for (const next of changes) assert.throws(() => assurance.confirmStatement(next, request, actor, now, 'selection-attestation'))
})
test('same generation with changed content fingerprint cannot confirm', () => {
  const { s, a, request } = confirmed(), changed = structuredClone(s)
  changed.profileResolutionsByModuleId[a].fieldGlazingThicknesses['field-1'].thicknessMm = 24
  assert.throws(() => assurance.confirmStatement(changed, request, actor, now, 'selection-attestation'))
})
test('thickness changes stale historical confirmation without mutating its record', () => {
  const { s, a, field, confirmation } = confirmed(), before = canonical.canonicalize(confirmation)
  const changed = editThickness(s, a, 24, field)
  assert.equal(selectors.confirmationFreshness(changed, confirmation).state, 'stale')
  assert.equal(canonical.canonicalize(changed.assurance.confirmationsById[confirmation.id]), before)
  codec.validateProjectSnapshot(changed)
})
test('module B edits do not stale independent module A confirmation', () => {
  const { s, b, field, confirmation } = confirmed()
  assert.equal(selectors.confirmationFreshness(editThickness(s, b, 24, field), confirmation).state, 'current')
})
test('Undo cannot decrease generations or resurrect confirmation authority', () => {
  const { s, a, field, confirmation } = confirmed()
  let changed = editThickness(s, a, 24, field)
  changed = ops.editProject(changed, (draft) => { draft.profileResolutionsByModuleId[a] = structuredClone(s.profileResolutionsByModuleId[a]) })
  assert.ok(changed.assurance.changeGenerations[`module:${a}`] > s.assurance.changeGenerations[`module:${a}`])
  assert.equal(selectors.confirmationFreshness(changed, confirmation).state, 'stale')
})
test('topology reset preserves historical confirmation context through round trip', () => {
  const { s, a, confirmation } = confirmed()
  const changed = ops.editProject(s, (draft) => { draft.constructionDraftsByModuleId[a] = null; draft.profileResolutionsByModuleId[a] = null })
  const loaded = codec.deserializeProject(codec.serializeProject(changed))
  assert.equal(selectors.confirmationFreshness(loaded, loaded.assurance.confirmationsById[confirmation.id]).state, 'stale')
})
test('system and base-profile changes stale scoped confirmations', () => {
  const { s, a, confirmation } = confirmed()
  const base = ops.editProject(s, (draft) => { draft.profileResolutionsByModuleId[a].frame = null; draft.profileResolutionsByModuleId[a].fieldGlazingBeads = {}; draft.profileResolutionsByModuleId[a].reinforcements = {} })
  assert.equal(selectors.confirmationFreshness(base, confirmation).state, 'stale')
  const systemChange = ops.editProject(s, (draft) => { draft.modulesById[a].definition.profileSystemId = 'kmg-prestige-70'; draft.profileResolutionsByModuleId[a] = profiles.createModuleProfileResolution('kmg-prestige-70') })
  assert.equal(selectors.confirmationFreshness(systemChange, confirmation).state, 'stale')
})
test('module reorder changes aggregate dependency but not module authority', () => {
  const { s, a, b, confirmation } = confirmed()
  const next = ops.editProject(s, (draft) => { draft.modulesById[a].sequence = 2; draft.modulesById[b].sequence = 1 })
  assert.equal(selectors.confirmationFreshness(next, confirmation).state, 'current')
  assert.ok(next.assurance.changeGenerations[`offer:${s.workspace.freeOfferId}`] > s.assurance.changeGenerations[`offer:${s.workspace.freeOfferId}`])
})
test('Free to Offer copy has new identities and no borrowed human authority', () => {
  const { s, a, confirmation } = confirmed()
  const next = ops.copyFreeModuleToOffer(s, a, s.constructionDraftsByModuleId[a], idFactory)
  const target = model.getOfferModules(next)[0].id
  assert.notEqual(target, a)
  assert.deepEqual(next.profileResolutionsByModuleId[target], s.profileResolutionsByModuleId[a])
  assert.deepEqual(selectors.assessStatement(next, evidence(next, target).id).authority.humanConfirmationIds, [])
  assert.equal(selectors.confirmationFreshness(next, confirmation).state, 'current')
  codec.validateProjectSnapshot(next)
})
test('PF01 migration preserves graph exactly, creates no history and invents no attribution', () => {
  const { s } = fixture(), { revisions: _r, assurance: _a, ...legacy } = s
  legacy.schemaVersion = 'project-foundation-01'
  const migrated = codec.deserializeProject(JSON.stringify(legacy))
  const { revisions: r, assurance: a, schemaVersion: _v, ...graph } = migrated
  const { schemaVersion: _old, ...oldGraph } = legacy
  assert.deepEqual(graph, oldGraph); assert.equal(r.headRevisionId, null)
  assert.deepEqual(r.revisionsById, {}); assert.deepEqual(a.confirmationsById, {})
  for (const e of Object.values(a.evidenceById)) if (e.provenance.kind === 'human-input') { assert.equal(e.provenance.actor, null); assert.equal(e.provenance.enteredAt, null) }
  for (const source of Object.values(a.sourcesById)) assert.equal(source.documentVersion.state, 'unknown')
  assert.ok(Object.values(a.evidenceById).some((e) => e.reviewedRule && e.statement.predicate === 'reviewed-front-elevation-overlap'))
})
test('complete round trip preserves identities, immutable history, evidence and freshness', () => {
  const { s } = confirmed(), next = codec.deserializeProject(codec.serializeProject(s))
  assert.deepEqual(next, s)
  assert.ok(Object.isFrozen(revisions.revisionStatus(next).head.content))
  assert.ok(Object.isFrozen(Object.values(next.assurance.confirmationsById)[0]))
})
for (const [name, mutate] of [
  ['revision digest', (s) => { revisions.revisionStatus(s).head.content.project.site.objectName = 'tampered' }],
  ['dangling revision head', (s) => { s.revisions.headRevisionId = 'absent' }],
  ['confirmation revision', (s) => { Object.values(s.assurance.confirmationsById)[0].projectRevisionId = 'absent' }],
  ['confirmation FIELD', (s) => { Object.values(s.assurance.confirmationsById)[0].statement.scope.target.fieldId = 'absent' }],
  ['missing source', (s) => { delete s.assurance.sourcesById[Object.keys(s.assurance.sourcesById)[0]] }],
  ['unsupported predicate', (s) => { Object.values(s.assurance.evidenceById)[0].statement.predicate = 'anything' }],
  ['production usage', (s) => { Object.values(s.assurance.evidenceById)[0].allowedUsage.push('production') }],
  ['unknown promotion', (s) => { Object.values(s.assurance.evidenceById).find((e) => e.statement.predicate === 'glazing-inset').applicability = 'applicable' }],
  ['decreased generation', (s) => { s.assurance.changeGenerations[`module:${Object.keys(s.modulesById)[0]}`] = 0 }],
]) test(`persistence rejects ${name}`, () => {
  const s = structuredClone(confirmed().s)
  mutate(s); assert.throws(() => codec.deserializeProject(JSON.stringify(s)))
})
test('corrupt and future stored records fail closed with zero writes', () => {
  for (const json of ['{broken', JSON.stringify({ ...fixture().s, schemaVersion: 'project-foundation-99' })]) {
    const memory = new MemoryStorage(); memory.data.set(persistence.ACTIVE_PROJECT_KEY, 'broken'); memory.data.set(persistence.PROJECT_KEY_PREFIX + 'broken', json)
    const storage = new persistence.LocalProjectStorage(() => memory), session = persistence.hydrateProject(storage, idFactory)
    assert.equal(session.blocked, true); persistence.saveProjectSession(session, storage)
    assert.equal(memory.writes, 0); assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + 'broken'), json)
  }
})
test('quota failure retains in-memory work, previous data and all history', () => {
  const { s, a, field } = confirmed(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(s); const raw = memory.getItem(persistence.PROJECT_KEY_PREFIX + s.project.id)
  const changed = editThickness(s, a, 24, field); memory.failWrite = true
  const session = persistence.saveProjectSession({ snapshot: changed, hydrated: true, blocked: false, status: 'unsaved', error: null }, storage)
  assert.equal(session.status, 'failed'); assert.equal(session.snapshot, changed)
  assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + s.project.id), raw)
  assert.deepEqual(changed.revisions, s.revisions); assert.deepEqual(changed.assurance.confirmationsById, s.assurance.confirmationsById)
})
test('existing persisted history cannot be silently overwritten or deleted', () => {
  const { s } = confirmed(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(s)
  const next = structuredClone(s); next.assurance.confirmationsById = {}
  assert.throws(() => storage.save(next))
  assert.deepEqual(storage.load(), s)
})
test('source transcription changes stale existing confirmation and reject prepared request', () => {
  const { s, request, confirmation } = confirmed()
  const fact = load('src/data/profileSystems/glazingEvidence').PRELUDE60_GLAZING_BEAD_EVIDENCE.find((f) => f.beadCode === '482.22')
  const oldNote = fact.evidence.note
  try {
    fact.evidence.note = 'Changed catalog transcription record'
    assert.equal(selectors.confirmationFreshness(s, confirmation).state, 'stale')
    assert.throws(() => assurance.confirmStatement(s, request, actor, now, 'selection-attestation'))
    const restored = codec.deserializeProject(codec.serializeProject(s))
    assert.equal(selectors.confirmationFreshness(restored, confirmation).state, 'stale')
  } finally { fact.evidence.note = oldNote }
})
test('reviewed rule changes stale evidence without rewriting archived rule semantics', () => {
  const { s } = fixture(), recorded = record(s)
  const e = Object.values(recorded.assurance.evidenceById).find((item) => item.statement.predicate === 'reviewed-front-elevation-overlap')
  const rule = load('src/data/profileSystems/jointSemantics').profileJointEvidenceRules.find((r) => r.supportProfileCode === e.statement.parameters.supportProfileCode)
  const old = rule.noteBg
  try {
    rule.noteBg = 'Changed reviewed rule version content'
    assert.equal(selectors.assessStatement(recorded, e.id).freshness.state, 'stale')
    assert.deepEqual(selectors.assessStatement(recorded, e.id).effectiveAllowedUsage, [])
    assert.equal(codec.deserializeProject(codec.serializeProject(recorded)).assurance.evidenceById[e.id].statement.value.value, 22)
  } finally { rule.noteBg = old }
})
test('invalid source fingerprint cannot be presented or confirmed', () => {
  const { s, a, request } = confirmed(), altered = structuredClone(s)
  altered.assurance.sourcesById[request.sources[0].id].locator.printedPage = '999'
  assert.throws(() => assurance.prepareConfirmation(altered, evidence(altered, a).id))
  assert.throws(() => codec.serializeProject(altered))
})
test('legacy operational policies remain limited reviewed evidence without new human confirmations', () => {
  const { s } = fixture()
  const policies = Object.values(s.assurance.evidenceById).filter((e) => e.statement.predicate === 'reviewed-operational-policy')
  assert.ok(policies.some((e) => e.statement.parameters.category === 'hardware-system-policy'))
  assert.ok(policies.some((e) => e.statement.parameters.category === 'finish-choice'))
  assert.equal(Object.keys(s.assurance.confirmationsById).length, 0)
  assert.ok(policies.every((e) => e.allowedUsage.every((usage) => ['schematic', 'technical-review'].includes(usage))))
})
test('recorded revision fingerprint ignores property insertion order throughout graph', () => {
  const { s } = fixture(), reordered = structuredClone(s)
  reordered.modulesById = Object.fromEntries(Object.entries(reordered.modulesById).reverse())
  reordered.assurance.currentEvidenceByStatementKey = Object.fromEntries(Object.entries(reordered.assurance.currentEvidenceByStatementKey).reverse())
  assert.equal(canonical.fingerprint(revisions.revisionContent(s)), canonical.fingerprint(revisions.revisionContent(reordered)))
})
test('PF01 hydration migration writes nothing until explicit save, using the same storage keys', () => {
  const { s } = fixture(), { assurance: _a, revisions: _r, ...legacy } = s
  legacy.schemaVersion = 'project-foundation-01'
  const memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  memory.data.set(persistence.ACTIVE_PROJECT_KEY, s.project.id)
  memory.data.set(persistence.PROJECT_KEY_PREFIX + s.project.id, JSON.stringify(legacy))
  const session = persistence.hydrateProject(storage)
  assert.equal(session.snapshot.schemaVersion, 'project-foundation-02'); assert.equal(memory.writes, 0)
  assert.equal(persistence.saveProjectSession(session, storage).status, 'saved')
  assert.equal(memory.data.size, 2)
  assert.equal(JSON.parse(memory.getItem(persistence.PROJECT_KEY_PREFIX + s.project.id)).schemaVersion, 'project-foundation-02')
})
test('stale writer cannot decrease persisted generation or lose independent edits', () => {
  const { s, a, field } = fixture(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(s)
  const changed = editThickness(s, a, 24, field); storage.save(changed)
  assert.throws(() => storage.save(s)); assert.deepEqual(storage.load(), changed)
})
test('active-pointer write failure restores previous project data', () => {
  const { s, a, field } = fixture(), memory = new MemoryStorage(), storage = new persistence.LocalProjectStorage(() => memory)
  storage.save(s); memory.data.set(persistence.ACTIVE_PROJECT_KEY, 'another-project')
  const raw = memory.getItem(persistence.PROJECT_KEY_PREFIX + s.project.id)
  const original = memory.setItem.bind(memory)
  memory.setItem = (key, value) => { if (key === persistence.ACTIVE_PROJECT_KEY) throw Error('pointer denied'); original(key, value) }
  assert.throws(() => storage.save(editThickness(s, a, 24, field)))
  assert.equal(memory.getItem(persistence.PROJECT_KEY_PREFIX + s.project.id), raw)
  assert.equal(memory.getItem(persistence.ACTIVE_PROJECT_KEY), 'another-project')
})
test('deleting a module preserves historical context and invalidates its confirmation', () => {
  const { s, a, confirmation } = confirmed()
  const changed = ops.editProject(s, (draft) => ops.replaceFreeModules(draft, model.getFreeModules(draft).filter((m) => m.id !== a)))
  const loaded = codec.deserializeProject(codec.serializeProject(changed))
  assert.equal(selectors.confirmationFreshness(loaded, confirmation).state, 'stale')
  assert.ok(revisions.getModuleRevisionView(loaded.revisions.revisionsById[confirmation.projectRevisionId], a))
})
test('ordinary draft edits prune superseded unpinned evidence while retaining pinned history', () => {
  const unrecorded = fixture()
  let draft = unrecorded.s
  const initialEvidenceCount = Object.keys(draft.assurance.evidenceById).length
  const initialSourceCount = Object.keys(draft.assurance.sourcesById).length
  for (let i = 1; i <= 120; i++) draft = ops.editProject(draft, (next) => {
    const saved = next.constructionDraftsByModuleId[unrecorded.a]
    saved.frame.widthMm = 1800 + i
    saved.topology.frame.widthMm = 1800 + i
  })
  assert.equal(Object.keys(draft.assurance.evidenceById).length, initialEvidenceCount)
  assert.equal(Object.keys(draft.assurance.sourcesById).length, initialSourceCount)

  const state = confirmed()
  let withHistory = state.s
  const pinnedEvidenceIds = new Set([
    ...Object.values(withHistory.revisions.revisionsById[state.confirmation.projectRevisionId].content.evidenceByStatementKey),
    state.confirmation.statementEvidenceId,
    ...state.confirmation.supportingEvidenceIds,
  ])
  const pinnedBefore = Object.fromEntries([...pinnedEvidenceIds].map((id) => [id, canonical.canonicalize(withHistory.assurance.evidenceById[id])]))
  const boundedBaseline = Object.keys(withHistory.assurance.evidenceById).length
  for (let i = 1; i <= 120; i++) withHistory = ops.editProject(withHistory, (next) => {
    const saved = next.constructionDraftsByModuleId[state.a]
    saved.frame.widthMm = 1800 + i
    saved.topology.frame.widthMm = 1800 + i
  })
  assert.ok(Object.keys(withHistory.assurance.evidenceById).length <= boundedBaseline + initialEvidenceCount)
  for (const [id, value] of Object.entries(pinnedBefore)) assert.equal(canonical.canonicalize(withHistory.assurance.evidenceById[id]), value)
  const loaded = codec.deserializeProject(codec.serializeProject(withHistory))
  assert.equal(selectors.confirmationFreshness(loaded, state.confirmation).state, 'stale')
})
console.log(`PROJECT FOUNDATION 02 RUNTIME PASS: ${passed} cases`)
