# GLAZING CONTEXT 01A - Human Thickness + Bead Selection Foundation

## Purpose

This stage adds a fail-closed domain read model for an explicitly human-entered nominal glazing thickness and an optional explicitly human-selected glazing-bead code.

It prepares later Constructor UI wiring without creating a second persistence model and without changing Construction geometry.

## Human glazing thickness

The nominal glazing thickness is explicit human input. It is never inferred from frame, sash, field size, glass bead, or profile geometry.

For PRELUDE 60 the existing GLAZING EVIDENCE 01 layer may return catalogue-labelled candidates for the entered thickness.

Examples:

- 24 mm -> candidates `482.15` and `482.01`;
- 32 mm -> candidate `482.22`;
- even one candidate remains a candidate only.

## Human bead selection

The resolver accepts an optional bead code only as an explicit human selection.

- selection must be one of the current system + thickness candidates;
- wrong-thickness or stale selections fail closed;
- cross-system code reuse fails closed;
- changing thickness is expected to invalidate a bead code that is no longer a candidate;
- NO automatic bead selection is allowed.

A valid human selection means only that the code is a catalogue-labelled candidate for the selected system and nominal glazing thickness.

It does not prove bead-to-frame/sash compatibility.

## Safety boundary

- base-profile compatibility: UNCONFIRMED;
- exact glazing inset: unknown;
- glass cut: unknown;
- rebate/falz geometry: unknown;
- no ConstructionModel mutation;
- no FIELD-bound mutation;
- no automatic bead selection;
- no production approval;
- MACHINE READY: NO.

Required visible verifier statements remain:

`GLAZING INSET: UNKNOWN`

`GLASS CUT: UNKNOWN`

`MACHINE READY: NO`
