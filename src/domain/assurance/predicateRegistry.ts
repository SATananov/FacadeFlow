import type { Statement } from './assuranceModel'
import { canonicalize, freezeDeep } from './canonical'

export const PREDICATE_REGISTRY_VERSION = 'pf02-predicates-1' as const
export const PREDICATES = freezeDeep({
  'human-selected-bead': { scope: 'field', unit: 'none', value: 'code', parameters: ['profileSystemId', 'thicknessMm', 'baseProfileCode'] },
  'human-glazing-thickness': { scope: 'field', unit: 'mm', value: 'positive', parameters: ['profileSystemId'] },
  'human-selected-profile': { scope: 'target', unit: 'none', value: 'code', parameters: ['profileSystemId'] },
  'human-selected-reinforcement': { scope: 'target', unit: 'none', value: 'code', parameters: ['profileSystemId', 'baseProfileCode', 'thicknessMm'] },
  'catalog-stated-bead-thickness': { scope: 'catalog', unit: 'mm', value: 'positive', parameters: [] },
  'catalog-reinforcement-pairing': { scope: 'catalog', unit: 'none', value: 'code', parameters: ['baseProfileCode', 'thicknessMm'] },
  'bead-base-profile-compatibility': { scope: 'field', unit: 'none', value: 'unknown', parameters: ['profileSystemId', 'beadCode', 'baseProfileCode'] },
  'reviewed-front-elevation-overlap': { scope: 'catalog', unit: 'mm', value: 'positive', parameters: ['supportProfileCode'] },
  'reviewed-visible-face': { scope: 'catalog', unit: 'mm', value: 'positive', parameters: [] },
  'reviewed-operational-policy': { scope: 'catalog', unit: 'none', value: 'code', parameters: ['category'] },
  'glazing-inset': { scope: 'field', unit: 'mm', value: 'unknown', parameters: ['profileSystemId'] },
  'glass-cut-width': { scope: 'field', unit: 'mm', value: 'unknown', parameters: ['profileSystemId'] },
  'official-sectional-bead-base-pairing': { scope: 'module', unit: 'none', value: 'code', parameters: ['profileSystemId', 'baseProfileCode', 'beadCode', 'thicknessMm', 'sourceCandidateId'] },
  'official-sectional-bead-placement': { scope: 'module', unit: 'none', value: 'code', parameters: ['profileSystemId', 'baseProfileCode', 'beadCode', 'thicknessMm', 'sourceCandidateId'] },
} as const)
export type Predicate = keyof typeof PREDICATES
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`PF02: ${message}`)
}
export function objectKeys(value: unknown, expected: readonly string[]): asserts value is Record<string, unknown> {
  invariant(value && typeof value === 'object' && !Array.isArray(value), 'expected object')
  invariant(canonicalize(Object.keys(value).sort()) === canonicalize([...expected].sort()), 'unexpected/missing property')
}
export function nonempty(value: unknown): asserts value is string {
  invariant(typeof value === 'string' && value.trim().length > 0 && !['__proto__', 'constructor', 'prototype'].includes(value), 'invalid text/identity')
}
export function validateStatement(value: unknown): asserts value is Statement {
  objectKeys(value, ['registryVersion', 'predicate', 'scope', 'parameters', 'value', 'unit'])
  invariant(value.registryVersion === PREDICATE_REGISTRY_VERSION, 'unsupported predicate registry')
  invariant(typeof value.predicate === 'string' && Object.hasOwn(PREDICATES, value.predicate), 'unsupported predicate')
  const rule = PREDICATES[value.predicate as Predicate]
  const scope = value.scope as Record<string, unknown>
  if (rule.scope === 'catalog') {
    objectKeys(scope, ['kind', 'profileSystemId', 'itemCode'])
    invariant(scope.kind === 'catalog', 'catalog scope required'); nonempty(scope.profileSystemId); nonempty(scope.itemCode)
  } else {
    objectKeys(scope, ['kind', 'projectId', 'offerId', 'moduleId', 'target'])
    invariant(scope.kind === 'module', 'module scope required')
    nonempty(scope.projectId); nonempty(scope.offerId); nonempty(scope.moduleId)
    const target = scope.target as Record<string, unknown>
    invariant(target && ['module', 'frame', 'field', 'divider'].includes(String(target.kind)), 'invalid target')
    objectKeys(target, target.kind === 'module' || target.kind === 'frame' ? ['kind'] : ['kind', target.kind === 'field' ? 'fieldId' : 'dividerId'])
    if (target.kind === 'field') nonempty(target.fieldId)
    if (target.kind === 'divider') nonempty(target.dividerId)
    if (rule.scope === 'field') invariant(target.kind === 'field', 'FIELD scope required')
    if (rule.scope === 'module') invariant(target.kind === 'module', 'MODULE scope required')
  }
  invariant(value.unit === rule.unit, 'predicate unit mismatch')
  objectKeys(value.parameters, rule.parameters)
  for (const [key, parameter] of Object.entries(value.parameters)) {
    if (key === 'thicknessMm') invariant(typeof parameter === 'number' && Number.isFinite(parameter) && parameter > 0, 'invalid thickness')
    else nonempty(parameter)
  }
  if (value.predicate === 'reviewed-operational-policy') invariant(['finish-choice', 'glazing-choice', 'hardware-standard', 'hardware-system-policy'].includes(String(value.parameters.category)), 'unsupported policy category')
  const data = value.value as Record<string, unknown>
  if (rule.value === 'unknown') {
    objectKeys(data, ['state', 'reason']); invariant(data.state === 'unknown', 'technical value remains UNKNOWN'); nonempty(data.reason)
  } else {
    objectKeys(data, ['state', 'value']); invariant(data.state === 'known', 'known input required')
    if (rule.value === 'code') nonempty(data.value)
    else invariant(typeof data.value === 'number' && Number.isFinite(data.value) && data.value > 0, 'invalid dimension')
  }
}
export function statementKey(statement: Statement): string {
  validateStatement(statement)
  return canonicalize({ registryVersion: statement.registryVersion, predicate: statement.predicate,
    scope: statement.scope, parameters: statement.parameters })
}
