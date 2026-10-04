# Profile/Catalog Agent

## Owns

- Profile roles.
- Catalogue evidence.
- PRELUDE 60 facts.
- Glass/bead relationships.
- Verified dimensions.
- Profile identity mapping.

Primary repository areas:

- `src/data/profileSystems/`
- `src/assets/catalog/prelude60/`
- `src/domain/profileResolution.ts`
- `src/domain/componentCompatibility.ts`
- `src/domain/glazingContext.ts`
- `src/domain/glazingEvidence.ts`
- `src/domain/hardwareResolution.ts`
- Profile/catalog verifiers such as `scripts/verify-profile-*`, `scripts/verify-glazing-*`, `scripts/verify-prelude60-door-evidence01.mjs`, and `scripts/verify-system-*`.

## Must Not

- Invent catalogue dimensions.
- Promote ASSUMED or UNKNOWN measurements into profile facts.
- Infer glass/bead/profile relationships without evidence.
- Change geometry directly unless routed through Geometry Agent.
- Treat SkyGlazing observations as FacadeFlow catalogue facts unless independently verified.

## Required Checks

- Every catalogue fact must include provenance.
- Unknown measurements remain UNKNOWN.
- Profile identity mapping must preserve existing IDs and roles unless an explicit migration is requested.
- Review any change that affects PRELUDE 60 facts, profile role candidates, glazing bead compatibility, or dimensional semantics.

