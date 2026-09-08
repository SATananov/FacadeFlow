# Concept 04A — Profile System Catalog Foundation

## Purpose

Create the first canonical, source-backed profile-system catalogue for FacadeFlow.
This step intentionally adds data only. It does not yet alter the offer UI.

## Source of truth

KMG / ALTEST `PVC Profiles Systems` catalogue supplied by the user.

Catalogue pages used:

- Page 2 — PRELUDE 60 mm: main profiles, glass beads, additional profiles, EPDM gaskets.
- Page 3 — PRELUDE 60 mm: PVC panels/sills, reinforcements, accessories.
- Page 4 — PRESTIGE 70 mm and PRESTIGE PLUS: main profiles, glass beads, additional profiles, EPDM gaskets.
- Page 5 — PRESTIGE 70 mm: PVC panels/sills, reinforcements, accessories and aluminium cover caps.

## Canonical selectable systems

1. `kmg-prelude-60` — KMG PRELUDE 60
2. `kmg-prestige-70` — KMG PRESTIGE 70
3. `kmg-prestige-plus-70` — KMG PRESTIGE PLUS, linked to PRESTIGE family

## Safety / semantics boundary

Catalogue dimensions are stored as `calloutsMm` exactly as numeric labels printed around the drawings.
They are NOT automatically interpreted as production concepts such as visible height, rebate, cutting dimension or machine dimension.

A later human-reviewed semantic layer may map catalogue callouts to production meaning.

This prevents FacadeFlow or future AI logic from silently converting a drawing label into an unsupported manufacturing rule.

## Offer architecture boundary

The offer must later persist only the selected catalogue id, for example:

```ts
profileSystemId: 'kmg-prelude-60'
```

System knowledge remains central in `src/data/profileSystems` and is not copied into each offer.

## Acceptance

- [x] Central TypeScript catalogue model exists.
- [x] PRELUDE 60 is represented from catalogue pages 2–3.
- [x] PRESTIGE 70 is represented from catalogue pages 4–5.
- [x] PRESTIGE PLUS is represented as a selectable 70 mm PRESTIGE-family entry.
- [x] Main profiles are source-backed by catalogue page/section evidence.
- [x] Glass beads are source-backed.
- [x] Reinforcement-to-profile mappings are source-backed.
- [x] Accessories are source-backed.
- [x] Catalogue dimensions remain raw/uninterpreted.
- [x] No automatic geometry, compatibility validation or machine-ready claim is introduced.

## Next step

Concept 04B: wire the offer flow to `getSelectableProfileSystems()` after client/object data and persist the chosen `profileSystemId` before module creation.
