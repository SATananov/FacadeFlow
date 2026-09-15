# FacadeFlow 0.1.8D — FIELD Glazing Ownership 01

## Goal
Close the glazing-ownership gap without inferring geometry, catalogue compatibility, or production rules.

## Canonical precedence
For each FIELD, the effective glazing specification is resolved in this order:

1. explicit FIELD glazing override;
2. explicit Module glazing override;
3. inherited Offer glazing default;
4. unset.

The full glazing specification is identified by an existing human-confirmed glazing option ID. No new glass composition is invented.

## Effective thickness
- An explicit human FIELD thickness remains the highest-priority technical thickness override.
- Otherwise, thickness comes from the effective glazing specification's confirmed `totalThicknessMm`.
- The Offer glazing therefore establishes a usable FIELD thickness when no lower-level override exists.

## Bead behavior
- Bead selection remains human-only.
- Changing Module/FIELD glazing specification or explicit FIELD thickness re-evaluates the currently selected bead against the effective thickness.
- An invalid bead is removed; a new bead is never auto-selected.
- Base-profile compatibility remains UNCONFIRMED unless reviewed evidence exists.

## Persistence
`ModuleProfileResolution` now carries Module and FIELD glazing specification overrides. Existing saved resolutions without these properties are accepted and normalized to empty overrides, preserving backward readability within the current project schema.

## Boundaries
- No automatic divider or sash geometry.
- No automatic bead selection.
- No glass-cut or glazing-inset inference.
- No manufacturing/BOM/CNC readiness claim.

AUTOMATIC GEOMETRY: NO
RULES VALIDATED: NO
MACHINE READY: NO
