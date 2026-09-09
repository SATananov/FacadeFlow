# PROFILE RESOLUTION 01B — Dimensional Semantics Foundation

## Goal

FacadeFlow must distinguish the dimensional levels that are visible in a real window drawing instead of treating every number as the same kind of size.

The canonical chain introduced in 01B is:

**OUTER OVERALL → SCHEMATIC MODULE / BAY → FIELD CLEAR OPENING → SASH → VISIBLE GLAZING → GLASS CUT SIZE**

01B is a semantic/read-model stage. It does **not** mutate Constructor topology or profile-aware geometry.

## Source boundary

Raw catalogue `calloutsMm` remain untouched and have no positional meaning. FacadeFlow MUST NOT infer that the smallest, largest, first, second, or third callout is automatically the visible face, rebate, overlap, or construction depth.

A number receives a semantic name only in the reviewed dimensional-semantics registry.

## Human-confirmed PRELUDE 60 semantics currently allowed

- `482.30` / frame:
  - system nominal construction depth: **60 mm**
  - human-confirmed visible face: **42 mm**
- `482.21` / mullion:
  - system nominal construction depth: **60 mm**
  - human-confirmed visible face: **40 mm**

The following remain deliberately unresolved:

- `482.20` frame visible face — **UNKNOWN**
- `482.24` mullion visible face — **UNKNOWN**
- sash visible face / sash overlap / rebate / glazing inset for `482.05`, `482.18`, `482.23`, `482.25` — **UNKNOWN**

The sash measuring convention was explicitly identified as special and must be confirmed before FacadeFlow derives sash or glass dimensions.

## Constructor dimensional chain

For a rectangular single-row layout, 01B may show a **schematic module/bay width** by allocating:

- full schematic frame face to an outside edge;
- half of an adjacent schematic divider face to each neighbouring bay.

Example for the current schematic 3400 mm frame with clear FIELD widths 900 / 1470 / 830, frame face 60 and two 40 mm dividers:

- Bay 1 = 60 + 900 + 20 = **980 mm**
- Bay 2 = 20 + 1470 + 20 = **1510 mm**
- Bay 3 = 20 + 830 + 60 = **910 mm**
- 980 + 1510 + 910 = **3400 mm**

These are labelled **SCHEMATIC**. They are useful for a reference-style bottom dimension chain but are not production dimensions until profile-aware geometry exists.

## UI requirements

- Show outer overall dimensions separately from FIELD clear dimensions.
- Show schematic bay widths as a segmented bottom dimension chain when the layout is a simple horizontal row.
- FIELD cards must distinguish `FIELD` clear size from `МОДУЛ` width.
- Selected frame/divider/sash profile shows:
  - raw catalogue callouts as evidence only;
  - construction depth with source/status;
  - visible face only when reviewed;
  - sash overlap and glazing inset as UNKNOWN until reviewed.
- Selected FIELD shows separate slots for:
  - schematic clear width/height;
  - sash width/height;
  - visible glazing width/height;
  - glass cut width/height.

Unknown values must display **UNKNOWN**, not guessed numbers.

## Safety boundary

- CONSTRUCTION TOPOLOGY: UNCHANGED
- RAW CATALOG CALLOUT POSITIONAL INFERENCE: NO
- SASH OVERLAP SEMANTICS: UNKNOWN
- VISIBLE GLAZING SIZE: UNKNOWN
- GLASS CUT SIZE: UNKNOWN
- PROFILE-AWARE GEOMETRY: NO
- MACHINE READY: NO

## Next stage

01C may consume only reviewed 01B semantics to create profile-aware 2D rendering: visible frame/mullion/sash faces, real overlap/rebate relationships, and glazing contours. It must not invent missing sash semantics.
