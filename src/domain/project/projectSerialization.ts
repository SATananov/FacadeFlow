import { type ProjectSnapshot, type PF01Snapshot } from './projectModel'
import { validateAssuranceSnapshot } from '../assurance/assuranceValidation'
import { migratePF01Snapshot } from './projectMigration'
import { freezeHistory } from './revisionOperations'

type Obj = Record<string, unknown>
function requireThat(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Invalid project snapshot: ${message}`)
}
function object(value: unknown): Obj {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'expected object')
  const result = value as Obj
  requireThat(!Object.keys(result).some((key) => ['__proto__', 'constructor', 'prototype'].includes(key)), 'unsafe key')
  return result
}
function keys(value: unknown, required: string[], optional: string[] = []): Obj {
  const result = object(value)
  requireThat(required.every((key) => Object.hasOwn(result, key)), `missing ${required.join('/')}`)
  requireThat(Object.keys(result).every((key) => required.includes(key) || optional.includes(key)), 'unexpected property')
  return result
}
function string(value: unknown): asserts value is string { requireThat(typeof value === 'string', 'expected string') }
function id(value: unknown): asserts value is string {
  string(value)
  requireThat(value.length > 0 && !['__proto__', 'constructor', 'prototype'].includes(value), 'invalid identity')
}
function number(value: unknown, minimum = 0): asserts value is number {
  requireThat(typeof value === 'number' && Number.isFinite(value) && value >= minimum, 'invalid number')
}
function sequence(value: unknown) { number(value, 1); requireThat(Number.isSafeInteger(value), 'invalid sequence') }
function choice(value: unknown, values: unknown[]) { requireThat(values.includes(value), `invalid enum ${String(value)}`) }
function strings(value: unknown, names: string[]) { const item = keys(value, names); names.forEach((name) => string(item[name])); return item }
function nullableNumber(value: unknown) { if (value !== null) number(value) }
const settingKeys = ['profileSystemId', 'colorId', 'foilModeId', 'glazingId', 'hardwareStandardId', 'hardwareManufacturerId']
function settings(value: unknown, inherited = false) {
  const names = inherited ? ['inheritanceMode', ...settingKeys] : settingKeys
  const item = strings(value, names)
  choice(item.hardwareManufacturerId, ['unspecified'])
  if (inherited) choice(item.inheritanceMode, ['inherit-offer-defaults'])
}
function fieldSemantics(item: Obj) {
  choice(item.fieldType, [null, 'fixed', 'operable'])
  choice(item.openingMode, [null, 'side-hinged', 'tilt', 'tilt-turn'])
  choice(item.openingHanding, [null, 'left', 'right'])
}
function frame(value: unknown) {
  const item = keys(value, ['xMm', 'yMm', 'widthMm', 'heightMm'])
  number(item.xMm); number(item.yMm); number(item.widthMm, Number.MIN_VALUE); number(item.heightMm, Number.MIN_VALUE)
}
function construction(value: unknown): { fields: Set<string>; dividers: Set<string> } | null {
  if (value === null) return null
  const draft = keys(value, ['version', 'frame'], ['topology', 'dividers'])
  choice(draft.version, ['constructor-01b', 'constructor-01c', 'constructor-01c.1', 'constructor-01c.2', 'constructor-01c.3',
    'constructor-01c.3.2', 'constructor-01c.3.3', 'constructor-01c.3.4', 'constructor-01c.3.5', 'constructor-01c.3.6', 'constructor-01c.3.7', 'constructor-01d'])
  frame(draft.frame)
  if (draft.dividers !== undefined) {
    requireThat(Array.isArray(draft.dividers), 'legacy dividers')
    draft.dividers.forEach((value) => {
      const item = keys(value, ['id', 'axis', 'positionMm', 'span'])
      id(item.id); choice(item.axis, ['vertical', 'horizontal']); number(item.positionMm); choice(item.span, ['full'])
    })
  }
  if (draft.topology === undefined) return null
  const topology = keys(draft.topology, ['version', 'frame', 'root', 'nextFieldId', 'nextDividerId'], ['frameFaceMm'])
  choice(topology.version, Array.from({ length: 7 }, (_, i) => `field-topology-0${i + 1}`))
  frame(topology.frame)
  requireThat(['xMm', 'yMm', 'widthMm', 'heightMm'].every((key) => object(draft.frame)[key] === object(topology.frame)[key]), 'frame mismatch')
  sequence(topology.nextFieldId); sequence(topology.nextDividerId)
  if (topology.frameFaceMm !== undefined) number(topology.frameFaceMm)
  const fields = new Set<string>(), dividers = new Set<string>(), lineage = new Set<string>()
  let count = 0
  function node(value: unknown, depth: number) {
    requireThat(depth < 128 && ++count <= 10000, 'topology exceeds supported traversal limit')
    const item = object(value)
    choice(item.kind, ['field', 'split', 'angled-split'])
    keys(item, item.kind === 'field' ? ['kind', 'field'] : ['kind', 'field', 'divider', 'first', 'second'])
    const field = keys(item.field, ['id', 'fieldType', 'openingMode', 'openingHanding'])
    id(field.id); fieldSemantics(field)
    requireThat(!lineage.has(field.id), 'duplicate FIELD identity'); lineage.add(field.id)
    if (item.kind === 'field') { fields.add(field.id); return }
    const divider = keys(item.divider, item.kind === 'split'
      ? ['id', 'axis', 'offsetMm', 'thicknessMm'] : ['id', 'axis', 'topOffsetMm', 'bottomOffsetMm', 'thicknessMm'])
    id(divider.id); requireThat(!dividers.has(divider.id), 'duplicate divider identity'); dividers.add(divider.id)
    number(divider.thicknessMm)
    if (item.kind === 'split') { choice(divider.axis, ['vertical', 'horizontal']); number(divider.offsetMm) }
    else { choice(divider.axis, ['angled']); number(divider.topOffsetMm); number(divider.bottomOffsetMm) }
    node(item.first, depth + 1); node(item.second, depth + 1)
  }
  node(topology.root, 0)
  return { fields, dividers }
}
function definition(value: unknown) {
  const item = object(value)
  choice(item.kind, ['free', 'offer'])
  if (item.kind === 'free') {
    keys(item, ['kind', 'profileSystemId', 'productType']); string(item.profileSystemId); choice(item.productType, [null, 'window', 'door']); return
  }
  keys(item, ['kind', 'draft'])
  const draft = keys(item.draft, ['inheritedDefaults', 'productType', 'customProductTypeLabel', 'productTypeSource',
    'widthMm', 'widthSource', 'heightMm', 'heightSource', 'fieldCount', 'fieldCountSource', 'fields'])
  settings(draft.inheritedDefaults, true); choice(draft.productType, [null, 'window', 'door']); string(draft.customProductTypeLabel)
  const sources = ['unset', 'preset', 'manual', 'constructor']
  for (const name of ['productTypeSource', 'widthSource', 'heightSource', 'fieldCountSource']) choice(draft[name], sources)
  for (const name of ['widthMm', 'heightMm', 'fieldCount']) nullableNumber(draft[name])
  requireThat(Array.isArray(draft.fields), 'module fields')
  const ids = new Set<string>()
  draft.fields.forEach((value) => {
    const field = keys(value, ['id', 'sequence', 'constructionFieldId', 'fieldType', 'customFieldTypeLabel', 'fieldTypeSource',
      'widthMm', 'widthSource', 'openingMode', 'customOpeningModeLabel', 'openingModeSource', 'openingHanding', 'customOpeningHandingLabel', 'openingHandingSource'])
    id(field.id); requireThat(!ids.has(field.id), 'duplicate definition FIELD'); ids.add(field.id)
    sequence(field.sequence); if (field.constructionFieldId !== null) id(field.constructionFieldId)
    fieldSemantics(field); nullableNumber(field.widthMm)
    for (const key of ['customFieldTypeLabel', 'customOpeningModeLabel', 'customOpeningHandingLabel']) string(field[key])
    for (const key of ['fieldTypeSource', 'widthSource', 'openingModeSource', 'openingHandingSource']) choice(field[key], sources)
  })
}
function profileResolution(value: unknown, topology: ReturnType<typeof construction>, systemId: unknown) {
  if (value === null) return
  const item = keys(value, ['version', 'componentResolutionVersion', 'profileSystemId', 'frame', 'dividers',
    'fieldSashes', 'fieldGlazingThicknesses', 'fieldGlazingBeads', 'reinforcements'])
  choice(item.version, ['profile-resolution-01a']); choice(item.componentResolutionVersion, ['profile-components-02a2'])
  id(item.profileSystemId); requireThat(item.profileSystemId === systemId, 'profile system ownership mismatch')
  function assignment(value: unknown) { const valueObject = keys(value, ['profileCode', 'source']); id(valueObject.profileCode); choice(valueObject.source, ['human']) }
  if (item.frame !== null) assignment(item.frame)
  for (const name of ['dividers', 'fieldSashes', 'fieldGlazingBeads', 'fieldGlazingThicknesses']) {
    for (const [targetId, value] of Object.entries(object(item[name]))) {
      id(targetId)
      requireThat(topology && (name === 'dividers' ? topology.dividers : topology.fields).has(targetId), 'dangling technical target')
      if (name === 'fieldGlazingThicknesses') {
        const valueObject = keys(value, ['thicknessMm', 'source']); number(valueObject.thicknessMm, Number.MIN_VALUE); choice(valueObject.source, ['human'])
      } else assignment(value)
    }
  }
  for (const [target, value] of Object.entries(object(item.reinforcements))) {
    const assignment = keys(value, ['reinforcementCode', 'thicknessMm', 'appliesToProfileCode', 'source'])
    id(assignment.reinforcementCode); id(assignment.appliesToProfileCode); number(assignment.thicknessMm, Number.MIN_VALUE); choice(assignment.source, ['human'])
    requireThat(target === 'frame:frame' || (target.startsWith('divider:') && topology?.dividers.has(target.slice(8)))
      || (target.startsWith('field-sash:') && topology?.fields.has(target.slice(11))), 'dangling reinforcement target')
  }
}

/** Shape/ownership validation only; no catalogue inference or technical approval. */
export function validatePF01Snapshot(value: unknown): asserts value is PF01Snapshot {
  const root = keys(value, ['schemaVersion', 'project', 'offersById', 'modulesById', 'constructionDraftsByModuleId', 'profileResolutionsByModuleId', 'workspace'])
  requireThat(root.schemaVersion === 'project-foundation-01', 'unsupported schema version')
  const project = keys(root.project, ['id', 'client', 'site']); id(project.id)
  strings(project.client, ['clientName', 'clientEik', 'clientAddress', 'clientPhone', 'clientEmail', 'clientContactPerson'])
  strings(project.site, ['objectName', 'objectAddress'])
  const offers = object(root.offersById), modules = object(root.modulesById)
  const drafts = object(root.constructionDraftsByModuleId), profiles = object(root.profileResolutionsByModuleId)
  const ids = new Set([project.id])
  for (const [key, value] of Object.entries(offers)) {
    const offer = object(value); id(offer.id); requireThat(key === offer.id && !ids.has(key), 'offer identity'); ids.add(key)
    requireThat(offer.projectId === project.id, 'offer project ownership')
    choice(offer.entryMode, ['free', 'offer'])
    if (offer.entryMode === 'free') keys(offer, ['id', 'projectId', 'entryMode'])
    else {
      keys(offer, ['id', 'projectId', 'entryMode', 'settingsDraft', 'commonConditions', 'setupStage', 'pendingCopyModuleId', 'fromFreeSketch'])
      settings(offer.settingsDraft); string(offer.commonConditions); choice(offer.setupStage, ['editing', 'modules']); choice(offer.fromFreeSketch, [true, false])
      if (offer.pendingCopyModuleId !== null) {
        id(offer.pendingCopyModuleId)
        requireThat(offer.setupStage === 'editing' && offer.fromFreeSketch === true && object(modules[offer.pendingCopyModuleId]).offerId === key, 'pending copy ownership')
      }
    }
  }
  for (const [key, value] of Object.entries(modules)) {
    const module = keys(value, ['id', 'offerId', 'sequence', 'definition']); id(module.id); id(module.offerId); sequence(module.sequence)
    requireThat(key === module.id && !ids.has(key), 'module identity'); ids.add(key)
    const owner = object(offers[module.offerId]); definition(module.definition)
    requireThat(object(module.definition).kind === owner.entryMode, 'module kind ownership')
    requireThat(Object.hasOwn(drafts, key) && Object.hasOwn(profiles, key), 'missing module payload')
    const topology = construction(drafts[key])
    const def = object(module.definition)
    const systemId = def.kind === 'free' ? def.profileSystemId : object(object(def.draft).inheritedDefaults).profileSystemId
    profileResolution(profiles[key], topology, systemId)
    if (topology && def.kind === 'offer') {
      const draft = object(def.draft)
      requireThat(draft.widthMm === null && draft.heightMm === null && draft.fieldCount === null && (draft.fields as unknown[]).length === 0,
        'duplicate topology-derived definition')
    }
  }
  requireThat([...Object.keys(drafts), ...Object.keys(profiles)].every((key) => Object.hasOwn(modules, key)), 'orphan module payload')
  const workspace = keys(root.workspace, ['offerId', 'freeOfferId', 'activeModuleIdByOffer', 'screen'])
  id(workspace.offerId); id(workspace.freeOfferId)
  requireThat(object(offers[workspace.offerId]).entryMode === 'offer' && object(offers[workspace.freeOfferId]).entryMode === 'free', 'workspace ownership')
  choice(workspace.screen, ['home', 'offer-setup', 'offer-constructor', 'free-constructor'])
  const active = object(workspace.activeModuleIdByOffer)
  requireThat(Object.keys(offers).every((key) => Object.hasOwn(active, key)), 'missing navigation context')
  for (const [offerId, moduleId] of Object.entries(active)) {
    requireThat(Object.hasOwn(offers, offerId), 'dangling offer selection')
    if (moduleId !== null) { id(moduleId); requireThat(object(modules[moduleId]).offerId === offerId, 'dangling module selection') }
  }
}

export function validateProjectSnapshot(value: unknown): asserts value is ProjectSnapshot {
  const root = keys(value, ['schemaVersion', 'project', 'offersById', 'modulesById', 'constructionDraftsByModuleId', 'profileResolutionsByModuleId', 'workspace', 'revisions', 'assurance'])
  requireThat(root.schemaVersion === 'project-foundation-02', 'unsupported schema version')
  const { revisions: _revisions, assurance: _assurance, ...graph } = root
  validatePF01Snapshot({ ...graph, schemaVersion: 'project-foundation-01' })
  validateAssuranceSnapshot(value as ProjectSnapshot, validatePF01Snapshot)
}

export function serializeProject(snapshot: ProjectSnapshot): string {
  validateProjectSnapshot(snapshot)
  return JSON.stringify(snapshot)
}
export function deserializeProject(json: string): ProjectSnapshot {
  const snapshot: unknown = JSON.parse(json)
  if (object(snapshot).schemaVersion === 'project-foundation-01') {
    validatePF01Snapshot(snapshot)
    const migrated = migratePF01Snapshot(snapshot)
    validateProjectSnapshot(migrated)
    return freezeHistory(migrated)
  }
  validateProjectSnapshot(snapshot)
  return freezeHistory(snapshot)
}
