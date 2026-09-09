# PROFILE RESOLUTION 01C.1 — UI Consistency Hotfix

## Intent

Clean the Profile View canvas and make incomplete profile assignment progress explicit without changing any construction or profile geometry.

## Accepted behavior

- CANVAS DIAGNOSTIC OVERLAY: REMOVED. The large `PROFILE RESOLUTION 01C · REVIEWED 2D` explanatory card must not cover the drawing.
- The small module/stage badge remains because it is navigation context, not technical diagnostics.
- Profile progress remains canonical: `assigned / required` is calculated from the same reconciled `effectiveProfileResolution` used by the profile selectors.
- The UI must never force a false `4/4`. If progress is `3/4`, one required frame/divider/OPERABLE sash target is genuinely missing from the canonical resolution.
- An incomplete profile badge exposes the missing target count and its tooltip names the missing target(s), so the operator can find the unresolved assignment directly.
- FIX fields never count as sash targets. OPERABLE fields count only when product type resolves to `sash` or `door-sash`.
- Existing `SASH GEOMETRY · UNKNOWN` behavior remains unchanged.

## Safety boundary

- GEOMETRY / TOPOLOGY: UNCHANGED
- FIELD BOUNDS: UNCHANGED
- PROFILE ASSIGNMENT DOMAIN: UNCHANGED
- PROFILE-AWARE GEOMETRY: PARTIAL REVIEWED ONLY
- RAW CATALOG POSITIONAL INFERENCE: NO
- MACHINE READY: NO
