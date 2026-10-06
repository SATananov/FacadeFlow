# KMG 482.20 ↔ 482.21 Geometry Evidence Freeze 01

## Scope

This freeze applies to KMG PRELUDE 60, `482.20` Frame / `Каса`, `482.21` Mullion / `Делител`, `KM242`, and the `FRAME_TO_MULLION` context.

The freeze is intentional. It records the boundary between verified source evidence, database relationship evidence, and unresolved physical joint facts. It does not generate geometry, select profiles automatically, create joints, validate rules, or declare machine readiness.

## Verified facts

### 482.20 Frame

- Profile identity: `VERIFIED`
- Role: Frame / `Каса`
- Isolated profile section: `CATALOGUE_VERIFIED`
- Source file: `PVC Prelude_bg.pdf`
- Source page: `2`
- Source SHA-256: `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`

### 482.21 Mullion

- Profile identity: `VERIFIED`
- Role: Mullion / `Делител`
- Isolated profile section: `CATALOGUE_VERIFIED`
- Source file: `PVC Prelude_bg.pdf`
- Source page: `2`
- Source SHA-256: `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`

### KM242

- Association with the 482.21 mullion: `VERIFIED AS SUPPORTING CATALOGUE EVIDENCE`
- Physical geometry: `UNKNOWN`
- Placement in the 482.20 ↔ 482.21 joint: `UNKNOWN`

The KM242 association does not establish connector shape, fixing, seating, or frame placement.

## Relationship evidence only

The following remain `DATABASE_RELATIONSHIP_EVIDENCE` only:

- `BeamHorizontalKMG4k`
- `BeamVerticalKMG4k`
- `SglobkaDelitel`
- operation `19`
- `L_Fr`, `R_Fr`, `U_Fr`, `D_Fr`
- `POS[]`
- `MM1`, `MM4`

These records prove an imported relationship/operation context. They do not prove physical contact geometry, direct article-pair binding, overlap, rebate, notch, machining contour, cut geometry, or connector placement.

## Frozen unknown fields

For the exact 482.20 ↔ 482.21 `FRAME_TO_MULLION` physical joint:

| Field | Status |
|---|---|
| Contact line | `UNKNOWN` |
| Contact point | `UNKNOWN` |
| Contact surfaces | `UNKNOWN` |
| Contact depth | `UNKNOWN` |
| Overlap | `UNKNOWN` |
| Rebate | `UNKNOWN` |
| Notch contour | `UNKNOWN` |
| Mullion end treatment | `UNKNOWN` |
| Cut angle | `UNKNOWN` |
| Cut length | `UNKNOWN` |
| Machining geometry | `UNKNOWN` |
| Machining coordinates | `UNKNOWN` |
| Toolpath | `UNKNOWN` |
| Connector placement | `UNKNOWN` |
| Assembly cross-section | `UNKNOWN` |
| Weld / allowance data | `UNKNOWN` |

## Rejected inference paths

None of the frozen fields may be derived from:

- `profileW`, `profileZ`, `dim_in`, or `dim_out`
- visual matching or isolated catalogue sections
- operation names, `POS[]`, `MM1`, or `MM4`
- existing FacadeFlow drawings
- other profile-pair sections
- generic help screenshots

The repository's existing presentation or related-profile evidence does not override this exact-pair freeze.

## Source-search history

The completed searches covered:

- recovered catalogue and local technical PDFs;
- legacy and current Altest package databases;
- imported CSV and operation evidence;
- local CAD, image, help, and archive references;
- current and archived public technical sources;
- legacy graphical help `NHD.pdf` and `NVD.pdf`, visually inspected page-by-page.

The searches found isolated profile evidence, relationship tokens, and the KM242 catalogue association, but no direct 482.20 ↔ 482.21 assembly detail, KM242 installation detail, exact-pair CAD, fabrication drawing, machining sheet, or assembly cross-section.

## Unfreeze conditions

The joint may leave `UNKNOWN` only when a new source directly proves the missing physical relationship and explicitly binds enough context to `482.20`, `482.21`, and/or `KM242` in the actual joint.

Acceptable source classes include:

- primary manufacturer assembly drawing;
- original fabrication or workshop manual;
- KM242 installation detail;
- manufacturer CAD/DXF/DWG assembly;
- machining sheet with profile identifiers;
- another direct manufacturer technical source with explicit article context.

Visual similarity, envelope arithmetic, operation tokens, or an unlabeled drawing are insufficient.

## Readiness warning

`AUTOMATIC GEOMETRY = NO`  
`AUTOMATIC PROFILE SELECTION = NO`  
`AUTOMATIC JOINT CREATION = NO`  
`RULES VALIDATED = NO`  
`MACHINE READY = NO`

`UNKNOWN` is intentional and correct. This freeze must remain in force until direct technical evidence satisfies the unfreeze conditions.
