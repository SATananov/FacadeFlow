import { fingerprint, freezeDeep } from '../assurance/canonical'
import type { ProjectSnapshot } from '../project/projectModel'
import { resolveConstructionTopology } from '../construction'
import { evaluateGlazingBeadCompatibility, evaluateReinforcementCompatibility, getReinforcementCandidatesForProfile } from '../componentCompatibility'
import { buildFieldHardwareRequirements } from '../hardwareResolution'
import { profileDimensionalSemantics } from '../../data/profileSystems/dimensionalSemantics'
import { profileJointEvidenceRules } from '../../data/profileSystems/jointSemantics'
import { prepareAssemblyInput } from './assemblyInput'
import { BASELINE_RULES, GATES, GATE_CONTRACT, RESOLVER, ruleBundleRef, validateRuleBundle, type AssemblyRuleBundle } from './assemblyRules'
import type {
  AssemblyBlocker, AssemblyConnection, AssemblyInfill, AssemblyMember, AssemblyRequirement,
  AssemblyTarget, BlockerCode, Configuration, DependencyRef, GateName, Proof, RequirementKind,
  RequirementValue, Resolution, ResolvedAssembly, SelectionRef, Side, SourceBinding,
} from './assemblyModel'

export type DerivationOptions = { revisionId?: string; ruleBundle?: AssemblyRuleBundle }
export const derivedId = (...parts: string[]): string => `af01a:${fingerprint(parts)}`
const SIDES: readonly Side[] = ['left', 'right', 'top', 'bottom']
const ASSEMBLY: readonly GateName[] = ['ASSEMBLY_RESOLUTION']
const PHYSICAL_NEXT = 'Необходимо е прегледано техническо правило за точните профили и този възел. Етап AF01B; потвърждение на избор не е достатъчно.'

export function deriveResolvedAssembly(snapshot: ProjectSnapshot, moduleId: string, options: DerivationOptions = {}): ResolvedAssembly {
  const bundle = options.ruleBundle ?? BASELINE_RULES
  const requirements: AssemblyRequirement[] = [], blockers: AssemblyBlocker[] = []
  const members: AssemblyMember[] = [], connections: AssemblyConnection[] = [], infills: AssemblyInfill[] = []
  let dependencies: DependencyRef[] = []
  let source: SourceBinding = { kind: 'draft', baseRevisionId: null, projectId: snapshot?.project?.id ?? '', offerId: '', moduleId, contentDigest: '' }
  let support: ResolvedAssembly['support'] = { status: 'undetermined', blockerIds: [] }
  let rules = ruleBundleRef(BASELINE_RULES)
  const authority: ResolvedAssembly['authority'] = bundle.purpose === 'synthetic-mechanics-only' ? 'synthetic-mechanics-only' : 'technical-review'
  const moduleTarget: AssemblyTarget = { kind: 'module', id: moduleId }
  const targetId = (target: AssemblyTarget) => `${target.kind}:${target.id}`
  const proof = (ruleId: string, kind: Proof['authority'] = 'representation'): Proof => ({
    rule: { ...RESOLVER, id: ruleId }, authority: kind, dependencies: [...dependencies], permittedUse: 'technical-review',
  })
  const known = <T,>(value: T, ruleId: string, kind?: Proof['authority']): Resolution<T> => ({ status: 'resolved', value, proof: proof(ruleId, kind) })
  const addBlocker = (code: BlockerCode, target: AssemblyTarget, requirementId: string | null, messageBg: string, nextStepBg: string, gates: readonly GateName[] = ASSEMBLY) => {
    const id = derivedId(moduleId, 'blocker', code, targetId(target), requirementId ?? '', messageBg)
    if (!blockers.some((b) => b.id === id)) blockers.push({ id, code, target, requirementId, blocks: gates, messageBg, nextStepBg })
    return id
  }
  const reqId = (kind: RequirementKind, target: AssemblyTarget) => derivedId(moduleId, 'requirement', targetId(target), kind)
  const addRequirement = (kind: RequirementKind, target: AssemblyTarget, labelBg: string, satisfaction: Resolution<RequirementValue>, gates: readonly GateName[] = ASSEMBLY): AssemblyRequirement => {
    const item: AssemblyRequirement = { id: reqId(kind, target), kind, target, labelBg,
      applicability: known('required', 'af01a-assessment-obligation'), satisfaction, requiredBy: gates }
    requirements.push(item)
    return item
  }
  const missing = (kind: RequirementKind, target: AssemblyTarget, labelBg: string, nextStepBg = PHYSICAL_NEXT,
    gates: readonly GateName[] = ASSEMBLY, code: BlockerCode = 'RULE_MISSING'): AssemblyRequirement => {
    const id = addBlocker(code, target, reqId(kind, target), labelBg, nextStepBg, gates)
    return addRequirement(kind, target, labelBg, { status: code === 'SELECTION_INCOMPATIBLE' ? 'invalid' : 'unresolved', blockerIds: [id] }, gates)
  }
  const finish = (forceInvalid = false): ResolvedAssembly => {
    for (const gate of GATES.filter((g) => g !== 'ASSEMBLY_RESOLUTION')) addBlocker('STAGE_NOT_IMPLEMENTED', moduleTarget, null,
      `Етапът ${gate} не е реализиран в AF01A.`, 'Завърши съответния бъдещ етап и неговите проверки. Прегледът на сглобката не го разрешава.', [gate])
    const uniqueDeps = [...new Map(dependencies.map((d) => [`${d.kind}:${d.key}`, d])).values()]
      .sort((a, b) => `${a.kind}:${a.key}` < `${b.kind}:${b.key}` ? -1 : 1)
    const relevant = requirements.filter((r) => r.requiredBy.includes('ASSEMBLY_RESOLUTION'))
    const hasKnown = requirements.some((r) => r.satisfaction.status === 'resolved')
    const invalid = forceInvalid || relevant.some((r) => r.satisfaction.status === 'invalid')
    const complete = support.status === 'supported' && relevant.length > 0 && relevant.every((r) =>
      ['resolved', 'not-applicable'].includes(r.satisfaction.status) && ['resolved', 'not-applicable'].includes(r.applicability.status)) && !blockers.some((b) => b.blocks.includes('ASSEMBLY_RESOLUTION'))
    const data = {
      schemaVersion: 'af01a-assembly-1' as const, source, resolver: RESOLVER, ruleSet: rules, authority, support,
      coverageStatus: invalid ? 'invalid' as const : complete ? 'complete' as const : hasKnown ? 'partial' as const : 'unresolved' as const,
      members, connections, infills, requirements, blockers, dependencies: uniqueDeps,
    }
    return freezeDeep({ ...data, resultDigest: fingerprint(data) })
  }

  try {
    validateRuleBundle(bundle)
    rules = ruleBundleRef(bundle)
    const input = prepareAssemblyInput(snapshot, moduleId, options.revisionId)
    source = input.source
    dependencies = [...input.dependencies, { kind: 'rules', key: rules.id, digest: rules.digest },
      { kind: 'rules', key: GATE_CONTRACT.id, digest: GATE_CONTRACT.digest }, { kind: 'resolver', key: RESOLVER.id, digest: RESOLVER.digest }]
    for (const issue of input.evidenceProblems) addBlocker(issue.historical ? 'HISTORICAL_RULE_UNAVAILABLE' : 'EVIDENCE_STALE', moduleTarget, null,
      `Доказателството ${issue.id} не съвпада с наличната интерпретация.`, 'Възстанови точната версия на доказателството/правилото или генерирай нов преглед от текущите данни.')
    const { topology, resolution, system, module } = input
    if (!topology || !system || !resolution) {
      const id = addBlocker('INPUT_MISSING', moduleTarget, null, 'Липсва топология, профилна система или контекст на профилите.', 'Избери модул и система и създай конструкцията.')
      support = { status: 'undetermined', blockerIds: [id] }
      return finish()
    }
    if (resolution.profileSystemId !== system.id) {
      addBlocker('SELECTION_INCOMPATIBLE', moduleTarget, null, 'Системата на селекциите не съвпада със системата на модула.', 'Прегледай профилната система и съществуващите селекции.')
      return finish(true)
    }
    const resolved = resolveConstructionTopology(topology)
    const productType = module.definition.kind === 'free' ? module.definition.productType : module.definition.draft.productType
    const field = resolved.fields[0]
    const unsupportedReasons: string[] = []
    const undeterminedReasons: string[] = []
    const unsupported = (message: string) => unsupportedReasons.push(addBlocker('CONFIGURATION_UNSUPPORTED', moduleTarget, null, message,
      'AF01A оценява PRELUDE 60 с един правоъгълен FIX или дясно странично отваряемо поле, каса 482.30 и крило 482.05.'))
    const absent = (message: string) => undeterminedReasons.push(addBlocker('INPUT_MISSING', moduleTarget, null, message, 'Попълни липсващата настройка в Constructor.'))
    if (system.id !== 'kmg-prelude-60') unsupported('Профилната система е извън AF01A.')
    if (productType === null) absent('Не е избран вид на изделието.')
    else if (productType !== 'window') unsupported('AF01A не поддържа врати.')
    if (topology.root.kind !== 'field' || resolved.fields.length !== 1 || field?.polygon) unsupported('Топология с делители или polygon поле е извън AF01A.')
    if (!field?.fieldType) absent('Не е зададен FIX / Отваряемо.')
    if (!resolution.frame) absent('Не е избран профил на касата.')
    else if (resolution.frame.profileCode !== '482.30') unsupported('AF01A изисква каса 482.30.')
    if (field?.fieldType === 'operable') {
      if (!resolution.fieldSashes[field.id]) absent('Не е избран профил на крилото.')
      else if (resolution.fieldSashes[field.id].profileCode !== '482.05') unsupported('AF01A изисква крило 482.05.')
      if (!field.openingMode || !field.openingHanding) absent('Липсва начин или посока на отваряне.')
      else if (field.openingMode !== 'side-hinged' || field.openingHanding !== 'right') unsupported('Начинът или посоката на отваряне са извън AF01A.')
      if (!input.hardwareStandardId) absent('Липсва обковен стандарт; свободният модул няма наследени настройки за обков.')
      else if (input.hardwareStandardId !== 'standard-european') unsupported('Обковният стандарт е извън AF01A.')
    }
    const configuration: Configuration = field?.fieldType === 'operable' ? 'PRELUDE60_OPERABLE_RECT_01' : 'PRELUDE60_FIX_RECT_01'
    if (field) {
      const thickness = resolution.fieldGlazingThicknesses[field.id]?.thicknessMm
      const bead = resolution.fieldGlazingBeads[field.id]?.profileCode
      if (thickness !== undefined && thickness !== 24) unsupported('Началният AF01A контракт е за изрично въведени 24 mm.')
      if (bead && bead !== '482.15') unsupported('Избраният стъклодържател е извън началния AF01A контракт за 482.15.')
    }
    support = unsupportedReasons.length ? { status: 'unsupported', blockerIds: unsupportedReasons }
      : undeterminedReasons.length ? { status: 'undetermined', blockerIds: undeterminedReasons } : { status: 'supported', configuration }

    const selection = (assignment: { profileCode: string; source: 'human' } | undefined | null, path: string[], target: AssemblyTarget, role: 'frame' | 'sash' | 'mullion' | 'glass-bead'): Resolution<SelectionRef> => {
      const kind = role === 'glass-bead' ? 'bead-selection' : 'profile-selection'
      if (!assignment) return missing(kind, target, 'Липсва човешки избран профил / компонент.', 'Избери съответния компонент; AF01A не избира автоматично.', ASSEMBLY, 'ASSIGNMENT_MISSING').satisfaction as Resolution<SelectionRef>
      const candidates = role === 'glass-bead' ? system.glassBeads : system.mainProfiles
      if (!candidates.some((p) => p.code === assignment.profileCode && p.role === role)) return missing(kind, target,
        'Избраният код не е приложим за системата и ролята.', 'Прегледай избора на компонент за този елемент.', ASSEMBLY, 'SELECTION_INCOMPATIBLE').satisfaction as Resolution<SelectionRef>
      const value: SelectionRef = { moduleId, sourcePath: ['profileResolutionsByModuleId', moduleId, ...path], assignmentDigest: fingerprint(assignment), componentCode: assignment.profileCode, source: 'human' }
      const result = known(value, 'af01a-read-human-selection', 'human-input')
      addRequirement(kind, target, `Избран компонент ${assignment.profileCode}`, result)
      return result
    }
    const member = (origin: AssemblyMember['origin'], assignment: { profileCode: string; source: 'human' } | null | undefined, path: string[], role: 'frame' | 'sash' | 'mullion') => {
      const id = origin.kind === 'frame-side' ? derivedId(moduleId, 'frame', origin.side) : origin.kind === 'sash-side' ? derivedId(moduleId, 'field', origin.fieldId, 'sash', origin.side) : derivedId(moduleId, 'divider', origin.dividerId)
      const target: AssemblyTarget = { kind: 'member', id }
      const profileSelection = selection(assignment, path, target, role)
      const physical = missing('member-realization', target, 'Физическата реализация на профилния член не е доказана.')
      const item: AssemblyMember = { id, origin, profileSelection, physicalRealization: physical.satisfaction as Resolution<'specified'>, requirementIds: [reqId('profile-selection', target), physical.id] }
      members.push(item)
      if (assignment) {
        const semantic = profileDimensionalSemantics.find((e) => e.systemId === system.id && e.profileCode === assignment.profileCode)
        if (semantic?.visibleFace && !input.evidenceProblems.length) addRequirement('reviewed-visible-face', target, 'Прегледано видимо лице — само фронтален изглед', known(semantic.visibleFace.valueMm, `pf01-visible-face:${system.id}:${assignment.profileCode}`, 'reviewed-front-elevation'), [])
      }
      return item
    }
    const frameMembers = Object.fromEntries(SIDES.map((side) => [side, member({ kind: 'frame-side', side }, resolution.frame, ['frame'], 'frame')])) as Record<Side, AssemblyMember>
    const connect = (kind: AssemblyConnection['kind'], key: string[], endpoints: AssemblyConnection['endpoints']) => {
      const id = derivedId(moduleId, 'connection', kind, ...key), target: AssemblyTarget = { kind: 'connection', id }
      const labels = { 'frame-corner': 'ъгъл на касата', 'sash-corner': 'ъгъл на крилото', 'divider-to-frame': 'делител към каса', 'sash-to-frame': 'крило към каса', 'glazing-to-surround': 'стъклопакет към обграждащ профил' }
      const physical = missing('connection-specification', target, `Липсва физическа спецификация на връзката: ${labels[kind]}.`)
      const item: AssemblyConnection = { id, kind, endpoints, adjacency: known('established', 'af01a-semantic-adjacency'), physicalSpecification: physical.satisfaction as Resolution<'specified'>, requirementIds: [physical.id] }
      connections.push(item)
      if (kind === 'sash-to-frame') {
        const seal = missing('seal-specification', target, 'Приложимото уплътнение между крило и каса не е определено.')
        item.requirementIds = [...item.requirementIds, seal.id]
      }
      return id
    }
    const corners = (ring: Record<Side, AssemblyMember>, kind: 'frame-corner' | 'sash-corner', owner: string) => {
      for (const [a, b] of [['left', 'top'], ['top', 'right'], ['right', 'bottom'], ['bottom', 'left']] as const) connect(kind, [owner, a, b], [
        { kind: 'member', memberId: ring[a].id, location: b }, { kind: 'member', memberId: ring[b].id, location: a },
      ])
    }
    corners(frameMembers, 'frame-corner', 'frame')
    // Preserve divider identity for diagnostics. No adjacency/physical claim is
    // synthesized for unsupported split topology.
    for (const divider of [...resolved.dividers, ...resolved.angledDividers].sort((a, b) => a.id < b.id ? -1 : 1)) {
      const item = member({ kind: 'divider', dividerId: divider.id, axis: divider.axis }, resolution.dividers[divider.id], ['dividers', divider.id], 'mullion')
      const b = addBlocker('CONFIGURATION_UNSUPPORTED', { kind: 'divider', id: divider.id }, null, 'Физическите връзки на делителя не са в AF01A.', 'Необходим е отделен контракт за делители.')
      item.physicalRealization = { status: 'unsupported', blockerIds: [b] }
    }
    // Do not flatten unsupported FIELD layouts into a false single infill.
    const fields = topology.root.kind === 'field' && !field?.polygon ? resolved.fields : []
    for (const f of fields) {
      const fieldTarget: AssemblyTarget = { kind: 'field', id: f.id }
      let surround = frameMembers
      if (f.fieldType === 'operable') {
        surround = Object.fromEntries(SIDES.map((side) => [side, member({ kind: 'sash-side', fieldId: f.id, side }, resolution.fieldSashes[f.id], ['fieldSashes', f.id], 'sash')])) as Record<Side, AssemblyMember>
        corners(surround, 'sash-corner', f.id)
        for (const side of SIDES) connect('sash-to-frame', [f.id, side], [
          { kind: 'member', memberId: surround[side].id, location: side }, { kind: 'member', memberId: frameMembers[side].id, location: side },
        ])
        const joint = profileJointEvidenceRules.find((e) => e.systemId === system.id && e.supportProfileCode === resolution.frame?.profileCode && e.sashProfileCode === resolution.fieldSashes[f.id]?.profileCode)
        if (joint?.sashOverlapMm !== null && joint?.sashOverlapMm !== undefined && !input.evidenceProblems.length) addRequirement('reviewed-overlap', fieldTarget, 'Застъпване само във фронталния изглед; не е монтажен отстъп', known(joint.sashOverlapMm, `pf01-overlap:${system.id}:${joint.supportProfileCode}:${joint.sashProfileCode}`, 'reviewed-front-elevation'), [])
        const hardware = buildFieldHardwareRequirements({ field: f, profileSystemId: system.id, hardwareStandardId: input.hardwareStandardId })
        if (hardware.status === 'ready-for-kit-resolution') addRequirement('hardware-opening-context', fieldTarget, 'Изисквания за отваряне; конкретен kit не е избран', known({ mode: f.openingMode!, handing: f.openingHanding! }, 'af01a-hardware-requirements', 'human-input'))
        else missing('hardware-opening-context', fieldTarget, 'Недостатъчни или непотвърдени изисквания за обков.', 'Попълни начин, посока и приложим стандарт за обков.', ASSEMBLY, 'INPUT_MISSING')
        missing('hardware-kit', fieldTarget, 'Конкретният комплект обков не е разрешен.', 'Бъдещ етап за конкретни съвместими комплекти обков.', ['BOM', 'PRODUCTION_RELEASE'])
      } else if (f.fieldType === 'fixed') addRequirement('hardware-kit', fieldTarget, 'FIX не изисква отваряем комплект обков.', { status: 'not-applicable', proof: proof('af01a-fixed-no-opening-kit') }, ['BOM', 'PRODUCTION_RELEASE'])
      const id = derivedId(moduleId, 'field', f.id, 'glazing'), target: AssemblyTarget = { kind: 'infill', id }
      const thickness = resolution.fieldGlazingThicknesses[f.id]?.thicknessMm
      const thicknessResult = thickness !== undefined && Number.isFinite(thickness) && thickness > 0
        ? known(thickness, 'af01a-read-human-glazing-thickness', 'human-input')
        : missing('glazing-thickness', target, 'Липсва изрично въведена дебелина на стъклопакета.', 'Въведи дебелината в контекста на полето.', ASSEMBLY, 'INPUT_MISSING').satisfaction as Resolution<number>
      if (thicknessResult.status === 'resolved') addRequirement('glazing-thickness', target, 'Човешки въведена номинална дебелина', thicknessResult)
      const bead = selection(resolution.fieldGlazingBeads[f.id], ['fieldGlazingBeads', f.id], target, 'glass-bead')
      const base = f.fieldType === 'fixed' ? resolution.frame?.profileCode : resolution.fieldSashes[f.id]?.profileCode
      const compatibility = evaluateGlazingBeadCompatibility(system, thickness, resolution.fieldGlazingBeads[f.id]?.profileCode, {
        fieldType: f.fieldType, baseProfileCode: base, baseProfileRole: f.fieldType === 'fixed' ? 'frame' : 'sash',
      })
      missing('bead-base-compatibility', target, compatibility.status === 'invalid' ? 'Изборът на стъклодържател е несъвместим с контекста.' : 'Съвместимостта на стъклодържателя с базовия профил не е доказана.',
        compatibility.status === 'missing-data' ? 'Първо попълни дебелината, базовия профил и човешкия избор на стъклодържател.' : PHYSICAL_NEXT,
        ASSEMBLY, compatibility.status === 'invalid' ? 'SELECTION_INCOMPATIBLE' : compatibility.status === 'missing-data' ? 'INPUT_MISSING' : 'EVIDENCE_MISSING')
      missing('glazing-seat-specification', target, 'Липсва доказана спецификация за поставяне и задържане на стъклопакета.')
      missing('glazing-inset', target, 'Точният отстъп на стъклопакета остава неизвестен.', 'Необходимо е отделно прегледано правило за точния glazing inset. Фронталното застъпване не го определя.', ['GLASS_ORDER', 'PRODUCTION_RELEASE'])
      missing('seal-specification', target, 'Приложимите уплътнения и техните интерфейси не са определени.')
      const accessory = missing('accessory-applicability', target, 'Не е установена необходимостта от подложки и други аксесоари.')
      accessory.applicability = { status: 'unresolved', blockerIds: accessory.satisfaction.status === 'unresolved' ? accessory.satisfaction.blockerIds : [] }
      missing('glass-cut-dimensions', target, 'Размерите за рязане на стъклото остават неизвестни.', 'Необходими са отделни проверени правила за производствени размери на стъклото.', ['GLASS_ORDER', 'PRODUCTION_RELEASE'])
      const boundaryConnectionIds = SIDES.map((side) => connect('glazing-to-surround', [f.id, side], [
        { kind: 'infill', infillId: id, side }, { kind: 'member', memberId: surround[side].id, location: side },
      ]))
      infills.push({ id, fieldId: f.id, kind: 'glazing', nominalThicknessMm: thicknessResult, selectedBead: bead, boundaryConnectionIds,
        requirementIds: requirements.filter((r) => r.target.kind === 'infill' && r.target.id === id).map((r) => r.id) })
    }
    const reinforcementTargets = [
      { target: moduleTarget, key: 'frame:frame', base: resolution.frame?.profileCode },
      ...fields.filter((f) => f.fieldType === 'operable').map((f) => ({ target: { kind: 'field' as const, id: f.id }, key: `field-sash:${f.id}`, base: resolution.fieldSashes[f.id]?.profileCode })),
    ]
    for (const { target, key, base } of reinforcementTargets) {
      const application = missing('reinforcement-applicability', target, 'Не е определено кога и в кои членове е необходима армировка.')
      application.applicability = { status: 'unresolved', blockerIds: application.satisfaction.status === 'unresolved' ? application.satisfaction.blockerIds : [] }
      const candidates = getReinforcementCandidatesForProfile(system, base)
      if (candidates.length) addRequirement('reinforcement-candidate', target, 'Каталогови кандидати — не са задължителна армировка', known(candidates.map((c) => c.code).sort().join(', '), 'af01a-catalog-reinforcement-candidates', 'catalog'), [])
      const selected = resolution.reinforcements[key]
      if (selected) {
        const match = evaluateReinforcementCompatibility(system, base, selected.reinforcementCode, selected.thicknessMm)
        if (match.status === 'valid') addRequirement('reinforcement-selection', target, `Избрана армировка ${selected.reinforcementCode} / ${selected.thicknessMm} mm; само каталогово съвпадение`, known({ moduleId, sourcePath: ['profileResolutionsByModuleId', moduleId, 'reinforcements', key], assignmentDigest: fingerprint(selected), componentCode: selected.reinforcementCode, source: 'human' }, 'af01a-read-reinforcement-selection', 'human-input'))
        else missing('reinforcement-selection', target, 'Избраната армировка не съответства на базовия профил или дебелината.', 'Прегледай армировката за този профил.', ASSEMBLY, 'SELECTION_INCOMPATIBLE')
      }
      missing('reinforcement-adequacy', target, 'Конструктивната достатъчност и товарните ограничения не са доказани.', 'Необходими са проверени конструктивни правила и приложими входни натоварвания.', ['PRODUCTION_RELEASE'])
    }
    missing('manufacturing-dimensions', moduleTarget, 'Дължини за рязане и припуски не се извеждат от изображението.', 'Бъдещ етап за проверена производствена геометрия.', ['BOM', 'PRODUCTION_RELEASE', 'MACHINE_EXPORT'])

    // Deliberately isolated mechanics fixture. Never reached by the review UI,
    // never accepted in a baseline bundle, never enables a downstream gate.
    if (bundle.purpose === 'synthetic-mechanics-only' && support.status === 'supported') {
      for (const req of requirements) {
        const matches = bundle.rules.filter((r) => r.configuration === configuration && r.requirementId === req.id && r.kind === req.kind)
        if (!matches.length) continue
        if (matches.length > 1) {
          addBlocker('RULE_CONFLICT', req.target, req.id, 'Противоречиви/дублиращи правила за едно изискване.', 'Отстрани двусмислието в тестовия rule bundle.')
          continue
        }
        const rule = matches[0]
        if (req.satisfaction.status !== 'unresolved' || rule.decision !== 'satisfied') continue
        const existing = blockers.filter((b) => b.requirementId === req.id)
        if (existing.some((b) => !['RULE_MISSING', 'EVIDENCE_MISSING'].includes(b.code))) continue
        for (let i = blockers.length - 1; i >= 0; i--) if (blockers[i].requirementId === req.id) blockers.splice(i, 1)
        const syntheticProof: Proof = { rule: { id: rule.id, version: rule.version, digest: fingerprint(rule) }, authority: 'synthetic-test', permittedUse: 'synthetic-mechanics-only', dependencies: [...dependencies, { kind: 'evidence', key: rule.evidence.id, digest: rule.evidence.digest }] }
        req.satisfaction = { status: 'resolved', value: 'specified', proof: syntheticProof }
        req.applicability = { status: 'resolved', value: 'required', proof: syntheticProof }
      }
      for (const m of members) if (m.origin.kind !== 'divider') m.physicalRealization = requirements.find((r) => r.kind === 'member-realization' && r.target.id === m.id)!.satisfaction as Resolution<'specified'>
      for (const c of connections) c.physicalSpecification = requirements.find((r) => r.kind === 'connection-specification' && r.target.id === c.id)!.satisfaction as Resolution<'specified'>
    }
    return finish()
  } catch (error) {
    addBlocker('SOURCE_INVALID', moduleTarget, null, 'Входът или договорът за правила не може да бъде проверен.',
      `Отвори валиден проект и точната ревизия. ${error instanceof Error ? error.message : 'Невалидни данни.'}`)
    return finish(true)
  }
}
