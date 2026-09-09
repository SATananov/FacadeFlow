import type {
  CatalogEvidence,
  GlazingBeadDefinition,
  ProfileDefinition,
  ProfileSystemCatalogEntry,
  ReinforcementDefinition,
} from '../data/profileSystems/types'

export const COMPONENT_COMPATIBILITY_VERSION = 'component-compatibility-02a2' as const

export type ComponentCompatibilityStatus =
  | 'valid'
  | 'invalid'
  | 'unconfirmed'
  | 'missing-data'

export type ComponentCompatibilityResult = {
  status: ComponentCompatibilityStatus
  code: string
  labelBg: string
  noteBg: string
  evidence: readonly CatalogEvidence[]
}

export type GlazingBeadStructuralContext = {
  fieldType: 'fixed' | 'operable' | null
  baseProfileCode: string | null | undefined
  baseProfileRole: 'frame' | 'sash' | 'door-sash' | null
}

export function getGlazingBeadCandidates(
  system: ProfileSystemCatalogEntry,
  glazingThicknessMm: number | null | undefined,
): readonly GlazingBeadDefinition[] {
  if (glazingThicknessMm === null || glazingThicknessMm === undefined) return []
  return system.glassBeads.filter(
    (bead) => Math.abs(bead.statedGlassMm - glazingThicknessMm) < 0.01,
  )
}

/**
 * 02A.2 deliberately separates a catalog thickness match from a resolved
 * structural compatibility. A field must first have explicit FIX / OPERABLE
 * semantics and a structural base profile. Even then, PRELUDE 60 currently has
 * no reviewed bead-to-frame/sash pairing rule in our data, so a matching bead
 * remains UNCONFIRMED rather than being promoted to RESOLVED.
 */
export function evaluateGlazingBeadCompatibility(
  system: ProfileSystemCatalogEntry,
  glazingThicknessMm: number | null | undefined,
  beadCode: string | null | undefined,
  context: GlazingBeadStructuralContext,
): ComponentCompatibilityResult {
  if (glazingThicknessMm === null || glazingThicknessMm === undefined) {
    return {
      status: 'missing-data',
      code: 'GLAZING_THICKNESS_MISSING',
      labelBg: 'MISSING DATA',
      noteBg: 'Няма избран/потвърден общ размер на стъклопакета.',
      evidence: [],
    }
  }

  if (context.fieldType === null) {
    return {
      status: 'missing-data',
      code: 'GLAZING_BEAD_FIELD_TYPE_MISSING',
      labelBg: 'MISSING CONTEXT',
      noteBg: 'Първо задай FIX или Отваряемо. Геометрично FIELD не е достатъчно за bead resolution.',
      evidence: [],
    }
  }

  if (!context.baseProfileCode) {
    return {
      status: 'missing-data',
      code: context.fieldType === 'fixed'
        ? 'GLAZING_BEAD_FRAME_PROFILE_MISSING'
        : 'GLAZING_BEAD_SASH_PROFILE_MISSING',
      labelBg: 'MISSING CONTEXT',
      noteBg: context.fieldType === 'fixed'
        ? 'FIX полето изисква human-confirmed профил на касата преди bead resolution.'
        : 'OPERABLE полето изисква human-confirmed sash profile преди bead resolution.',
      evidence: [],
    }
  }

  if (!beadCode) {
    return {
      status: 'missing-data',
      code: 'GLAZING_BEAD_NOT_ASSIGNED',
      labelBg: 'MISSING DATA',
      noteBg: 'Стъклодържателят остава human-controlled и още не е избран.',
      evidence: [],
    }
  }

  const bead = system.glassBeads.find((candidate) => candidate.code === beadCode)
  if (!bead) {
    return {
      status: 'invalid',
      code: 'GLAZING_BEAD_OUTSIDE_SYSTEM',
      labelBg: 'INVALID',
      noteBg: 'Кодът не съществува сред стъклодържателите на избраната профилна система.',
      evidence: [],
    }
  }

  if (Math.abs(bead.statedGlassMm - glazingThicknessMm) >= 0.01) {
    return {
      status: 'invalid',
      code: 'GLAZING_BEAD_THICKNESS_MISMATCH',
      labelBg: 'INVALID',
      noteBg: `Каталогът заявява ${bead.statedGlassMm} mm за ${bead.code}, а офертата е ${glazingThicknessMm} mm.`,
      evidence: [bead.evidence],
    }
  }

  return {
    status: 'unconfirmed',
    code: 'GLAZING_BEAD_BASE_PROFILE_RULE_MISSING',
    labelBg: 'UNCONFIRMED',
    noteBg: `Дебелината съвпада каталожно, но още няма reviewed правило, което доказва ${bead.code} като съвместим с ${context.baseProfileRole ?? 'base profile'} ${context.baseProfileCode}. Assignment ≠ RESOLVED.`,
    evidence: [bead.evidence],
  }
}

export function getReinforcementCandidatesForProfile(
  system: ProfileSystemCatalogEntry,
  profileCode: string | null | undefined,
): readonly ReinforcementDefinition[] {
  if (!profileCode) return []
  return system.reinforcements.filter((reinforcement) =>
    reinforcement.appliesToProfileCodes.includes(profileCode),
  )
}

export function evaluateReinforcementCompatibility(
  system: ProfileSystemCatalogEntry,
  profileCode: string | null | undefined,
  reinforcementCode: string | null | undefined,
  thicknessMm: number | null | undefined,
): ComponentCompatibilityResult {
  if (!profileCode) {
    return {
      status: 'missing-data',
      code: 'BASE_PROFILE_MISSING',
      labelBg: 'MISSING DATA',
      noteBg: 'Първо трябва да има human-confirmed основен профил.',
      evidence: [],
    }
  }

  if (!reinforcementCode || thicknessMm === null || thicknessMm === undefined) {
    return {
      status: 'missing-data',
      code: 'REINFORCEMENT_NOT_ASSIGNED',
      labelBg: 'MISSING DATA',
      noteBg: 'Армировката не се избира автоматично. Няма human-confirmed assignment.',
      evidence: [],
    }
  }

  const matchingCode = system.reinforcements.filter(
    (candidate) => candidate.code === reinforcementCode,
  )
  if (matchingCode.length === 0) {
    return {
      status: 'invalid',
      code: 'REINFORCEMENT_OUTSIDE_SYSTEM',
      labelBg: 'INVALID',
      noteBg: 'Кодът на армировката не съществува в избраната профилна система.',
      evidence: [],
    }
  }

  const compatible = matchingCode.find(
    (candidate) =>
      candidate.appliesToProfileCodes.includes(profileCode) &&
      candidate.thicknessOptionsMm.some((value) => Math.abs(value - thicknessMm) < 0.01),
  )

  if (!compatible) {
    return {
      status: 'invalid',
      code: 'REINFORCEMENT_PROFILE_OR_THICKNESS_MISMATCH',
      labelBg: 'INVALID',
      noteBg: `Армировка ${reinforcementCode} / ${thicknessMm} mm не е каталожно свързана с профил ${profileCode}.`,
      evidence: matchingCode.map((candidate) => candidate.evidence),
    }
  }

  return {
    status: 'valid',
    code: 'REINFORCEMENT_CATALOG_MATCH',
    labelBg: 'VALID',
    noteBg: 'Каталогът директно посочва тази армировка за избрания профил. Кога армировката е задължителна по размер/цвят/натоварване остава UNCONFIRMED.',
    evidence: [compatible.evidence],
  }
}

/**
 * Pair compatibility is intentionally conservative. Sharing one profile system
 * does not prove that two concrete structural profiles are a valid production
 * pair. A future reviewed rule catalog must provide that evidence.
 */
export function evaluateStructuralProfilePairCompatibility(
  first: ProfileDefinition | null | undefined,
  second: ProfileDefinition | null | undefined,
): ComponentCompatibilityResult {
  if (!first || !second) {
    return {
      status: 'missing-data',
      code: 'STRUCTURAL_PROFILE_PAIR_MISSING',
      labelBg: 'MISSING DATA',
      noteBg: 'Липсва един от двата конкретни профила.',
      evidence: [],
    }
  }

  return {
    status: 'unconfirmed',
    code: 'STRUCTURAL_PROFILE_PAIR_RULE_MISSING',
    labelBg: 'UNCONFIRMED',
    noteBg: `Наличието на ${first.code} и ${second.code} в една система не доказва автоматично производствена съвместимост.`,
    evidence: [first.evidence, second.evidence],
  }
}
