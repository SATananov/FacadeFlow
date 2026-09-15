# FacadeFlow 0.1.8C — Form → Constructor Transition 01

## Goal

Prevent pre-Constructor FIELD descriptions from being silently discarded when Constructor topology becomes authoritative.

## Accepted behavior

- Offer-form FIELD semantics are retained as a semantic-only transition payload when topology FIELD count does not yet match the form description count.
- Constructor geometry remains authoritative for frame size, FIELD count, FIELD width and divider geometry.
- FacadeFlow does **not** create dividers or geometry from form FIELD count.
- When human-created topology exposes the same number of FIELDs, canonical preset semantics can transfer by existing `constructionFieldId`, otherwise by exact-count FIELD sequence.
- Transfer covers only explicit `fixed` / `operable`, opening mode and opening handing values whose source is `preset`.
- Manual/custom descriptions are never converted into fabricated canonical semantics; they remain persisted for human resolution.
- Once canonical semantics exist in topology, redundant form-side constructor projections are removed.
- Transition payload may not own topology geometry and may not persist constructor-owned semantic duplicates.

## Verification

- `scripts/verify-form-constructor-transition01.mjs`
- `scripts/verify-form-constructor-transition01-runtime.mjs`
- Project Foundation 01 runtime regression
- Project Foundation 02 runtime regression
- lint
- build

## Safety boundary

- AUTOMATIC DIVIDER GEOMETRY: NO
- AUTOMATIC GEOMETRY: NO
- RULES VALIDATED: NO
- MACHINE READY: NO
