import type { DerivedProductModel } from './derivedProductModel'
import {
  fingerprintProductBuildInputs,
  fingerprintProductSketch,
  fingerprintProductSystem,
} from './productBuildFingerprint'
import type { ProductBlocker, ProductResolutionStatus } from './productResolution'
import {
  PRODUCT_RESOLVER_VERSION,
  resolveProductFromSketch,
  type ProductResolverInput,
} from './productResolver'

export const PRODUCT_BUILD_ACTION_VERSION = 'product-build-action-04' as const

export type ProductBuildViewState = 'CURRENT' | 'STALE' | 'NOT_BUILT'

export type ProductBuildResult = Readonly<{
  moduleId: string
  product: DerivedProductModel
  status: ProductResolutionStatus
  blockers: readonly ProductBlocker[]
  sketchFingerprint: string
  systemFingerprint: string
  inputFingerprint: string
  actionVersion: typeof PRODUCT_BUILD_ACTION_VERSION
  resolverVersion: typeof PRODUCT_RESOLVER_VERSION
  viewState: 'CURRENT'
  machineReady: false
}>

export type ProductBuildState = Readonly<{
  state: ProductBuildViewState
  reason: string
}>

/**
 * Universal BUILD PRODUCT / APPLY SYSTEM domain action.
 *
 * This is a derived-product operation only. It delegates resolution to the
 * pure resolver and never writes or mutates the semantic sketch, project,
 * history, persistence, or UI state.
 */
export function buildProductFromSketch(input: ProductResolverInput): ProductBuildResult {
  const resolved = resolveProductFromSketch(input)
  return {
    moduleId: input.sketch.moduleId,
    product: resolved.model,
    status: resolved.status,
    blockers: resolved.blockers,
    sketchFingerprint: fingerprintProductSketch(input),
    systemFingerprint: fingerprintProductSystem(input),
    inputFingerprint: fingerprintProductBuildInputs(input),
    actionVersion: PRODUCT_BUILD_ACTION_VERSION,
    resolverVersion: PRODUCT_RESOLVER_VERSION,
    viewState: 'CURRENT',
    machineReady: false,
  }
}

export function getProductBuildState(
  input: ProductResolverInput,
  previous: ProductBuildResult | null | undefined,
): ProductBuildState {
  if (!previous) return { state: 'NOT_BUILT', reason: 'No derived product build exists for this input.' }
  if (previous.moduleId !== input.sketch.moduleId) return { state: 'STALE', reason: 'The built product belongs to another module.' }
  if (previous.inputFingerprint !== fingerprintProductBuildInputs(input)) {
    return { state: 'STALE', reason: 'Authoritative sketch or system inputs changed.' }
  }
  return { state: 'CURRENT', reason: 'The built product matches the authoritative inputs.' }
}
