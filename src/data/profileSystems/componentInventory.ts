import type {
  CatalogEvidence,
  ProfileRole,
  ProfileSystemCatalogEntry,
} from './types'

export const PROFILE_COMPONENT_INVENTORY_VERSION = 'profile-component-inventory-02a' as const

export type ProfileSystemComponentKind =
  | 'structural-profile'
  | 'glazing-bead'
  | 'additional-profile'
  | 'gasket'
  | 'panel-or-sill'
  | 'reinforcement'
  | 'accessory'
  | 'aluminium-cover-cap'

export type ProfileSystemComponentInventoryItem = {
  systemId: string
  kind: ProfileSystemComponentKind
  code: string
  role: ProfileRole | 'reinforcement' | 'accessory' | 'aluminium-cover-cap'
  labelBg: string
  evidence: CatalogEvidence
  appliesToProfileCodes: readonly string[]
  thicknessOptionsMm: readonly number[]
  statedGlassMm: number | null
}

/**
 * Normalized read model for a future Profile Data Studio / catalog importer.
 * It does not replace the source catalog arrays and does not add compatibility
 * that is absent from the evidence-backed definitions.
 */
export function buildProfileSystemComponentInventory(
  system: ProfileSystemCatalogEntry,
): readonly ProfileSystemComponentInventoryItem[] {
  const profiles = [
    ...system.mainProfiles.map((profile) => ({
      systemId: system.id,
      kind: 'structural-profile' as const,
      code: profile.code,
      role: profile.role,
      labelBg: profile.labelBg,
      evidence: profile.evidence,
      appliesToProfileCodes: [] as readonly string[],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
    ...system.glassBeads.map((profile) => ({
      systemId: system.id,
      kind: 'glazing-bead' as const,
      code: profile.code,
      role: profile.role,
      labelBg: profile.labelBg,
      evidence: profile.evidence,
      appliesToProfileCodes: [] as readonly string[],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: profile.statedGlassMm,
    })),
    ...system.additionalProfiles.map((profile) => ({
      systemId: system.id,
      kind: 'additional-profile' as const,
      code: profile.code,
      role: profile.role,
      labelBg: profile.labelBg,
      evidence: profile.evidence,
      appliesToProfileCodes: [] as readonly string[],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
    ...system.gaskets.map((profile) => ({
      systemId: system.id,
      kind: 'gasket' as const,
      code: profile.code,
      role: profile.role,
      labelBg: profile.labelBg,
      evidence: profile.evidence,
      appliesToProfileCodes: [] as readonly string[],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
    ...system.panelsAndSills.map((profile) => ({
      systemId: system.id,
      kind: 'panel-or-sill' as const,
      code: profile.code,
      role: profile.role,
      labelBg: profile.labelBg,
      evidence: profile.evidence,
      appliesToProfileCodes: [] as readonly string[],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
    ...system.reinforcements.map((reinforcement) => ({
      systemId: system.id,
      kind: 'reinforcement' as const,
      code: reinforcement.code,
      role: 'reinforcement' as const,
      labelBg: `Армировка ${reinforcement.code}`,
      evidence: reinforcement.evidence,
      appliesToProfileCodes: reinforcement.appliesToProfileCodes,
      thicknessOptionsMm: reinforcement.thicknessOptionsMm,
      statedGlassMm: null,
    })),
    ...system.accessories.map((accessory) => ({
      systemId: system.id,
      kind: 'accessory' as const,
      code: accessory.code,
      role: 'accessory' as const,
      labelBg: accessory.labelBg,
      evidence: accessory.evidence,
      appliesToProfileCodes: accessory.appliesToProfileCodes ?? [],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
    ...(system.aluminiumCoverCaps ?? []).map((accessory) => ({
      systemId: system.id,
      kind: 'aluminium-cover-cap' as const,
      code: accessory.code,
      role: 'aluminium-cover-cap' as const,
      labelBg: accessory.labelBg,
      evidence: accessory.evidence,
      appliesToProfileCodes: accessory.appliesToProfileCodes ?? [],
      thicknessOptionsMm: [] as readonly number[],
      statedGlassMm: null,
    })),
  ] satisfies ProfileSystemComponentInventoryItem[]

  return profiles
}
