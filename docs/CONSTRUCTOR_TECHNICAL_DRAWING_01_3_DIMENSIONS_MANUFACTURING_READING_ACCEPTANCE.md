# CONSTRUCTOR TECHNICAL DRAWING 01.3 — Dimensions & Manufacturing Reading

## Scope

TD01.3 changes only the visual hierarchy of dimensions already rendered by Constructor.
It does not change dimensional values, field bounds, frame bounds, rounding, topology or manufacturing semantics.

## Visual intent

- individual bay / FIELD widths form the secondary dimension chain closest to the product;
- overall module width is visually stronger and sits farther from the product;
- overall height uses the same primary hierarchy;
- end ticks / dimension legs are longer and easier to scan;
- dimension numerals use tabular figures for faster technical reading;
- labels remain neutral white and do not compete with frame, sash or selection states.

## Hard boundaries

- `simpleBayDimensions` values are unchanged;
- `displayedFrame.widthMm` is unchanged;
- `displayedFrame.heightMm` is unchanged;
- `Math.round(...)` dimensional rendering is unchanged;
- no cut sizes are introduced;
- no profile deductions are introduced;
- no glass sizes are introduced;
- no machining sizes are introduced;
- geometry, topology, profile resolution and persistence are unchanged.

## Required human browser acceptance

Review at least:

1. single-field module;
2. three-field module such as OPERABLE + FIXED + OPERABLE;
3. overall width and overall height together;
4. bay widths with at least two dividers;
5. zoom around 70%;
6. zoom around 125–135%;
7. selected and unselected geometry.

Acceptance goal: a production user can distinguish the local FIELD chain from the overall module dimensions in one glance, without any change to dimensional truth.

## Safety status

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
