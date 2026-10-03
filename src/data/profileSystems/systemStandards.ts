/**
 * Source-linked catalogue context for KMG PRELUDE 60 standards.
 * These records guide manual review only. They are not compatibility rules,
 * automatic assignments, geometry inputs, or executable legacy expressions.
 */
export type SystemStandardEvidenceKind =
  | 'direct-role-block'
  | 'd0b0'
  | 'comment'
  | 'formula-reference'
  | 'conflict'
  | 'unknown'

export interface SystemStandardComponentRef {
  code: string
  role: string
  evidence: SystemStandardEvidenceKind
  sourceDetail: string
  note?: string
}

export type SystemStandardFamily =
  | 'base' | 'balcony-t' | 'balcony-z' | 'door-t-threshold' | 'door-z-threshold'
  | 'door-t-closed-frame' | 'door-z-closed-frame' | 'frame-from-mullion'
  | 'frame-from-sash' | 'bead-variant' | 'budget' | 'other'

export interface SystemStandard {
  id: string
  systemId: string
  sourceName: string
  displayNameBg: string
  family: SystemStandardFamily
  sourceComment?: string
  components: readonly SystemStandardComponentRef[]
  rawD0B0?: string
  rawD4B0?: string
  conflicts?: readonly string[]
  notes?: readonly string[]
}

export interface SystemStandardConflict {
  id: string
  summary: string
  sourceDetail: string
  standardIds?: readonly string[]
}

const systemId = 'kmg-prelude-60'
export const PRELUDE60_SYSTEM_STANDARD_POLICY = {
  automaticGeometry: false,
  rulesValidated: false,
  machineReady: false,
  automaticComponentSelection: false,
  formulaEvaluation: false,
} as const

const frame3k = { code: '482.30-K', role: 'Каса', evidence: 'd0b0', sourceDetail: 'D0B0', note: 'Коментарят посочва 482.30; кодовете остават разграничени.' } satisfies SystemStandardComponentRef
const frame4k = { code: '482.20', role: 'Каса', evidence: 'd0b0', sourceDetail: 'D0B0' } satisfies SystemStandardComponentRef
const doorZ = { code: '482.26', role: 'Крило врата · Door', evidence: 'direct-role-block', sourceDetail: 'D6 Door' } satisfies SystemStandardComponentRef
const doorT = { code: '482.27', role: 'Крило врата · DoorOut', evidence: 'direct-role-block', sourceDetail: 'D6 DoorOut' } satisfies SystemStandardComponentRef
const threshold = { code: 'E3308', role: 'Алуминиев праг', evidence: 'd0b0', sourceDetail: 'D0B0 компонентен низ', note: 'Позицията в низа не е преведена във физическа страна.' } satisfies SystemStandardComponentRef
const bead32 = { code: '482.22', role: 'Стъклодържател', evidence: 'formula-reference', sourceDetail: 'Формула за 32 mm', note: 'Референция за 32 mm; съвместимост с конкретно крило не е потвърдена.' } satisfies SystemStandardComponentRef

const doorFormulaRefs = [bead32]

export const prelude60SystemStandards: readonly SystemStandard[] = [
  { id: 'kmg-3k', systemId, sourceName: 'KMG 3K', displayNameBg: 'KMG 3K', family: 'base',
    sourceComment: 'Коментарът посочва 482.30; D0B0 и D6 Frame посочват 482.30-K.',
    components: [frame3k, { code: '482.05', role: 'Прозоречно крило · Window', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }, { code: '482.21', role: 'Делител', evidence: 'comment', sourceDetail: 'Коментар' }, doorZ], rawD0B0: '482.30-K;482.30-K;482.30-K;482.30-K',
    conflicts: ['Коментар 482.30 срещу D0B0/D6 Frame 482.30-K.'] },
  { id: 'kmg-3k-balcony-t', systemId, sourceName: 'KMG 3K - балк. крило T', displayNameBg: 'KMG 3K - балк. крило T', family: 'balcony-t',
    components: [{ code: '482.23', role: 'Балконско крило T', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }] },
  { id: 'kmg-3k-balcony-z', systemId, sourceName: 'KMG 3K - балк. крило Z', displayNameBg: 'KMG 3K - балк. крило Z', family: 'balcony-z',
    components: [{ code: '482.25', role: 'Балконско крило Z', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }] },
  { id: 'kmg-3k-door-t-threshold', systemId, sourceName: 'KMG 3K - врата T с AL праг', displayNameBg: 'KMG 3K - врата T с AL праг', family: 'door-t-threshold',
    components: [frame3k, doorT, threshold, ...doorFormulaRefs], rawD0B0: '482.30-K;482.30-K;E3308;482.30-K', rawD4B0: '0110',
    conflicts: ['Коментарна референция 482.30 срещу 482.30-K в D0B0.'], notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-3k-door-z-closed', systemId, sourceName: 'KMG 3K - врата Z затв.каса', displayNameBg: 'KMG 3K - врата Z затв.каса', family: 'door-z-closed-frame',
    components: [frame3k, doorZ, ...doorFormulaRefs], rawD0B0: '482.30-K;482.30-K;482.30-K;482.30-K', rawD4B0: '0000',
    conflicts: ['Коментарна референция 482.30 срещу 482.30-K в D0B0.'], notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-3k-door-z-threshold', systemId, sourceName: 'KMG 3K - врата Z с AL праг', displayNameBg: 'KMG 3K - врата Z с AL праг', family: 'door-z-threshold',
    components: [frame3k, doorZ, threshold, ...doorFormulaRefs], rawD0B0: '482.30-K;482.30-K;E3308;482.30-K', rawD4B0: '0110',
    conflicts: ['Коментарна референция 482.30 срещу 482.30-K в D0B0.'], notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-4k', systemId, sourceName: 'KMG 4K', displayNameBg: 'KMG 4K', family: 'base',
    components: [frame4k, { code: '482.18', role: 'Прозоречно крило · Window', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }, { code: '482.21', role: 'Делител', evidence: 'comment', sourceDetail: 'Коментар' }, doorZ] },
  { id: 'kmg-4k-balcony-t', systemId, sourceName: 'KMG 4K - балк. крило T', displayNameBg: 'KMG 4K - балк. крило T', family: 'balcony-t',
    components: [{ code: '482.23', role: 'Балконско крило T', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }] },
  { id: 'kmg-4k-balcony-z', systemId, sourceName: 'KMG 4K - балк. крило Z', displayNameBg: 'KMG 4K - балк. крило Z', family: 'balcony-z',
    components: [{ code: '482.25', role: 'Балконско крило Z', evidence: 'direct-role-block', sourceDetail: 'D6 Window' }] },
  { id: 'kmg-4k-door-t-closed', systemId, sourceName: 'KMG 4K - врата T затв.каса', displayNameBg: 'KMG 4K - врата T затв.каса', family: 'door-t-closed-frame',
    components: [frame4k, doorT, ...doorFormulaRefs], rawD0B0: '482.20;482.20;482.20;482.20', rawD4B0: '0000',
    sourceComment: 'Коментарът посочва 482.26, а D6 DoorOut посочва 482.27.',
    conflicts: ['Коментар 482.26 срещу D6 DoorOut 482.27.'], notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-4k-door-t-threshold', systemId, sourceName: 'KMG 4K - врата T с AL праг', displayNameBg: 'KMG 4K - врата T с AL праг', family: 'door-t-threshold',
    components: [frame4k, doorT, threshold, ...doorFormulaRefs], rawD0B0: '482.20;482.20;E3308;482.20', rawD4B0: '0110',
    notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-4k-door-z-threshold', systemId, sourceName: 'KMG 4K - врата Z Ал.праг', displayNameBg: 'KMG 4K - врата Z Ал.праг', family: 'door-z-threshold',
    components: [frame4k, doorZ, threshold, ...doorFormulaRefs], rawD0B0: '482.20;482.20;E3308;482.20', rawD4B0: '0110',
    notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-4k-door-z-closed', systemId, sourceName: 'KMG 4K - врата Z затв.каса', displayNameBg: 'KMG 4K - врата Z затв.каса', family: 'door-z-closed-frame',
    components: [frame4k, doorZ, ...doorFormulaRefs], rawD0B0: '482.20;482.20;482.20;482.20', rawD4B0: '0000',
    notes: ['D4B0 е сурова стойност; значение UNKNOWN.'] },
  { id: 'kmg-4k-frame-from-mullion', systemId, sourceName: 'KMG 4K - каса от делител', displayNameBg: 'KMG 4K - каса от делител', family: 'frame-from-mullion',
    components: [{ code: '482.21', role: 'Референция на каса от делител', evidence: 'd0b0', sourceDetail: 'D0B0', note: 'Позиционното значение на токените не е установено.' }], rawD0B0: '482.21;482.21;482.21;482.21' },
  { id: 'kmg-4k-frame-from-sash', systemId, sourceName: 'KMG 4K - каса от крило', displayNameBg: 'KMG 4K - каса от крило', family: 'frame-from-sash',
    sourceComment: 'Коментарът посочва рамка 482.20; D0B0 и D6 Frame сочат 482.18.',
    components: [{ code: '482.18', role: 'Frame role block', evidence: 'direct-role-block', sourceDetail: 'D6 Frame' }, { code: '482.20', role: 'Каса според коментар', evidence: 'conflict', sourceDetail: 'Коментар' }], rawD0B0: '482.18;482.18;482.18;482.18',
    conflicts: ['Коментар 482.20 срещу D0B0/D6 Frame 482.18.'] },
  { id: 'kmg-4k-bead-482-01', systemId, sourceName: 'KMG 4K -СД 482.01', displayNameBg: 'KMG 4K -СД 482.01', family: 'bead-variant',
    components: [{ code: '482.01', role: 'Стъклодържател', evidence: 'formula-reference', sourceDetail: 'Формула за 24 mm' }, bead32],
    notes: ['Формулните препратки са неизпълнявани изходни данни, не правило за автоматичен избор.'] },
  { id: 'kmg-4k-budget', systemId, sourceName: 'KMG 4K бюджет', displayNameBg: 'KMG 4K бюджет', family: 'budget', components: [],
    notes: ['Не са добавени компонентни асоциации без потвърдена пряка препратка.'] },
]

export const prelude60SystemStandardConflicts: readonly SystemStandardConflict[] = [
  { id: 'ap3173-ap3174', summary: 'AP3173/AP3174 имащи разминаващи се 60/70 mm и PDF асоциации.', sourceDetail: 'items и PDF; нерешен конфликт' },
  { id: 'frame-48230-48230k', summary: '482.30 и 482.30-K не са доказани като взаимозаменяеми.', sourceDetail: 'standart comments срещу D0B0/D6 Frame', standardIds: ['kmg-3k', 'kmg-3k-door-t-threshold', 'kmg-3k-door-z-threshold', 'kmg-3k-door-z-closed'] },
  { id: 'kmg4-door-t-closed', summary: 'KMG 4K T затворена каса: коментар 482.26 срещу DoorOut блок 482.27.', sourceDetail: 'standart comment срещу D6 DoorOut', standardIds: ['kmg-4k-door-t-closed'] },
  { id: 'doorout-naming-variable', summary: 'Името 482.27/DoorOut и променливата DoorOut=0 са в конфликт; посоката не е изведена.', sourceDetail: 'items и standart variables' },
  { id: 'e3308-alprag', summary: 'E3308 е в прагова D0B0 конфигурация, докато alprag=0 също е наблюдавано.', sourceDetail: 'standart corrections и items', standardIds: ['kmg-3k-door-t-threshold', 'kmg-3k-door-z-threshold', 'kmg-4k-door-t-threshold', 'kmg-4k-door-z-threshold'] },
  { id: 'km530-context', summary: 'KM530 се среща и извън прагови контексти; срещането не доказва наличие на праг.', sourceDetail: 'standart corrections' },
  { id: 'tre03-thickness', summary: 'PDF TRE 03 S=2.0 mm срещу няколко database варианта по дебелина.', sourceDetail: 'PDF и items' },
]

export function getSystemStandards(systemIdValue: string): readonly SystemStandard[] {
  return prelude60SystemStandards.filter((standard) => standard.systemId === systemIdValue)
}

export function getSystemStandardById(id: string | null | undefined): SystemStandard | undefined {
  return id ? prelude60SystemStandards.find((standard) => standard.id === id) : undefined
}

export function getStandardComponentRef(standard: SystemStandard | undefined, code: string): SystemStandardComponentRef | undefined {
  return standard?.components.find((component) => component.code === code)
}

export function getSystemStandardConflicts(standard: SystemStandard | undefined): readonly SystemStandardConflict[] {
  if (!standard) return []
  return prelude60SystemStandardConflicts.filter((conflict) => conflict.standardIds?.includes(standard.id))
}

export function rankSystemStandardSuggestions<T extends { code: string }>(
  candidates: readonly T[],
  standard: SystemStandard | undefined,
): T[] {
  if (!standard) return [...candidates]
  return [...candidates].sort((a, b) => Number(Boolean(getStandardComponentRef(standard, b.code))) - Number(Boolean(getStandardComponentRef(standard, a.code))))
}
