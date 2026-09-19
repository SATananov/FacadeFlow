# FIX43 — PROFILE RENDER NORMALIZATION + FACADEFLOW-NATIVE WORDING 01

## Goal

Unify the technical rendering of the participating profile sections and remove third-party product naming from the FacadeFlow codebase and project documentation.

## Render normalization

- `482.21` clean and assembly assets are normalized to the same black-on-white technical rendering used by the other reviewed profile assets.
- Canvas size, crop, profile geometry and catalogue dimensions are unchanged.
- Participant cards and the final assembly use neutral rendering with no additional contrast filter.

## FacadeFlow-native wording

- User-facing rule provenance is now expressed as `KMG 60 · референтно системно правило`.
- Historical internal comments, docs, verifier names and filenames use FacadeFlow-native / generic technical terminology.
- No third-party product name is required to describe or execute the rules.

## Safety boundary

This stage does not validate or unlock exact production geometry.

- AUTOMATIC GEOMETRY: NO
- RULES VALIDATED: NO
- PRODUCTION AUTO-UNLOCK: NO
- MACHINE READY: NO
- NO COMMIT / NO PUSH / NO RELEASE
