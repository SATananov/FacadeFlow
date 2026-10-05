import { fingerprint } from './assurance/canonical'
import type { ProductResolverInput } from './productResolver'

export const PRODUCT_BUILD_FINGERPRINT_VERSION = 'product-build-fingerprint-04' as const

/**
 * Only authoritative inputs participate in product invalidation. This
 * projection intentionally excludes transient view state such as pan, zoom,
 * selection, open panels, and rulers.
 */
export type ProductBuildAuthoritativeInputs = Readonly<{
  sketch: ProductResolverInput['sketch']
  system: ProductResolverInput['system']
}>

export function projectProductBuildInputs(input: ProductResolverInput): ProductBuildAuthoritativeInputs {
  return {
    sketch: {
      moduleId: input.sketch.moduleId,
      topology: input.sketch.topology,
      productIntent: input.sketch.productIntent,
      combinedComposition: input.sketch.combinedComposition,
    },
    system: {
      profileSystemId: input.system.profileSystemId,
      standardId: input.system.standardId,
      profileResolution: input.system.profileResolution,
      offerDefaultGlazingId: input.system.offerDefaultGlazingId,
      hardware: {
        standardId: input.system.hardware.standardId,
        manufacturerId: input.system.hardware.manufacturerId,
      },
    },
  }
}

export function fingerprintProductBuildInputs(input: ProductResolverInput): string {
  return fingerprint({
    version: PRODUCT_BUILD_FINGERPRINT_VERSION,
    inputs: projectProductBuildInputs(input),
  })
}

export function fingerprintProductSketch(input: ProductResolverInput): string {
  return fingerprint({
    version: PRODUCT_BUILD_FINGERPRINT_VERSION,
    sketch: projectProductBuildInputs(input).sketch,
  })
}

export function fingerprintProductSystem(input: ProductResolverInput): string {
  return fingerprint({
    version: PRODUCT_BUILD_FINGERPRINT_VERSION,
    system: projectProductBuildInputs(input).system,
  })
}
