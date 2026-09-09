export type ProfileManufacturerId = string

export type ProfileMaterial =
  | 'PVC'
  | 'ALUMINIUM'
  | 'STEEL'
  | 'COMPOSITE'
  | 'OTHER'

export type ProfileRole =
  | 'frame'
  | 'sash'
  | 'door-sash'
  | 'mullion'
  | 'overhung'
  | 'glass-bead'
  | 'additional-profile'
  | 'gasket'
  | 'panel'
  | 'sill'
  | 'reinforcement'
  | 'accessory'
  | 'aluminium-cover-cap'

export interface CatalogEvidence {
  documentTitle: string
  page: number
  section: string
  note?: string
}

/**
 * Dimensions are copied from the numeric callouts printed in the catalogue drawing.
 * They are intentionally NOT given production semantics here.
 * Example: [60, 64, 42] means the drawing prints 60 / 64 / 42 mm around the profile.
 * A later human-reviewed semantic layer may map a callout to concepts such as
 * visible height, construction depth, rebate, etc.
 */
export interface RawCatalogDimensions {
  calloutsMm: number[]
}

export interface ProfileDefinition {
  code: string
  role: ProfileRole
  labelBg: string
  labelCatalog: string
  dimensions?: RawCatalogDimensions
  evidence: CatalogEvidence
}

export interface GlazingBeadDefinition extends ProfileDefinition {
  role: 'glass-bead'
  statedGlassMm: number
}

export interface ReinforcementDefinition {
  code: string
  thicknessOptionsMm: number[]
  appliesToProfileCodes: string[]
  dimensions?: RawCatalogDimensions
  evidence: CatalogEvidence
  note?: string
}

export interface AccessoryDefinition {
  code: string
  labelBg: string
  appliesToProfileCodes?: string[]
  evidence: CatalogEvidence
}

export interface ProfileSystemCatalogEntry {
  id: string
  manufacturer: ProfileManufacturerId
  name: string
  family: string
  material: ProfileMaterial
  nominalDepthMm: number
  parentSystemId?: string
  selectable: boolean
  sourceStatus: 'catalog-derived'
  mainProfiles: ProfileDefinition[]
  glassBeads: GlazingBeadDefinition[]
  additionalProfiles: ProfileDefinition[]
  gaskets: ProfileDefinition[]
  panelsAndSills: ProfileDefinition[]
  reinforcements: ReinforcementDefinition[]
  accessories: AccessoryDefinition[]
  aluminiumCoverCaps?: AccessoryDefinition[]
  evidence: CatalogEvidence[]
}
