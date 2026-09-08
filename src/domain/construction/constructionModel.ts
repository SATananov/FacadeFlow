export type ConstructionAxis = 'vertical' | 'horizontal'

/** Neutral schematic frame face before a real profile is resolved. */
export const CONSTRUCTION_DEFAULT_FRAME_FACE_MM = 60

export type ConstructionFrame = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

export type ConstructionFieldType = 'fixed' | 'operable'
export type ConstructionOpeningMode = 'side-hinged' | 'tilt' | 'tilt-turn'
export type ConstructionOpeningHanding = 'left' | 'right'

/**
 * Canonical FIELD semantics. Constructor 01C.1 created the stable FIELD object;
 * Constructor 01C.3 keeps that identity while adding a real frame interior.
 * Constructor 01C.3.2 corrects divider semantics: divider length follows its parent FIELD,
 * divider face width is schematic/profile-derived, and the user changes position only.
 * Field type/opening values intentionally remain unset
 * until the dedicated FIELD semantics stage.
 */
export type ConstructionFieldDefinition = {
  id: string
  fieldType: ConstructionFieldType | null
  openingMode: ConstructionOpeningMode | null
  openingHanding: ConstructionOpeningHanding | null
}

export type ConstructionFieldNode =
  | {
      kind: 'field'
      field: ConstructionFieldDefinition
    }
  | {
      kind: 'split'
      /** The FIELD that existed before this split. Kept as lineage metadata. */
      field: ConstructionFieldDefinition
      divider: {
        id: string
        axis: ConstructionAxis
        /** Clear size of the first child FIELD before the divider face begins. */
        offsetMm: number
        /** Schematic visible divider face. Profile resolution may replace this later. */
        thicknessMm: number
      }
      first: ConstructionFieldNode
      second: ConstructionFieldNode
    }

export type ConstructionModel = {
  /** Older 01C.1/01C.2 topologies remain readable; new 01C.3 drafts emit field-topology-03. */
  version: 'field-topology-01' | 'field-topology-02' | 'field-topology-03'
  frame: ConstructionFrame
  /** Schematic visible frame face. Not a profile-resolved production value. */
  frameFaceMm?: number
  root: ConstructionFieldNode
  nextFieldId: number
  nextDividerId: number
}

export type ConstructionFieldBounds = {
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
}

export type ResolvedConstructionField = ConstructionFieldDefinition & {
  sequence: number
  bounds: ConstructionFieldBounds
}

export type ResolvedConstructionDivider = {
  id: string
  parentFieldId: string
  axis: ConstructionAxis
  /** Absolute leading-face position inside the outer frame coordinate system. */
  positionMm: number
  /** Cross-axis start/end of the physical divider face. */
  startMm: number
  endMm: number
  /** Clear size of the first child FIELD before the divider begins. */
  offsetMm: number
  /** Clear size before the divider face; exposed explicitly for UI/read models. */
  firstClearMm: number
  /** Clear size after the divider face inside the same parent FIELD. */
  secondClearMm: number
  /** Schematic physical face consumed by the divider in the topology. */
  thicknessMm: number
}

export type ConstructorDividerSnapshot = {
  id: string
  axis: ConstructionAxis
  positionMm: number
  span: 'full'
}

export type ConstructorDraftSnapshot = {
  version: 'constructor-01b' | 'constructor-01c' | 'constructor-01c.1' | 'constructor-01c.2' | 'constructor-01c.3' | 'constructor-01c.3.2'
  frame: ConstructionFrame
  /** Legacy 01C persistence. Read-only compatibility for old clean drafts. */
  dividers?: ConstructorDividerSnapshot[]
  /** Canonical source of truth from Constructor 01C.1 onward. */
  topology?: ConstructionModel
}

export function createFieldDefinition(id: string): ConstructionFieldDefinition {
  return {
    id,
    fieldType: null,
    openingMode: null,
    openingHanding: null,
  }
}

export function createConstructionModel(frame: ConstructionFrame): ConstructionModel {
  return {
    version: 'field-topology-03',
    frame: { ...frame },
    frameFaceMm: CONSTRUCTION_DEFAULT_FRAME_FACE_MM,
    root: {
      kind: 'field',
      field: createFieldDefinition('field-1'),
    },
    nextFieldId: 2,
    nextDividerId: 1,
  }
}
