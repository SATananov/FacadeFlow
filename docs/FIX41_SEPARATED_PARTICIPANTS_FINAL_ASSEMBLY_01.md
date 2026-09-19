# FIX41 · SEPARATED PARTICIPANTS FINAL ASSEMBLY 01

## Goal

The technical joint review must read in two unmistakable stages:

1. the participating catalogue profiles as separate technical details;
2. a separate final assembly view below them.

This preserves FacadeFlow's own UX while making the construction logic easier to read: first understand the real parts, then inspect how the system review places them together.

## Participating catalogue profiles

Each resolved profile is shown independently with:

- its catalogue sketch;
- profile role and code;
- catalogue envelope dimensions;
- an explicit note that the detail is separate from the final assembly.

The participant area is intentionally structured as a grid so an additional participating component can be added later without turning the catalogue details into one shared sketch.

## Final assembly

The existing automatic technical node remains a separate block below the participants and is now introduced by `КРАЙНА СГЛОБКА`.

The assembly continues to show:

- boundary orientation;
- catalogue dimensions;
- reviewed visible-face facts;
- system-rule correction as a reference value;
- explicit unknown mounting overlap.

## Safety boundary

FIX41 is a technical-reading / composition change only. It does not establish or infer:

- exact frame/sash or mullion/sash overlap;
- exact mate X/Y/rotation;
- exact glazing inset;
- production deductions or tolerances;
- BOM unlock;
- production release;
- machine output.

`AUTOMATIC GEOMETRY = NO`, `RULES VALIDATED = NO`, and `MACHINE READY = NO` remain unchanged.
