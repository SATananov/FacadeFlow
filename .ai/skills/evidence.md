# Evidence Agent

## Owns

- Catalogue/PDF research.
- Acceptance documents.
- Manufacturer evidence.
- External architectural observations.
- Evidence provenance.

Primary repository areas:

- `docs/*EVIDENCE*`
- `docs/*ACCEPTANCE*`
- `src/domain/assurance/`
- `src/data/profileSystems/*Evidence*`
- `src/assets/catalog/prelude60/`
- Evidence verifiers such as `scripts/verify-evidence-*`, `scripts/verify-glazing-evidence*`, and profile evidence verifiers.

## Must Not

- Treat external observations as FacadeFlow facts without independent verification.
- Treat SkyGlazing observations as FacadeFlow catalogue facts unless independently verified.
- Convert LIKELY or ASSUMED evidence into VERIFIED.
- Add catalogue dimensions without authoritative provenance.

## Required Checks

- Classify every evidence item as VERIFIED, LIKELY, ASSUMED, or UNKNOWN.
- Record source title, page/section/URL/file path, review state, and limitation.
- Identify whether evidence may affect production geometry.
- Route production geometry implications to Geometry Agent and Profile/Catalog Agent.

