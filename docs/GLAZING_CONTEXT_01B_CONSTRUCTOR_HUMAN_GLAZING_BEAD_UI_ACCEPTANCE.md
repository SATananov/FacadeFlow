# GLAZING CONTEXT 01B — Constructor Human Glazing + Bead UI

## Purpose

Wire the closed GLAZING CONTEXT 01A foundation into Constructor for the currently selected FIELD.

This stage persists explicit human glazing thickness inside the existing ModuleProfileResolution model, outside ConstructionModel. It does not create or mutate construction topology or glazing geometry.

## Accepted Constructor flow

1. Human selects a FIELD.
2. Human types and explicitly applies nominal glazing thickness in mm.
3. FacadeFlow resolves evidence-backed bead candidates using only the selected profile system + the human thickness.
4. PRELUDE 60 examples remain:
   - 24 mm -> `482.15` + `482.01`;
   - 32 mm -> `482.22`.
5. Even one candidate remains unselected until the human explicitly chooses it.
6. Changing thickness fails closed: a stale bead assignment is cleared when it is not a candidate for the new thickness.
7. Each FIELD owns its human thickness independently.

## Existing 02A.2 structural gate remains closed

- UNSET FIELD -> no bead target.
- FIX FIELD -> human-confirmed FRAME profile is required before bead assignment is enabled.
- OPERABLE FIELD -> human-confirmed SASH profile is required before bead assignment is enabled.
- Candidates may be shown before base-profile context is complete, but selection remains disabled.
- Catalogue thickness match is not proof of bead-to-base-profile compatibility.

## Safety boundary

- HUMAN GLAZING THICKNESS: EXPLICIT PER FIELD.
- BEAD CANDIDATES: SYSTEM + THICKNESS GATED.
- BEAD SELECTION: HUMAN ONLY.
- AUTOMATIC BEAD SELECTION: NO.
- BASE-PROFILE COMPATIBILITY: UNCONFIRMED.
- GLAZING INSET: UNKNOWN.
- GLASS CUT: UNKNOWN.
- CONSTRUCTION TOPOLOGY: UNCHANGED.
- CONSTRUCTION GEOMETRY MUTATION: NO.
- MACHINE READY: NO.

NO COMMIT / NO PUSH.
