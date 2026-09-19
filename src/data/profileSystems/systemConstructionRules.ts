import type { ProfileJointKind } from './jointSemantics'

export type SystemConstructionEdge = 'left' | 'right' | 'top' | 'bottom'
export type SystemDividerOrientation = 'vertical' | 'horizontal'

export type SystemConstructionRuleSource = Readonly<{
  id: string
  kind: 'reference-derived'
  labelBg: string
  product: string
  dataset: string
  noteBg: string
}>

export type SystemSashConstructionRule = Readonly<{
  id: string
  systemId: string
  productType: 'window' | 'door'
  frameProfileCode: string
  frameReferenceVariantCode: string | null
  sashProfileCode: string
  sashSideProfileCodes: Readonly<Record<SystemConstructionEdge, string>>
  edgeCorrectionMm: Readonly<Record<SystemConstructionEdge, number>>
  assemblyUseRabbet: boolean
  profileAllowanceMm: number
  reinforcementCorrectionMm: number
  source: SystemConstructionRuleSource
}>

export type SystemDividerConstructionRule = Readonly<{
  id: string
  systemId: string
  profileCode: string
  orientation: 'both'
  profileAllowanceMm: number
  reinforcementCorrectionMm: number
  connectorCode: string | null
  connectorQuantityPerDivider: number | null
  source: SystemConstructionRuleSource
}>

export type SystemGlazingConstructionRule = Readonly<{
  id: string
  systemId: string
  nominalThicknessMm: number
  glazingBeadProfileCode: string
  referenceHeightCorrectionMm: number
  referenceWidthCorrectionMm: number
  source: SystemConstructionRuleSource
}>

export type ResolvedSystemBoundaryRule = Readonly<{
  id: string
  systemId: string
  jointKind: ProfileJointKind
  supportProfileCode: string
  sashProfileCode: string
  edge: SystemConstructionEdge
  status: 'matched'
  source: SystemConstructionRuleSource
  sashEdgeCorrectionMm: number
  assemblyUseRabbet: boolean
  sashProfileAllowanceMm: number
  sashReinforcementCorrectionMm: number
  supportProfileAllowanceMm: number | null
  supportReinforcementCorrectionMm: number | null
  supportOrientation: SystemDividerOrientation | null
  supportConnectorCode: string | null
  supportConnectorQuantity: number | null
  exactAssemblyGeometryProven: false
  noteBg: string
}>

/**
 * SYSTEM CONSTRUCTION RULES 01
 *
 * These rules adopt useful construction semantics observed in the user-supplied
 * KMG 60 reference configuration as a REFERENCE, not as authoritative
 * proof of exact cross-section placement.
 *
 * The reference contains, among other things:
 * - frame side set 482.30-K on all four sides;
 * - window sash 482.05 on all four sides;
 * - sash side corrections: top 8, bottom 8, left 8.5, right 8.5;
 * - Assembly_Use_Rabbet=1, Pl=6, ReinfCorr=20 for that sash standard;
 * - divider 482.21 with horizontal/vertical roles, Pl=8, ReinfCorr=10;
 * - KM242 quantity 2 in the divider standard;
 * - glazing rule: 4 -> 482.14, 24 -> 482.15, 32 -> 482.22,
 *   with reference glass corrections 12 / 12.
 *
 * FacadeFlow keeps these values separate from jointAssemblyEvidence. They may
 * drive rule resolution, recommendations, and dimensional intent, but they DO
 * NOT unlock exact profile placement, overlap, glazing inset, BOM cuts, or
 * machine output until exact assembly evidence is reviewed.
 */
const kmg60ReferenceRuleSource: SystemConstructionRuleSource = {
  id: 'kmg60-reference-01',
  kind: 'reference-derived',
  labelBg: 'KMG 60 В· СЂРµС„РµСЂРµРЅС‚РЅРѕ СЃРёСЃС‚РµРјРЅРѕ РїСЂР°РІРёР»Рѕ',
  product: 'KMG 60 reference dataset',
  dataset: 'KMG / PVC KMG 60mm standard configuration',
  noteBg: 'РР·РїРѕР»Р·РІР° СЃРµ СЃР°РјРѕ РєРѕРЅСЃС‚СЂСѓРєС‚РёРІРЅР°С‚Р° Р»РѕРіРёРєР° Рё РїР°СЂР°РјРµС‚СЂРёС‚Рµ РѕС‚ СЂРµС„РµСЂРµРЅС‚РЅР°С‚Р° РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ. РўРѕРІР° РЅРµ Рµ РґРѕРєР°Р·Р°С‚РµР»СЃС‚РІРѕ Р·Р° С‚РѕС‡РЅР°С‚Р° РјРѕРЅС‚Р°Р¶РЅР° РіРµРѕРјРµС‚СЂРёСЏ РЅР° РїСЂРѕС„РёР»РЅРёСЏ СЂР°Р·СЂРµР·.',
}

const kmgPrelude60Window48205: SystemSashConstructionRule = {
  id: 'kmg-prelude60-window-48205-reference-01',
  systemId: 'kmg-prelude-60',
  productType: 'window',
  frameProfileCode: '482.30',
  frameReferenceVariantCode: '482.30-K',
  sashProfileCode: '482.05',
  sashSideProfileCodes: {
    left: '482.05',
    right: '482.05',
    top: '482.05',
    bottom: '482.05',
  },
  edgeCorrectionMm: {
    left: 8.5,
    right: 8.5,
    top: 8,
    bottom: 8,
  },
  assemblyUseRabbet: true,
  profileAllowanceMm: 6,
  reinforcementCorrectionMm: 20,
  source: kmg60ReferenceRuleSource,
}

const kmgPrelude60Divider48221: SystemDividerConstructionRule = {
  id: 'kmg-prelude60-divider-48221-reference-01',
  systemId: 'kmg-prelude-60',
  profileCode: '482.21',
  orientation: 'both',
  profileAllowanceMm: 8,
  reinforcementCorrectionMm: 10,
  connectorCode: 'KM242',
  connectorQuantityPerDivider: 2,
  source: kmg60ReferenceRuleSource,
}

const kmgPrelude60GlazingRules: readonly SystemGlazingConstructionRule[] = [
  {
    id: 'kmg-prelude60-glazing-4-reference-01',
    systemId: 'kmg-prelude-60',
    nominalThicknessMm: 4,
    glazingBeadProfileCode: '482.14',
    referenceHeightCorrectionMm: 12,
    referenceWidthCorrectionMm: 12,
    source: kmg60ReferenceRuleSource,
  },
  {
    id: 'kmg-prelude60-glazing-24-reference-01',
    systemId: 'kmg-prelude-60',
    nominalThicknessMm: 24,
    glazingBeadProfileCode: '482.15',
    referenceHeightCorrectionMm: 12,
    referenceWidthCorrectionMm: 12,
    source: kmg60ReferenceRuleSource,
  },
  {
    id: 'kmg-prelude60-glazing-32-reference-01',
    systemId: 'kmg-prelude-60',
    nominalThicknessMm: 32,
    glazingBeadProfileCode: '482.22',
    referenceHeightCorrectionMm: 12,
    referenceWidthCorrectionMm: 12,
    source: kmg60ReferenceRuleSource,
  },
]

export function getSystemSashConstructionRule(args: {
  systemId: string
  productType: 'window' | 'door' | null
  frameProfileCode: string | null
  sashProfileCode: string | null
}): SystemSashConstructionRule | null {
  if (
    args.systemId === kmgPrelude60Window48205.systemId &&
    args.productType === kmgPrelude60Window48205.productType &&
    args.frameProfileCode === kmgPrelude60Window48205.frameProfileCode &&
    args.sashProfileCode === kmgPrelude60Window48205.sashProfileCode
  ) {
    return kmgPrelude60Window48205
  }
  return null
}

export function getSystemDividerConstructionRule(args: {
  systemId: string
  profileCode: string | null
  orientation: SystemDividerOrientation
}): SystemDividerConstructionRule | null {
  if (
    args.systemId === kmgPrelude60Divider48221.systemId &&
    args.profileCode === kmgPrelude60Divider48221.profileCode
  ) {
    return kmgPrelude60Divider48221
  }
  return null
}

export function getSystemGlazingConstructionRule(args: {
  systemId: string
  nominalThicknessMm: number | null | undefined
}): SystemGlazingConstructionRule | null {
  if (args.nominalThicknessMm === null || args.nominalThicknessMm === undefined) return null
  return kmgPrelude60GlazingRules.find((rule) =>
    rule.systemId === args.systemId && Math.abs(rule.nominalThicknessMm - args.nominalThicknessMm!) < 0.01,
  ) ?? null
}

export function resolveSystemBoundaryRule(args: {
  systemId: string
  productType: 'window' | 'door' | null
  jointKind: ProfileJointKind
  supportProfileCode: string | null
  sashProfileCode: string | null
  frameProfileCode: string | null
  edge: SystemConstructionEdge
  supportOrientation: SystemDividerOrientation | null
}): ResolvedSystemBoundaryRule | null {
  if (!args.supportProfileCode || !args.sashProfileCode) return null

  // ASSEMBLY MODEL 04C вЂ” CATALOGUE PAIRING TRUTH.
  // PRELUDE 60 catalogue page 25 shows mullion 482.21 with sash 482.18.
  // Do not generalize the external 482.05 reference into an automatic
  // catalogue mate for 482.21. Keep the user's explicit 482.05 selection,
  // but return no automatic boundary rule for this unreviewed pair.
  if (
    args.systemId === 'kmg-prelude-60' &&
    args.jointKind === 'mullion-sash' &&
    args.supportProfileCode === '482.21' &&
    args.sashProfileCode === '482.05'
  ) {
    return null
  }
  const sashRule = getSystemSashConstructionRule({
    systemId: args.systemId,
    productType: args.productType,
    frameProfileCode: args.frameProfileCode,
    sashProfileCode: args.sashProfileCode,
  })
  if (!sashRule) return null

  if (args.jointKind === 'frame-sash' && args.supportProfileCode !== sashRule.frameProfileCode) return null

  const dividerRule = args.jointKind === 'mullion-sash' && args.supportOrientation
    ? getSystemDividerConstructionRule({
        systemId: args.systemId,
        profileCode: args.supportProfileCode,
        orientation: args.supportOrientation,
      })
    : null

  if (args.jointKind === 'mullion-sash' && !dividerRule) return null

  return {
    id: `${sashRule.id}:${args.jointKind}:${args.supportProfileCode}:${args.edge}`,
    systemId: args.systemId,
    jointKind: args.jointKind,
    supportProfileCode: args.supportProfileCode,
    sashProfileCode: args.sashProfileCode,
    edge: args.edge,
    status: 'matched',
    source: sashRule.source,
    sashEdgeCorrectionMm: sashRule.edgeCorrectionMm[args.edge],
    assemblyUseRabbet: sashRule.assemblyUseRabbet,
    sashProfileAllowanceMm: sashRule.profileAllowanceMm,
    sashReinforcementCorrectionMm: sashRule.reinforcementCorrectionMm,
    supportProfileAllowanceMm: dividerRule?.profileAllowanceMm ?? null,
    supportReinforcementCorrectionMm: dividerRule?.reinforcementCorrectionMm ?? null,
    supportOrientation: dividerRule ? args.supportOrientation : null,
    supportConnectorCode: dividerRule?.connectorCode ?? null,
    supportConnectorQuantity: dividerRule?.connectorQuantityPerDivider ?? null,
    exactAssemblyGeometryProven: false,
    noteBg: dividerRule
      ? 'РЎРёСЃС‚РµРјРЅРѕС‚Рѕ РїСЂР°РІРёР»Рѕ СЂР°Р·РїРѕР·РЅР°РІР° 482.21 РєР°С‚Рѕ С…РѕСЂРёР·РѕРЅС‚Р°Р»РµРЅ/РІРµСЂС‚РёРєР°Р»РµРЅ РґРµР»РёС‚РµР» Рё 482.05 РєР°С‚Рѕ РєСЂРёР»Рѕ. Р РµС„РµСЂРµРЅС‚РЅРёС‚Рµ РєРѕСЂРµРєС†РёРё РјРѕРіР°С‚ РґР° РІРѕРґСЏС‚ РєРѕРЅСЃС‚СЂСѓРєС‚РёРІРЅР°С‚Р° Р»РѕРіРёРєР°, РЅРѕ РЅРµ РґРѕРєР°Р·РІР°С‚ С‚РѕС‡РЅРёСЏ РїСЂРѕС„РёР»РµРЅ СЂР°Р·СЂРµР· РЅР° РІСЉР·РµР»Р°.'
      : 'РЎРёСЃС‚РµРјРЅРѕС‚Рѕ РїСЂР°РІРёР»Рѕ СЂР°Р·РїРѕР·РЅР°РІР° РєР°СЃР°С‚Р° 482.30 Рё РєСЂРёР»РѕС‚Рѕ 482.05 РїРѕ СЃС‚СЂР°РЅРёС‚Рµ РЅР° РїСЂРѕР·РѕСЂРµС†Р°. Р РµС„РµСЂРµРЅС‚РЅРёС‚Рµ РєРѕСЂРµРєС†РёРё РјРѕРіР°С‚ РґР° РІРѕРґСЏС‚ РєРѕРЅСЃС‚СЂСѓРєС‚РёРІРЅР°С‚Р° Р»РѕРіРёРєР°, РЅРѕ РЅРµ РґРѕРєР°Р·РІР°С‚ С‚РѕС‡РЅРёСЏ РїСЂРѕС„РёР»РµРЅ СЂР°Р·СЂРµР· РЅР° РІСЉР·РµР»Р°.',
  }
}
