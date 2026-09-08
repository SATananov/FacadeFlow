# Concept 05B — Glazing Selection

## Purpose

Add a dedicated glazing step after profile system, color, and foil mode selection.

## Human-confirmed operational glazing choices

The following values are operator-provided data and are not treated as manufacturer-catalog claims:

- `б + б / 24` — обикновено + обикновено, 24 mm
- `б + б / 32` — обикновено + обикновено, 32 mm
- `б + 4S / 24` — обикновено + Four Seasons, 24 mm
- `к + б / 32` — зимно защитно + обикновено, 32 mm
- `к + б + 4S / 44` — зимно защитно + обикновено + Four Seasons, 44 mm

Legend:

- `б` = бяло / обикновено стъкло
- `к` = стъкло за зимна топлозащита
- `4S` = Four Seasons

## Data model

The offer stores `glazingId`, not a free-text glazing description.

Glazing definitions live in `src/data/profileSystems/glazingOptions.ts` and carry `sourceStatus: 'human-confirmed'`.

## Workflow gate

The glazing step is shown after a valid color and foil mode have been selected. A valid glazing option is required before the current "continue to modules" action can be enabled.

## Safety / semantics boundary

- The stated 24 / 32 / 44 mm package thickness is stored exactly as supplied.
- FacadeFlow does **not** infer individual pane thicknesses or spacer thicknesses.
- FacadeFlow does **not** infer system compatibility from manufacturer glass-bead catalogue values at this stage.
- No automatic geometry is generated.
- The result is not machine-ready.

## Acceptance

- Five human-confirmed options are represented structurally.
- The abbreviation legend is preserved.
- UI reads glazing options from the structured dataset.
- Offer persists `glazingId`.
- Glazing is part of the module-continue gate.
- Prior Concept 01–05A contracts remain green.
