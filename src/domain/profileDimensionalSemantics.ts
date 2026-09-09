import {
  getProfileDimensionalSemantics,
  type ProfileDefinition,
  type ProfileDimensionalSemantics,
  type ProfileSystemCatalogEntry,
  type SemanticDimension,
} from '../data/profileSystems'
import type {
  ConstructionFrame,
  ResolvedConstructionDivider,
  ResolvedConstructionField,
} from './construction'
import type { ModuleProfileResolution, ProfileAssignment } from './profileResolution'

export const PROFILE_DIMENSIONAL_SEMANTICS_VERSION = 'profile-resolution-01b' as const

export type DimensionResolutionStatus =
  | 'constructor-authoritative'
  | 'schematic-only'
  | 'human-confirmed'
  | 'system-nominal'
  | 'unknown'

export type ResolvedDimension = {
  valueMm: number | null
  status: DimensionResolutionStatus
  labelBg: string
  noteBg: string
}

export type AssignedProfileDimensionalReadModel = {
  profileCode: string
  role: ProfileDefinition['role']
  rawCatalogCalloutsMm: readonly number[]
  constructionDepth: ResolvedDimension
  visibleFace: ResolvedDimension
  sashOverlap: ResolvedDimension
  glazingInset: ResolvedDimension
}

export type FieldDimensionalChain = {
  fieldId: string
  sequence: number
  fieldType: ResolvedConstructionField['fieldType']
  schematicClearWidth: ResolvedDimension
  schematicClearHeight: ResolvedDimension
  schematicBayWidth: ResolvedDimension
  sashProfile: AssignedProfileDimensionalReadModel | null
  sashOverallWidth: ResolvedDimension
  sashOverallHeight: ResolvedDimension
  visibleGlazingWidth: ResolvedDimension
  visibleGlazingHeight: ResolvedDimension
  glassCutWidth: ResolvedDimension
  glassCutHeight: ResolvedDimension
}

export type ModuleDimensionalChain = {
  version: typeof PROFILE_DIMENSIONAL_SEMANTICS_VERSION
  overallWidth: ResolvedDimension
  overallHeight: ResolvedDimension
  frameProfile: AssignedProfileDimensionalReadModel | null
  dividerProfiles: Record<string, AssignedProfileDimensionalReadModel | null>
  fields: readonly FieldDimensionalChain[]
  profileAwareGeometryReady: false
  machineReady: false
}

const unknownDimension = (labelBg: string, noteBg: string): ResolvedDimension => ({
  valueMm: null,
  status: 'unknown',
  labelBg,
  noteBg,
})

const semanticDimension = (
  semantic: SemanticDimension | undefined,
  labelBg: string,
  unknownNoteBg: string,
): ResolvedDimension => semantic
  ? {
      valueMm: semantic.valueMm,
      status: semantic.source,
      labelBg,
      noteBg: semantic.noteBg,
    }
  : unknownDimension(labelBg, unknownNoteBg)

function findProfile(
  system: ProfileSystemCatalogEntry,
  profileCode: string,
): ProfileDefinition | undefined {
  return [
    ...system.mainProfiles,
    ...system.glassBeads,
    ...system.additionalProfiles,
    ...system.gaskets,
    ...system.panelsAndSills,
  ].find((profile) => profile.code === profileCode)
}

export function getAssignedProfileDimensionalReadModel(
  system: ProfileSystemCatalogEntry,
  assignment: ProfileAssignment | null | undefined,
): AssignedProfileDimensionalReadModel | null {
  if (!assignment) return null
  const profile = findProfile(system, assignment.profileCode)
  if (!profile) return null

  const reviewed: ProfileDimensionalSemantics | undefined =
    getProfileDimensionalSemantics(system.id, profile.code)

  const constructionDepth = reviewed?.constructionDepth
    ? semanticDimension(
        reviewed.constructionDepth,
        'Конструктивна дълбочина',
        'Няма потвърдена конструктивна дълбочина.',
      )
    : {
        valueMm: system.nominalDepthMm,
        status: 'system-nominal' as const,
        labelBg: 'Конструктивна дълбочина',
        noteBg: `Номинална системна дълбочина ${system.name}; не е геометрия на конкретен срез.`,
      }

  return {
    profileCode: profile.code,
    role: profile.role,
    rawCatalogCalloutsMm: profile.dimensions?.calloutsMm ?? [],
    constructionDepth,
    visibleFace: semanticDimension(
      reviewed?.visibleFace,
      'Видима ширина / лице',
      'UNKNOWN — raw catalog callouts не се интерпретират автоматично.',
    ),
    sashOverlap: semanticDimension(
      reviewed?.sashOverlap,
      'Застъпване на крилото',
      'UNKNOWN — необходимо е human-confirmed правило за застъпване/фалц.',
    ),
    glazingInset: semanticDimension(
      reviewed?.glazingInset,
      'Отстъп до стъклопакета',
      'UNKNOWN — необходимо е human-confirmed правило за glazing/rebate геометрия.',
    ),
  }
}

function approximatelyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) < 0.01
}

/**
 * Schematic bay width allocates half of an adjacent divider face to each side
 * and the full schematic frame face to an outside edge. It is useful for the
 * reference-style 600 / 1000 / 500 dimension chain, but it remains schematic
 * until profile-aware geometry exists.
 */
function getSchematicBayWidth(
  frame: ConstructionFrame,
  frameFaceMm: number,
  field: ResolvedConstructionField,
  dividers: readonly ResolvedConstructionDivider[],
): ResolvedDimension {
  if (field.polygon) {
    return unknownDimension(
      'Схемна модулна ширина',
      'UNKNOWN за polygon поле — няма еднозначна ортогонална модулна ширина.',
    )
  }

  const fieldLeft = field.bounds.xMm
  const fieldRight = field.bounds.xMm + field.bounds.widthMm
  const interiorLeft = frameFaceMm
  const interiorRight = frame.widthMm - frameFaceMm

  let bayLeft: number | null = null
  let bayRight: number | null = null

  if (approximatelyEqual(fieldLeft, interiorLeft)) {
    bayLeft = 0
  } else {
    const leftDivider = dividers.find(
      (divider) => divider.axis === 'vertical' &&
        approximatelyEqual(divider.positionMm + divider.thicknessMm, fieldLeft),
    )
    if (leftDivider) {
      bayLeft = leftDivider.positionMm + leftDivider.thicknessMm / 2
    }
  }

  if (approximatelyEqual(fieldRight, interiorRight)) {
    bayRight = frame.widthMm
  } else {
    const rightDivider = dividers.find(
      (divider) => divider.axis === 'vertical' && approximatelyEqual(divider.positionMm, fieldRight),
    )
    if (rightDivider) {
      bayRight = rightDivider.positionMm + rightDivider.thicknessMm / 2
    }
  }

  if (bayLeft === null || bayRight === null || bayRight <= bayLeft) {
    return unknownDimension(
      'Схемна модулна ширина',
      'UNKNOWN — полето не е част от проста хоризонтална размерна верига.',
    )
  }

  return {
    valueMm: bayRight - bayLeft,
    status: 'schematic-only',
    labelBg: 'Схемна модулна ширина',
    noteBg: 'Разпределение до осите на съседните делители / външните ръбове. Не е производствен размер.',
  }
}

export function buildModuleDimensionalChain(args: {
  frame: ConstructionFrame
  frameFaceMm: number
  fields: readonly ResolvedConstructionField[]
  dividers: readonly ResolvedConstructionDivider[]
  system: ProfileSystemCatalogEntry
  resolution: ModuleProfileResolution
}): ModuleDimensionalChain {
  const { frame, frameFaceMm, fields, dividers, system, resolution } = args

  const frameProfile = getAssignedProfileDimensionalReadModel(system, resolution.frame)
  const dividerProfiles = Object.fromEntries(
    dividers.map((divider) => [
      divider.id,
      getAssignedProfileDimensionalReadModel(system, resolution.dividers[divider.id]),
    ]),
  )

  return {
    version: PROFILE_DIMENSIONAL_SEMANTICS_VERSION,
    overallWidth: {
      valueMm: frame.widthMm,
      status: 'constructor-authoritative',
      labelBg: 'Външен габарит — ширина',
      noteBg: 'Авторитетен размер от Constructor frame.',
    },
    overallHeight: {
      valueMm: frame.heightMm,
      status: 'constructor-authoritative',
      labelBg: 'Външен габарит — височина',
      noteBg: 'Авторитетен размер от Constructor frame.',
    },
    frameProfile,
    dividerProfiles,
    fields: fields.map((field) => {
      const sashProfile = getAssignedProfileDimensionalReadModel(system, resolution.fieldSashes[field.id])
      return {
        fieldId: field.id,
        sequence: field.sequence,
        fieldType: field.fieldType,
        schematicClearWidth: {
          valueMm: field.bounds.widthMm,
          status: 'schematic-only',
          labelBg: 'Схемен светъл отвор — ширина',
          noteBg: 'Текущ FIELD topology размер при схемни 60/40 mm лица.',
        },
        schematicClearHeight: {
          valueMm: field.bounds.heightMm,
          status: 'schematic-only',
          labelBg: 'Схемен светъл отвор — височина',
          noteBg: 'Текущ FIELD topology размер при схемни 60/40 mm лица.',
        },
        schematicBayWidth: getSchematicBayWidth(frame, frameFaceMm, field, dividers),
        sashProfile,
        sashOverallWidth: unknownDimension(
          'Размер на крилото — ширина',
          field.fieldType === 'operable'
            ? 'UNKNOWN — изисква потвърдени sash visible-face + overlap/rebate семантики.'
            : 'Не се изисква за FIX поле.',
        ),
        sashOverallHeight: unknownDimension(
          'Размер на крилото — височина',
          field.fieldType === 'operable'
            ? 'UNKNOWN — изисква потвърдени sash visible-face + overlap/rebate семантики.'
            : 'Не се изисква за FIX поле.',
        ),
        visibleGlazingWidth: unknownDimension(
          'Видим стъклопакет — ширина',
          'UNKNOWN — glazing/rebate семантиката още не е потвърдена.',
        ),
        visibleGlazingHeight: unknownDimension(
          'Видим стъклопакет — височина',
          'UNKNOWN — glazing/rebate семантиката още не е потвърдена.',
        ),
        glassCutWidth: unknownDimension(
          'Стъклопакет за производство — ширина',
          'UNKNOWN — машинни/производствени deductions не са разрешени.',
        ),
        glassCutHeight: unknownDimension(
          'Стъклопакет за производство — височина',
          'UNKNOWN — машинни/производствени deductions не са разрешени.',
        ),
      }
    }),
    profileAwareGeometryReady: false,
    machineReady: false,
  }
}

export function formatResolvedDimension(dimension: ResolvedDimension): string {
  return dimension.valueMm === null
    ? 'UNKNOWN'
    : `${Math.round(dimension.valueMm * 100) / 100} mm`
}
