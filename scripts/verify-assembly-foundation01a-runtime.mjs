import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRuntimeLoader } from './runtime-loader.mjs'

const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const revisions = load('src/domain/project/revisionOperations')
const codec = load('src/domain/project/projectSerialization')
const topology = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const canonical = load('src/domain/assurance/canonical')
const assurance = load('src/domain/assurance/assuranceOperations')
const { deriveResolvedAssembly: derive, derivedId } = load('src/domain/assembly/resolveAssembly')
const { assessReadiness: assess } = load('src/domain/assembly/assemblyReadiness')
const { BASELINE_RULES, SYNTHETIC_CLOSABLE } = load('src/domain/assembly/assemblyRules')
const { selectAssemblyReview } = load('src/domain/assembly/assemblySelectors')
const system = load('src/data/profileSystems').getProfileSystemById('kmg-prelude-60')
const semantics = load('src/data/profileSystems/dimensionalSemantics').profileDimensionalSemantics
const actor = { id: 'af01a-test-operator', label: 'Test operator', identityBasis: 'local-self-asserted' }
let passed = 0
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
function fixture(operable = false) {
  let seq = 0
  const id = () => `af01a-fixture-${++seq}`
  let s = model.createProjectSnapshot(id)
  s = ops.editProject(s, (next) => ops.writeOfferForm(next, { ...model.getOfferForm(next), profileSystemId: system.id,
    colorId: 'white', foilModeId: '', glazingId: 'b-b-24', hardwareStandardId: 'standard-european' }))
  s = ops.completeOfferSetup(s, id)
  const a = model.getOfferModules(s)[0].id
  let t = topology.createConstructionModel({ xMm: 0, yMm: 0, widthMm: 1000, heightMm: 1200 })
  t = topology.setConstructionFieldType(t, 'field-1', operable ? 'operable' : 'fixed')
  if (operable) {
    t = topology.setConstructionFieldOpeningMode(t, 'field-1', 'side-hinged')
    t = topology.setConstructionFieldOpeningHanding(t, 'field-1', 'right')
  }
  const field = topology.resolveConstructionTopology(t).fields[0]
  let r = profiles.setFrameProfileAssignment(null, system, '482.30')
  if (operable) r = profiles.setFieldSashProfileAssignment(r, system, 'window', field, '482.05')
  r = profiles.setFieldHumanGlazingThicknessAssignment(r, system, field, 24)
  r = profiles.setFieldGlazingBeadAssignment(r, system, field, 24, '482.15')
  r = profiles.setReinforcementAssignment(r, system, { kind: 'frame', id: 'frame' }, '482.30', 'TRE 01', 1.2)
  s = ops.editProject(s, (next) => {
    next.modulesById[a].definition.draft.productType = 'window'
    next.modulesById[a].definition.draft.productTypeSource = 'manual'
    next.constructionDraftsByModuleId[a] = { version: 'constructor-01d', frame: structuredClone(t.frame), topology: t }
    next.profileResolutionsByModuleId[a] = r
  })
  codec.validateProjectSnapshot(s)
  return { s, a, field, id }
}
const gate = (a, s, options) => assess(a, s, options)[0]
const edit = (f, fn) => ops.editProject(f.s, (next) => fn(next.profileResolutionsByModuleId[f.a], next))
const record = (f) => revisions.recordProjectRevision(f.s, actor, '2026-09-12T12:00:00.000Z', f.id)
function syntheticBundle(assembly) {
  return { id: 'TEST-ONLY-NOT-A-PRELUDE-REFERENCE', version: '1', purpose: 'synthetic-mechanics-only',
    rules: assembly.requirements.filter((r) => SYNTHETIC_CLOSABLE.includes(r.kind)).map((r, i) => ({
      id: `SYNTHETIC-NONPRODUCTION-${i}`, version: '1', configuration: assembly.support.configuration,
      kind: r.kind, requirementId: r.id, decision: 'satisfied',
      evidence: { id: `SYNTHETIC-NONREFERENCE-EVIDENCE-${i}`, digest: canonical.fingerprint(['TEST', i]), classification: 'synthetic-test-only' },
    })) }
}

test('real FIX: partial/BLOCKED; four positions, one infill, no physical members proved', () => {
  const f = fixture(), a = derive(f.s, f.a)
  assert.equal(a.support.status, 'supported'); assert.equal(a.coverageStatus, 'partial')
  assert.equal(a.members.length, 4); assert.equal(a.infills.length, 1)
  assert.equal(a.connections.filter((c) => c.kind === 'frame-corner').length, 4)
  assert.ok(a.members.every((m) => m.physicalRealization.status === 'unresolved'))
  assert.equal(gate(a, f.s).status, 'BLOCKED')
  assert.equal(a.requirements.find((r) => r.kind === 'hardware-kit').satisfaction.status, 'not-applicable')
})
test('real OPERABLE: exact configuration; eight positions; no unproved overlap requirement', () => {
  const f = fixture(true), a = derive(f.s, f.a)
  assert.equal(a.support.configuration, 'PRELUDE60_OPERABLE_RECT_01')
  assert.equal(a.coverageStatus, 'partial'); assert.equal(a.members.length, 8)
  assert.equal(a.connections.filter((c) => c.kind === 'sash-to-frame').length, 4)
  assert.equal(
    a.requirements.find((r) => r.kind === 'reviewed-overlap'),
    undefined,
    'current 04C pairing must not manufacture reviewed overlap without current joint evidence',
  )
  assert.equal(a.requirements.find((r) => r.kind === 'hardware-kit').satisfaction.status, 'unresolved')
  assert.equal(gate(a, f.s).status, 'BLOCKED')
})
test('deterministic regeneration and JSON object insertion order', () => {
  const f = fixture(true), a = derive(f.s, f.a)
  const reverse = (x) => Array.isArray(x) ? x.map(reverse) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).reverse().map(([k,v]) => [k,reverse(v)])) : x
  assert.equal(a.resultDigest, derive(reverse(f.s), f.a).resultDigest)
  assert.equal(a.resultDigest, derive(f.s, f.a).resultDigest)
  const { resultDigest, ...data } = a; assert.equal(resultDigest, canonical.fingerprint(data))
})
test('derived IDs are collision-safe tuples and preserve source ownership', () => {
  const f = fixture(), a = derive(f.s, f.a)
  assert.notEqual(derivedId('a:b','c'), derivedId('a','b:c'))
  assert.equal(a.source.projectId, f.s.project.id)
  assert.equal(a.source.offerId, f.s.modulesById[f.a].offerId)
  assert.equal(a.source.moduleId, f.a); assert.equal(a.infills[0].fieldId, 'field-1')
  assert.ok(a.members.every((m) => m.profileSelection.value.sourcePath.join('/') === `profileResolutionsByModuleId/${f.a}/frame`))
})
test('resize changes digest but preserves semantic member identities', () => {
  const f = fixture(), a = derive(f.s, f.a)
  const s = edit(f, (_, next) => {
    const d = next.constructionDraftsByModuleId[f.a]
    d.topology = topology.resizeConstructionFrame(d.topology, { ...d.topology.frame, widthMm: 1100 })
    d.frame = { ...d.topology.frame }
  })
  const b = derive(s, f.a)
  assert.deepEqual(b.members.map((m) => m.id), a.members.map((m) => m.id))
  assert.notEqual(b.resultDigest, a.resultDigest)
})
test('missing assignment is actionable; never auto-selects', () => {
  const f = fixture(), s = edit(f, (r) => { r.frame = null }), a = derive(s, f.a)
  assert.ok(a.blockers.some((b) => b.code === 'ASSIGNMENT_MISSING' && b.nextStepBg))
  assert.equal(s.profileResolutionsByModuleId[f.a].frame, null)
  assert.equal(gate(a, s).status, 'BLOCKED')
})
test('missing physical evidence remains explicit for every real baseline', () => {
  const f = fixture(), a = derive(f.s, f.a)
  for (const kind of ['member-realization','connection-specification','bead-base-compatibility','glazing-seat-specification','seal-specification','reinforcement-applicability','accessory-applicability']) {
    assert.ok(a.requirements.some((r) => r.kind === kind && r.satisfaction.status === 'unresolved'), kind)
  }
  assert.ok(a.blockers.some((b) => b.code === 'EVIDENCE_MISSING'))
})
test('missing selected evidence is not replaced with input-only technical proof', () => {
  const f = fixture(), s = structuredClone(f.s)
  const key = Object.keys(s.assurance.currentEvidenceByStatementKey).find((k) => k.includes('human-selected-bead'))
  delete s.assurance.currentEvidenceByStatementKey[key]
  const a = derive(s, f.a)
  assert.equal(gate(a,s).status, 'BLOCKED')
  assert.ok(a.blockers.some((b) => ['SOURCE_INVALID','EVIDENCE_STALE'].includes(b.code)))
})
test('incompatible bead thickness fails closed', () => {
  const f = fixture(), s = edit(f, (r) => { r.fieldGlazingBeads['field-1'] = { profileCode: '482.22', source: 'human' } }), a = derive(s, f.a)
  assert.equal(a.coverageStatus, 'invalid')
  assert.ok(a.blockers.some((b) => b.code === 'SELECTION_INCOMPATIBLE'))
})
test('incompatible reinforcement is distinct from unknown adequacy', () => {
  const f = fixture(), s = edit(f, (r) => { r.reinforcements['frame:frame'] = { reinforcementCode: 'TRE 03', thicknessMm: 2, appliesToProfileCode: '482.30', source: 'human' } })
  const a = derive(s,f.a)
  assert.ok(a.blockers.some((b) => b.code === 'SELECTION_INCOMPATIBLE'))
  assert.equal(a.requirements.find((r) => r.kind === 'reinforcement-adequacy').satisfaction.status, 'unresolved')
})
test('catalog reinforcement candidate, selection, requirement and adequacy remain distinct', () => {
  const f = fixture(), a = derive(f.s,f.a)
  assert.equal(a.requirements.find((r) => r.kind === 'reinforcement-candidate').satisfaction.status,'resolved')
  assert.equal(a.requirements.find((r) => r.kind === 'reinforcement-selection').satisfaction.status,'resolved')
  assert.equal(a.requirements.find((r) => r.kind === 'reinforcement-applicability').applicability.status,'unresolved')
  assert.equal(a.requirements.find((r) => r.kind === 'reinforcement-adequacy').satisfaction.status,'unresolved')
})
test('unsupported split retains divider identity and does not flatten infills', () => {
  const f = fixture(), s = edit(f, (_, next) => {
    const d = next.constructionDraftsByModuleId[f.a]
    d.topology = topology.splitField(d.topology, 'field-1', 'vertical', 400)
    const t = topology.resolveConstructionTopology(d.topology)
    next.profileResolutionsByModuleId[f.a] = profiles.reconcileModuleProfileResolution(next.profileResolutionsByModuleId[f.a],system,'window',t.dividers.map((d) => d.id),t.fields)
  })
  const a = derive(s,f.a)
  assert.equal(a.support.status,'unsupported', JSON.stringify(a.blockers)); assert.equal(a.infills.length,0)
  assert.equal(a.members.find((m) => m.origin.kind === 'divider').origin.dividerId, topology.resolveConstructionTopology(s.constructionDraftsByModuleId[f.a].topology).dividers[0].id)
})
test('unsupported angled topology remains blocked', () => {
  const f = fixture(), s = edit(f, (_, next) => {
    const d = next.constructionDraftsByModuleId[f.a]
    d.topology = topology.splitFieldAngled(d.topology, 'field-1', 300)
    const t = topology.resolveConstructionTopology(d.topology)
    next.profileResolutionsByModuleId[f.a] = profiles.reconcileModuleProfileResolution(next.profileResolutionsByModuleId[f.a],system,'window',t.angledDividers.map((d) => d.id),t.fields)
  })
  const a = derive(s,f.a)
  assert.equal(a.support.status,'unsupported'); assert.equal(gate(a,s).status,'BLOCKED')
})
test('valid catalog selection outside narrow scope is unsupported, not fabricated incompatibility', () => {
  const f = fixture(), s = edit(f, (r) => { r.frame = { profileCode: '482.20', source:'human' } }), a = derive(s,f.a)
  assert.equal(a.support.status,'unsupported')
  assert.ok(a.members.every((m) => m.profileSelection.status === 'resolved'))
})
test('other opening configurations cannot become supported', () => {
  const f = fixture(true), s = edit(f, (_, next) => {
    const d = next.constructionDraftsByModuleId[f.a]
    d.topology = topology.setConstructionFieldOpeningMode(d.topology,'field-1','tilt-turn')
  })
  assert.equal(derive(s,f.a).support.status,'unsupported')
})
test('exact recorded revision is reproducible and ownership-bound', () => {
  const f = fixture(), s = record(f), revisionId = s.revisions.headRevisionId
  const a = derive(s,f.a,{revisionId})
  assert.equal(a.source.revisionId,revisionId)
  assert.equal(a.source.contentDigest,s.revisions.revisionsById[revisionId].contentDigest)
  assert.equal(gate(a,s,{revisionId}).freshness,'current')
})
test('stale current input blocked; historical interpretation remains separately addressable', () => {
  const f = fixture(), s = record(f), revisionId = s.revisions.headRevisionId
  const a = derive(s,f.a,{revisionId})
  const changed = ops.editProject(s, (next) => { next.project.site.objectName = 'Changed object' })
  assert.ok(gate(a,changed).blockers.some((b) => b.code === 'INPUT_STALE'))
  assert.equal(gate(a,changed,{revisionId}).freshness,'current')
})
test('changed catalog dependency stales an existing result', () => {
  const f = fixture(), a = derive(f.s,f.a), original = system.gaskets[0].labelBg
  try {
    system.gaskets[0].labelBg += ' changed'
    assert.ok(gate(a,f.s).blockers.some((b) => b.code === 'EVIDENCE_STALE'))
  } finally { system.gaskets[0].labelBg = original }
})
test('historical reviewed rule unavailable is explicit; no latest substitution authority', () => {
  const f = fixture(), s = record(f), revisionId = s.revisions.headRevisionId
  const entry = semantics.find((e) => e.profileCode === '482.30'), original = entry.visibleFace.valueMm
  try {
    entry.visibleFace.valueMm = 43
    const a = derive(s,f.a,{revisionId})
    assert.ok(a.blockers.some((b) => b.code === 'HISTORICAL_RULE_UNAVAILABLE'))
    assert.equal(gate(a,s,{revisionId}).freshness,'unverifiable')
    assert.ok(!a.requirements.some((r) => r.kind === 'reviewed-visible-face' && r.satisfaction.status === 'resolved'))
  } finally { entry.visibleFace.valueMm = original }
})
test('current evidence mismatch reports stale freshness even on a freshly derived result', () => {
  const f = fixture(), entry = semantics.find((e) => e.profileCode === '482.30'), original = entry.visibleFace.valueMm
  try {
    entry.visibleFace.valueMm = 43
    const a = derive(f.s,f.a)
    assert.ok(a.blockers.some((b) => b.code === 'EVIDENCE_STALE'))
    assert.equal(gate(a,f.s).freshness,'stale')
  } finally { entry.visibleFace.valueMm = original }
})
test('missing requested revision and foreign module fail closed', () => {
  const f = fixture()
  assert.equal(derive(f.s,f.a,{revisionId:'not-present'}).coverageStatus,'invalid')
  assert.equal(derive(f.s,'foreign-module').coverageStatus,'invalid')
})
test('SYNTHETIC resolver-only READY fixture is NOT production and NOT a technical reference', () => {
  const f = fixture(), real = derive(f.s,f.a), ruleBundle = syntheticBundle(real)
  const a = derive(f.s,f.a,{ruleBundle}), g = gate(a,f.s,{ruleBundle})
  assert.equal(a.authority,'synthetic-mechanics-only')
  assert.equal(a.coverageStatus,'complete'); assert.equal(g.status,'READY')
  assert.equal(g.authority,'synthetic-mechanics-only')
  assert.ok(a.requirements.some((r) => r.satisfaction.proof?.authority === 'synthetic-test'))
  assert.equal(gate(a,f.s).status,'BLOCKED')
  assert.equal(gate(real,f.s).status,'BLOCKED')
})
test('synthetic evidence cannot be labelled baseline technical authority', () => {
  const f = fixture(), ruleBundle = { ...syntheticBundle(derive(f.s,f.a)), purpose:'baseline' }
  assert.equal(derive(f.s,f.a,{ruleBundle}).coverageStatus,'invalid')
})
test('synthetic closure cannot bypass missing inputs or incompatible selections', () => {
  const f = fixture(), ruleBundle = syntheticBundle(derive(f.s,f.a))
  const s = edit(f,(r) => { delete r.fieldGlazingBeads['field-1'] })
  const a = derive(s,f.a,{ruleBundle})
  assert.equal(gate(a,s,{ruleBundle}).status,'BLOCKED')
})
test('changed rule bundle makes old result stale', () => {
  const f = fixture(), ruleBundle = syntheticBundle(derive(f.s,f.a)), a = derive(f.s,f.a,{ruleBundle})
  const changed = structuredClone(ruleBundle); changed.rules[0].version = '2'
  assert.ok(gate(a,f.s,{ruleBundle:changed}).blockers.some((b) => b.code === 'RULE_STALE'))
})
test('conflicting or duplicate applicable rules block rather than selecting one', () => {
  const f = fixture(), ruleBundle = syntheticBundle(derive(f.s,f.a))
  ruleBundle.rules.push({ ...ruleBundle.rules[0], id:'conflict', decision:'denied' })
  const a = derive(f.s,f.a,{ruleBundle})
  assert.ok(a.blockers.some((b) => b.code === 'RULE_CONFLICT'))
  assert.equal(gate(a,f.s,{ruleBundle}).status,'BLOCKED')
})
test('rule ordering does not change deterministic output', () => {
  const f = fixture(), bundle = syntheticBundle(derive(f.s,f.a))
  assert.equal(derive(f.s,f.a,{ruleBundle:bundle}).resultDigest,derive(f.s,f.a,{ruleBundle:{...bundle,rules:[...bundle.rules].reverse()}}).resultDigest)
})
test('all future gates fail closed even for synthetic READY', () => {
  const f = fixture(), ruleBundle = syntheticBundle(derive(f.s,f.a)), a = derive(f.s,f.a,{ruleBundle})
  for (const g of assess(a,f.s,{ruleBundle}).slice(1)) {
    assert.equal(g.status,'BLOCKED'); assert.ok(g.blockers.some((b) => b.code === 'STAGE_NOT_IMPLEMENTED'))
  }
})
test('tampered result, including recomputed digest, cannot acquire readiness', () => {
  const f = fixture(), a = structuredClone(derive(f.s,f.a))
  a.coverageStatus = 'complete'; a.blockers = []
  assert.ok(gate(a,f.s).blockers.some((b) => b.code === 'RESULT_INVALID'))
  const { resultDigest: _digest, ...content } = a; a.resultDigest = canonical.fingerprint(content)
  assert.ok(gate(a,f.s).blockers.some((b) => b.code === 'RESULT_INVALID'))
})
test('zero mutation, no persisted assembly, repeat selectors stable', () => {
  const f = fixture(), before = codec.serializeProject(f.s)
  canonical.freezeDeep(f.s)
  const a = derive(f.s,f.a); assess(a,f.s)
  assert.deepEqual(selectAssemblyReview(a),selectAssemblyReview(a))
  assert.equal(codec.serializeProject(f.s),before)
  assert.ok(Object.isFrozen(a)); assert.ok(Object.isFrozen(a.members))
  assert.equal(codec.serializeProject(codec.deserializeProject(before)),before)
  assert.ok(!before.includes('af01a-assembly'))
})
test('PF01 migration preserves identities and does not invent assembly/history', () => {
  const f = fixture(), { revisions: _r, assurance: _a, ...legacy } = f.s
  const migrated = codec.deserializeProject(JSON.stringify({...legacy,schemaVersion:'project-foundation-01'}))
  assert.equal(migrated.project.id,f.s.project.id)
  assert.equal(migrated.revisions.headRevisionId,null)
  assert.equal(derive(migrated,f.a).coverageStatus,'partial')
})
test('PF02 confirmation does not close physical evidence or mutate history', () => {
  const f = fixture(), s = record(f)
  const evidence = Object.values(s.assurance.evidenceById).find((e) => e.statement.predicate === 'human-selected-bead')
  const request = assurance.prepareConfirmation(s,evidence.id)
  const confirmed = assurance.confirmStatement(s,request,actor,'2026-09-12T12:01:00.000Z','selection-attestation',f.id)
  const history = canonical.canonicalize(confirmed.revisions)
  assert.equal(gate(derive(confirmed,f.a),confirmed).status,'BLOCKED')
  assert.equal(canonical.canonicalize(confirmed.revisions),history)
})
test('01B candidates/selection/inset/cut restrictions unchanged', () => {
  const f = fixture(), r = f.s.profileResolutionsByModuleId[f.a]
  const before = structuredClone(r)
  derive(f.s,f.a)
  const glazing = load('src/domain/glazingContext').resolveHumanGlazingContext(system,24,'482.15')
  assert.equal(glazing.automaticBeadSelectionAllowed,false)
  assert.equal(glazing.baseProfileCompatibility,'UNCONFIRMED')
  assert.equal(glazing.exactGlazingInsetKnown,false); assert.equal(glazing.glassCutKnown,false)
  assert.deepEqual(r,before)
})
test('navigation does not change result or create revisions', () => {
  const f = fixture(), a = derive(f.s,f.a), s = structuredClone(f.s)
  s.workspace.screen = 'offer-constructor'
  assert.equal(derive(s,f.a).resultDigest,a.resultDigest)
  assert.equal(s.revisions.headRevisionId,null)
})
test('module copy identity cannot share derived IDs', () => {
  const f = fixture(), b = 'new-module-id'
  const s = ops.editProject(f.s, (next) => {
    next.modulesById[b] = { ...structuredClone(next.modulesById[f.a]), id:b, sequence:2 }
    next.constructionDraftsByModuleId[b] = structuredClone(next.constructionDraftsByModuleId[f.a])
    next.profileResolutionsByModuleId[b] = structuredClone(next.profileResolutionsByModuleId[f.a])
  })
  const a = derive(s,f.a), copy = derive(s,b)
  assert.notEqual(a.members[0].id,copy.members[0].id)
})
test('baseline rule bundle has no fabricated technical rules', () => assert.deepEqual(BASELINE_RULES.rules,[]))
test('review launcher renders; application wiring has no mutation callbacks', () => {
  const f = fixture(), Panel = load('src/components/AssemblyReviewPanel').AssemblyReviewPanel
  const html = renderToStaticMarkup(React.createElement(Panel,{snapshot:f.s,moduleId:f.a}))
  assert.match(html,/Преглед на сглобките/); assert.match(html,/aria-haspopup="dialog"/)
  const src = readFileSync('src/components/AssemblyReviewPanel.tsx','utf8')
  assert.doesNotMatch(src,/ruleBundle|confirmStatement|saveProject|localStorage|editProject/)
  assert.match(readFileSync('src/App.tsx','utf8'),/<AssemblyReviewPanel snapshot=\{workspace.snapshot\}/)
})
test('open review renders current supported coverage and exact fail-closed unsupported coverage without touching the project', () => {
  const f = fixture(true), before = codec.serializeProject(f.s)
  const uiLoad = createRuntimeLoader({ react: { ...React, useState: (initial) => [initial === false ? true : initial, () => {}] }, 'react-dom': { createPortal: (child) => child } })
  const previousDocument = globalThis.document
  try {
    globalThis.document = { body: {} }
    const Panel = uiLoad('src/components/AssemblyReviewPanel').AssemblyReviewPanel

    const html = renderToStaticMarkup(React.createElement(Panel,{ snapshot:f.s,moduleId:f.a }))
    assert.match(html,/СИСТЕМЕН ПРЕГЛЕД/)
    assert.match(html,/Покрити са всички очаквани страни/)
    assert.match(html,/не производствено потвърждение/)
    assert.match(html,/aria-labelledby="assembly-review-title"/)
    assert.equal(codec.serializeProject(f.s),before)

    const unsupported = edit(f,(r) => { r.frame = { profileCode:'482.20',source:'human' } })
    const unsupportedAssembly = derive(unsupported, f.a)
    assert.equal(unsupportedAssembly.support.status, 'unsupported')
    assert.equal(gate(unsupportedAssembly, unsupported).status, 'BLOCKED')

    const unsupportedHtml = renderToStaticMarkup(React.createElement(Panel,{snapshot:unsupported,moduleId:f.a}))
    assert.match(unsupportedHtml,/482\.20/)
    assert.match(unsupportedHtml,/0\/4 граници имат системен технически преглед/)
    assert.match(unsupportedHtml,/НЯМА ТЕХНИЧЕСКО СЕЧЕНИЕ/)
    assert.match(unsupportedHtml,/4 граници са блокирани/)
    assert.match(unsupportedHtml,/не създава заместителна геометрия/)
    assert.doesNotMatch(unsupportedHtml,/Покрити са всички очаквани страни/)
    assert.doesNotMatch(unsupportedHtml,/4\/4 граници имат системен технически преглед/)

    assert.match(renderToStaticMarkup(React.createElement(Panel,{snapshot:f.s,moduleId:null})),/Избери модул/)
  } finally {
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  }
})
console.log(`AF01A runtime: ${passed} passed. Synthetic fixtures are NON-PRODUCTION / NON-REFERENCE.`)
