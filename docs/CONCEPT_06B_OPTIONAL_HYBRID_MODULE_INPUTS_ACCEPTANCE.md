# Concept 06B — Optional Hybrid Module Inputs

## Goal

Make Module 1 easy to start even when the constructor does not yet have every value, while preserving a structured path for standard choices and an explicit manual path for non-standard values.

## Accepted principle

`Suggest confirmed standard choices -> allow manual/non-standard entry -> keep draft incomplete when needed -> validate later`

Module-level values are optional during drafting. An incomplete module is not rejected or deleted.

## Module 1 hybrid inputs

### Product type

Dropdown:

- not selected
- Window
- Door
- Other / manual

When `Other / manual` is selected, a free-text field is shown.

### Width and height

Each dimension has an input-source dropdown:

- not set
- manual / non-standard
- standard preset

No company-confirmed standard width or height presets have been supplied yet. Therefore `MODULE_DIMENSION_PRESETS_MM` is intentionally empty. FacadeFlow must not invent production dimensions.

Manual millimetre entry is available now. The preset path is already represented in the model/UI so confirmed company values can be added later without redesigning Module 1.

### Field count

Dropdown:

- not set
- 1 field
- 2 fields
- 3 fields
- 4 fields
- other count / manual

The field-count choice is conceptual structure only. It does not create mullion coordinates, sash geometry, or opening logic.

## Data provenance

Each hybrid input records whether its current value comes from:

- `unset`
- `preset`
- `manual`

This allows later AI/review logic to distinguish a confirmed standard choice from a human-entered non-standard value.

## Draft boundary

Module 1 may remain incomplete. Completeness helpers are informational only and do not block the draft.

Later technical-review / production gates may require missing values before approval, but Concept 06B does not introduce such a gate.

## Inherited offer defaults

Unchanged from Concept 05C / 06A. Module 1 continues to inherit:

- profile system
- color
- foil mode
- glazing
- hardware standard / manufacturer preference

These offer-level defaults are not re-entered in Module 1.

## Explicitly not implemented

- standard company dimension catalog values
- field-by-field behavior
- fixed/openable field assignment
- opening direction / tilt-turn logic
- mullion positions
- automatic geometry
- module-specific profile/member calculation
- cutting calculation
- machine output

## Safety boundary

`CONFIRMED DIMENSION PRESETS = NONE`

`AUTOMATIC GEOMETRY = NO`

`MACHINE READY = NO`
